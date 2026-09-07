import OAuthProvider from "@cloudflare/workers-oauth-provider";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { McpAgent } from "agents/mcp";
import { z } from "zod";
import { GitHubHandler } from "./github-handler";
import type { Props } from "./utils";

// The people's door to the Datum data platform. Sign in with GitHub (DatumLabMHQ members only), then
// the same five tools as the keyed API: this worker forwards each call to datum-api with a server-side
// key, so nobody holds a key on their machine.
async function api<T>(env: Env, path: string): Promise<T> {
	const base = (env.DATUM_API_URL || "https://datum-api-datumlabs1.vercel.app").replace(/\/$/, "");
	const res = await fetch(`${base}${path}`, { headers: { "x-api-key": env.DATUM_API_KEY, accept: "application/json" } });
	if (!res.ok) throw new Error(`datum-api ${path} -> HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
	return res.json() as Promise<T>;
}
const text = (v: unknown) => ({ content: [{ type: "text" as const, text: typeof v === "string" ? v : JSON.stringify(v, null, 2) }] });
const qs = (o: Record<string, unknown>) => Object.entries(o).filter(([, v]) => v !== undefined && v !== "").map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join("&");

export class DatumMCP extends McpAgent<Env, Record<string, never>, Props> {
	server = new McpServer({ name: "datum-platform", version: "1.0.0" });

	async init() {
		this.server.tool("whoami", "Who is signed in to the Datum platform door.", {}, async () => text({ login: this.props!.login, name: this.props!.name }));
		this.server.tool("list_products", "List the products in the Datum data platform and the resources (curated tables) each exposes, with their filters.", {}, async () => text(await api(this.env, "/api/v1/products")));
		this.server.tool("list_questions", "List the canonical consensus questions the platform answers, with ids and the metric definition each uses.", {}, async () => text(await api(this.env, "/api/v1/questions")));
		this.server.tool(
			"ask",
			"Answer one canonical question for a date (YYYY-MM-DD; default: latest day with data). Returns value, unit, the date used and the SQL behind it.",
			{ question_id: z.string().describe("id from list_questions"), date: z.string().optional().describe("YYYY-MM-DD") },
			async ({ question_id, date }) => text(await api(this.env, `/api/v1/ask/${encodeURIComponent(question_id)}${date ? `?date=${date}` : ""}`)),
		);
		this.server.tool(
			"query",
			"Read rows from one resource (product and name from list_products). Filters must come from that resource's filter list. Daily tables default to the latest day; pass day, or since/until (YYYY-MM-DD). limit up to 5000.",
			{ product: z.string(), resource: z.string(), filters: z.record(z.string(), z.string()).optional(), since: z.string().optional(), until: z.string().optional(), limit: z.number().int().min(1).max(5000).optional() },
			async ({ product, resource, filters, since, until, limit }) => text(await api(this.env, `/api/v1/${product}/${resource}?${qs({ ...(filters ?? {}), since, until, limit })}`)),
		);
		this.server.tool("health", "Platform health: latest run per job, source freshness, last successful build, and current problems.", {}, async () => text(await api(this.env, "/api/v1/health")));
	}
}

export default new OAuthProvider({
	apiHandler: DatumMCP.serve("/mcp"),
	apiRoute: "/mcp",
	authorizeEndpoint: "/authorize",
	clientRegistrationEndpoint: "/register",
	defaultHandler: GitHubHandler as any,
	tokenEndpoint: "/token",
});
