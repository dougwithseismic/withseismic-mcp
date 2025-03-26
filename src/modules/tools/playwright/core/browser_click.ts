import { Page } from "playwright";
import { z } from "zod";
import { Tool } from "../../../core";
import { PlaywrightSession } from "../instance";
import { ElementOperations, ElementReferenceSchema } from "./browser_utils";

/**
 * Output schema for the browser click action
 */
export const BrowserClickOutputSchema = z.object({
  success: z.boolean(),
  elementFound: z.boolean(),
  url: z.string(),
  wasForced: z.boolean(),
  snapshot: z.array(
    z.object({
      type: z.string(),
      text: z.string(),
    })
  ),
});

export type BrowserClickInput = {
  page: Page;
  elementRef: z.infer<typeof ElementReferenceSchema>;
};

export type BrowserClickOutput = z.infer<typeof BrowserClickOutputSchema>;

/**
 * Attempts to click an element with fallback to forced click
 */
async function attemptClick(element: any, timeout: number): Promise<boolean> {
  try {
    // Try normal click first
    await element.click({ timeout });
    return false; // Indicates normal click succeeded
  } catch (error) {
    try {
      // Fallback to forced click
      await element.click({ force: true, timeout });
      return true; // Indicates forced click was used
    } catch (forceError) {
      throw forceError; // If both methods fail, throw the last error
    }
  }
}

/**
 * Clicks an element identified by ARIA ID and captures a snapshot
 */
export const clickElement = async ({
  page,
  elementRef,
}: BrowserClickInput): Promise<BrowserClickOutput> => {
  try {
    const { element, exists, url } = await ElementOperations.findElement({
      page,
      elementRef,
    });

    if (!exists) {
      return {
        success: false,
        elementFound: false,
        wasForced: false,
        url,
        snapshot: [
          {
            type: "text",
            text: `Element with aria-ref=${elementRef.ariaId} not found`,
          },
        ],
      };
    }

    // Attempt click with fallback
    const wasForced = await attemptClick(element, elementRef.timeout);

    // Take a snapshot after click
    // @ts-ignore -- Undocumented API here.
    const snapshot = await page.locator("html").ariaSnapshot({ ref: true });

    return {
      success: true,
      elementFound: true,
      wasForced,
      url: page.url(),
      snapshot: [
        {
          type: "text",
          text: `Clicked element with aria-ref=${elementRef.ariaId}${wasForced ? " (forced)" : ""}\n\nSnapshot:\n\`\`\`yaml\n${snapshot}\n\`\`\``,
        },
      ],
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Click operation failed: ${errorMessage}`);
  }
};

/**
 * Browser click tool implementation
 */
export const browserClickTool = new Tool<
  z.infer<typeof ElementReferenceSchema>,
  BrowserClickOutput
>(
  {
    name: "browser_click",
    description: "Click an element identified by ARIA ID using Playwright",
    inputSchema: ElementReferenceSchema,
    outputSchema: BrowserClickOutputSchema,
  },
  async (elementRef) => {
    const session = PlaywrightSession.getInstance();
    const { page } = await session.initialize();

    return clickElement({
      page,
      elementRef,
    });
  }
);
