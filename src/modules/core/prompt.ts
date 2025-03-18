import {
  BaseComponent,
  BaseDefinition,
  BaseRepository,
  ComponentError,
  ComponentErrorType,
} from "./base";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { Registry } from "./registry";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

/**
 * Prompt message interface
 */
export interface PromptMessage {
  role: string;
  content: {
    type: string;
    text: string;
  };
}

/**
 * Prompt definition interface
 */
export interface PromptDefinition extends BaseDefinition {
  argsSchema: z.ZodType;
}

/**
 * Prompt generation error class
 */
export class PromptGenerationError extends Error {
  constructor(
    public readonly promptName: string,
    message: string,
    public readonly cause?: unknown,
  ) {
    super(`Prompt generation error (${promptName}): ${message}`);
    this.name = "PromptGenerationError";
  }
}

/**
 * Prompt component class
 */
export class Prompt<TArgs = unknown> extends BaseComponent<PromptDefinition> {
  private readonly jsonArgsSchema: ReturnType<typeof zodToJsonSchema>;

  constructor(
    definition: PromptDefinition,
    private readonly getMessages: (args: TArgs) => Promise<PromptMessage[]>,
  ) {
    super(definition);
    // Convert Zod schema to JSON schema
    this.jsonArgsSchema = zodToJsonSchema(definition.argsSchema);
    // Register with repository during collection phase
    Registry.getPromptRepository<TArgs>().register(this);
  }

  /**
   * Get the JSON schema version of the arguments schema
   */
  public getJsonArgsSchema(): ReturnType<typeof zodToJsonSchema> {
    return this.jsonArgsSchema;
  }

  /**
   * Generate messages for the prompt
   * @throws {PromptGenerationError} If generation fails
   */
  public async generateMessages(args: unknown): Promise<PromptMessage[]> {
    try {
      // Validate arguments using Zod schema
      const validatedArgs = this.getInternalDefinition().argsSchema.parse(args);
      return await this.getMessages(validatedArgs as TArgs);
    } catch (error) {
      throw new PromptGenerationError(
        this.getName(),
        "Message generation failed",
        error,
      );
    }
  }
}

/**
 * Prompt repository class
 */
export class PromptRepository<TArgs = unknown> extends BaseRepository<
  Prompt<TArgs>,
  PromptDefinition
> {
  private server?: Server;

  /**
   * Register a prompt with the repository
   */
  public register(prompt: Prompt<TArgs>): void {
    super.register(prompt);
  }

  /**
   * Unregister a prompt by name
   */
  public unregister(name: string): void {
    const prompt = this.get(name);
    if (!prompt) {
      throw new ComponentError(
        ComponentErrorType.NOT_FOUND,
        `Cannot unregister: prompt ${name} not found`,
        name,
      );
    }
    this.removeComponent(name);
  }

  /**
   * Get all prompt definitions with JSON schemas
   */
  private getAllDefinitionsWithJsonSchemas() {
    return this.getAll().map((prompt) => ({
      ...prompt.getDefinition(),
      arguments: [
        {
          name: "args",
          description: "Prompt arguments",
          schema: prompt.getJsonArgsSchema(),
        },
      ],
    }));
  }

  /**
   * Register all prompt handlers with the MCP server
   */
  public registerWithServer(server: Server): void {
    this.server = server;
    console.log("💭 Registering prompt handlers with server");

    // Register prompt list handler
    server.setRequestHandler(ListPromptsRequestSchema, async () => {
      console.log("📋 Handling ListPrompts request");
      return {
        prompts: this.getAllDefinitionsWithJsonSchemas(),
      };
    });

    // Register prompt messages handler
    server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      console.log(`💬 Handling prompt request: ${name}`, args);

      try {
        const prompt = this.get(name);

        if (!prompt) {
          throw new ComponentError(
            ComponentErrorType.NOT_FOUND,
            `Unknown prompt: ${name}`,
            name,
          );
        }

        const messages = await prompt.generateMessages(args);
        console.log(`✅ Prompt ${name} generated messages successfully`);

        return { messages };
      } catch (error) {
        console.error(`❌ Prompt generation error (${name}):`, error);

        // Rethrow to be handled by MCP server
        throw error instanceof Error
          ? error
          : new Error(`Error generating prompt ${name}: ${String(error)}`);
      }
    });
  }
}
