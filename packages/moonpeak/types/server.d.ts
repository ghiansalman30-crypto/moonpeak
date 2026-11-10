import type { McpServer } from "@modelcontextprotocol/server";
import type { CallToolResult, ResourceConfig, ToolConfig } from "./index";

export const RESOURCE_MIME_TYPE: "text/html;profile=mcp-app";
export type ToolModule = { tool?: ToolConfig; schema?: unknown; outputSchema?: unknown; default: (input: any, ctx: any) => unknown };
export type ServerOptions = {
  name: string;
  version?: string;
  instructions?: string;
  tools: { name: string; module: ToolModule }[];
  resources: { name: string; config?: ResourceConfig; html: () => string | Promise<string> }[];
};
export function resourceUri(app: string, name: string): string;
export function normalizeResult(ret: unknown): CallToolResult;
export function createMcpServer(opts: ServerOptions): McpServer;
/** Fetch-style handler for Workers, Hono, Deno, Bun, Next.js route handlers. */
export function createHandler(opts: ServerOptions): (request: Request) => Promise<Response>;
/** Node (req, res) handler for http.createServer or Express. */
export function createNodeHandler(opts: ServerOptions): Promise<(req: any, res: any) => Promise<void>>;
export const createMcpHandlerFor: typeof createHandler;
/** Load a `moonpeak build` output as server options (Node only). */
export function loadBuilt(root?: string, outDir?: string): Promise<ServerOptions>;
