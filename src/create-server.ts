import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { registry } from "./lib/registry-instance.js";

// Import modules to ensure tools and prompts are loaded and registered
import "./modules/prompts";
import "./modules/tools";

export const createServer = () => {
  // If server already exists in registry, return it
  if (registry.getServer()) {
    return registry.getServer()!;
  }

  console.log("🚀 Creating MCP server");

  const server = new Server(
    {
      name: "withseismic/mcp",
      version: "1.0.0",
    },
    {
      capabilities: {
        prompts: {},
        resources: { subscribe: true },
        tools: {},
        logging: {},
      },
    }
  );

  // Initialize the existing registry instance with the server
  registry.initialize({ server });

  console.log("✅ MCP Server created successfully");
  return server;
};
