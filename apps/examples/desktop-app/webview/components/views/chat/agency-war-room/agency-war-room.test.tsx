// @vitest-environment jsdom

import type {
	RuntimePersonaDefinition,
	SquadConfig,
} from "@cline/shared/browser";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getLensTranslations } from "@/lib/lens-i18n";
import {
	AgencyWarRoomPanel,
	AgentMessageBubble,
	CheckpointGateCard,
	useWarRoom,
	type WarRoomCheckpointGate,
	type WarRoomMessage,
	WarRoomProvider,
} from "./index";

const t = getLensTranslations().ultraAgency;

let container: HTMLDivElement;
let root: Root;

const AUDIT_PERSONA: RuntimePersonaDefinition = {
	id: "audit-bot",
	name: "Audit Bot",
	role: "Release Auditor",
	stage: "qa",
	avatar: { chassis: "sentinel", accentColor: "#10b981" },
	instructions: "Audit the release evidence.",
	tools: ["read_files"],
	toolPolicy: "require_approval",
	scope: "workspace",
};

const CUSTOM_SQUAD: SquadConfig = {
	presetId: "custom",
	activePersonaIds: ["orion", "audit-bot"],
	checkpointGatesEnabled: true,
};

beforeEach(() => {
	Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
	window.matchMedia = vi.fn().mockReturnValue({
		matches: true,
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
	});
	container = document.createElement("div");
	document.body.appendChild(container);
	root = createRoot(container);
});

afterEach(async () => {
	await act(async () => root.unmount());
	container.remove();
	window.localStorage.clear();
});

