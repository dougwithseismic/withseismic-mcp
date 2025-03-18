import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { Registry } from "./modules/core";

// Import modules to ensure tools and prompts are loaded and registered
import "./modules/tools";
import "./modules/prompts";

export const createServer = () => {
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
    },
  );

  // Register repositories with server
  Registry.getInstance().registerWithServer(server);
  console.log("✅ Repositories registered successfully");

  const cleanup = async () => {
    console.log("🧹 Running server cleanup");
    // Add any cleanup logic here
  };

  return { server, cleanup };
};
