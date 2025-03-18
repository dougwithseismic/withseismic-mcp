/**
 * This file demonstrates how to use the Mastra Client to interact with Mastra agents.
 * In this example, we create a Tool that uses the Mastra weather agent to fetch weather information.
 * The Tool wraps the agent call in a type-safe interface that can be used by other parts of the system.
 */

import { z } from "zod";
import { Tool } from "../core";
import { MastraClient } from "@mastra/client-js";

// ---------- Schemas ----------
/**
 * Input schema for the Mastra weather tool
 */
const MastraWeatherToolInputSchema = z.object({
  location: z.string().describe("Location to get weather for"),
});

/**
 * Output schema for the Mastra weather tool
 */
const MastraWeatherToolOutputSchema = z.string().describe("Weather data");

type MastraWeatherToolInput = z.infer<typeof MastraWeatherToolInputSchema>;
type MastraWeatherToolOutput = z.infer<typeof MastraWeatherToolOutputSchema>;

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

// Get a reference to the weather agent
const weatherAgent = client.getAgent("weatherAgent");

/**
 * Mastra weather tool implementation
 */
export const mastraWeatherTool = new Tool<
  MastraWeatherToolInput,
  MastraWeatherToolOutput
>(
  {
    name: "mastraWeather",
    description: "Gets weather information using the Mastra weather agent",
    inputSchema: MastraWeatherToolInputSchema,
    outputSchema: MastraWeatherToolOutputSchema,
  },
  async (args) => {
    console.log("Generating weather data...");
    const response = await weatherAgent.generate({
      messages: [
        {
          role: "user",
          content: `Get the weather for ${args.location}`,
        },
      ],
    });

    console.log("Weather data generated:", response.text);

    // Parse the response into our expected format
    return response.text;
  },
);
