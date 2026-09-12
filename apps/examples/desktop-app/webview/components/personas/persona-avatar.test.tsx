import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
	AthenaAvatar,
	AtlasAvatar,
	CipherAvatar,
	EchoAvatar,
	LyraAvatar,
	OrionAvatar,
	PersonaAvatar,
	SentinelAvatar,
	VectorAvatar,
	type PersonaActivityState,
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
	it("renders each individual avatar component to valid SVG markup", () => {
		const avatars = [
			{ Component: OrionAvatar, label: "Orion" },
			{ Component: LyraAvatar, label: "Lyra" },
			{ Component: AthenaAvatar, label: "Athena" },
			{ Component: AtlasAvatar, label: "Atlas" },
			{ Component: CipherAvatar, label: "Cipher" },
			{ Component: VectorAvatar, label: "Vector" },
			{ Component: SentinelAvatar, label: "Sentinel" },
			{ Component: EchoAvatar, label: "Echo" },
		];

		for (const { Component, label } of avatars) {
			const html = renderToStaticMarkup(<Component size={64} state="idle" />);
			expect(html).toContain("<svg");
			expect(html).toContain('viewBox="0 0 128 128"');
			expect(html).toContain(label);
		}
	});

	it("renders all 8 personas via the unified PersonaAvatar facade", () => {
		for (const id of PERSONA_IDS) {
			const html = renderToStaticMarkup(
				<PersonaAvatar personaId={id} size={48} state="idle" />,
			);
			expect(html).toContain("<svg");
			expect(html).toContain('viewBox="0 0 128 128"');
			expect(html).toContain('width="48"');
			expect(html).toContain('height="48"');
		}
	});

	it("renders across all activity states without crashing", () => {
		for (const state of ACTIVITY_STATES) {
			const html = renderToStaticMarkup(
				<PersonaAvatar personaId="orion" size={56} state={state} />,
			);
			expect(html).toContain("<svg");
			if (state === "checkpoint") {
				expect(html).toContain("CHECKPOINT");
			}
		}
	});

	it("falls back gracefully for unknown persona IDs", () => {
		const html = renderToStaticMarkup(
			<PersonaAvatar personaId="unknown_agent" size={40} />,
		);
		expect(html).toContain("<svg");
		expect(html).toContain("ORION");
	});
});
