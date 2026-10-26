import { clerkClient, getAuth } from "@clerk/express";
import type { RequestHandler } from "express";
import { GetAdminSessionResponse } from "@workspace/api-zod";

export type AdminProfile = {
  userId: string;
  name: string;
  email: string;
};

function pickPrimaryEmail(user: {
  primaryEmailAddressId: string | null;
  emailAddresses: Array<{ id: string; emailAddress: string }>;
}): string {
  return (
    user.emailAddresses.find(
      (address) => address.id === user.primaryEmailAddressId,
    )?.emailAddress ??
    user.emailAddresses[0]?.emailAddress ??
    ""
  );
}

export const requireAdmin: RequestHandler = async (req, res, next) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Sign in to access the admin dashboard." });
    return;
  }

  try {
    const user = await clerkClient.users.getUser(userId);
    if (user.publicMetadata.role !== "admin") {
      res.status(403).json({
        error:
          "This account is not an administrator. Ask the site owner to grant admin access.",
      });
      return;
    }

    const profile = GetAdminSessionResponse.parse({
      userId: user.id,
      name: user.fullName ?? user.firstName ?? pickPrimaryEmail(user),
      email: pickPrimaryEmail(user),
    });
    res.locals.admin = profile satisfies AdminProfile;
    next();
  } catch (error) {
    next(error);
  }
};

export const requireSameOriginMutation: RequestHandler = (req, res, next) => {
  const origin = req.get("origin");
  const host = req.get("host");
  if (!origin || !host) {
    res.status(403).json({ error: "A same-origin request is required." });
    return;
  }

  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    res.status(403).json({ error: "Invalid request origin." });
    return;
  }

  if (originHost !== host) {
    res.status(403).json({ error: "A same-origin request is required." });
    return;
  }

  next();
}
