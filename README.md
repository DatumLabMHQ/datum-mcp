# datum-mcp

> Part of [Atlas](https://github.com/DatumLabMHQ/atlas), Datum Labs' internal data infrastructure. Start there for how the parts fit together.

The people's door to the Datum data platform: an MCP server on Cloudflare Workers (Datum Labs account) that
signs users in with GitHub and only admits members of the DatumLabMHQ organisation. Tools: `whoami`,
`list_products`, `list_questions`, `ask`, `query`, `health`; each one forwards to `datum-api` with a server-side
key, so no person ever holds a key.

- Endpoint: `https://datum-mcp.datumlabs.workers.dev/mcp` (streamable HTTP). Claude Code: it is the `datum`
  server in `DatumLabMHQ/datum-analysis/.mcp.json`; the first call opens the GitHub sign-in.
- Built on `@cloudflare/workers-oauth-provider` + `agents` (McpAgent), from Cloudflare's reference server.
- Bindings: KV `OAUTH_KV` (grants and state), Durable Object `DatumMCP`. Vars: `DATUM_API_URL`, `GITHUB_ORG`.
- Secrets: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` (an OAuth App owned by the DatumLabMHQ organisation, callback
  `https://datum-mcp.datumlabs.workers.dev/callback`), `COOKIE_ENCRYPTION_KEY`, `DATUM_API_KEY`.
- Deploy: `CLOUDFLARE_ACCOUNT_ID=c9bf3d8e875ffe933a9bf895695e0fd1 npx wrangler deploy`.

Removing someone from the organisation removes their access at their next sign-in.
