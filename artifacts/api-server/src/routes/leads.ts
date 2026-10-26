import { once } from "node:events";
import { Router, type IRouter } from "express";
import {
  CreateLeadBody,
  CreateLeadResponse,
  GetAdminSessionResponse,
  GetLeadSummaryResponse,
  ListLeadsQueryParams,
  ListLeadsResponse,
  UpdateLeadBody,
  UpdateLeadParams,
  UpdateLeadResponse,
} from "@workspace/api-zod";
import { Types } from "mongoose";
import { leadSubmissionLimiter } from "../middlewares/leadSubmissionLimiter";
import {
  requireAdmin,
  requireSameOriginMutation,
  type AdminProfile,
} from "../middlewares/admin";
import { LeadModel, type LeadDocument } from "../models/lead";
import { connectMongo, MongoNotConfiguredError } from "../lib/mongo";

const router: IRouter = Router();
const STATUSES = ["new", "contacted", "quoted", "booked", "closed"] as const;

function asLeadDocument(value: LeadDocument | (LeadDocument & { _id: Types.ObjectId })) {
  return {
    id: value._id.toString(),
    name: value.name,
    phone: value.phone,
    email: value.email ?? null,
    pickupLocation: value.pickupLocation,
    destination: value.destination,
    movingDate: new Date(`${value.movingDate}T00:00:00.000Z`),
    propertyType: value.propertyType,
    services: value.services,
    additionalDetails: value.additionalDetails ?? "",
    source: value.source,
    status: value.status,
    internalNotes: value.internalNotes ?? "",
    createdAt: value.createdAt,
  };
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function csvCell(value: unknown): string {
  let text = String(value ?? "").replace(/\r\n?/g, "\n");
  if (/^[=+\-@\t\r]/.test(text.trimStart())) {
    text = `'${text}`;
  }
  return `"${text.replace(/"/g, '""')}"`;
}

function normalizePublicInput(input: unknown): unknown {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return input;
  }

  const body = input as Record<string, unknown>;
  const trim = (value: unknown) =>
    typeof value === "string" ? value.trim() : value;
  const email = trim(body.email);

  return {
    ...body,
    name: trim(body.name),
    phone: trim(body.phone),
    email: email === "" || email === undefined ? null : email,
    pickupLocation: trim(body.pickupLocation),
    destination: trim(body.destination),
    additionalDetails: trim(body.additionalDetails),
    website: typeof body.website === "string" ? body.website.trim() : body.website,
  };
}

function isMongoUnavailable(error: unknown): boolean {
  return (
    error instanceof MongoNotConfiguredError ||
    (error instanceof Error &&
      (error.name === "MongoServerSelectionError" ||
        error.name === "MongoNetworkError" ||
        error.name === "MongooseServerSelectionError"))
  );
}

router.post("/leads", leadSubmissionLimiter, async (req, res): Promise<void> => {
  const parsed = CreateLeadBody.safeParse(normalizePublicInput(req.body));
  if (!parsed.success) {
    res.status(400).json({ error: "Check the form fields and try again." });
    return;
  }

  if (parsed.data.website !== "") {
    res.status(400).json({ error: "The enquiry could not be accepted." });
    return;
  }

  try {
    await connectMongo();
    const { movingDate } = parsed.data;
    const [lead] = await LeadModel.create([
      {
        name: parsed.data.name,
        phone: parsed.data.phone,
        email: parsed.data.email ?? null,
        pickupLocation: parsed.data.pickupLocation,
        destination: parsed.data.destination,
        movingDate: movingDate.toISOString().slice(0, 10),
        propertyType: parsed.data.propertyType,
        services: parsed.data.services,
        additionalDetails: parsed.data.additionalDetails ?? "",
        source: "Website quote form",
      },
    ]);

    res.status(201).json(
      CreateLeadResponse.parse({
        received: true,
        reference: lead._id.toString(),
      }),
    );
  } catch (error) {
    if (isMongoUnavailable(error)) {
      res.status(503).json({
        error:
          "Quote requests are temporarily unavailable because enquiry storage is not configured.",
      });
      return;
    }
    throw error;
  }
});

router.get(
  "/admin/session",
  requireAdmin,
  async (_req, res): Promise<void> => {
    res.json(GetAdminSessionResponse.parse(res.locals.admin as AdminProfile));
  },
);

