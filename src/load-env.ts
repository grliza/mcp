import { config as loadDotenv } from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// Load environment from .env BEFORE any other module evaluates. Mirror of
// tm1-mcp-server's loader so the clone+build setup works regardless of the
// MCP client's working directory.
//
// dotenv never overwrites already-set keys, so precedence is:
//   real shell / MCP `env:` vars  >  $DOTENV_CONFIG_PATH  >  cwd/.env  >  <packageRoot>/.env
if (process.env.DOTENV_CONFIG_PATH) {
  loadDotenv({ path: process.env.DOTENV_CONFIG_PATH, quiet: true });
}
loadDotenv({ quiet: true });
loadDotenv({
  path: join(dirname(fileURLToPath(import.meta.url)), "..", ".env"),
  quiet: true,
});
