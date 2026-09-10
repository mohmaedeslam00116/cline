/**
 * TelemetryPort — event streaming from the agent runtime to the host UI
 * (LENS hexagonal blueprint §3.1). The sidecar bridges these into its
 * transport (EventRingBuffer + WebSocket broadcast) — push, never polling.
 */

export type AgentLifecycleEventType =
	| "session-started"
	| "turn-started"
	| "turn-completed"
	| "tool-call-started"
	| "tool-call-completed"
	| "policy-denied"
	| "evidence-recorded"
	| "session-aborted"
	| "session-error";

export interface AgentLifecycleEvent {
	type: AgentLifecycleEventType;
	sessionId: string;
	/** Monotonic sequence within the session's event stream. */
	seq: number;
	/** ISO-8601 timestamp. */
	timestamp: string;
	/** Event payload — free-form but JSON-serializable. */
	data?: Record<string, unknown>;
}

/** Typed token-delta event data: per-session correlation and stream ordering. */
export interface TokenDeltaEvent {
	/** Session the delta belongs to (adapters without a fixed session filter correlate on this). */
	sessionId: string;
	/** Monotonic sequence within the session's token stream. */
	seq: number;
	/** The raw model delta. */
	delta: string;
}

export interface TelemetryPort {
	emitEvent(event: AgentLifecycleEvent): void;
	emitTokenDelta(event: TokenDeltaEvent): void;
}
