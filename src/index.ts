import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express, { type Request, type Response } from "express";

import { getServer } from "./server.js";
import { config } from "./config.js";

const app = express();
app.use(express.json());

app.post("/mcp", async (req: Request, res: Response) => {
  try {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });

    res.on("close", () => {
      transport.close();
    });

    const server = getServer();
    await server.connect(transport);
    if (req.body.params?.arguments?.name === "bad") {
      throw new Error("Bad Error");
    }
    if (req.body.params?.arguments?.name === "mcp") {
      res.writeHead(400).end(
        JSON.stringify({
          jsonrpc: "2.0",
          error: {
            code: -32700,
            message: "MCP Protocol Error",
          },
          id: null,
        }),
      );
      return;
    }

    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error("Error handling MCP request:", error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: "Internal server error",
        },
        id: null,
      });
    }
  }
});

app.get("/mcp", async (req: Request, res: Response) => {
  console.log("Received GET MCP request");
  res.writeHead(405).end(
    JSON.stringify({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Method not allowed.",
      },
      id: null,
    }),
  );
});

app.delete("/mcp", async (req: Request, res: Response) => {
  console.log("Received GET MCP request");
  res.writeHead(405).end(
    JSON.stringify({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Method not allowed.",
      },
      id: null,
    }),
  );
});

app.listen(config.MCP_HTTP_PORT, (error) => {
  if (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
  console.log(`MCP Streamable HTTP Server listening on port ${config.MCP_HTTP_PORT}`);
});

process.on("SIGINT", async () => {
  console.log("Server shutdown complete");
  process.exit(0);
});
