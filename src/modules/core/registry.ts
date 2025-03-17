import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { ToolRepository } from "./tool";
import { PromptRepository } from "./prompt";

/**
 * Registry status enum for lifecycle management
 */
export enum RegistryStatus {
  INITIALIZING = "initializing",
  READY = "ready",
  ERROR = "error",
}

/**
 * Registry for managing all MCP repositories
 * Implemented as a singleton to allow auto-registration of components
 */
export class Registry {
  private static instance: Registry;
  private readonly toolRepository = new ToolRepository();
  private readonly promptRepository = new PromptRepository();
  private status: RegistryStatus = RegistryStatus.INITIALIZING;
  private error?: Error;

  private constructor() {
    // Constructor is private for singleton pattern
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): Registry {
    if (!Registry.instance) {
      Registry.instance = new Registry();
    }
    return Registry.instance;
  }

  /**
   * Get the tool repository
   */
  public static getToolRepository<
    TInput = unknown,
    TOutput = unknown,
  >(): ToolRepository<TInput, TOutput> {
    return Registry.getInstance().toolRepository as ToolRepository<
      TInput,
      TOutput
    >;
  }

  /**
   * Get the prompt repository
   */
  public static getPromptRepository<
    TArgs = unknown,
  >(): PromptRepository<TArgs> {
    return Registry.getInstance().promptRepository as PromptRepository<TArgs>;
  }

  /**
   * Get current registry status
   */
  public getStatus(): RegistryStatus {
    return this.status;
  }

  /**
   * Get error if status is ERROR
   */
  public getError(): Error | undefined {
    return this.error;
  }

  /**
   * Register all repositories with the MCP server
   */
  public registerWithServer(server: Server): void {
    try {
      this.toolRepository.registerWithServer(server);
      this.promptRepository.registerWithServer(server);
      this.status = RegistryStatus.READY;

      // Log registration summary
      this.logRegistrationSummary();
    } catch (err) {
      this.status = RegistryStatus.ERROR;
      this.error = err instanceof Error ? err : new Error(String(err));
      console.error("❌ Registry initialization failed:", this.error);
      throw this.error;
    }
  }

  /**
   * Log a summary of all registered components
   */
  private logRegistrationSummary(): void {
    const tools = this.toolRepository.getAll();
    const prompts = this.promptRepository.getAll();

    console.log("\n=== MCP Registry Initialization Complete ===");

    console.log("\n📋 Registered Components:");
    console.table([
      ...tools.map((tool) => ({
        type: "Tool",
        name: tool.getName(),
        description: tool.getDescription(),
      })),
      ...prompts.map((prompt) => ({
        type: "Prompt",
        name: prompt.getName(),
        description: prompt.getDescription(),
      })),
    ]);

    console.log(
      `\n✅ MCP Server ready with ${tools.length} tools and ${prompts.length} prompts\n`,
    );
  }
}