router.get("/admin/leads", requireAdmin, async (req, res): Promise<void> => {
  const parsed = ListLeadsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid search or filter." });
    return;
  }

  try {
    await connectMongo();
    const { search, status, source, page, pageSize } = parsed.data;
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (source) filter.source = source;
    if (search) {
      const safeSearch = new RegExp(escapeRegex(search), "i");
      filter.$or = [
        { name: safeSearch },
        { phone: safeSearch },
        { email: safeSearch },
        { pickupLocation: safeSearch },
        { destination: safeSearch },
      ];
    }

    const [documents, total] = await Promise.all([
      LeadModel.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      LeadModel.countDocuments(filter),
    ]);

    res.json(
      ListLeadsResponse.parse({
        items: documents.map((document) =>
          asLeadDocument(document as unknown as LeadDocument),
        ),
        total,
        page,
        pageSize,
      }),
    );
  } catch (error) {
    if (isMongoUnavailable(error)) {
      res.status(503).json({ error: "MongoDB enquiry storage is unavailable." });
      return;
    }
    throw error;
  }
});

router.get(
  "/admin/leads/summary",
  requireAdmin,
  async (_req, res): Promise<void> => {
    try {
      await connectMongo();
      const startOfUtcDay = new Date();
      startOfUtcDay.setUTCHours(0, 0, 0, 0);

      const [total, newToday, grouped, recent] = await Promise.all([
        LeadModel.countDocuments(),
        LeadModel.countDocuments({
          status: "new",
          createdAt: { $gte: startOfUtcDay },
        }),
        LeadModel.aggregate<{ _id: string; count: number }>([
          { $group: { _id: "$status", count: { $sum: 1 } } },
        ]),
        LeadModel.find().sort({ createdAt: -1 }).limit(5).lean(),
      ]);

      res.json(
        GetLeadSummaryResponse.parse({
          total,
          newToday,
          byStatus: STATUSES.map((status) => ({
            status,
            count: grouped.find((row) => row._id === status)?.count ?? 0,
          })),
          recent: recent.map((document) =>
            asLeadDocument(document as unknown as LeadDocument),
          ),
        }),
      );
    } catch (error) {
      if (isMongoUnavailable(error)) {
        res
          .status(503)
          .json({ error: "MongoDB enquiry storage is unavailable." });
        return;
      }
      throw error;
    }
  },
);

router.patch(
  "/admin/leads/:id",
  requireAdmin,
  requireSameOriginMutation,
  async (req, res): Promise<void> => {
    const params = UpdateLeadParams.safeParse(req.params);
    const body = UpdateLeadBody.safeParse(req.body);
    if (!params.success || !body.success) {
      res.status(400).json({ error: "Invalid enquiry update." });
      return;
    }
    if (!Types.ObjectId.isValid(params.data.id)) {
      res.status(400).json({ error: "Invalid enquiry ID." });
      return;
    }

    const updates: Record<string, string> = {};
    if (body.data.status !== undefined) updates.status = body.data.status;
    if (body.data.internalNotes !== undefined) {
      updates.internalNotes = body.data.internalNotes.trim();
    }

    if (Object.keys(updates).length === 0) {
      res.status(400).json({ error: "No supported changes were provided." });
      return;
    }

    try {
      await connectMongo();
      const lead = await LeadModel.findByIdAndUpdate(
        params.data.id,
        { $set: updates },
        { new: true, runValidators: true },
      );
      if (!lead) {
        res.status(404).json({ error: "Enquiry not found." });
        return;
      }

      res.json(UpdateLeadResponse.parse(asLeadDocument(lead)));
    } catch (error) {
      if (isMongoUnavailable(error)) {
        res.status(503).json({ error: "MongoDB enquiry storage is unavailable." });
        return;
      }
      throw error;
    }
  },
);

router.get(
  "/admin/leads/export",
  requireAdmin,
  async (_req, res): Promise<void> => {
    try {
      await connectMongo();
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="almaluxe-enquiries-${new Date().toISOString().slice(0, 10)}.csv"`,
      );
      res.write("\uFEFF");
      res.write(
        [
          "Name",
          "Phone",
          "Email",
          "Pickup",
          "Destination",
          "Moving date",
          "Property type",
          "Services",
          "Details",
          "Source",
          "Status",
          "Internal notes",
          "Created at",
        ]
          .map(csvCell)
          .join(",") + "\r\n",
      );

      const cursor = LeadModel.find().sort({ createdAt: -1 }).lean().cursor();
      for await (const document of cursor) {
        const row = [
          document.name,
          document.phone,
          document.email,
          document.pickupLocation,
          document.destination,
          document.movingDate,
          document.propertyType,
          document.services.join("; "),
          document.additionalDetails,
          document.source,
          document.status,
          document.internalNotes,
          document.createdAt?.toISOString(),
        ]
          .map(csvCell)
          .join(",");

        if (!res.write(`${row}\r\n`)) {
          await once(res, "drain");
        }
      }
      res.end();
    } catch (error) {
      if (isMongoUnavailable(error)) {
        res.status(503).json({ error: "MongoDB enquiry storage is unavailable." });
        return;
      }
      throw error;
    }
  },
);

export default router;
