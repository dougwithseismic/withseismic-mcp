import { config as mcpConfig } from "../../../mcp.config";

export interface MCPConfig {
  prefix?: string;
}

export const config: MCPConfig = mcpConfig;

export const getNameWithPrefix = (name: string): string => {
  if (!config.prefix) return name;
  return `${config.prefix}_${name}`;
};
