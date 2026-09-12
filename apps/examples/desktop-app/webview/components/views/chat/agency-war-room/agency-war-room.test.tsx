// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	AgencyWarRoomPanel,
	AgentMessageBubble,
	CheckpointGateCard,
	useWarRoom,
	type WarRoomCheckpointGate,
	type WarRoomMessage,
	WarRoomProvider,
} from "./index";

let container: HTMLDivElement;
let root: Root;

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
		const approveBtn = container.querySelector("button.bg-emerald-600");
		expect(approveBtn).not.toBeNull();

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
		expect(container.textContent).toContain("Vector");
		expect(container.textContent).toContain("Sentinel");
		expect(container.textContent).toContain("Echo");

		// Check telemetry bar
		expect(container.textContent).toContain("Active Swarm: 8 Vectors");
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
				<WarRoomProvider initialOpen={true}>
					<AgencyWarRoomPanel />
				</WarRoomProvider>,
			);
		});

		// Dispatch live subagent chat event from Lyra
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
	});
});
