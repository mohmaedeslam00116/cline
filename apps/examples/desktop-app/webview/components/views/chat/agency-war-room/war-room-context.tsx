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
import { desktopClient } from "@/lib/desktop-client";
import { getLensTranslations } from "@/lib/lens-i18n";
import type {
	AgencyWarRoomEventPayload,
	WarRoomCheckpointGate,
	WarRoomMessage,
	WarRoomStage,
	WarRoomState,
	WarRoomViewMode,
} from "./types";

export function resolvePersonaStage(
	personaId: SpecialistPersonaId,
): WarRoomStage {
	switch (personaId) {
		case "orion":
		case "athena":
			return "strategy";
		case "lyra":
			return "research";
		case "atlas":
			return "architecture";
		case "cipher":
		case "vector":
			return "development";
		case "sentinel":
			return "qa";
		case "echo":
			return "documentation";
		default:
			return "development";
	}
}

export function createInitialCheckpointGates(
	t: ReturnType<typeof getLensTranslations>["ultraAgency"],
): WarRoomCheckpointGate[] {
	return [
		{
			id: "gate-1",
			gateNumber: 1,
			title: t.checkpointGate1Title,
			description: t.checkpoint1Desc,
			personaId: "atlas",
			status: "pending",
			deliverables: [
				{
					title: t.gate1Deliv1Title,
					type: "PRD",
					summary: t.gate1Deliv1Summary,
					badge: "Athena",
				},
				{
					title: t.gate1Deliv2Title,
					type: "Architecture",
					summary: t.gate1Deliv2Summary,
					badge: "Atlas",
				},
			],
			timestamp: Date.now() - 1000 * 60 * 8,
		},
		{
			id: "gate-2",
			gateNumber: 2,
			title: t.checkpointGate2Title,
			description: t.checkpoint2Desc,
			personaId: "sentinel",
			status: "pending",
			deliverables: [
				{
					title: t.gate2Deliv1Title,
					type: "QA",
					summary: t.gate2Deliv1Summary,
					badge: "Sentinel",
				},
				{
					title: t.gate2Deliv2Title,
					type: "Manifest",
					summary: t.gate2Deliv2Summary,
					badge: "Cipher",
				},
			],
			timestamp: Date.now() - 1000 * 60 * 2,
		},
	];
}

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

