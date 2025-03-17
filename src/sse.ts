import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express from "express";
import { createServer } from "./create-server";

const app = express();

const { server, cleanup } = createServer();

let transport: SSEServerTransport;

app.get("/sse", async (req, res) => {
  console.log("Received SSE connection request");

  transport = new SSEServerTransport("/message", res);

  // Add error handler for transport
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
      // Remove the process.exit to keep server running
      // process.exit(0);
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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Connect to the MCP Server at http://localhost:${PORT}/sse`);
});
