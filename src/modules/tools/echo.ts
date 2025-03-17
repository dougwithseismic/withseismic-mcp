// ---------- Imports ----------
import { z } from "zod";
import { Tool } from "../core";

// ---------- Schemas ----------
/**
 * Input schema for the echo tool
 */
const EchoToolInputSchema = z.object({
  message: z.string().describe("Message to echo"),
});

/**
 * Output schema for the echo tool
 */
const EchoToolOutputSchema = z.object({
  message: z.string().describe("The echoed message"),
});

type EchoToolInput = z.infer<typeof EchoToolInputSchema>;
type EchoToolOutput = z.infer<typeof EchoToolOutputSchema>;

/**
 * Echo tool implementation
 */
export const echoTool = new Tool<EchoToolInput, EchoToolOutput>(
  {
    name: "echo",
    description: "Echoes back the input",
    inputSchema: EchoToolInputSchema,
    outputSchema: EchoToolOutputSchema,
  },
  async (args) => {
    return { message: args.message };
  },
);