export function createSimulationScenarioSteps(
	t: ReturnType<typeof getLensTranslations>["ultraAgency"],
): Array<{
	message: Omit<WarRoomMessage, "id" | "timestamp">;
	personaStates: Partial<Record<SpecialistPersonaId, PersonaActivityState>>;
	gateTrigger?: "gate-1" | "gate-2";
}> {
	return [
		{
			message: {
				senderPersonaId: "orion",
				recipientPersonaId: "all",
				stage: "strategy",
				type: "chat",
				content: t.scenarioMsg1,
			},
			personaStates: { orion: "speaking", lyra: "thinking" },
		},
		{
			message: {
				senderPersonaId: "lyra",
				recipientPersonaId: "orion",
				stage: "research",
				type: "artifact",
				content: t.scenarioMsg2,
				untrusted: true,
				artifact: {
					title: t.scenarioArtifactTitle,
					type: "EvidenceBundle",
					summary: t.scenarioArtifactSummary,
					untrusted: true,
					provenance: "Secondary web & repo documentation research pass",
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
				content: t.scenarioMsg3,
			},
			personaStates: { athena: "speaking", atlas: "working" },
		},
		{
			message: {
				senderPersonaId: "atlas",
				recipientPersonaId: "all",
				stage: "architecture",
				type: "checkpoint",
				content: t.scenarioMsg4,
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
				content: t.scenarioMsg5,
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
				content: t.scenarioMsg6,
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
				content: t.scenarioMsg7,
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
}

export function isCheckpointGateBlocking(
	step: number,
	gates: WarRoomCheckpointGate[],
): boolean {
	if (step === 4) {
		const gate1 = gates.find((g) => g.id === "gate-1");
		if (gate1 && gate1.status === "pending") {
			return true;
		}
	}
	if (step === 6) {
		const gate2 = gates.find((g) => g.id === "gate-2");
		if (gate2 && gate2.status === "pending") {
			return true;
		}
	}
	return false;
}

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
	sessionId: string | null;
	setSessionId: (sessionId: string | null) => void;
}

const WarRoomContext = createContext<WarRoomContextValue | null>(null);

export function WarRoomProvider({
	children,
	initialOpen = false,
	sessionId: initialSessionId,
}: {
	children: React.ReactNode;
	initialOpen?: boolean;
	sessionId?: string | null;
}) {
	const t = getLensTranslations().ultraAgency;
	const scenarioSteps = useMemo(() => createSimulationScenarioSteps(t), [t]);

	const [isOpen, setIsOpen] = useState(initialOpen);
	const [viewMode, setViewMode] = useState<WarRoomViewMode>("split");
	const [activeFilterPersona, setActiveFilterPersona] = useState<
		SpecialistPersonaId | "all"
	>("all");
	const [checkpointGates, setCheckpointGates] = useState<
		WarRoomCheckpointGate[]
	>(() => createInitialCheckpointGates(t));
	const [activePersonaStates, setActivePersonaStates] = useState<
		Record<SpecialistPersonaId, PersonaActivityState>
	>(INITIAL_PERSONA_STATES);

	// Start with initial 4 messages from the scenario
	const [messages, setMessages] = useState<WarRoomMessage[]>(() =>
		scenarioSteps.slice(0, 4).map((step, idx) => ({
			...step.message,
			id: `msg-${idx + 1}`,
			timestamp: Date.now() - 1000 * 60 * (10 - idx * 2),
		})),
	);

	const [activeSessionId, setActiveSessionId] = useState<string | null>(
		initialSessionId ?? null,
	);
	const activeSessionIdRef = useRef(activeSessionId);
	activeSessionIdRef.current = activeSessionId;

	useEffect(() => {
		if (initialSessionId !== undefined) {
			setActiveSessionId(initialSessionId);
		}
	}, [initialSessionId]);

	// Map to correlate streaming text response IDs per subagent
	const activeTextStreamsRef = useRef<Map<string, string>>(new Map());

	const [isSimulating, setIsSimulating] = useState(false);
	const [activeSimulationStep, setActiveSimulationStep] = useState(4);
	const simTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

	const activeSimulationStepRef = useRef(activeSimulationStep);
	activeSimulationStepRef.current = activeSimulationStep;

	const checkpointGatesRef = useRef(checkpointGates);
	checkpointGatesRef.current = checkpointGates;

	const scenarioStepsRef = useRef(scenarioSteps);
	scenarioStepsRef.current = scenarioSteps;

	// Subscribe to live subagent events from desktop sidecar WebSocket
	useEffect(() => {
		const unsubscribe = desktopClient.subscribe(
			"agency_war_room_event",
			(rawPayload: unknown) => {
				const payload = rawPayload as AgencyWarRoomEventPayload;
				if (!payload || !payload.event) return;

				// Scope War Room events to the active session
				if (
					activeSessionIdRef.current &&
					payload.sessionId &&
					payload.sessionId !== activeSessionIdRef.current
				) {
					return;
				}

				const personaId: SpecialistPersonaId | undefined = payload.personaId;
				const event = payload.event;
				const ts = payload.ts || Date.now();
				const streamKey = payload.subAgentId || personaId || "subagent";

				if (event.type === "content_start") {
					if (event.contentType === "text" && event.text) {
						if (personaId) {
							setActivePersonaStates((prev) => ({
								...prev,
								[personaId]: "speaking",
							}));
						}
						const existingMsgId = activeTextStreamsRef.current.get(streamKey);
						if (existingMsgId) {
							setMessages((prev) =>
								prev.map((msg) =>
									msg.id === existingMsgId
										? { ...msg, content: msg.content + event.text }
										: msg,
								),
							);
						} else {
							const newMsgId = `live-msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
							activeTextStreamsRef.current.set(streamKey, newMsgId);
							setMessages((prev) => [
								...prev,
								{
									id: newMsgId,
									senderPersonaId: personaId || "cipher",
									recipientPersonaId: "all",
									stage: personaId
										? resolvePersonaStage(personaId)
										: "development",
									type: "chat",
									content: event.text || "",
									timestamp: ts,
								},
							]);
						}
					} else if (event.contentType === "tool") {
						if (personaId) {
							setActivePersonaStates((prev) => ({
								...prev,
								[personaId]: "working",
							}));
						}
						const toolCallId = event.toolCallId || `tool-${Date.now()}`;
						setMessages((prev) => [
							...prev,
							{
								id: `live-tool-${toolCallId}`,
								senderPersonaId: personaId || "cipher",
								recipientPersonaId: "all",
								stage: personaId
									? resolvePersonaStage(personaId)
									: "development",
								type: "tool_call",
								content: `Executing tool: ${event.toolName || "tool"}`,
								toolCall: {
									toolName: event.toolName || "unknown",
									toolCallId,
									args: event.input as Record<string, unknown>,
									status: "running",
								},
								timestamp: ts,
							},
						]);
					}
				} else if (event.type === "content_end") {
					if (event.contentType === "tool") {
						if (personaId) {
							setActivePersonaStates((prev) => ({
								...prev,
								[personaId]: "thinking",
							}));
						}
						setMessages((prev) =>
							prev.map((msg) => {
								const matches =
									msg.type === "tool_call" &&
									msg.toolCall?.status === "running" &&
									(event.toolCallId
										? msg.toolCall.toolCallId === event.toolCallId ||
											msg.id === `live-tool-${event.toolCallId}`
										: msg.toolCall?.toolName === event.toolName);

								if (matches && msg.toolCall) {
									return {
										...msg,
										toolCall: {
											...msg.toolCall,
											output: event.output,
											status: event.error ? "error" : "completed",
										},
									};
								}
								return msg;
							}),
						);
					} else if (event.contentType === "text") {
						activeTextStreamsRef.current.delete(streamKey);
						if (personaId) {
							setActivePersonaStates((prev) => ({
								...prev,
								[personaId]: "idle",
							}));
						}
					}
				} else if (event.type === "done") {
					activeTextStreamsRef.current.delete(streamKey);
					if (personaId) {
						setActivePersonaStates((prev) => ({
							...prev,
							[personaId]: "idle",
						}));
					}
				}
			},
		);

		return () => {
			unsubscribe();
		};
	}, []);

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

	const approveCheckpoint = useCallback(
		(gateId: string) => {
			setCheckpointGates((prev) =>
				prev.map((gate) =>
					gate.id === gateId ? { ...gate, status: "approved" as const } : gate,
				),
			);

			const gateTitle =
				gateId === "gate-1" ? t.checkpointGate1Title : t.checkpointGate2Title;

			const approvalMessage: WarRoomMessage = {
				id: `msg-approval-${Date.now()}`,
				senderPersonaId: "orion",
				recipientPersonaId: "all",
				stage: "strategy",
				type: "chat",
				content: `${t.gateApprovedProceeding} ${gateTitle}. ${t.proceedingImmediately}`,
				timestamp: Date.now(),
			};

			const currentStep = activeSimulationStepRef.current;
			const steps = scenarioStepsRef.current;
			let nextStep = currentStep;
			let nextMessage: WarRoomMessage | null = null;
			let nextPersonaStates: Partial<
				Record<SpecialistPersonaId, PersonaActivityState>
			> | null = null;

			if (currentStep < steps.length) {
				const stepData = steps[currentStep];
				if (stepData) {
					nextStep = currentStep + 1;
					nextMessage = {
						...stepData.message,
						id: `msg-${nextStep}-${Date.now()}`,
						timestamp: Date.now() + 10,
					};
					nextPersonaStates = stepData.personaStates;
				}
			}

			setMessages((prev) => {
				const nextList = [...prev, approvalMessage];
				if (nextMessage) {
					nextList.push(nextMessage);
				}
				return nextList;
			});

			if (nextPersonaStates) {
				setActivePersonaStates((prev) => ({
					...prev,
					...nextPersonaStates,
				}));
			}

			setActiveSimulationStep(nextStep);
		},
		[t],
	);

	const rejectCheckpoint = useCallback(
		(gateId: string, feedback: string) => {
			setCheckpointGates((prev) =>
				prev.map((gate) =>
					gate.id === gateId
						? { ...gate, status: "rejected" as const, feedback }
						: gate,
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
					content: `${t.gateModificationsRequested} ${gateId}: "${feedback}". ${t.reallocatingResources}`,
					timestamp: Date.now(),
				},
			]);
		},
		[t],
	);

	const stepSimulation = useCallback(() => {
		const currentStep = activeSimulationStepRef.current;
		const steps = scenarioStepsRef.current;

		if (currentStep >= steps.length) {
			return;
		}

		if (isCheckpointGateBlocking(currentStep, checkpointGatesRef.current)) {
			return;
		}

		const stepData = steps[currentStep];
		if (stepData) {
			const nextStep = currentStep + 1;
			setMessages((prev) => [
				...prev,
				{
					...stepData.message,
					id: `msg-sim-${nextStep}-${Date.now()}`,
					timestamp: Date.now(),
				},
			]);
			setActivePersonaStates((prev) => ({
				...prev,
				...stepData.personaStates,
			}));
			setActiveSimulationStep(nextStep);
		}
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
			const currentStep = activeSimulationStepRef.current;
			const steps = scenarioStepsRef.current;

			if (currentStep >= steps.length) {
				pauseSimulation();
				return;
			}

			if (isCheckpointGateBlocking(currentStep, checkpointGatesRef.current)) {
				pauseSimulation();
				return;
			}

			const stepData = steps[currentStep];
			if (stepData) {
				const nextStep = currentStep + 1;
				setMessages((prev) => [
					...prev,
					{
						...stepData.message,
						id: `msg-sim-${nextStep}-${Date.now()}`,
						timestamp: Date.now(),
					},
				]);
				setActivePersonaStates((prev) => ({
					...prev,
					...stepData.personaStates,
				}));
				setActiveSimulationStep(nextStep);
			}
		}, 3000);
	}, [pauseSimulation]);

	const resetSimulation = useCallback(() => {
		pauseSimulation();
		setActiveSimulationStep(4);
		setCheckpointGates(createInitialCheckpointGates(t));
		setActivePersonaStates(INITIAL_PERSONA_STATES);
		const steps = createSimulationScenarioSteps(t);
		setMessages(
			steps.slice(0, 4).map((step, idx) => ({
				...step.message,
				id: `msg-${idx + 1}`,
				timestamp: Date.now() - 1000 * 60 * (10 - idx * 2),
			})),
		);
	}, [pauseSimulation, t]);

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
			sessionId: activeSessionId,
			setSessionId: setActiveSessionId,
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
			activeSessionId,
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
