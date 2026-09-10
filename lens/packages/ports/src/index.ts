export { LensPortError } from "./errors.js";
export type { LensErrorCode } from "./errors.js";

export {
	CAPABILITY_TYPES,
	isCapabilityType,
	isActiveGrant,
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
} from "./research-retrieval-port.js";

export type {
	AgentLifecycleEvent,
	AgentLifecycleEventType,
	TelemetryPort,
} from "./telemetry-port.js";

export type { CancellationPort } from "./cancellation-port.js";
