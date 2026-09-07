// Secrets are not in wrangler.jsonc, so `wrangler types` cannot see them; declare them here (global
// declaration merging with the generated Env).
interface Env {
	GITHUB_CLIENT_ID: string;
	GITHUB_CLIENT_SECRET: string;
	COOKIE_ENCRYPTION_KEY: string;
	DATUM_API_KEY: string;
}
declare namespace Cloudflare {
	interface Env {
		GITHUB_CLIENT_ID: string;
		GITHUB_CLIENT_SECRET: string;
		COOKIE_ENCRYPTION_KEY: string;
		DATUM_API_KEY: string;
	}
}
