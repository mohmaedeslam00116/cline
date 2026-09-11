export type { CancellationPort } from "./cancellation-port.js";
export type { CapabilityGrant, CapabilityType } from "./capability-grant.js";

export {
	CAPABILITY_TYPES,
	freezeGrant,
	isActiveGrant,
	isCapabilityType,
} from "./capability-grant.js";
export type { LensErrorCode } from "./errors.js";
export { LensPortError } from "./errors.js";
export type {
	FileInfo,
	RepoInspectionPort,
	SearchOptions,
	SearchResult,
} from "./repo-inspection-port.js";
export type {
	EvidenceBundle,
	EvidenceBundleMetadata,
	ResearchRetrievalError,
	ResearchRetrievalPort,
	UntrustedContent,
	VerifiedClaim,
	VerifiedExcerpt,
} from "./research-retrieval-port.js";
export type {
	AgentLifecycleEvent,
	AgentLifecycleEventType,
	TelemetryPort,
	TokenDeltaEvent,
} from "./telemetry-port.js";
