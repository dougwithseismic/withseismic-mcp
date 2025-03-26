import { Page } from "playwright";
import { z } from "zod";
import { Tool } from "../../../core";
import { PlaywrightSession } from "../instance";
import { ElementOperations, ElementReferenceSchema } from "./browser_utils";

/**
 * Input schema for the browser hover action
 */
export const BrowserHoverInputSchema = z.object({
  page: z.custom<Page>(),
  elementRef: ElementReferenceSchema,
});

/**
 * Output schema for the browser hover action
 */
export const BrowserHoverOutputSchema = z.object({
  success: z.boolean(),
  elementFound: z.boolean(),
  url: z.string(),
});

export type BrowserHoverInput = z.infer<typeof BrowserHoverInputSchema>;
export type BrowserHoverOutput = z.infer<typeof BrowserHoverOutputSchema>;

/**
 * Hovers over an element identified by ARIA properties
 */
export const hoverElement = async ({
  page,
  elementRef,
}: BrowserHoverInput): Promise<BrowserHoverOutput> => {
  try {
    const { element, exists, url } = await ElementOperations.findElement({
      page,
      elementRef,
    });

    if (!exists) {
      return {
        success: false,
        elementFound: false,
        url,
      };
    }

    await element.hover({ timeout: elementRef.timeout });

    return {
      success: true,
      elementFound: true,
      url: page.url(),
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Hover operation failed: ${errorMessage}`);
  }
};

/**
 * Browser hover tool implementation
 */
export const browserHoverTool = new Tool<
  z.infer<typeof ElementReferenceSchema>,
  BrowserHoverOutput
>(
  {
    name: "browser_hover",
    description:
      "Hover over an element identified by ARIA properties using Playwright",
    inputSchema: ElementReferenceSchema,
    outputSchema: BrowserHoverOutputSchema,
  },
  async (elementRef) => {
    const session = PlaywrightSession.getInstance();
    const { page } = await session.initialize();

    return hoverElement({
      page,
      elementRef,
    });
  }
);
