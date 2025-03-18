// ---------- Imports ----------
import { z } from "zod";
import { Tool } from "../core";
import { ConversationsListResponse } from "@slack/web-api";
import { getSlackClient } from "./slack-utils";

// ---------- Types ----------
type Channel = NonNullable<ConversationsListResponse["channels"]>[number];

// ---------- Schemas ----------
const ListChannelsInputSchema = z.object({
  excludeArchived: z
    .boolean()
    .optional()
    .default(true)
    .describe("Whether to exclude archived channels"),
  limit: z
    .number()
    .optional()
    .default(100)
    .describe("Maximum number of channels to return"),
});

const SearchChannelsInputSchema = z.object({
  query: z.string().describe("Search query to find channels"),
  excludeArchived: z
    .boolean()
    .optional()
    .default(true)
    .describe("Whether to exclude archived channels"),
  limit: z
    .number()
    .optional()
    .default(100)
    .describe("Maximum number of channels to return"),
});

const ChannelInfoSchema = z.object({
  id: z.string().describe("Channel ID"),
  name: z.string().describe("Channel name"),
  isArchived: z.boolean().describe("Whether the channel is archived"),
  memberCount: z.number().describe("Number of members in the channel"),
});

const ListChannelsResponseSchema = z.object({
  channels: z.array(ChannelInfoSchema).describe("List of channels"),
  hasMore: z.boolean().describe("Whether there are more channels to fetch"),
  error: z
    .string()
    .optional()
    .describe("Error message if the operation failed"),
});

type ListChannelsInput = z.infer<typeof ListChannelsInputSchema>;
type SearchChannelsInput = z.infer<typeof SearchChannelsInputSchema>;
type ListChannelsOutput = z.infer<typeof ListChannelsResponseSchema>;

// ---------- Utilities ----------
const formatChannels = (
  channels: Channel[],
): z.infer<typeof ChannelInfoSchema>[] => {
  return channels.map((channel) => ({
    id: channel.id ?? "",
    name: channel.name ?? "",
    isArchived: channel.is_archived ?? false,
    memberCount: channel.num_members ?? 0,
  }));
};

// ---------- Tool Implementation ----------
export const listSlackChannelsTool = new Tool<
  ListChannelsInput,
  ListChannelsOutput
>(
  {
    name: "listSlackChannels",
    description: "Lists available Slack channels",
    inputSchema: ListChannelsInputSchema,
    outputSchema: ListChannelsResponseSchema,
  },
  async (args) => {
    const { client, error } = getSlackClient();

    if (!client) {
      return {
        channels: [],
        hasMore: false,
        error: error ?? "Unknown error getting Slack client",
      };
    }

    try {
      const response = await client.conversations.list({
        exclude_archived: args.excludeArchived,
        limit: args.limit,
      });

      const channels = formatChannels(response.channels ?? []);

      return {
        channels,
        hasMore: response.response_metadata?.next_cursor ? true : false,
      };
    } catch (error) {
      return {
        channels: [],
        hasMore: false,
        error: `Failed to list Slack channels: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  },
);

export const searchSlackChannelsTool = new Tool<
  SearchChannelsInput,
  ListChannelsOutput
>(
  {
    name: "searchSlackChannels",
    description: "Search for Slack channels by name",
    inputSchema: SearchChannelsInputSchema,
    outputSchema: ListChannelsResponseSchema,
  },
  async (args) => {
    const { client, error } = getSlackClient();

    if (!client) {
      return {
        channels: [],
        hasMore: false,
        error: error ?? "Unknown error getting Slack client",
      };
    }

    try {
      const response = await client.conversations.list({
        exclude_archived: args.excludeArchived,
        limit: args.limit,
      });

      const query = args.query.toLowerCase();
      const matchedChannels = (response.channels ?? []).filter((channel) =>
        channel.name?.toLowerCase().includes(query),
      );

      const channels = formatChannels(matchedChannels);

      return {
        channels,
        hasMore: response.response_metadata?.next_cursor ? true : false,
      };
    } catch (error) {
      return {
        channels: [],
        hasMore: false,
        error: `Failed to search Slack channels: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  },
);
