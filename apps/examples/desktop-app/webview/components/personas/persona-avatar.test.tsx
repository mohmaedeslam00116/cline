import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
	AthenaAvatar,
	AtlasAvatar,
	CipherAvatar,
	EchoAvatar,
	LyraAvatar,
	OrionAvatar,
	type PersonaActivityState,
	PersonaAvatar,
	SentinelAvatar,
	VectorAvatar,
} from "./svg";

const PERSONA_IDS = [
	"orion",
	"lyra",
	"athena",
	"atlas",
	"cipher",
	"vector",
	"sentinel",
	"echo",
] as const;

const ACTIVITY_STATES: PersonaActivityState[] = [
	"idle",
	"thinking",
	"speaking",
	"working",
	"checkpoint",
];

describe("Cyberpunk SVG Persona Avatars", () => {
	it("renders each individual avatar component to valid SVG markup with SVG radialGradient", () => {
		const avatars = [
			{ Component: OrionAvatar, label: "Orion", glowId: "orion-ambient-glow" },
			{ Component: LyraAvatar, label: "Lyra", glowId: "lyra-ambient-glow" },
			{
				Component: AthenaAvatar,
				label: "Athena",
				glowId: "athena-ambient-glow",
			},
			{ Component: AtlasAvatar, label: "Atlas", glowId: "atlas-ambient-glow" },
			{
				Component: CipherAvatar,
				label: "Cipher",
				glowId: "cipher-ambient-glow",
			},
			{
				Component: VectorAvatar,
				label: "Vector",
				glowId: "vector-ambient-glow",
			},
			{
				Component: SentinelAvatar,
				label: "Sentinel",
				glowId: "sentinel-ambient-glow",
			},
			{ Component: EchoAvatar, label: "Echo", glowId: "echo-ambient-glow" },
		];

		for (const { Component, label, glowId } of avatars) {
			const html = renderToStaticMarkup(
				<Component
					size={64}
					state="idle"
					title={`${label} - Cyberpunk Specialist`}
				/>,
			);
			expect(html).toContain("<svg");
			expect(html).toContain('viewBox="0 0 128 128"');
			expect(html).toContain(`aria-label="${label} - Cyberpunk Specialist"`);
			expect(html).toContain(`<radialGradient id="${glowId}"`);
			expect(html).toContain(`fill="url(#${glowId})"`);
			expect(html).not.toContain('fill="radial-gradient');
		}
	});

	it("renders all 8 personas via the unified PersonaAvatar facade", () => {
		for (const id of PERSONA_IDS) {
			const html = renderToStaticMarkup(
				<PersonaAvatar
					personaId={id}
					title={`${id} avatar`}
					size={48}
					state="idle"
				/>,
			);
			expect(html).toContain("<svg");
			expect(html).toContain('viewBox="0 0 128 128"');
			expect(html).toContain('width="48"');
			expect(html).toContain('height="48"');
			expect(html).toContain(`aria-label="${id} avatar"`);
		}
	});

	it("renders across all activity states without crashing", () => {
		for (const state of ACTIVITY_STATES) {
			const html = renderToStaticMarkup(
				<PersonaAvatar
					personaId="orion"
					title="Orion Lead"
					size={56}
					state={state}
				/>,
			);
			expect(html).toContain("<svg");
			if (state === "checkpoint") {
				expect(html).toContain("CHECKPOINT");
			}
		}
	});

	it("falls back gracefully for unknown persona IDs", () => {
		const html = renderToStaticMarkup(
			<PersonaAvatar
				personaId="unknown_agent"
				title="Fallback Agent"
				size={40}
			/>,
		);
		expect(html).toContain("<svg");
		expect(html).not.toContain("ORION");
		expect(html).toContain("Unknown specialist");
	});

	it("renders a custom persona with its configured chassis and accent", () => {
		const html = renderToStaticMarkup(
			<PersonaAvatar
				personaId="audit-bot"
				chassis="sentinel"
				accentColor="#10b981"
				title="Audit Bot"
				size={40}
			/>,
		);
		expect(html).toContain("SENTINEL");
		expect(html).toContain("#10b981");
	});
});
