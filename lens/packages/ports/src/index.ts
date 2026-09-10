export { LensPortError } from "./errors.js";
export type { LensErrorCode } from "./errors.js";

export {
	CAPABILITY_TYPES,
	isCapabilityType,
	isActiveGrant,
	freezeGrant,
} from "./capability-grant.js";
export type { CapabilityType, CapabilityGrant } from "./capability-grant.js";

export type {
	FileInfo,
	SearchOptions,
	SearchResult,
	RepoInspectionPort,
} from "./repo-inspection-port.js";

export type {
	VerifiedClaim,
	VerifiedExcerpt,
	EvidenceBundle,
	EvidenceBundleMetadata,
	ResearchRetrievalPort,
	ResearchRetrievalError,
	UntrustedContent,
} from "./research-retrieval-port.js";

export type {
	AgentLifecycleEvent,
	AgentLifecycleEventType,
	TokenDeltaEvent,
	TelemetryPort,
} from "./telemetry-port.js";

export type { CancellationPort } from "./cancellation-port.js";
