// src/sse.ts
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express from "express";

// src/create-server.ts
import { Server } from "@modelcontextprotocol/sdk/server/index.js";

// mcp.config.ts
var config = {
  prefix: "mcp"
};

// src/modules/core/config.ts
var config2 = config;
var getNameWithPrefix = (name) => {
  if (!config2.prefix) return name;
  return `${config2.prefix}_${name}`;
};

// src/modules/core/base.ts
var ComponentError = class extends Error {
  constructor(type, message, componentName) {
    super(`${type}: ${message}`);
    this.type = type;
    this.componentName = componentName;
    this.name = "ComponentError";
  }
};
var BaseComponent = class {
  constructor(definition) {
    this.definition = definition;
    this.prefixedName = getNameWithPrefix(definition.name);
  }
  prefixedName;
  getName() {
    return this.prefixedName;
  }
  getDescription() {
    return this.definition.description;
  }
  getDefinition() {
    return {
      ...this.definition,
      name: this.prefixedName
    };
  }
};
var BaseRepository = class {
  components = /* @__PURE__ */ new Map();
  /**
   * Register a component with the repository
   * @throws {ComponentError} If component with same name already exists
   */
  register(component) {
    this.components.set(component.getName(), component);
  }
  /**
   * Get a component by name
   * @returns The component or undefined if not found
   */
  get(name) {
    return this.components.get(name);
  }
  /**
   * Get all registered components
   */
  getAll() {
    return Array.from(this.components.values());
  }
  /**
   * Get all component definitions
   */
  getAllDefinitions() {
    return this.getAll().map(
      (component) => component.getDefinition()
    );
  }
};

// src/modules/core/tool.ts
import {
  CallToolRequestSchema,
  ListToolsRequestSchema
} from "@modelcontextprotocol/sdk/types.js";

// src/modules/core/prompt.ts
import {
  GetPromptRequestSchema,
  ListPromptsRequestSchema
} from "@modelcontextprotocol/sdk/types.js";
var PromptGenerationError = class extends Error {
  constructor(promptName, message, cause) {
    super(`Prompt generation error (${promptName}): ${message}`);
    this.promptName = promptName;
    this.cause = cause;
    this.name = "PromptGenerationError";
  }
};
var Prompt = class extends BaseComponent {
  constructor(definition, getMessages) {
    super(definition);
    this.getMessages = getMessages;
    Registry.getPromptRepository().register(this);
  }
  /**
   * Generate messages for the prompt
   * @throws {PromptGenerationError} If generation fails
   */
  async generateMessages(args) {
    try {
      return await this.getMessages(args);
    } catch (error) {
      throw new PromptGenerationError(
        this.getName(),
        "Message generation failed",
        error
      );
    }
  }
};
var PromptRepository = class extends BaseRepository {
  /**
   * Register all prompt handlers with the MCP server
   */
  registerWithServer(server2) {
    console.log("\u{1F4AD} Registering prompt handlers with server");
    server2.setRequestHandler(ListPromptsRequestSchema, async () => {
      console.log("\u{1F4CB} Handling ListPrompts request");
      return {
        prompts: this.getAllDefinitions()
      };
    });
    server2.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      console.log(`\u{1F4AC} Handling prompt request: ${name}`, args);
      try {
        const prompt2 = this.get(name);
        if (!prompt2) {
          throw new ComponentError(
            "NOT_FOUND" /* NOT_FOUND */,
            `Unknown prompt: ${name}`,
            name
          );
        }
        const messages = await prompt2.generateMessages(args);
        console.log(`\u2705 Prompt ${name} generated messages successfully`);
        return { messages };
      } catch (error) {
        console.error(`\u274C Prompt generation error (${name}):`, error);
        throw error instanceof Error ? error : new Error(`Error generating prompt ${name}: ${String(error)}`);
      }
    });
  }
};

// src/modules/core/registry.ts
var Registry = class _Registry {
  static instance;
  toolRepository = new ToolRepository();
  promptRepository = new PromptRepository();
  status = "initializing" /* INITIALIZING */;
  error;
  constructor() {
  }
  /**
   * Get the singleton instance
   */
  static getInstance() {
    if (!_Registry.instance) {
      _Registry.instance = new _Registry();
    }
    return _Registry.instance;
  }
  /**
   * Get the tool repository
   */
  static getToolRepository() {
    return _Registry.getInstance().toolRepository;
  }
  /**
   * Get the prompt repository
   */
  static getPromptRepository() {
    return _Registry.getInstance().promptRepository;
  }
  /**
   * Get current registry status
   */
  getStatus() {
    return this.status;
  }
  /**
   * Get error if status is ERROR
   */
  getError() {
    return this.error;
  }
  /**
   * Register all repositories with the MCP server
   */
  registerWithServer(server2) {
    try {
      this.toolRepository.registerWithServer(server2);
      this.promptRepository.registerWithServer(server2);
      this.status = "ready" /* READY */;
      this.logRegistrationSummary();
    } catch (err) {
      this.status = "error" /* ERROR */;
      this.error = err instanceof Error ? err : new Error(String(err));
      console.error("\u274C Registry initialization failed:", this.error);
      throw this.error;
    }
  }
  /**
   * Log a summary of all registered components
   */
  logRegistrationSummary() {
    const tools = this.toolRepository.getAll();
    const prompts = this.promptRepository.getAll();
    console.log("\n=== MCP Registry Initialization Complete ===");
    console.log("\n\u{1F4CB} Registered Components:");
    console.table([
      ...tools.map((tool) => ({
        type: "Tool",
        name: tool.getName(),
        description: tool.getDescription()
      })),
      ...prompts.map((prompt2) => ({
        type: "Prompt",
        name: prompt2.getName(),
        description: prompt2.getDescription()
      }))
    ]);
    console.log(
      `
\u2705 MCP Server ready with ${tools.length} tools and ${prompts.length} prompts
`
    );
  }
};

