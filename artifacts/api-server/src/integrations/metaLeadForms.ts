import { createHmac, timingSafeEqual } from "node:crypto";
import { CreateLeadBody } from "@workspace/api-zod";

type MetaField = {
  name: string;
  values: string[];
};

type MetaLeadPayload = {
  id?: string;
  field_data?: MetaField[];
};

function getMetaConfig() {
  const accessToken = process.env.META_LEAD_ACCESS_TOKEN;
  const appSecret = process.env.META_APP_SECRET;
  const graphVersion = process.env.META_GRAPH_VERSION;
  if (!accessToken || !appSecret || !graphVersion) {
    return null;
  }
  if (!/^v\d+\.\d+$/.test(graphVersion)) {
    throw new Error("META_GRAPH_VERSION must use a version such as vXX.X.");
  }
  return { accessToken, appSecret, graphVersion };
}

export function isMetaLeadFormsConfigured(): boolean {
  return Boolean(
    getMetaConfig() &&
      process.env.META_WEBHOOK_VERIFY_TOKEN &&
      process.env.META_PAGE_ID,
  );
}

export function verifyMetaSignature(
  rawBody: Buffer,
  signatureHeader: string | undefined,
): boolean {
  const config = getMetaConfig();
  if (!config || !signatureHeader?.startsWith("sha256=")) {
    return false;
  }

  const provided = Buffer.from(signatureHeader.slice("sha256=".length), "hex");
  const expected = createHmac("sha256", config.appSecret).update(rawBody).digest();
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}

export async function fetchMetaLead(leadId: string): Promise<MetaLeadPayload> {
  const config = getMetaConfig();
  if (!config) {
    throw new Error("Meta lead forms are not configured.");
  }
  if (!/^\d{5,40}$/.test(leadId)) {
    throw new Error("Invalid Meta lead ID.");
  }

  const url = new URL(
    `https://graph.facebook.com/${config.graphVersion}/${leadId}`,
  );
  url.searchParams.set("fields", "id,field_data");
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${config.accessToken}` },
  });
  if (!response.ok) {
    throw new Error("Meta could not return the requested lead form record.");
  }
  return (await response.json()) as MetaLeadPayload;
}

export function normalizeMetaLead(
  metaLead: MetaLeadPayload,
  source: "Facebook Lead Ads" | "Instagram Lead Ads",
) {
  const fields = new Map(
    (metaLead.field_data ?? []).map((field) => [
      field.name.toLowerCase().replace(/[^a-z0-9]/g, ""),
      field.values[0] ?? "",
    ]),
  );
  const serviceValues = (fields.get("services") ?? "")
    .split(/[;,]/)
    .map((service) => service.trim().toLowerCase().replace(/[^a-z0-9]/g, ""));
  const serviceMap = new Map([
    ["householdshifting", "household-shifting"],
    ["officerelocation", "office-relocation"],
    ["packingunpacking", "packing-unpacking"],
    ["loadingunloading", "loading-unloading"],
    ["localmoving", "local-moving"],
    ["longdistancemoving", "long-distance-moving"],
  ]);
  const normalized = {
    name: fields.get("fullname") ?? fields.get("name") ?? "",
    phone: fields.get("phone") ?? fields.get("phonenumber") ?? "",
    email: fields.get("email") || null,
    pickupLocation: fields.get("pickuplocation") ?? fields.get("pickup") ?? "",
    destination: fields.get("destination") ?? "",
    movingDate: fields.get("movingdate") ?? fields.get("movedate") ?? "",
    propertyType:
      fields.get("propertytype")?.toLowerCase() ??
      fields.get("property")?.toLowerCase() ??
      "",
    services: serviceValues
      .map((service) => serviceMap.get(service))
      .filter((service): service is string => service !== undefined),
    additionalDetails: fields.get("additionaldetails") ?? "",
    website: "",
  };
  const validated = CreateLeadBody.safeParse(normalized);

  if (!validated.success) {
    return null;
  }

  return { lead: validated.data, source };
}
