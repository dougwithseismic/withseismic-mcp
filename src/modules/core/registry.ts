import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { Tool, ToolRepository } from "./tool.js";
import { Prompt, PromptRepository } from "./prompt.js";

/**
 * Registry configuration interface
 */
export interface RegistryConfig {
  server?: Server;
}

/**
 * Registry status enum for lifecycle management
 */
export enum RegistryStatus {
  COLLECTING = "collecting", // Initial state where components are being collected
  INITIALIZING = "initializing", // Server is being initialized
  READY = "ready", // Server is ready and all components are connected
  ERROR = "error",
}

/**
 * Registry for managing all MCP repositories
 */
export class Registry {
  private readonly toolRepository: ToolRepository<any, any>;
  private readonly promptRepository: PromptRepository;
  private status: RegistryStatus = RegistryStatus.COLLECTING;
  private error?: Error;
  private server?: Server;

  private static instance?: Registry;

  constructor(config: RegistryConfig = {}) {
    if (Registry.instance) {
      throw new Error(
        "Registry is a singleton. Use Registry.getInstance() to access the instance.",
      );
    }

    this.toolRepository = new ToolRepository();
    this.promptRepository = new PromptRepository();
    Registry.instance = this;

    // Initialize with server if provided
    if (config.server) {
      this.initialize({ server: config.server });
    }
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
    // This cast is safe because the repository is type-parameterized at the tool level
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
   * Get the MCP server instance
   */
  public getServer(): Server | undefined {
    return this.server;
  }

  /**
   * Initialize the registry with an MCP server instance
   */
  public initialize({ server }: { server: Server }): void {
    if (this.server) {
      throw new Error("Registry already initialized with a server");
    }

    try {
      console.log("🔄 Initializing registry with server");
      this.status = RegistryStatus.INITIALIZING;
      this.server = server;

      // Connect repositories to server
      this.toolRepository.registerWithServer(server);
      this.promptRepository.registerWithServer(server);

      this.status = RegistryStatus.READY;
      console.log("✅ Registry initialized successfully");

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
   * Register a new tool with the repository
   * If server is available, it will be connected automatically
   */
  public registerTool<TInput = unknown, TOutput = unknown>(
    tool: Tool<TInput, TOutput>,
  ): void {
    if (this.status === RegistryStatus.ERROR) {
      throw new Error("Cannot register tool: Registry is in error state");
    }

    const isPostInitialization = this.status === RegistryStatus.READY;
    console.log(
      `🔧 Registering tool${isPostInitialization ? " (post-initialization)" : ""}: ${tool.getName()}`,
    );

    // This cast is safe because the repository accepts any tool type
    (this.toolRepository as ToolRepository<TInput, TOutput>).register(tool);
    console.log(`✅ Tool ${tool.getName()} registered successfully`);
  }

  /**
   * Register a new prompt with the repository
   * If server is available, it will be connected automatically
   */
  public registerPrompt<TArgs = unknown>(prompt: Prompt<TArgs>): void {
    if (this.status === RegistryStatus.ERROR) {
      throw new Error("Cannot register prompt: Registry is in error state");
    }

    const isPostInitialization = this.status === RegistryStatus.READY;
    console.log(
      `💭 Registering prompt${isPostInitialization ? " (post-initialization)" : ""}: ${prompt.getName()}`,
    );

    // This cast is safe because the repository accepts any prompt type
    (this.promptRepository as PromptRepository<TArgs>).register(prompt);
    console.log(`✅ Prompt ${prompt.getName()} registered successfully`);
  }

  /**
   * Unregister a tool
   */
  public unregisterTool(name: string): void {
    if (this.status === RegistryStatus.ERROR) {
      throw new Error("Cannot unregister tool: Registry is in error state");
    }

    console.log(`🔧 Unregistering tool: ${name}`);
    this.toolRepository.unregister(name);
    console.log(`✅ Tool ${name} unregistered successfully`);
  }

  /**
   * Unregister a prompt
   */
  public unregisterPrompt(name: string): void {
    if (this.status === RegistryStatus.ERROR) {
      throw new Error("Cannot unregister prompt: Registry is in error state");
    }

    console.log(`💭 Unregistering prompt: ${name}`);
    this.promptRepository.unregister(name);
    console.log(`✅ Prompt ${name} unregistered successfully`);
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