describe("Agency War Room Suite", () => {
	it("renders CheckpointGateCard with pending status, deliverables, and approve button", async () => {
		const handleApprove = vi.fn();
		const handleReject = vi.fn();

		const gate: WarRoomCheckpointGate = {
			id: "gate-test-1",
			gateNumber: 1,
			title: "Checkpoint 1: Architecture & PRD Sign-off",
			description: "Paused for architecture approval.",
			personaId: "atlas",
			status: "pending",
			deliverables: [
				{
					title: "PRD-001",
					type: "PRD",
					summary: "Core requirements",
					badge: "Athena",
				},
			],
			timestamp: Date.now(),
		};

		await act(async () => {
			root.render(
				<CheckpointGateCard
					gate={gate}
					onApprove={handleApprove}
					onReject={handleReject}
				/>,
			);
		});

		expect(container.textContent).toContain(
			"Checkpoint 1: Architecture & PRD Sign-off",
		);
		expect(container.textContent).toContain("GATE #1");
		expect(container.textContent).toContain("PRD-001");
		expect(container.textContent).toContain("Approve & Proceed");

		// Click Approve button
		const approveBtn = Array.from(container.querySelectorAll("button")).find(
			(b) => b.textContent?.includes(t.approveAndProceed),
		);
		expect(approveBtn).toBeDefined();

		await act(async () => {
			approveBtn?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
		});

		expect(handleApprove).toHaveBeenCalledWith("gate-test-1");
	});

	it("renders AgentMessageBubble with sender SVG avatar, recipient arrow, and stage badge", async () => {
		const message: WarRoomMessage = {
			id: "msg-1",
			senderPersonaId: "orion",
			recipientPersonaId: "lyra",
			stage: "research",
			type: "chat",
			content: "Lyra, initiate deep technical research pass on the AST parser.",
			timestamp: Date.now(),
		};

		await act(async () => {
			root.render(<AgentMessageBubble message={message} />);
		});

		expect(container.textContent).toContain("Orion");
		expect(container.textContent).toContain("Lyra");
		expect(container.textContent).toContain("Research");
		expect(container.textContent).toContain(
			"initiate deep technical research pass",
		);

		// Avatar check
		const svgAvatar = container.querySelector("svg");
		expect(svgAvatar).not.toBeNull();
	});

	it("renders AgencyWarRoomPanel with live squad roster, message feed, and simulation controls", async () => {
		await act(async () => {
			root.render(
				<WarRoomProvider initialOpen={true}>
					<AgencyWarRoomPanel />
				</WarRoomProvider>,
			);
		});

		expect(container.textContent).toContain("Agency War Room");
		expect(container.textContent).toContain("LIVE SWARM");
		expect(container.textContent).toContain("Orion");
		expect(container.textContent).toContain("Lyra");
		expect(container.textContent).toContain("Athena");
		expect(container.textContent).toContain("Atlas");
		expect(container.textContent).toContain("Cipher");
		expect(container.textContent).toContain("Sentinel");

		// Check telemetry bar
		expect(container.textContent).toContain("Active Swarm: 5 Specialists");
	});

	it("filters messages when a persona filter is selected", async () => {
		await act(async () => {
			root.render(
				<WarRoomProvider initialOpen={true}>
					<AgencyWarRoomPanel />
				</WarRoomProvider>,
			);
		});

		// Find filter button for Lyra
		const filterButtons = Array.from(container.querySelectorAll("button"));
		const lyraFilter = filterButtons.find((btn) =>
			btn.textContent?.includes("Lyra"),
		);
		expect(lyraFilter).toBeDefined();

		await act(async () => {
			lyraFilter?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
		});

		// Stream now contains Lyra messages and excludes messages that do not involve Lyra
		expect(container.textContent).toContain("Lyra");
		expect(container.textContent).toContain("EvidenceBundle #842");
		expect(container.textContent).not.toContain(
			"Architecture blueprint formulated",
		);
	});

	it("supports interactive simulation advancement and checkpoint approval", async () => {
		function TestComponent() {
			const {
				checkpointGates,
				approveCheckpoint,
				activeSimulationStep,
				stepSimulation,
			} = useWarRoom();
			const gate1 = checkpointGates.find((g) => g.id === "gate-1");

			return (
				<div>
					<span data-testid="gate-status">{gate1?.status}</span>
					<span data-testid="sim-step">{activeSimulationStep}</span>
					<button type="button" data-testid="step-btn" onClick={stepSimulation}>
						Step
					</button>
					<button
						type="button"
						data-testid="approve-btn"
						onClick={() => approveCheckpoint("gate-1")}
					>
						Approve Gate 1
					</button>
				</div>
			);
		}

		await act(async () => {
			root.render(
				<WarRoomProvider initialOpen={true}>
					<TestComponent />
				</WarRoomProvider>,
			);
		});

		const gateStatus = container.querySelector('[data-testid="gate-status"]');
		const simStep = container.querySelector('[data-testid="sim-step"]');
		expect(gateStatus?.textContent).toBe("pending");
		expect(simStep?.textContent).toBe("4");

		// Progression is blocked while gate 1 is pending
		const stepBtn = container.querySelector('[data-testid="step-btn"]');
		await act(async () => {
			stepBtn?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
		});
		expect(simStep?.textContent).toBe("4");

		// Approving gate advances simulation past the gate
		const approveBtn = container.querySelector('[data-testid="approve-btn"]');
		await act(async () => {
			approveBtn?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
		});

		expect(gateStatus?.textContent).toBe("approved");
		expect(simStep?.textContent).toBe("5");
	});

	it("receives live agency_war_room_event and renders incoming subagent message and active state", async () => {
		const { desktopClient } = await import("@/lib/desktop-client");

		await act(async () => {
			root.render(
				<WarRoomProvider initialOpen={true} sessionId="test-session">
					<AgencyWarRoomPanel />
				</WarRoomProvider>,
			);
		});

		// Event from a different session should be ignored
		await act(async () => {
			desktopClient.dispatchLocalEvent("agency_war_room_event", {
				sessionId: "different-session",
				subAgentId: "subagent-atlas-1",
				personaId: "atlas",
				event: {
					type: "content_start",
					contentType: "text",
					text: "This should NOT appear in test-session",
				},
				ts: Date.now(),
			});
		});
		expect(container.textContent).not.toContain(
			"This should NOT appear in test-session",
		);

		// Dispatch live subagent chat event from Lyra for test-session
		await act(async () => {
			desktopClient.dispatchLocalEvent("agency_war_room_event", {
				sessionId: "test-session",
				subAgentId: "subagent-lyra-99",
				parentAgentId: "root-orion",
				personaId: "lyra",
				event: {
					type: "content_start",
					contentType: "text",
					text: "Live AST parsing analysis complete.",
				},
				ts: Date.now(),
			});
		});

		expect(container.textContent).toContain(
			"Live AST parsing analysis complete.",
		);

		// Dispatch tool start with unique toolCallId
		await act(async () => {
			desktopClient.dispatchLocalEvent("agency_war_room_event", {
				sessionId: "test-session",
				subAgentId: "subagent-lyra-99",
				personaId: "lyra",
				event: {
					type: "content_start",
					contentType: "tool",
					toolName: "read_file",
					toolCallId: "call-123",
					input: { path: "src/index.ts" },
				},
				ts: Date.now(),
			});
		});
		expect(container.textContent).toContain("Executing tool: read_file");

		// Dispatch tool end correlating with toolCallId
		await act(async () => {
			desktopClient.dispatchLocalEvent("agency_war_room_event", {
				sessionId: "test-session",
				subAgentId: "subagent-lyra-99",
				personaId: "lyra",
				event: {
					type: "content_end",
					contentType: "tool",
					toolName: "read_file",
					toolCallId: "call-123",
					output: "file contents",
				},
				ts: Date.now(),
			});
		});
	});

	it("renders CheckpointGateCard with Proposed Team Memory Updates and persona attribution", async () => {
		const handleApprove = vi.fn();
		const handleReject = vi.fn();

		const gateWithProposals: WarRoomCheckpointGate = {
			id: "gate-memory-1",
			gateNumber: 1,
			title: "Checkpoint 1: Architecture Sign-off",
			description: "Reviewing architecture and team memory.",
			personaId: "atlas",
			status: "pending",
			deliverables: [
				{
					title: "Arch Spec",
					type: "Spec",
					summary: "Architecture spec",
				},
			],
			proposedLearnings: [
				{
					id: "prop-1",
					personaId: "atlas",
					topic: "ESM Dynamic Import",
					learning: "Always await dynamic imports in sidecar commands",
					timestamp: Date.now(),
					approved: true,
				},
				{
					id: "prop-2",
					personaId: "athena",
					topic: "Schema Strictness",
					learning: "Use z.strictObject to avoid extra field leakage",
					timestamp: Date.now(),
					approved: true,
				},
			],
			timestamp: Date.now(),
		};

		await act(async () => {
			root.render(
				<CheckpointGateCard
					gate={gateWithProposals}
					onApprove={handleApprove}
					onReject={handleReject}
				/>,
			);
		});

		expect(container.textContent).toContain("Proposed Team Memory Updates");
		expect(container.textContent).toContain("ESM Dynamic Import");
		expect(container.textContent).toContain(
			"Always await dynamic imports in sidecar commands",
		);
		expect(container.textContent).toContain("Schema Strictness");
		expect(container.textContent).toContain("Atlas");
		expect(container.textContent).toContain("Athena");
		expect(container.textContent).toContain("2 / 2");
		expect(container.textContent).toContain("Approved for Commit");
	});

	it("allows toggling memory proposal approval and commits only approved proposals", async () => {
		const handleApprove = vi.fn();
		const handleReject = vi.fn();

		const gateWithProposals: WarRoomCheckpointGate = {
			id: "gate-memory-2",
			gateNumber: 1,
			title: "Checkpoint 1: PRD Sign-off",
			description: "Sign off PRD",
			personaId: "atlas",
			status: "pending",
			deliverables: [],
			proposedLearnings: [
				{
					id: "prop-toggle-1",
					personaId: "atlas",
					topic: "Keep This",
					learning: "This learning is accurate",
					timestamp: Date.now(),
					approved: true,
				},
				{
					id: "prop-toggle-2",
					personaId: "vector",
					topic: "Exclude This",
					learning: "This learning is hallucinated",
					timestamp: Date.now(),
					approved: true,
				},
			],
			timestamp: Date.now(),
		};

		await act(async () => {
			root.render(
				<CheckpointGateCard
					gate={gateWithProposals}
					onApprove={handleApprove}
					onReject={handleReject}
				/>,
			);
		});

		// Toggle off the second proposal ("Exclude This")
		const toggleBtn2 = container.querySelector(
			'button[data-testid="toggle-proposal-prop-toggle-2"]',
		);
		expect(toggleBtn2).not.toBeNull();

		await act(async () => {
			toggleBtn2?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
		});

		// Proposal 2 is now excluded
		expect(container.textContent).toContain("1 / 2");
		expect(container.textContent).toContain("Excluded");

		// Click Approve & Proceed
		const approveBtn = Array.from(container.querySelectorAll("button")).find(
			(b) => b.textContent?.includes(t.approveAndProceed),
		);
		expect(approveBtn).toBeDefined();
		await act(async () => {
			approveBtn?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
		});

		expect(handleApprove).toHaveBeenCalledWith(
			"gate-memory-2",
			expect.arrayContaining([
				expect.objectContaining({
					id: "prop-toggle-1",
					topic: "Keep This",
					approved: true,
				}),
			]),
		);
		// Second proposal must NOT be in the approved list
		const passedList = handleApprove.mock.calls[0][1];
		expect(passedList).toHaveLength(1);
		expect(passedList[0].topic).toBe("Keep This");
	});

	it("allows inline editing of proposal topic and learning in CheckpointGateCard", async () => {
		const handleApprove = vi.fn();
		const handleReject = vi.fn();

		const gateWithProposals: WarRoomCheckpointGate = {
			id: "gate-memory-3",
			gateNumber: 2,
			title: "Checkpoint 2: Pre-Ship",
			description: "Pre-ship audit",
			personaId: "sentinel",
			status: "pending",
			deliverables: [],
			proposedLearnings: [
				{
					id: "prop-edit-1",
					personaId: "sentinel",
					topic: "Raw Topic",
					learning: "Raw learning text",
					timestamp: Date.now(),
					approved: true,
				},
			],
			timestamp: Date.now(),
		};

		await act(async () => {
			root.render(
				<CheckpointGateCard
					gate={gateWithProposals}
					onApprove={handleApprove}
					onReject={handleReject}
				/>,
			);
		});

		// Click "Edit" button
		const editBtn = container.querySelector(
			'button[aria-label="Edit Raw Topic"]',
		);
		expect(editBtn).not.toBeNull();

		await act(async () => {
			editBtn?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
		});

		// Inputs should now be visible
		const topicInput = container.querySelector(
			'input[aria-label="Topic"]',
		) as HTMLInputElement;
		const learningTextarea = container.querySelector(
			'textarea[aria-label="Learning"]',
		) as HTMLTextAreaElement;

		expect(topicInput).not.toBeNull();
		expect(learningTextarea).not.toBeNull();
		expect(topicInput.value).toBe("Raw Topic");

		// Modify values
		await act(async () => {
			const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
				window.HTMLInputElement.prototype,
				"value",
			)?.set;
			nativeInputValueSetter?.call(topicInput, "Polished Topic");
			topicInput.dispatchEvent(new Event("input", { bubbles: true }));

			const nativeTextareaValueSetter = Object.getOwnPropertyDescriptor(
				window.HTMLTextAreaElement.prototype,
				"value",
			)?.set;
			nativeTextareaValueSetter?.call(
				learningTextarea,
				"Polished and verified learning content.",
			);
			learningTextarea.dispatchEvent(new Event("input", { bubbles: true }));
		});

		// Click "Save" button
		const saveBtn = Array.from(container.querySelectorAll("button")).find((b) =>
			b.textContent?.includes("Save"),
		);
		expect(saveBtn).toBeDefined();

		await act(async () => {
			saveBtn?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
		});

		// Verify card now shows the polished text
		expect(container.textContent).toContain("Polished Topic");
		expect(container.textContent).toContain(
			"Polished and verified learning content.",
		);

		// Click Approve & Proceed
		const approveBtn = Array.from(container.querySelectorAll("button")).find(
			(b) => b.textContent?.includes(t.approveAndProceed),
		);
		expect(approveBtn).toBeDefined();
		await act(async () => {
			approveBtn?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
		});

		expect(handleApprove).toHaveBeenCalledWith("gate-memory-3", [
			expect.objectContaining({
				id: "prop-edit-1",
				topic: "Polished Topic",
				learning: "Polished and verified learning content.",
				approved: true,
			}),
		]);
	});

	it("allows requesting changes with option to discard proposals without modifying memory", async () => {
		const handleApprove = vi.fn();
		const handleReject = vi.fn();

		const gateWithProposals: WarRoomCheckpointGate = {
			id: "gate-memory-4",
			gateNumber: 1,
			title: "Checkpoint 1: PRD Sign-off",
			description: "Sign off PRD",
			personaId: "atlas",
			status: "pending",
			deliverables: [],
			proposedLearnings: [
				{
					id: "prop-reject-1",
					personaId: "atlas",
					topic: "Flawed Idea",
					learning: "Do not persist this",
					timestamp: Date.now(),
					approved: true,
				},
			],
			timestamp: Date.now(),
		};

		await act(async () => {
			root.render(
				<CheckpointGateCard
					gate={gateWithProposals}
					onApprove={handleApprove}
					onReject={handleReject}
				/>,
			);
		});

		// Click "Request Changes" button
		const requestChangesBtn = Array.from(
			container.querySelectorAll("button"),
		).find((b) => b.textContent?.includes("Request Changes"));
		expect(requestChangesBtn).toBeDefined();

		await act(async () => {
			requestChangesBtn?.dispatchEvent(
				new MouseEvent("click", { bubbles: true }),
			);
		});

		// Enter feedback
		const feedbackTextarea = container.querySelector(
			"textarea.resize-none",
		) as HTMLTextAreaElement;
		expect(feedbackTextarea).not.toBeNull();

		await act(async () => {
			const nativeTextareaValueSetter = Object.getOwnPropertyDescriptor(
				window.HTMLTextAreaElement.prototype,
				"value",
			)?.set;
			nativeTextareaValueSetter?.call(
				feedbackTextarea,
				"Revise architecture completely before proceeding.",
			);
			feedbackTextarea.dispatchEvent(new Event("input", { bubbles: true }));
		});

		// Click Send Feedback button
		const sendFeedbackBtn = Array.from(
			container.querySelectorAll("button"),
		).find((b) => b.textContent?.includes(t.sendFeedback));
		expect(sendFeedbackBtn).toBeDefined();

		await act(async () => {
			sendFeedbackBtn?.dispatchEvent(
				new MouseEvent("click", { bubbles: true }),
			);
		});

		expect(handleReject).toHaveBeenCalledWith(
			"gate-memory-4",
			"Revise architecture completely before proceeding.",
			{ discardProposals: true },
		);
	});

	it("renders and filters an active custom persona with its exact chassis and accent", async () => {
		const { desktopClient } = await import("@/lib/desktop-client");

		await act(async () => {
			root.render(
				<WarRoomProvider
					initialOpen={true}
					initialPersonaCatalog={[AUDIT_PERSONA]}
					initialSquadConfig={CUSTOM_SQUAD}
					sessionId="custom-session"
				>
					<AgencyWarRoomPanel />
				</WarRoomProvider>,
			);
		});

		await act(async () => {
			desktopClient.dispatchLocalEvent("agency_war_room_event", {
				sessionId: "custom-session",
				subAgentId: "subagent-audit-bot-1",
				personaId: "audit-bot",
				event: {
					type: "content_start",
					contentType: "text",
					text: "Release evidence verified.",
				},
				ts: Date.now(),
			});
		});

		expect(container.textContent).toContain("Audit Bot");
		expect(container.textContent).toContain("Active Swarm: 2 Specialists");
		const avatar = container.querySelector(
			'svg[aria-label="Audit Bot - Release Auditor"]',
		);
		expect(avatar?.textContent).toContain("SENTINEL");
		expect(avatar?.outerHTML).toContain("#10b981");

		const customFilter = Array.from(container.querySelectorAll("button")).find(
			(button) => button.textContent?.includes("Audit Bot"),
		);
		await act(async () => {
			customFilter?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
		});
		expect(container.textContent).toContain("Release evidence verified.");
		expect(container.textContent).not.toContain(
			"Architecture blueprint formulated",
		);
	});

	it("tracks all five live states for a custom persona", async () => {
		const { desktopClient } = await import("@/lib/desktop-client");

		function StateProbe() {
			const { activePersonaStates, addMessage } = useWarRoom();
			return (
				<>
					<span data-testid="audit-state">
						{activePersonaStates["audit-bot"]}
					</span>
					<button
						type="button"
						onClick={() =>
							addMessage({
								senderPersonaId: "audit-bot",
								recipientPersonaId: "all",
								stage: "qa",
								type: "checkpoint",
								content: "Awaiting release approval.",
							})
						}
					>
						Checkpoint
					</button>
				</>
			);
		}

		await act(async () => {
			root.render(
				<WarRoomProvider
					initialPersonaCatalog={[AUDIT_PERSONA]}
					initialSquadConfig={CUSTOM_SQUAD}
					sessionId="state-session"
				>
					<StateProbe />
				</WarRoomProvider>,
			);
		});
		const state = () =>
			container.querySelector('[data-testid="audit-state"]')?.textContent;
		expect(state()).toBe("idle");

		for (const [event, expected] of [
			[
				{ type: "content_start", contentType: "text", text: "Working" },
				"speaking",
			],
			[
				{
					type: "content_start",
					contentType: "tool",
					toolName: "read_file",
					toolCallId: "audit-call",
				},
				"working",
			],
			[
				{
					type: "content_end",
					contentType: "tool",
					toolName: "read_file",
					toolCallId: "audit-call",
				},
				"thinking",
			],
			[{ type: "content_end", contentType: "text" }, "idle"],
		] as const) {
			await act(async () => {
				desktopClient.dispatchLocalEvent("agency_war_room_event", {
					sessionId: "state-session",
					subAgentId: "subagent-audit-bot-2",
					personaId: "audit-bot",
					event,
					ts: Date.now(),
				});
			});
			expect(state()).toBe(expected);
		}

		await act(async () => {
			container
				.querySelector("button")
				?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
		});
		expect(state()).toBe("checkpoint");
	});

	it("keeps unknown event personas visible with a neutral diagnostic identity", async () => {
		const { desktopClient } = await import("@/lib/desktop-client");
		await act(async () => {
			root.render(
				<WarRoomProvider initialOpen={true} sessionId="unknown-session">
					<AgencyWarRoomPanel />
				</WarRoomProvider>,
			);
		});

		await act(async () => {
			desktopClient.dispatchLocalEvent("agency_war_room_event", {
				sessionId: "unknown-session",
				personaId: "retired-agent",
				event: {
					type: "content_start",
					contentType: "text",
					text: "Historical diagnostic event.",
				},
				ts: Date.now(),
			});
		});

		expect(container.textContent).toContain("Unknown specialist");
		expect(container.textContent).toContain("Unavailable persona");
		const avatar = container.querySelector(
			'svg[aria-label="Unknown specialist - Unavailable persona"]',
		);
		expect(avatar?.textContent).not.toContain("ORION");
		expect(avatar?.querySelector("desc")?.textContent).toBe(
			"Unknown specialist",
		);
	});
});
