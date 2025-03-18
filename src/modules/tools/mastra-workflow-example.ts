/**
 * This file demonstrates how to use Mastra Workflows with the Mastra client in a type-safe way.
 * It wraps the weather workflow in a Tool interface that can be used by other parts of the system.
 */

import { z } from "zod";
import { Tool } from "../core";
import { MastraClient } from "@mastra/client-js";

// ---------- Client Setup ----------
const client = new MastraClient({
  baseUrl: String(process.env.MASTRA_BASE_URL),
  retries: 3,
  backoffMs: 300,
  maxBackoffMs: 5000,
  headers: {
    "X-Development": "true",
  },
});

// ---------- Schemas ----------
/**
 * Input schema for the Mastra workflow tool
 * Matches the trigger schema of the weather workflow
 */
const MastraWorkflowToolInputSchema = z.object({
  city: z.string().describe("The city to get weather activities for"),
});

/**
 * Output schema for the Mastra workflow tool
 * Represents the final output of the workflow after activity planning
 */
const MastraWorkflowToolOutputSchema = z.object({
  activities: z
    .string()
    .describe("Suggested activities based on weather forecast"),
});

type MastraWorkflowToolInput = z.infer<typeof MastraWorkflowToolInputSchema>;
type MastraWorkflowToolOutput = z.infer<typeof MastraWorkflowToolOutputSchema>;

/**
 * Mastra workflow tool implementation
 * Uses the Mastra client to interact with the weather workflow
 */
export const planActivitiesTool = new Tool<
  MastraWorkflowToolInput,
  MastraWorkflowToolOutput
>(
  {
    name: "plan-activities",
    description:
      "Gets weather-based activity suggestions using the Mastra weather workflow",
    inputSchema: MastraWorkflowToolInputSchema,
    outputSchema: MastraWorkflowToolOutputSchema,
  },
  async (args): Promise<MastraWorkflowToolOutput> => {
    console.log("Running weather workflow for city:", args.city);

    // Get workflow instance
    const workflows = await client.getWorkflows();
    console.log("Workflows:", workflows);
    const workflow = client.getWorkflow("weatherWorkflow");

    try {
      // Start workflow and await results
      const { runId } = await workflow.createRun();
      const result = await workflow.startAsync({
        runId,
        triggerData: {
          city: args.city,
        },
      });

      console.log(result);

      // Get the final step result which contains the activities
      // @ts-expect-error -- wrongly typed
      const { activities } = result.results["plan-activities"].output;

      if (!activities) {
        throw new Error("No activities generated from workflow");
      }

      return {
        activities: activities,
      };
    } catch (error) {
      console.error("Error running weather workflow:", error);
      throw error;
    }
  }
);
