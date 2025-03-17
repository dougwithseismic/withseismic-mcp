import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { zodToJsonSchema } from "zod-to-json-schema";
import {
  BaseComponent,
  BaseDefinition,
  BaseRepository,
  ComponentError,
  ComponentErrorType,
} from "./base";
import { Registry } from "./registry";
import { z } from "zod";

/**
 * Tool definition interface
 */
export interface ToolDefinition extends BaseDefinition {
  inputSchema: z.ZodType;
  outputSchema: z.ZodType;
}

/**
 * Tool execution error class
 */
export class ToolExecutionError extends Error {
  constructor(
    public readonly toolName: string,
    message: string,
    public readonly cause?: unknown,
  ) {
    super(`Tool execution error (${toolName}): ${message}`);
    this.name = "ToolExecutionError";
  }
}

/**
 * Tool component class
 */
export class Tool<
  TInput = unknown,
  TOutput = unknown,
> extends BaseComponent<ToolDefinition> {
  private readonly jsonInputSchema: ReturnType<typeof zodToJsonSchema>;
  private readonly jsonOutputSchema: ReturnType<typeof zodToJsonSchema>;

  constructor(
    definition: ToolDefinition,
    private readonly execute: (args: TInput) => Promise<TOutput>,
  ) {
    super(definition);
    // Convert Zod schemas to JSON schemas
    this.jsonInputSchema = zodToJsonSchema(definition.inputSchema);
    this.jsonOutputSchema = zodToJsonSchema(definition.outputSchema);
    // Auto-register with repository
    Registry.getToolRepository<TInput, TOutput>().register(this);
  }

  /**
   * Get the JSON schema version of the input schema
   */
  public getJsonInputSchema(): ReturnType<typeof zodToJsonSchema> {
    return this.jsonInputSchema;
  }

  /**
   * Get the JSON schema version of the output schema
   */
  public getJsonOutputSchema(): ReturnType<typeof zodToJsonSchema> {
    return this.jsonOutputSchema;
  }

  /**
   * Execute the tool with the given arguments
   * @throws {ToolExecutionError} If execution fails
   */
  public async executeTool(args: unknown): Promise<TOutput> {
    try {
      // Validate input using Zod schema
      const validatedArgs =
        this.getInternalDefinition().inputSchema.parse(args);
      return await this.execute(validatedArgs as TInput);
    } catch (error) {
      throw new ToolExecutionError(this.getName(), "Execution failed", error);
    }
  }
}

/**
 * Tool repository class
 */
export class ToolRepository<
  TInput = unknown,
  TOutput = unknown,
> extends BaseRepository<Tool<TInput, TOutput>, ToolDefinition> {
  /**
   * Get all tool definitions with JSON schemas
   */
  private getAllDefinitionsWithJsonSchemas() {
    return this.getAll().map((tool) => ({
      ...tool.getDefinition(),
      inputSchema: tool.getJsonInputSchema(),
      outputSchema: tool.getJsonOutputSchema(),
    }));
  }

  /**
   * Register all tool handlers with the MCP server
   */
  public registerWithServer(server: Server): void {
    // Register tool list handler
    server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: this.getAllDefinitionsWithJsonSchemas(),
      };
    });

    // Register tool call handler
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        const tool = this.get(name);

        if (!tool) {
          throw new ComponentError(
            ComponentErrorType.NOT_FOUND,
            `Unknown tool: ${name}`,
            name,
          );
        }

        const result = await tool.executeTool(args);

        return {
          content: [
            {
              type: "text",
              text:
                typeof result === "string" ? result : JSON.stringify(result),
            },
          ],
        };
      } catch (error) {
        console.error(`❌ Tool execution error (${name}):`, error);

        // Format error for client
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        return {
          content: [
            {
              type: "text",
              text: `Error executing tool ${name}: ${errorMessage}`,
            },
          ],
        };
      }
    });
  }
}
