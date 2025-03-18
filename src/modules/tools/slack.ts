// ---------- Imports ----------
import { z } from "zod";
import { Tool } from "../core";
import { getSlackClient } from "./slack-utils";

// ---------- Schemas ----------
const SlackMessageSchema = z.object({
  recipient: z
    .string()
    .describe("Channel ID/name or user ID to send message to"),
  message: z.string().describe("Message text to send"),
  isUser: z
    .boolean()
    .optional()
    .default(false)
    .describe("Whether recipient is a user ID"),
});

const SlackMessageResponseSchema = z.object({
  messageId: z.string().describe("ID of the sent message"),
  timestamp: z.string().describe("Timestamp of the sent message"),
  error: z
    .string()
    .optional()
    .describe("Error message if the operation failed"),
});

type SlackMessageInput = z.infer<typeof SlackMessageSchema>;
type SlackMessageOutput = z.infer<typeof SlackMessageResponseSchema>;

// ---------- Tool Implementation ----------
export const sendSlackMessageTool = new Tool<
  SlackMessageInput,
  SlackMessageOutput
>(
  {
    name: "sendSlackMessage",
    description: "Sends a message to a Slack channel or user",
    inputSchema: SlackMessageSchema,
    outputSchema: SlackMessageResponseSchema,
  },
  async (args) => {
    const { client, error } = getSlackClient();

    if (!client) {
      return {
        messageId: "",
        timestamp: "",
        error: error ?? "Unknown error getting Slack client",
      };
    }

    try {
      const response = await client.chat.postMessage({
        channel: args.recipient,
        text: args.message,
      });

      return {
        messageId: response.ts ?? "",
        timestamp: response.ts ?? "",
      };
    } catch (error) {
      return {
        messageId: "",
        timestamp: "",
        error: `Failed to send Slack message: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  },
);
