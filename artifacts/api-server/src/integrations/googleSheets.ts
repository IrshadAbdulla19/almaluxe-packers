import { createSign } from "node:crypto";
import type { LeadDocument } from "../models/lead";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets";

function base64Url(value: string): string {
  return Buffer.from(value).toString("base64url");
}

function getGoogleConfig() {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(
    /\\n/g,
    "\n",
  );
  if (!spreadsheetId || !clientEmail || !privateKey) {
    return null;
  }
  return { spreadsheetId, clientEmail, privateKey };
}

export function isGoogleSheetsConfigured(): boolean {
  return getGoogleConfig() !== null;
}

async function createAccessToken(config: NonNullable<ReturnType<typeof getGoogleConfig>>) {
  const issuedAt = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64Url(
    JSON.stringify({
      iss: config.clientEmail,
      scope: SHEETS_SCOPE,
      aud: TOKEN_URL,
      iat: issuedAt,
      exp: issuedAt + 3600,
    }),
  );
  const unsignedToken = `${header}.${claims}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsignedToken);
  signer.end();
  const assertion = `${unsignedToken}.${signer.sign(config.privateKey, "base64url")}`;

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  if (!response.ok) {
    throw new Error("Google Sheets authorization failed.");
  }
  const token = (await response.json()) as { access_token?: string };
  if (!token.access_token) {
    throw new Error("Google Sheets did not return an access token.");
  }
  return token.access_token;
}

export async function appendLeadToGoogleSheets(lead: LeadDocument): Promise<void> {
  const config = getGoogleConfig();
  if (!config) {
    throw new Error("Google Sheets is not configured.");
  }

  const token = await createAccessToken(config);
  const range = process.env.GOOGLE_SHEETS_RANGE || "Enquiries!A:M";
  const url = new URL(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(config.spreadsheetId)}/values/${encodeURIComponent(range)}:append`,
  );
  url.searchParams.set("valueInputOption", "RAW");
  url.searchParams.set("insertDataOption", "INSERT_ROWS");

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      values: [
        [
          lead.name,
          lead.phone,
          lead.email ?? "",
          lead.pickupLocation,
          lead.destination,
          lead.movingDate,
          lead.propertyType,
          lead.services.join("; "),
          lead.additionalDetails ?? "",
          lead.source,
          lead.status,
          lead.internalNotes ?? "",
          lead.createdAt.toISOString(),
        ],
      ],
    }),
  });
  if (!response.ok) {
    throw new Error("Google Sheets could not append the enquiry.");
  }
}