// src/modules/core/tool.ts
var ToolExecutionError = class extends Error {
  constructor(toolName, message, cause) {
    super(`Tool execution error (${toolName}): ${message}`);
    this.toolName = toolName;
    this.cause = cause;
    this.name = "ToolExecutionError";
  }
};
var Tool = class extends BaseComponent {
  constructor(definition, execute) {
    super(definition);
    this.execute = execute;
    Registry.getToolRepository().register(this);
  }
  /**
   * Execute the tool with the given arguments
   * @throws {ToolExecutionError} If execution fails
   */
  async executeTool(args) {
    try {
      return await this.execute(args);
    } catch (error) {
      throw new ToolExecutionError(this.getName(), "Execution failed", error);
    }
  }
};
var ToolRepository = class extends BaseRepository {
  /**
   * Register all tool handlers with the MCP server
   */
  registerWithServer(server2) {
    server2.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: this.getAllDefinitions()
      };
    });
    server2.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      try {
        const tool = this.get(name);
        if (!tool) {
          throw new ComponentError(
            "NOT_FOUND" /* NOT_FOUND */,
            `Unknown tool: ${name}`,
            name
          );
        }
        const result = await tool.executeTool(args);
        return {
          content: [
            {
              type: "text",
              text: typeof result === "string" ? result : JSON.stringify(result)
            }
          ]
        };
      } catch (error) {
        console.error(`\u274C Tool execution error (${name}):`, error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text",
              text: `Error executing tool ${name}: ${errorMessage}`
            }
          ]
        };
      }
    });
  }
};

// src/modules/tools/echo.ts
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
var EchoToolInputSchema = z.object({
  message: z.string().describe("The message to echo back")
});
var EchoToolOutputSchema = z.object({
  message: z.string().describe("The echoed message")
});
var echoTool = new Tool(
  {
    name: "echo",
    description: "Echoes the input message back to the client",
    inputSchema: zodToJsonSchema(EchoToolInputSchema),
    outputSchema: zodToJsonSchema(EchoToolOutputSchema)
  },
  async (args) => {
    const input = EchoToolInputSchema.parse(args);
    return { message: input.message };
  }
);

// src/modules/tools/add.ts
import { z as z2 } from "zod";
import { zodToJsonSchema as zodToJsonSchema2 } from "zod-to-json-schema";
var AddToolInputSchema = z2.object({
  a: z2.number().describe("First number"),
  b: z2.number().describe("Second number")
});
var AddToolOutputSchema = z2.object({
  result: z2.number().describe("Sum of the two numbers")
});
var addTool = new Tool(
  {
    name: "add",
    description: "Adds two numbers",
    inputSchema: zodToJsonSchema2(AddToolInputSchema),
    outputSchema: zodToJsonSchema2(AddToolOutputSchema)
  },
  async (args) => {
    const input = AddToolInputSchema.parse(args);
    return { result: input.a + input.b };
  }
);

// src/modules/prompts/git-commit.ts
import { z as z3 } from "zod";
var GitWorkflowPromptArgsSchema = z3.object({
  changes: z3.string().describe("Git diff or description of changes")
});
var prompt = new Prompt(
  {
    name: "git-workflow",
    description: "Generate Git add, commit and push workflow commands",
    arguments: [
      {
        name: "changes",
        description: "Git diff or description of changes",
        required: true
      }
    ]
  },
  async (args) => {
    return [
      {
        role: "user",
        content: {
          type: "text",
          text: `Generate a concise but descriptive commit message for these changes and return the full git workflow commands:

${args.changes}

Respond with the exact commands to run in this format:

git add .
git commit -m "{generated commit message}"
git push`
        }
      }
    ];
  }
);

// src/create-server.ts
var createServer = () => {
  console.log("\u{1F680} Creating MCP server");
  const server2 = new Server(
    {
      name: "example-servers/everything",
      version: "1.0.0"
    },
    {
      capabilities: {
        prompts: {},
        resources: { subscribe: true },
        tools: {},
        logging: {}
      }
    }
  );
  Registry.getInstance().registerWithServer(server2);
  console.log("\u2705 Repositories registered successfully");
  const cleanup2 = async () => {
    console.log("\u{1F9F9} Running server cleanup");
  };
  return { server: server2, cleanup: cleanup2 };
};

// src/sse.ts
var app = express();
var { server, cleanup } = createServer();
var transport;
app.get("/sse", async (req, res) => {
  console.log("Received SSE connection request");
  transport = new SSEServerTransport("/message", res);
  res.on("close", () => {
    console.log("Client closed connection");
  });
  try {
    await server.connect(transport);
    console.log("Connected transport to server");
    server.onclose = async () => {
      console.log("Server onclose handler triggered");
      console.log("Server closing, cleaning up...");
      await cleanup();
      await server.close();
      console.log("Server closed successfully");
    };
  } catch (err) {
    console.error("Error connecting transport:", err);
    throw err;
  }
});
app.post("/message", async (req, res) => {
  console.log("Received message request");
  console.log("Message body:", req.body);
  console.log("Content type:", req.headers["content-type"]);
  try {
    await transport.handlePostMessage(req, res);
    console.log("Message handled successfully");
  } catch (err) {
    console.error("Error handling message:", err);
    throw err;
  }
});
var PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Connect to the MCP Server at http://localhost:${PORT}/sse`);
});
//# sourceMappingURL=sse.js.map