export { resolveSafePath, scopeCoversPath } from "./path-boundary.js";
export type { ResolvedWorkspacePath } from "./path-boundary.js";

export { CapabilityGrantRegistry } from "./grant-registry.js";
export type { AuditRecord } from "./grant-registry.js";

export { PHASE1_READ_ONLY_TOOLS, createPhase1ToolApproval, decideToolCall } from "./tool-approval.js";
export type { PolicyDecision } from "./tool-approval.js";
