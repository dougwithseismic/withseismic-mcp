import { z } from "zod";
import { Tool } from "../../core";
import { PlaywrightSession } from "./instance";

// ---------- Schemas ----------
/**
 * Input schema for the browser PDF tool
 */
const BrowserPdfToolInputSchema = z.object({
  status: z
    .string()
    .optional()
    .default("")
    .describe("Optional status message to include"),
});

/**
 * Output schema for the browser PDF tool
 */
const BrowserPdfToolOutputSchema = z.object({
  success: z.boolean().describe("Whether PDF generation was successful"),
  filePath: z.string().describe("Path where PDF was saved"),
  url: z.string().describe("URL of the page that was captured"),
});

type BrowserPdfToolInput = z.infer<typeof BrowserPdfToolInputSchema>;
type BrowserPdfToolOutput = z.infer<typeof BrowserPdfToolOutputSchema>;

/**
 * Browser PDF tool implementation
 * Takes a PDF snapshot of the current page using Playwright
 */
export const browserPdfTool = new Tool<
  BrowserPdfToolInput,
  BrowserPdfToolOutput
>(
  {
    name: "browser_pdf",
    description: "Capture a PDF of the current page",
    inputSchema: BrowserPdfToolInputSchema,
    outputSchema: BrowserPdfToolOutputSchema,
  },
  async () => {
    const session = PlaywrightSession.getInstance();
    const page = await session.ensurePage();

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const sanitizedUrl = page.url().replace(/[^a-zA-Z0-9]/g, "_");
      const filename = `${timestamp}_${sanitizedUrl}.pdf`;

      await page.pdf({
        path: filename,
        format: "A4",
        printBackground: true,
      });

      return {
        success: true,
        filePath: filename,
        url: page.url(),
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to generate PDF: ${errorMessage}`);
    }
  },
);
