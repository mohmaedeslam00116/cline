import type { SpecialistPersonaId } from "@cline/shared/browser";

export type PersonaActivityState =
	| "idle"
	| "thinking"
	| "speaking"
	| "working"
	| "checkpoint";

export interface PersonaAvatarProps {
	/**
	 * Pixel size or CSS dimension for width and height (square aspect ratio).
	 * Defaults to 48.
	 */
	size?: number | string;

	/**
	 * Current operational state for dynamic animation cues.
	 * Defaults to "idle".
	 */
	state?: PersonaActivityState;

	/**
	 * Additional CSS class names to apply to the root SVG or container.
	 */
	className?: string;

	/**
	 * Whether to render the ambient neon glow halo behind the avatar.
	 * Defaults to true.
	 */
	showGlow?: boolean;

	/**
	 * Whether to render the active status LED dot / activity ring.
	 * Defaults to true.
	 */
	showStatusRing?: boolean;

	/**
	 * Whether hover and click interaction micro-animations are enabled.
	 * Defaults to false.
	 */
	interactive?: boolean;

	/**
	 * Accessible title or tooltip for screen readers.
	 * Required to ensure proper accessibility and bilingual parity.
	 */
	title: string;

	/**
	 * Optional click handler.
	 */
	onClick?: () => void;
}

export interface PersonaMetadata {
	id: SpecialistPersonaId;
	name: string;
	title: string;
	cyberRole: string;
	primaryColor: string;
	secondaryColor: string;
	accentGlow: string;
	description: string;
	sigilCode: string;
}
