"use client";

import type { SpecialistPersonaId } from "@cline/shared/browser";
import type React from "react";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import type { PersonaActivityState } from "@/components/personas";
import type {
	WarRoomCheckpointGate,
	WarRoomMessage,
	WarRoomState,
	WarRoomViewMode,
} from "./types";

const INITIAL_CHECKPOINT_GATES: WarRoomCheckpointGate[] = [
	{
		id: "gate-1",
		gateNumber: 1,
		title: "Checkpoint 1: Architecture & PRD Sign-off",
		description:
			"Orion & Atlas paused the pipeline to review the Product PRD and System Architecture DAG before core code implementation begins.",
		personaId: "atlas",
		status: "pending",
		deliverables: [
			{
				title: "PRD-001 Specification",
				type: "PRD",
				summary: "User stories (P0, P1, P2) & zero-trust boundaries",
				badge: "Athena",
			},
			{
				title: "System Architecture & DAG",
				type: "Architecture",
				summary: "Component hierarchy, state contracts & interface seams",
				badge: "Atlas",
			},
		],
		timestamp: Date.now() - 1000 * 60 * 8,
	},
	{
		id: "gate-2",
		gateNumber: 2,
		title: "Checkpoint 2: Pre-Ship Quality Audit",
		description:
			"Cipher finished code implementation. Sentinel completed verification and test suite execution. Pipeline awaiting final authorization to package and ship.",
		personaId: "sentinel",
		status: "pending",
		deliverables: [
			{
				title: "Test Execution Report",
				type: "QA",
				summary: "180/180 Vitest suites passed. 0 regression failures.",
				badge: "Sentinel",
			},
			{
				title: "Atomic ChangeSet Manifest",
				type: "Manifest",
				summary: "Validated SHA-256 base hashes & rollback transactions.",
				badge: "Cipher",
			},
		],
		timestamp: Date.now() - 1000 * 60 * 2,
	},
];

const INITIAL_PERSONA_STATES: Record<
	SpecialistPersonaId,
	PersonaActivityState
> = {
	orion: "speaking",
	lyra: "working",
	athena: "thinking",
	atlas: "checkpoint",
	cipher: "idle",
	vector: "idle",
	sentinel: "idle",
	echo: "idle",
};

const SIMULATION_SCENARIO_STEPS: Array<{
	message: Omit<WarRoomMessage, "id" | "timestamp">;
	personaStates: Partial<Record<SpecialistPersonaId, PersonaActivityState>>;
	gateTrigger?: "gate-1" | "gate-2";
}> = [
	{
		message: {
			senderPersonaId: "orion",
			recipientPersonaId: "all",
			stage: "strategy",
			type: "chat",
			content:
				"Initializing Ultra SOP Swarm session. We are targeting high-reliability dual-loop execution with zero-trust research boundaries. Lyra, initiate technical research pass.",
		},
		personaStates: { orion: "speaking", lyra: "thinking" },
	},
	{
		message: {
			senderPersonaId: "lyra",
			recipientPersonaId: "orion",
			stage: "research",
			type: "artifact",
			content:
				"Research pass complete. Synthesized 8 verified claims from repo documentation and secondary evidence. Zero-trust containment contract verified.",
			artifact: {
				title: "EvidenceBundle #842",
				type: "EvidenceBundle",
				summary: "8 verified claims, 0 untrusted elevations.",
			},
		},
		personaStates: { lyra: "working", athena: "thinking" },
	},
	{
		message: {
			senderPersonaId: "athena",
			recipientPersonaId: "atlas",
			stage: "strategy",
			type: "handoff",
			content:
				"PRD-001 drafted with user stories P0 (Split-Screen War Room), P1 (Live Agent SVG Bubbles), P2 (Checkpoint Gates). Handing off requirements to Atlas for architecture modeling.",
		},
		personaStates: { athena: "speaking", atlas: "working" },
	},
	{
		message: {
			senderPersonaId: "atlas",
			recipientPersonaId: "all",
			stage: "architecture",
			type: "checkpoint",
			content:
				"Architecture blueprint formulated. Module decomposition complete with ResizablePanelGroup layout. Pausing execution at Checkpoint Gate 1 for user sign-off.",
			checkpointGateId: "gate-1",
			codeSnippet: {
				language: "typescript",
				filename: "agency-war-room/types.ts",
				code: "export interface WarRoomCheckpointGate {\n  id: string;\n  status: 'pending' | 'approved';\n}",
			},
		},
		personaStates: { atlas: "checkpoint", orion: "checkpoint" },
		gateTrigger: "gate-1",
	},
	{
		message: {
			senderPersonaId: "cipher",
			recipientPersonaId: "vector",
			stage: "development",
			type: "tool_call",
			content:
				"Checkpoint Gate 1 cleared! Commencing core implementation. Constructing reactive War Room context and SVG message bubbles.",
			toolCall: {
				toolName: "write_to_file",
				args: { targetFile: "agency-war-room-panel.tsx" },
				output: "File created successfully.",
				status: "completed",
			},
		},
		personaStates: { cipher: "working", vector: "working", atlas: "idle" },
	},
	{
		message: {
			senderPersonaId: "sentinel",
			recipientPersonaId: "all",
			stage: "qa",
			type: "checkpoint",
			content:
				"Code implementation complete. Executed test runner: all 180 unit tests and persona avatar assertions passed! Checkpoint Gate 2: Pre-Ship Quality Audit reached.",
			checkpointGateId: "gate-2",
		},
		personaStates: { sentinel: "checkpoint", orion: "checkpoint" },
		gateTrigger: "gate-2",
	},
	{
		message: {
			senderPersonaId: "echo",
			recipientPersonaId: "all",
			stage: "documentation",
			type: "chat",
			content:
				"Checkpoint Gate 2 approved! Synchronized bilingual documentation and changelog entries. Ultra Swarm execution successfully finalized.",
		},
		personaStates: {
			orion: "idle",
			lyra: "idle",
			athena: "idle",
			atlas: "idle",
			cipher: "idle",
			vector: "idle",
			sentinel: "idle",
			echo: "idle",
		},
	},
];

