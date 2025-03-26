import { z } from "zod";
import { Tool } from "../../core";
import { PlaywrightSession } from "./instance";

// ---------- Schemas ----------
/**
 * Input schema for the browser initialization tool
 */
const BrowserInitToolInputSchema = z.object({
  headless: z
    .boolean()
    .optional()
    .default(process.env.NODE_ENV === "production")
    .describe("Whether to run browser in headless mode"),
});

/**
 * Output schema for the browser initialization tool
 */
const BrowserInitToolOutputSchema = z.object({
  success: z.boolean().describe("Whether initialization was successful"),
  url: z.string().describe("Current page URL"),
});

type BrowserInitToolInput = z.infer<typeof BrowserInitToolInputSchema>;
type BrowserInitToolOutput = z.infer<typeof BrowserInitToolOutputSchema>;

/**
 * Browser initialization tool implementation
 * Initializes a new Playwright browser session if one doesn't exist
 */
export const browserInitTool = new Tool<
  BrowserInitToolInput,
  BrowserInitToolOutput
>(
  {
    name: "browser_init",
    description:
      "Initialize a new Playwright browser session if one doesn't exist",
    inputSchema: BrowserInitToolInputSchema,
    outputSchema: BrowserInitToolOutputSchema,
  },
  async ({ headless }) => {
    const session = PlaywrightSession.getInstance();
    const { page } = await session.initialize({ headless });

    return {
      success: true,
      url: page.url(),
    };
  },
);
