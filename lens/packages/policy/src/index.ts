export type { AuditRecord } from "./grant-registry.js";
export { CapabilityGrantRegistry } from "./grant-registry.js";
export type { ResolvedWorkspacePath } from "./path-boundary.js";
export { resolveSafePath, scopeCoversPath } from "./path-boundary.js";
export type { PolicyDecision } from "./tool-approval.js";
export {
	createPhase1ToolApproval,
	decideToolCall,
	PHASE1_READ_ONLY_TOOLS,
} from "./tool-approval.js";
