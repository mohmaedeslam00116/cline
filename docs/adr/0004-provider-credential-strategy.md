# Provider & credential strategy: reuse the Base auth stack as-is

## Status

Accepted

## Context & Decision

The embedded LENS runtime needs model providers and credential storage (wayfinder [#6](https://github.com/mohmaedeslam00116/cline/issues/6)). The SDK already ships a pluggable auth framework — `sdk/packages/core/src/auth/provider-auth-registry.ts` (`ProviderAuthHandler`, OAuth flows with a local callback server, credential persistence via `getPersistedProviderApiKey` / `resolveProviderApiKeyFromSettings` / `saveProviderOAuthCredentials`) — keyed off the Base's settings store.

**Decision**:
1. **Reuse the Base provider/auth stack as-is.** LENS builds no separate configuration layer in Phase 1; upstream auth improvements flow through.
2. **Credentials persist in the SDK's settings store** (file-backed, app config dir). No OS-keychain migration in Phase 1.
3. **Raw keys never cross the transport.** The webview receives provider *status* (connected/disconnected), never key material — enforced in the sidecar wiring slice (#11).
4. **All `@cline/llms` providers ship enabled** (Anthropic, OpenAI, OpenRouter, Ollama, Gemini, …); any allowlist is a later branding-phase decision.
5. **The research engine runs credential-free in Phase 1**: local BM25 indexing + bounded public-web scraping only. Optional search-API keys may pass through env vars later if retrieval quality demands it.

## Considered Options

- **LENS-managed credential layer** (own storage, own UI): rejected for Phase 1 — duplicates working SDK machinery, widens the merge surface; revisit if/when LENS ships its own account system.
- **OS keychain via Tauri plugin now**: rejected for Phase 1 — worthwhile hardening, but the transport rule (no raw keys to the webview) addresses the acute exposure; keychain migration is a Phase-2 ticket.

## Consequences

- Phase-1 code touches zero auth internals — only the sidecar wiring enforces rule 3.
- OS-keychain migration and search-API key passthrough are pre-registered Phase-2 tickets.
