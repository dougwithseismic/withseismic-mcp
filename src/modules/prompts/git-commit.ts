// ---------- Imports ----------
import { z } from "zod";
import { Prompt, PromptMessage } from "../core";

// ---------- Schemas ----------
/**
 * Arguments schema for the git workflow prompt
 */
const GitWorkflowPromptArgsSchema = z.object({
  changes: z.string().describe("Git diff or description of changes"),
});

type GitWorkflowPromptArgs = z.infer<typeof GitWorkflowPromptArgsSchema>;

/**
 * Git workflow prompt implementation
 */
export const prompt = new Prompt<GitWorkflowPromptArgs>(
  {
    name: "git-workflow",
    description: "Generate Git add, commit and push workflow commands",
    argsSchema: GitWorkflowPromptArgsSchema,
  },
  async (args) => {
    return [
      {
        role: "user",
        content: {
          type: "text",
          text: `Generate a concise but descriptive commit message for these changes and return the full git workflow commands:\n\n${args.changes}\n\nRespond with the exact commands to run in this format:\n\ngit add .\ngit commit -m "{generated commit message}"\ngit push`,
        },
      },
    ];
  },
);
