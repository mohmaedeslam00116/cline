import type { SpecialistPersonaId } from "@cline/shared/browser";
import type { PersonaActivityState } from "@/components/personas";

export type WarRoomStage =
	| "strategy"
	| "research"
	| "architecture"
	| "development"
	| "qa"
	| "documentation";

export type WarRoomMessageType =
	| "chat"
	| "handoff"
	| "checkpoint"
	| "tool_call"
	| "artifact";

export interface WarRoomMessage {
	id: string;
	senderPersonaId: SpecialistPersonaId;
	recipientPersonaId?: SpecialistPersonaId | "all";
	stage: WarRoomStage;
	type: WarRoomMessageType;
	content: string;
	codeSnippet?: {
		language: string;
		code: string;
		filename?: string;
	};
	toolCall?: {
		toolName: string;
		toolCallId?: string;
		args?: Record<string, unknown>;
		output?: string;
		status: "running" | "completed" | "error";
	};
	artifact?: {
		title: string;
		type: string;
		summary?: string;
		uri?: string;
		untrusted?: boolean;
		provenance?: string;
	};
	untrusted?: boolean;
	checkpointGateId?: string;
	timestamp: number;
}

export interface WarRoomDeliverable {
	title: string;
	type: string;
	summary: string;
	badge?: string;
}

export interface WarRoomCheckpointMemoryProposal {
	id: string;
	personaId: SpecialistPersonaId;
	topic: string;
	learning: string;
	timestamp: string | number;
	approved?: boolean;
}

export interface WarRoomCheckpointGate {
	id: string;
	gateNumber: 1 | 2;
	title: string;
	description: string;
	personaId: SpecialistPersonaId;
	status: "pending" | "approved" | "rejected";
	deliverables: WarRoomDeliverable[];
	proposedLearnings?: WarRoomCheckpointMemoryProposal[];
	feedback?: string;
	timestamp: number;
}

export type WarRoomViewMode = "split" | "fullscreen" | "hidden";

export interface WarRoomState {
	isOpen: boolean;
	viewMode: WarRoomViewMode;
	messages: WarRoomMessage[];
	activeFilterPersona: SpecialistPersonaId | "all";
	checkpointGates: WarRoomCheckpointGate[];
	activePersonaStates: Record<SpecialistPersonaId, PersonaActivityState>;
	isSimulating: boolean;
	activeSimulationStep: number;
}

export interface AgencyWarRoomEventPayload {
	sessionId: string;
	subAgentId?: string;
	parentAgentId?: string;
	personaId?: SpecialistPersonaId;
	stage?: WarRoomStage;
	event: {
		type: string;
		contentType?: string;
		text?: string;
		accumulated?: string;
		reasoning?: string;
		toolName?: string;
		toolCallId?: string;
		input?: unknown;
		output?: string;
		error?: string;
		durationMs?: number;
		reason?: string;
		[key: string]: unknown;
	};
	ts: number;
}
