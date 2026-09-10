# LENS transport messages (Phase 1, ticket #11)

The transport schema location for LENS message types — this settles the open
point in `docs/spec-phase1.md`. LENS follows the desktop-app sidecar's own
conventions: command payloads are shaped by the handler modules under
`sidecar/`, and broadcast events are `(name, payload)` pairs delivered over
the existing WebSocket transport.

## Commands (webview → sidecar, via `handleCommand`)

Both handlers live in `sidecar/commands-lens.ts` and are **read-only**.

### `lens_evidence_index`

```jsonc
// request
{ "sessionId": "..." }
// response — bundle METADATA only; claim content is never pushed
{
  "lensMode": true,
  "sessionId": "...",
  "bundles": [
    {
      "digest": "<sha256-hex>",
      "createdAt": "<iso-8601>",
      "topic": "...",
      "claimCount": 3
    }
  ]
}
```

### `lens_policy_audit`

```jsonc
// request
{ "sessionId": "..." }
// response — grant audit trail + recent approval decisions (no secrets)
{
  "lensMode": true,
  "sessionId": "...",
  "auditTrail": [{ "seq": 0, "kind": "grant-issued", "capability": "...", "detail": "..." }],
  "recentDecisions": [{ "toolCallId": "...", "approved": false, "policyDenied": true, "reason": "..." }]
}
```

## Events (sidecar → webview, via `broadcastEvent`)

### `lens_policy_denied`

Emitted when the Phase-1 policy denies a tool call before any user
round-trip (fail-closed; the DoD's transport-observable denial).

```jsonc
{
  "sessionId": "...",
  "toolCallId": "...",
  "toolName": "write_to_file",
  "reason": "[LENS policy] Phase 1 is read-only: ..."
}
```

## Security invariants (ADR-0004)

1. **Raw provider API keys never cross the transport.** No LENS command or
   event carries credential material; the webview sees provider *status*
   only (upstream behavior, unchanged).
2. **Untrusted research content is pulled, never pushed.** Evidence claim
   statements/quotations travel only through the `get_evidence_detail`
   tool result, one claim at a time, marked `contentIsUntrusted: true`.
   Index and audit commands return metadata exclusively.
3. **Policy denials are fail-closed and observable.** Denials happen before
   the user approval surface, return an explicit reason to the runtime, and
   emit `lens_policy_denied`.
