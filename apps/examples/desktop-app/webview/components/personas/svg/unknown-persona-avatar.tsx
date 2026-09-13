import type React from "react";
import type { PersonaAvatarProps } from "./types";

export const UnknownPersonaAvatar: React.FC<PersonaAvatarProps> = ({
	size = 48,
	state = "idle",
	className = "",
	showStatusRing = true,
	accentColor = "#64748b",
	title,
}) => (
	<svg
		aria-label={title}
		className={`select-none ${className}`}
		height={size}
		role="img"
		viewBox="0 0 128 128"
		width={size}
		xmlns="http://www.w3.org/2000/svg"
	>
		<title>{title}</title>
		<desc>Unknown specialist</desc>
		<path
			d="M64 8 112 32v64l-48 24-48-24V32Z"
			fill="#0f1115"
			stroke={accentColor}
			strokeWidth="2"
		/>
		<path
			d="M42 48c2-13 11-20 23-20 14 0 23 8 23 20 0 10-6 15-14 20-7 4-10 8-10 16"
			fill="none"
			stroke={accentColor}
			strokeLinecap="round"
			strokeWidth="8"
		/>
		<circle cx="64" cy="99" fill={accentColor} r="5" />
		{showStatusRing ? (
			<circle
				cx="106"
				cy="22"
				fill={state === "checkpoint" ? "#f59e0b" : accentColor}
				r="6"
			/>
		) : null}
	</svg>
);
