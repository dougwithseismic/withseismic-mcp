// ---------- Imports ----------
import { z } from "zod";
import { Tool } from "../core";

// ---------- Schemas ----------
/**
 * Input schema for the add tool
 */
const AddToolInputSchema = z.object({
  a: z.number().describe("First number"),
  b: z.number().describe("Second number"),
});

/**
 * Output schema for the add tool
 */
const AddToolOutputSchema = z.object({
  result: z.number().describe("Sum of the two numbers"),
});

type AddToolInput = z.infer<typeof AddToolInputSchema>;
type AddToolOutput = z.infer<typeof AddToolOutputSchema>;

/**
 * Add tool implementation
 */
export const addTool = new Tool<AddToolInput, AddToolOutput>(
  {
    name: "add",
    description: "Adds two numbers",
    inputSchema: AddToolInputSchema,
    outputSchema: AddToolOutputSchema,
  },
  async (args) => {
    return { result: args.a + args.b };
  },
);
