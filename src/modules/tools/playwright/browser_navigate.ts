import { z } from "zod";
import { Tool } from "../../core";
import { PlaywrightSession } from "./instance";

// ---------- Schemas ----------
/**
 * Input schema for the browser navigation tool
 */
const BrowserNavigateToolInputSchema = z.object({
  url: z.string().url().describe("URL to navigate to"),
  waitUntil: z
    .enum(["load", "domcontentloaded", "networkidle", "commit"])
    .optional()
    .default("networkidle")
    .describe("Navigation wait condition"),
  timeout: z
    .number()
    .min(0)
    .optional()
    .default(30000)
    .describe("Navigation timeout in milliseconds"),
});

/**
 * Output schema for the browser navigation tool
 */
const BrowserNavigateToolOutputSchema = z.object({
  success: z.boolean().describe("Whether navigation was successful"),
  title: z.string().describe("Page title after navigation"),
  url: z.string().url().describe("Final URL after navigation"),
  snapshot: z
    .array(
      z.object({
        type: z.string(),
        text: z.string(),
      }),
    )
    .describe("Accessibility snapshot of page after navigation"),
});

type BrowserNavigateToolInput = z.infer<typeof BrowserNavigateToolInputSchema>;
type BrowserNavigateToolOutput = z.infer<
  typeof BrowserNavigateToolOutputSchema
>;

/**
 * Browser navigation tool implementation
 * Navigates to a specified URL using Playwright and returns page information
 */
export const browserNavigateTool = new Tool<
  BrowserNavigateToolInput,
  BrowserNavigateToolOutput
>(
  {
    name: "browser_navigate",
    description: "Navigate to a URL using Playwright browser automation",
    inputSchema: BrowserNavigateToolInputSchema,
    outputSchema: BrowserNavigateToolOutputSchema,
  },
  async ({ url, waitUntil, timeout }) => {
    const session = PlaywrightSession.getInstance();
    const page = await session.ensurePage();

    try {
      await page.goto(url, {
        waitUntil,
        timeout,
      });

      // @ts-ignore -- Undocumented API here.
      const snapshot = await page.locator("html").ariaSnapshot({ ref: true });

      return {
        success: true,
        title: await page.title(),
        url: page.url(),
        snapshot: [
          {
            type: "text",
            text: `Current Page Information:
URL: ${page.url()}
Title: ${await page.title()}

Accessibility Snapshot:
\`\`\`yaml
${snapshot}
\`\`\``,
          },
        ],
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Navigation failed: ${errorMessage}`);
    }
  },
);