interface WarRoomContextValue extends WarRoomState {
	openWarRoom: () => void;
	closeWarRoom: () => void;
	toggleWarRoom: () => void;
	setViewMode: (mode: WarRoomViewMode) => void;
	toggleFullscreen: () => void;
	setFilterPersona: (persona: SpecialistPersonaId | "all") => void;
	addMessage: (message: Omit<WarRoomMessage, "id" | "timestamp">) => void;
	approveCheckpoint: (gateId: string) => void;
	rejectCheckpoint: (gateId: string, feedback: string) => void;
	stepSimulation: () => void;
	playSimulation: () => void;
	pauseSimulation: () => void;
	resetSimulation: () => void;
}

const WarRoomContext = createContext<WarRoomContextValue | null>(null);

export function WarRoomProvider({
	children,
	initialOpen = false,
}: {
	children: React.ReactNode;
	initialOpen?: boolean;
}) {
	const [isOpen, setIsOpen] = useState(initialOpen);
	const [viewMode, setViewMode] = useState<WarRoomViewMode>("split");
	const [activeFilterPersona, setActiveFilterPersona] = useState<
		SpecialistPersonaId | "all"
	>("all");
	const [checkpointGates, setCheckpointGates] = useState<
		WarRoomCheckpointGate[]
	>(INITIAL_CHECKPOINT_GATES);
	const [activePersonaStates, setActivePersonaStates] = useState<
		Record<SpecialistPersonaId, PersonaActivityState>
	>(INITIAL_PERSONA_STATES);

	// Start with initial 4 messages from the scenario
	const [messages, setMessages] = useState<WarRoomMessage[]>(() =>
		SIMULATION_SCENARIO_STEPS.slice(0, 4).map((step, idx) => ({
			...step.message,
			id: `msg-${idx + 1}`,
			timestamp: Date.now() - 1000 * 60 * (10 - idx * 2),
		})),
	);

	const [isSimulating, setIsSimulating] = useState(false);
	const [activeSimulationStep, setActiveSimulationStep] = useState(4);
	const simTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

	const openWarRoom = useCallback(() => setIsOpen(true), []);
	const closeWarRoom = useCallback(() => setIsOpen(false), []);
	const toggleWarRoom = useCallback(() => setIsOpen((prev) => !prev), []);

	const toggleFullscreen = useCallback(() => {
		setViewMode((prev) => (prev === "fullscreen" ? "split" : "fullscreen"));
	}, []);

	const addMessage = useCallback(
		(newMsg: Omit<WarRoomMessage, "id" | "timestamp">) => {
			const msg: WarRoomMessage = {
				...newMsg,
				id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
				timestamp: Date.now(),
			};
			setMessages((prev) => [...prev, msg]);
		},
		[],
	);

	const approveCheckpoint = useCallback((gateId: string) => {
		setCheckpointGates((prev) =>
			prev.map((gate) =>
				gate.id === gateId ? { ...gate, status: "approved" } : gate,
			),
		);

		// Emit positive inter-agent response
		setMessages((prev) => [
			...prev,
			{
				id: `msg-approval-${Date.now()}`,
				senderPersonaId: "orion",
				recipientPersonaId: "all",
				stage: "strategy",
				type: "chat",
				content: `User verified and approved ${gateId === "gate-1" ? "Checkpoint Gate 1 (Architecture & PRD)" : "Checkpoint Gate 2 (Pre-Ship Audit)"}. Proceeding immediately!`,
				timestamp: Date.now(),
			},
		]);

		// Advance simulation if paused at this gate
		setActiveSimulationStep((step) => {
			const nextStep = step + 1;
			if (nextStep <= SIMULATION_SCENARIO_STEPS.length) {
				const stepData = SIMULATION_SCENARIO_STEPS[step];
				if (stepData) {
					setMessages((prev) => [
						...prev,
						{
							...stepData.message,
							id: `msg-${nextStep}-${Date.now()}`,
							timestamp: Date.now(),
						},
					]);
					setActivePersonaStates((prev) => ({
						...prev,
						...stepData.personaStates,
					}));
				}
			}
			return nextStep;
		});
	}, []);

	const rejectCheckpoint = useCallback((gateId: string, feedback: string) => {
		setCheckpointGates((prev) =>
			prev.map((gate) =>
				gate.id === gateId ? { ...gate, status: "rejected", feedback } : gate,
			),
		);

		setMessages((prev) => [
			...prev,
			{
				id: `msg-reject-${Date.now()}`,
				senderPersonaId: "orion",
				recipientPersonaId: "all",
				stage: "strategy",
				type: "chat",
				content: `User requested modifications on ${gateId}: "${feedback}". Orion reallocating resources for design adjustment.`,
				timestamp: Date.now(),
			},
		]);
	}, []);

	const stepSimulation = useCallback(() => {
		setActiveSimulationStep((currentStep) => {
			if (currentStep >= SIMULATION_SCENARIO_STEPS.length) {
				return currentStep;
			}
			const stepData = SIMULATION_SCENARIO_STEPS[currentStep];
			if (stepData) {
				setMessages((prev) => [
					...prev,
					{
						...stepData.message,
						id: `msg-sim-${currentStep + 1}-${Date.now()}`,
						timestamp: Date.now(),
					},
				]);
				setActivePersonaStates((prev) => ({
					...prev,
					...stepData.personaStates,
				}));
			}
			return currentStep + 1;
		});
	}, []);

	const pauseSimulation = useCallback(() => {
		setIsSimulating(false);
		if (simTimerRef.current) {
			clearInterval(simTimerRef.current);
			simTimerRef.current = null;
		}
	}, []);

	const playSimulation = useCallback(() => {
		setIsSimulating(true);
		if (simTimerRef.current) clearInterval(simTimerRef.current);
		simTimerRef.current = setInterval(() => {
			setActiveSimulationStep((currentStep) => {
				if (currentStep >= SIMULATION_SCENARIO_STEPS.length) {
					if (simTimerRef.current) {
						clearInterval(simTimerRef.current);
						simTimerRef.current = null;
					}
					setIsSimulating(false);
					return currentStep;
				}
				const stepData = SIMULATION_SCENARIO_STEPS[currentStep];
				if (stepData) {
					setMessages((prev) => [
						...prev,
						{
							...stepData.message,
							id: `msg-sim-${currentStep + 1}-${Date.now()}`,
							timestamp: Date.now(),
						},
					]);
					setActivePersonaStates((prev) => ({
						...prev,
						...stepData.personaStates,
					}));
				}
				return currentStep + 1;
			});
		}, 3000);
	}, []);

	const resetSimulation = useCallback(() => {
		pauseSimulation();
		setActiveSimulationStep(4);
		setCheckpointGates(INITIAL_CHECKPOINT_GATES);
		setActivePersonaStates(INITIAL_PERSONA_STATES);
		setMessages(
			SIMULATION_SCENARIO_STEPS.slice(0, 4).map((step, idx) => ({
				...step.message,
				id: `msg-${idx + 1}`,
				timestamp: Date.now() - 1000 * 60 * (10 - idx * 2),
			})),
		);
	}, [pauseSimulation]);

	useEffect(() => {
		return () => {
			if (simTimerRef.current) {
				clearInterval(simTimerRef.current);
			}
		};
	}, []);

	const value = useMemo<WarRoomContextValue>(
		() => ({
			isOpen,
			viewMode,
			messages,
			activeFilterPersona,
			checkpointGates,
			activePersonaStates,
			isSimulating,
			activeSimulationStep,
			openWarRoom,
			closeWarRoom,
			toggleWarRoom,
			setViewMode,
			toggleFullscreen,
			setFilterPersona: setActiveFilterPersona,
			addMessage,
			approveCheckpoint,
			rejectCheckpoint,
			stepSimulation,
			playSimulation,
			pauseSimulation,
			resetSimulation,
		}),
		[
			isOpen,
			viewMode,
			messages,
			activeFilterPersona,
			checkpointGates,
			activePersonaStates,
			isSimulating,
			activeSimulationStep,
			openWarRoom,
			closeWarRoom,
			toggleWarRoom,
			toggleFullscreen,
			addMessage,
			approveCheckpoint,
			rejectCheckpoint,
			stepSimulation,
			playSimulation,
			pauseSimulation,
			resetSimulation,
		],
	);

	return (
		<WarRoomContext.Provider value={value}>{children}</WarRoomContext.Provider>
	);
}

export function useWarRoom(): WarRoomContextValue {
	const context = useContext(WarRoomContext);
	if (!context) {
		throw new Error("useWarRoom must be used within a WarRoomProvider");
	}
	return context;
}
