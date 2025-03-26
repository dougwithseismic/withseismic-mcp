import { Browser, BrowserContext, Page, chromium } from "playwright";

interface InitializeOptions {
  headless?: boolean;
}

/**
 * Singleton class to manage a single Playwright browser session.
 * Provides centralized browser instance management and ensures only one browser
 * is running at a time.
 */
export class PlaywrightSession {
  private static instance: PlaywrightSession;
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;

  private constructor() {}

  /**
   * Gets the singleton instance of PlaywrightSession
   * @returns The PlaywrightSession instance
   */
  public static getInstance(): PlaywrightSession {
    if (!PlaywrightSession.instance) {
      PlaywrightSession.instance = new PlaywrightSession();
    }
    return PlaywrightSession.instance;
  }

  /**
   * Initializes the browser session if not already running
   * @param options Configuration options for browser initialization
   * @returns Object containing browser, context and page instances
   */
  public async initialize(options: InitializeOptions = {}): Promise<{
    browser: Browser;
    context: BrowserContext;
    page: Page;
  }> {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: options.headless ?? process.env.NODE_ENV === "production",
      });
      this.context = await this.browser.newContext();
      this.page = await this.context.newPage();
    }
    return {
      browser: this.browser,
      context: this.context!,
      page: this.page!,
    };
  }

  /**
   * Ensures a page exists, initializing if necessary
   * @returns The current Page instance
   * @throws Error if initialization fails
   */
  public async ensurePage(): Promise<Page> {
    if (!this.page) {
      const { page } = await this.initialize();
      return page;
    }
    return this.page;
  }

  /**
   * Closes all browser resources and resets the session
   */
  public async close(): Promise<void> {
    if (this.page) {
      await this.page.close();
      this.page = null;
    }
    if (this.context) {
      await this.context.close();
      this.context = null;
    }
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Gets the current page instance
   * @returns The current Page instance or null if not initialized
   */
  public getPage(): Page | null {
    return this.page;
  }

  /**
   * Gets the current browser context
   * @returns The current BrowserContext instance or null if not initialized
   */
  public getContext(): BrowserContext | null {
    return this.context;
  }

  /**
   * Gets the current browser instance
   * @returns The current Browser instance or null if not initialized
   */
  public getBrowser(): Browser | null {
    return this.browser;
  }
}
