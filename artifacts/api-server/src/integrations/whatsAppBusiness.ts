type WhatsAppTemplateRequest = {
  recipient: string;
  templateName: string;
  languageCode: string;
  components?: Array<Record<string, unknown>>;
};

function getWhatsAppConfig() {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const graphVersion = process.env.META_GRAPH_VERSION;
  if (!phoneNumberId || !accessToken || !graphVersion) {
    return null;
  }
  if (!/^v\d+\.\d+$/.test(graphVersion)) {
    throw new Error("META_GRAPH_VERSION must use a version such as vXX.X.");
  }
  return { phoneNumberId, accessToken, graphVersion };
}

export function isWhatsAppBusinessConfigured(): boolean {
  return getWhatsAppConfig() !== null;
}

/**
 * Call only after the business has verified the recipient's WhatsApp opt-in
 * and approved the template/message for the intended purpose.
 */
export async function sendApprovedWhatsAppTemplate(
  message: WhatsAppTemplateRequest,
): Promise<void> {
  const config = getWhatsAppConfig();
  if (!config) {
    throw new Error("WhatsApp Business is not configured.");
  }

  const response = await fetch(
    `https://graph.facebook.com/${config.graphVersion}/${config.phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: message.recipient,
        type: "template",
        template: {
          name: message.templateName,
          language: { code: message.languageCode },
          ...(message.components ? { components: message.components } : {}),
        },
      }),
    },
  );
  if (!response.ok) {
    throw new Error("WhatsApp Business could not send the approved template.");
  }
}
