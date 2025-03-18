// ---------- Imports ----------
import { z } from "zod";
import { Tool } from "../core";
import { UsersListResponse } from "@slack/web-api";
import { getSlackClient } from "./slack-utils";

// ---------- Types ----------
type User = NonNullable<UsersListResponse["members"]>[number];

// ---------- Schemas ----------
const ListUsersInputSchema = z.object({
  limit: z
    .number()
    .optional()
    .default(100)
    .describe("Maximum number of users to return"),
});

const SearchUsersInputSchema = z.object({
  query: z.string().describe("Search query to find users"),
  limit: z
    .number()
    .optional()
    .default(100)
    .describe("Maximum number of users to return"),
});

const UserInfoSchema = z.object({
  id: z.string().describe("User ID"),
  name: z.string().describe("Username"),
  realName: z.string().nullable().describe("User's real name"),
  isBot: z.boolean().describe("Whether the user is a bot"),
  isAdmin: z.boolean().describe("Whether the user is an admin"),
});

const ListUsersResponseSchema = z.object({
  users: z.array(UserInfoSchema).describe("List of users"),
  hasMore: z.boolean().describe("Whether there are more users to fetch"),
  error: z
    .string()
    .optional()
    .describe("Error message if the operation failed"),
});

type ListUsersInput = z.infer<typeof ListUsersInputSchema>;
type SearchUsersInput = z.infer<typeof SearchUsersInputSchema>;
type ListUsersOutput = z.infer<typeof ListUsersResponseSchema>;

// ---------- Utilities ----------
const formatUsers = (users: User[]): z.infer<typeof UserInfoSchema>[] => {
  return users.map((user) => ({
    id: user.id ?? "",
    name: user.name ?? "",
    realName: user.real_name ?? null,
    isBot: user.is_bot ?? false,
    isAdmin: user.is_admin ?? false,
  }));
};

// ---------- Tool Implementation ----------
export const listSlackUsersTool = new Tool<ListUsersInput, ListUsersOutput>(
  {
    name: "listSlackUsers",
    description: "Lists Slack workspace users",
    inputSchema: ListUsersInputSchema,
    outputSchema: ListUsersResponseSchema,
  },
  async (args) => {
    const { client, error } = getSlackClient();

    if (!client) {
      return {
        users: [],
        hasMore: false,
        error: error ?? "Unknown error getting Slack client",
      };
    }

    try {
      const response = await client.users.list({
        limit: args.limit,
      });

      const users = formatUsers(response.members ?? []);

      return {
        users,
        hasMore: response.response_metadata?.next_cursor ? true : false,
      };
    } catch (error) {
      return {
        users: [],
        hasMore: false,
        error: `Failed to list Slack users: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  },
);

export const searchSlackUsersTool = new Tool<SearchUsersInput, ListUsersOutput>(
  {
    name: "searchSlackUsers",
    description: "Search for Slack users by name or real name",
    inputSchema: SearchUsersInputSchema,
    outputSchema: ListUsersResponseSchema,
  },
  async (args) => {
    const { client, error } = getSlackClient();

    if (!client) {
      return {
        users: [],
        hasMore: false,
        error: error ?? "Unknown error getting Slack client",
      };
    }

    try {
      const response = await client.users.list({
        limit: args.limit,
      });

      const query = args.query.toLowerCase();
      const matchedUsers = (response.members ?? []).filter(
        (user) =>
          user.name?.toLowerCase().includes(query) ||
          user.real_name?.toLowerCase().includes(query),
      );

      const users = formatUsers(matchedUsers);

      return {
        users,
        hasMore: response.response_metadata?.next_cursor ? true : false,
      };
    } catch (error) {
      return {
        users: [],
        hasMore: false,
        error: `Failed to search Slack users: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  },
);
