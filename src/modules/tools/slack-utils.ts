// ---------- Imports ----------
import { WebClient } from "@slack/web-api";

// ---------- Types ----------
export type SlackClient = WebClient;

export interface SlackError {
  error: string;
}

// ---------- Constants ----------
const SLACK_TOKEN = process.env.SLACK_BOT_TOKEN;
const MISSING_TOKEN_ERROR =
  "SLACK_BOT_TOKEN environment variable is not set. Please configure your Slack token first.";

// ---------- Utilities ----------
export const getSlackClient = (): {
  client: SlackClient | null;
  error: string | null;
} => {
  if (!SLACK_TOKEN) {
    return { client: null, error: MISSING_TOKEN_ERROR };
  }
  return { client: new WebClient(SLACK_TOKEN), error: null };
};

export const createSlackError = (message: string): SlackError => ({
  error: message,
});

export const isSlackConfigured = (): boolean => Boolean(SLACK_TOKEN);
