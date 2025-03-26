import { z } from "zod";
import { Tool } from "../../core";
import { PlaywrightSession } from "./instance";

// ---------- Schemas ----------
/**
 * Input schema for the browser snapshot tool
 */
const BrowserSnapshotToolInputSchema = z.object({
  status: z
    .string()
    .optional()
    .default("")
    .describe("Optional status message to include"),
  selector: z
    .string()
    .optional()
    .default("html")
    .describe("CSS selector to target specific section of page for snapshot"),
});

/**
 * Output schema for the browser snapshot tool
 */
const BrowserSnapshotToolOutputSchema = z.object({
  content: z
    .array(
      z.object({
        type: z.string(),
        text: z.string(),
      }),
    )
    .describe("Snapshot content with page information"),
});

type BrowserSnapshotToolInput = z.infer<typeof BrowserSnapshotToolInputSchema>;
type BrowserSnapshotToolOutput = z.infer<
  typeof BrowserSnapshotToolOutputSchema
>;

/**
 * Browser snapshot tool implementation
 * Takes an accessibility snapshot of the current page using Playwright
 */
export const browserSnapshotTool = new Tool<
  BrowserSnapshotToolInput,
  BrowserSnapshotToolOutput
>(
  {
    name: "browser_snapshot",
    description:
      "Capture an accessibility snapshot of the current page or specific section",
    inputSchema: BrowserSnapshotToolInputSchema,
    outputSchema: BrowserSnapshotToolOutputSchema,
  },
  async ({ status, selector }) => {
    const session = PlaywrightSession.getInstance();
    const page = await session.ensurePage();

    try {
      // @ts-ignore -- Undocumented API here.
      const snapshot = await page.locator(selector).ariaSnapshot({ ref: true });
      return {
        content: [
          {
            type: "text",
            text: `${status ? `Status: ${status}\n` : ""}Current Page Information:
URL: ${page.url()}
Title: ${await page.title()}
Selected Element: ${selector}

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
      throw new Error(`Failed to capture snapshot: ${errorMessage}`);
    }
  },
);
