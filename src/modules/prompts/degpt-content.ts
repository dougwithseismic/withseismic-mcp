// ---------- Imports ----------
import { z } from "zod";
import { Prompt, PromptMessage } from "../core";

// ---------- Schemas ----------
/**
 * Arguments schema for removing LLM-specific language patterns
 */
const DegptContentArgsSchema = z.object({
  content: z.string().describe("Text content to process"),
});

type DegptContentArgs = z.infer<typeof DegptContentArgsSchema>;

/**
 * Prompt to remove common LLM/GPT language patterns
 */
export const prompt = new Prompt<DegptContentArgs>(
  {
    name: "degpt-content",
    description:
      "Remove common LLM/GPT language patterns and mannerisms from text",
    argsSchema: DegptContentArgsSchema,
  },
  async (args) => {
    return [
      {
        role: "user",
        content: {
          type: "text",
          text: `Review and revise this text to remove common AI language patterns like:
- Phrases that start with "This isn't X, it's Y"
- Marketing buzzwords like "game changer", "revolutionary", "groundbreaking"
- Overly enthusiastic or artificial-sounding language
- Repetitive acknowledgments and confirmations
- Unnecessarily formal or robotic transitions

Here is the text to process:

${args.content}

Provide the revised text with natural, straightforward language.`,
        },
      },
    ];
  }
);
