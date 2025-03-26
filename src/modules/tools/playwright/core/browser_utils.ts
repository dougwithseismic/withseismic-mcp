import { Locator, Page } from "playwright";
import { z } from "zod";

/**
 * Schema for element reference parameters
 */
export const ElementReferenceSchema = z.object({
  ariaId: z.string().describe("ARIA ID reference for the element"),
  timeout: z
    .number()
    .min(0)
    .optional()
    .default(5000)
    .describe("Operation timeout in milliseconds"),
});

export type ElementReference = z.infer<typeof ElementReferenceSchema>;

/**
 * Base schema for operation results
 */
export const BaseOperationResultSchema = z.object({
  success: z.boolean().describe("Whether operation was successful"),
  elementFound: z.boolean().describe("Whether element was found"),
  url: z.string().describe("Current URL after operation"),
});

export type BaseOperationResult = z.infer<typeof BaseOperationResultSchema>;

/**
 * Input type for finding elements
 */
export type FindElementInput = {
  page: Page;
  elementRef: ElementReference;
};

/**
 * Output type for finding elements
 */
export type FindElementOutput = {
  element: Locator;
  exists: boolean;
  url: string;
};

/**
 * Utility class for handling element operations
 */
export class ElementOperations {
  /**
   * Creates an accessibility-based locator for an element using ARIA ID
   */
  private static createAccessibilityLocator(
    page: Page,
    { ariaId }: ElementReference,
  ): Locator {
    const locator = page.locator(`aria-ref=${ariaId}`);
    return locator;
  }

  /**
   * Finds an element on the page using ARIA ID
   */
  static async findElement({
    page,
    elementRef,
  }: FindElementInput): Promise<FindElementOutput> {
    const element = this.createAccessibilityLocator(page, elementRef);

    const exists = (await element.count()) > 0;

    return {
      element,
      exists,
      url: page.url(),
    };
  }

  /**
   * Validates element existence and returns standardized result
   */
  static async validateElement(
    page: Page,
    reference: ElementReference,
  ): Promise<{ element: Locator; baseResult: BaseOperationResult }> {
    const { element, exists } = await this.findElement({
      page,
      elementRef: reference,
    });

    if (!exists) {
      return {
        element,
        baseResult: {
          success: false,
          elementFound: false,
          url: page.url(),
        },
      };
    }

    return {
      element,
      baseResult: {
        success: true,
        elementFound: true,
        url: page.url(),
      },
    };
  }
}
