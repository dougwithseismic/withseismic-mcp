# MCP (Model Context Protocol) Server

A TypeScript implementation of an MCP server that provides tools and prompts for AI model interactions. This server is built using the `@modelcontextprotocol/sdk` and follows TypeScript best practices.

## Overview

The MCP server provides a standardized way to expose functionality to AI models through:

- **Tools**: Executable functions that models can call
- **Prompts**: Template-based message generators for model interactions

## Getting Started

### Installation

```bash
pnpm install
```

### Running the Server

Two modes are available:

1. Standard mode (stdio):

```bash
pnpm dev      # Development with hot reload
pnpm start    # Production
```

2. SSE (Server-Sent Events) mode:

```bash
pnpm dev:sse  # Development with hot reload
pnpm start:sse # Production
```

When running in SSE mode, connect to: `http://localhost:3001/sse`

## Core Concepts

### Tools

Tools are executable functions that models can invoke. Each tool:

- Has defined input/output schemas using Zod
- Is automatically registered with the registry
- Can perform any operation (calculation, file I/O, API calls, etc.)

Example tool:

```typescript
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { Tool } from "../core";

const MyToolInputSchema = z.object({
  param1: z.string().describe("Parameter description"),
});

const MyToolOutputSchema = z.object({
  result: z.string().describe("Result description"),
});

export const myTool = new Tool(
  {
    name: "myTool",
    description: "What my tool does",
    inputSchema: zodToJsonSchema(MyToolInputSchema),
    outputSchema: zodToJsonSchema(MyToolOutputSchema),
  },
  async (args) => {
    const input = MyToolInputSchema.parse(args);
    // Tool logic here
    return { result: "processed result" };
  },
);
```

### Prompts

Prompts are message generators that help structure model interactions. Each prompt:

- Defines its argument schema
- Generates messages in a consistent format
- Is automatically registered with the registry

Example prompt:

```typescript
import { Prompt } from "../core";

export const myPrompt = new Prompt(
  {
    name: "myPrompt",
    description: "What my prompt does",
    arguments: [
      {
        name: "arg1",
        description: "Argument description",
        required: true,
      },
    ],
  },
  async (args) => {
    return [
      {
        role: "system",
        content: {
          type: "text",
          text: `Generated message using ${args.arg1}`,
        },
      },
    ];
  },
);
```

## Adding New Components

### Creating a New Tool

1. Create a new file in `src/modules/tools/`
2. Define your input/output schemas using Zod
3. Create and export your tool instance
4. Add the export to `src/modules/tools/index.ts`

The registry will automatically:

- Register your tool
- Make it available to models
- Handle validation and error handling

### Creating a New Prompt

1. Create a new file in `src/modules/prompts/`
2. Define your argument schema
3. Create and export your prompt instance
4. Add the export to `src/modules/prompts/index.ts`

The registry will automatically:

- Register your prompt
- Make it available to models
- Handle message generation and errors

## Architecture

### Core Components

- **Registry**: Central manager for all tools and prompts
- **Tool**: Base class for executable functions
- **Prompt**: Base class for message generators
- **Server**: MCP protocol implementation

### Auto-Registration

The system uses a singleton Registry pattern that:

1. Automatically registers tools and prompts on import
2. Provides type-safe access to components
3. Handles all MCP protocol interactions

### Error Handling

The system includes robust error handling:

- Type validation via Zod schemas
- Execution error wrapping
- Detailed error messages for debugging

## Development

### Type Safety

All components use TypeScript for full type safety:

- Input/output schemas are defined using Zod
- Type inference for tool arguments and results
- Comprehensive error types

### Testing

Run tests using:

```bash
pnpm test
```

### Best Practices

1. Always define clear input/output schemas
2. Use descriptive names and documentation
3. Handle errors gracefully
4. Follow the TypeScript guidelines in the codebase

## Contributing

1. Create a new branch
2. Add your tools/prompts
3. Ensure all tests pass
4. Submit a pull request

## License

UNLICENSED - All rights reserved
