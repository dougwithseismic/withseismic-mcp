import { Page } from "playwright";
import { z } from "zod";
import { Tool } from "../../../core";
import { PlaywrightSession } from "../instance";
import { ElementOperations, ElementReferenceSchema } from "./browser_utils";

/**
 * Input schema for the browser type action
 */
export const BrowserTypeInputSchema = z.object({
  page: z.custom<Page>(),
  elementRef: ElementReferenceSchema,
  text: z.string().describe("Text to type into the element"),
  delay: z
    .number()
    .min(0)
    .optional()
    .default(50)
    .describe("Delay between keystrokes in milliseconds"),
});

/**
 * Output schema for the browser type action
 */
export const BrowserTypeOutputSchema = z.object({
  success: z.boolean(),
  elementFound: z.boolean(),
  url: z.string(),
  textEntered: z.string(),
});

export type BrowserTypeInput = z.infer<typeof BrowserTypeInputSchema>;
export type BrowserTypeOutput = z.infer<typeof BrowserTypeOutputSchema>;

/**
 * Types text into an element identified by ARIA properties
 */
export const typeIntoElement = async ({
  page,
  elementRef,
  text,
  delay = 50,
}: BrowserTypeInput): Promise<BrowserTypeOutput> => {
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
        textEntered: "",
      };
    }

    // Clear existing content if any
    await element.clear();

    // Type the text with specified delay
    await element.type(text, { delay });

    return {
      success: true,
      elementFound: true,
      url: page.url(),
      textEntered: text,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Type operation failed: ${errorMessage}`);
  }
};

/**
 * Tool schema for browser type action
 */
const BrowserTypeToolInputSchema = ElementReferenceSchema.extend({
  text: z.string().describe("Text to type into the element"),
  delay: z
    .number()
    .min(0)
    .optional()
    .default(50)
    .describe("Delay between keystrokes in milliseconds"),
});

/**
 * Browser type tool implementation
 */
export const browserTypeTool = new Tool<
  z.infer<typeof BrowserTypeToolInputSchema>,
  BrowserTypeOutput
>(
  {
    name: "browser_type",
    description:
      "Type text into an element identified by ARIA properties using Playwright",
    inputSchema: BrowserTypeToolInputSchema,
    outputSchema: BrowserTypeOutputSchema,
  },
  async ({ text, delay, ...elementRef }) => {
    const session = PlaywrightSession.getInstance();
    const { page } = await session.initialize();

    return typeIntoElement({
      page,
      elementRef,
      text,
      delay,
    });
  }
);
