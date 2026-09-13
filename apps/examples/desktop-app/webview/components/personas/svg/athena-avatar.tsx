import type React from "react";
import type { PersonaAvatarProps } from "./types";

export const AthenaAvatar: React.FC<PersonaAvatarProps> = ({
	size = 48,
	state = "idle",
	className = "",
	showGlow = true,
	showStatusRing = true,
	accentColor,
	interactive = false,
	title,
	onClick,
}) => {
	const isThinking = state === "thinking";
	const isSpeaking = state === "speaking";
	const isWorking = state === "working";
	const isCheckpoint = state === "checkpoint";

	return (
		<svg
			viewBox="0 0 128 128"
			width={size}
			height={size}
			className={`select-none transition-transform duration-300 ${
				interactive ? "hover:scale-105 cursor-pointer" : ""
			} ${className}`}
			onClick={onClick}
			onKeyDown={(event) => {
				if (onClick && (event.key === "Enter" || event.key === " ")) {
					event.preventDefault();
					onClick();
				}
			}}
			role={onClick ? "button" : "img"}
			tabIndex={onClick ? 0 : undefined}
			aria-label={title ?? (onClick ? "Athena avatar" : undefined)}
			xmlns="http://www.w3.org/2000/svg"
		>
			<defs>
				{/* Purple Neon Glow */}
				<filter id="athena-glow" x="-20%" y="-20%" width="140%" height="140%">
					<feGaussianBlur stdDeviation="3.5" result="blur" />
					<feMerge>
						<feMergeNode in="blur" />
						<feMergeNode in="SourceGraphic" />
					</feMerge>
				</filter>

				{/* Magenta Prism Bloom */}
				<filter
					id="athena-prism-glow"
					x="-30%"
					y="-30%"
					width="160%"
					height="160%"
				>
					<feGaussianBlur stdDeviation="2" result="b1" />
					<feGaussianBlur stdDeviation="5" result="b2" />
					<feMerge>
						<feMergeNode in="b2" />
						<feMergeNode in="b1" />
						<feMergeNode in="SourceGraphic" />
					</feMerge>
				</filter>

				{/* Gradients */}
				<linearGradient id="athena-tunic" x1="0%" y1="0%" x2="100%" y2="100%">
					<stop offset="0%" stopColor="#3b0764" />
					<stop offset="60%" stopColor="#1e0533" />
					<stop offset="100%" stopColor="#0c0214" />
				</linearGradient>

				<linearGradient id="athena-crown" x1="0%" y1="0%" x2="100%" y2="0%">
					<stop offset="0%" stopColor="#c084fc" />
					<stop offset="50%" stopColor="#e879f9" />
					<stop offset="100%" stopColor="#a855f7" />
				</linearGradient>

				<linearGradient id="athena-face" x1="0%" y1="0%" x2="0%" y2="100%">
					<stop offset="0%" stopColor="#2e1065" />
					<stop offset="100%" stopColor="#17042a" />
				</linearGradient>

				<radialGradient id="athena-ambient-glow" cx="50%" cy="50%" r="50%">
					<stop offset="0%" stopColor="#a855f7" stopOpacity="0.2" />
					<stop offset="70%" stopColor="#090312" stopOpacity="0" />
				</radialGradient>

				<style>{`
					@keyframes athena-float-p0 {
						0%, 100% { transform: translate(0px, 0px); }
						50% { transform: translate(0px, -4px); }
					}
					@keyframes athena-float-p1 {
						0%, 100% { transform: translate(0px, 0px); }
						50% { transform: translate(-3px, 3px); }
					}
					@keyframes athena-float-p2 {
						0%, 100% { transform: translate(0px, 0px); }
						50% { transform: translate(3px, 3px); }
					}
					@keyframes athena-crown-shimmer {
						0%, 100% { opacity: 0.8; }
						50% { opacity: 1; filter: drop-shadow(0 0 6px #e879f9); }
					}
					.athena-p0 { animation: athena-float-p0 2.2s ease-in-out infinite; }
					.athena-p1 { animation: athena-float-p1 2.8s ease-in-out infinite 0.3s; }
					.athena-p2 { animation: athena-float-p2 2.5s ease-in-out infinite 0.6s; }
					.athena-shimmer { animation: athena-crown-shimmer 2s ease-in-out infinite; }
				`}</style>
			</defs>

			{/* Background Cyber Hex Shield */}
			<polygon
				points="64,4 116,24 116,92 64,124 12,92 12,24"
				fill="#090312"
				stroke={isCheckpoint ? "#f59e0b" : "#581c87"}
				strokeWidth="2"
			/>

			{/* Corner HUD Brackets */}
			<path
				d="M18,30 L18,26 L26,26"
				stroke="#c084fc"
				strokeWidth="1.5"
				fill="none"
				opacity="0.85"
			/>
			<path
				d="M110,30 L110,26 L102,26"
				stroke="#c084fc"
				strokeWidth="1.5"
				fill="none"
				opacity="0.85"
			/>
			<path
				d="M18,86 L18,90 L26,90"
				stroke="#c084fc"
				strokeWidth="1.5"
				fill="none"
				opacity="0.85"
			/>
			<path
				d="M110,86 L110,90 L102,90"
				stroke="#c084fc"
				strokeWidth="1.5"
				fill="none"
				opacity="0.85"
			/>

			{/* Requirement Hierarchy Matrix Backing Lines */}
			<line
				x1="64"
				y1="20"
				x2="30"
				y2="40"
				stroke="#3b0764"
				strokeWidth="0.8"
			/>
			<line
				x1="64"
				y1="20"
				x2="98"
				y2="40"
				stroke="#3b0764"
				strokeWidth="0.8"
			/>
			<line
				x1="30"
				y1="40"
				x2="64"
				y2="90"
				stroke="#3b0764"
				strokeWidth="0.8"
				strokeDasharray="3 3"
			/>
			<line
				x1="98"
				y1="40"
				x2="64"
				y2="90"
				stroke="#3b0764"
				strokeWidth="0.8"
				strokeDasharray="3 3"
			/>

			{/* Ambient Neural Glow */}
			{showGlow && (
				<circle
					cx="64"
					cy="58"
					r="38"
					fill="url(#athena-ambient-glow)"
					opacity={isWorking ? "1" : "0.55"}
				/>
			)}

			{/* Floating Requirement Prism Nodes: P0, P1, P2 */}
			<g id="athena-nodes">
				{/* P0 Crown Prism Node (Top Center) */}
				<g className="athena-p0">
					<polygon
						points="64,12 70,20 64,28 58,20"
						fill="#e879f9"
						filter="url(#athena-prism-glow)"
					/>
					<polygon points="64,15 68,20 64,25 60,20" fill="#ffffff" />
				</g>

				{/* P1 Node (Upper Left) */}
				<g className="athena-p1">
					<polygon
						points="28,34 33,39 28,44 23,39"
						fill="#c084fc"
						filter="url(#athena-glow)"
						opacity="0.85"
					/>
					<circle cx="28" cy="39" r="1.5" fill="#ffffff" />
				</g>

				{/* P2 Node (Upper Right) */}
				<g className="athena-p2">
					<polygon
						points="100,34 105,39 100,44 95,39"
						fill="#a855f7"
						filter="url(#athena-glow)"
						opacity="0.85"
					/>
					<circle cx="100" cy="39" r="1.5" fill="#ffffff" />
				</g>
			</g>

			{/* Executive Cybernetic Armor Shoulders */}
			<g id="athena-pauldrons">
				<path
					d="M24,96 L44,84 L54,92 L46,116 L26,104 Z"
					fill="url(#athena-tunic)"
					stroke="#9333ea"
					strokeWidth="1.2"
				/>
				<path
					d="M104,96 L84,84 L74,92 L82,116 L102,104 Z"
					fill="url(#athena-tunic)"
					stroke="#9333ea"
					strokeWidth="1.2"
				/>
				<path
					d="M44,88 L64,96 L84,88 L80,118 L48,118 Z"
					fill="#170326"
					stroke="#581c87"
					strokeWidth="1.5"
				/>
				{/* High-collared gold/magenta v-trim */}
				<path
					d="M52,88 L64,102 L76,88"
					stroke="#e879f9"
					strokeWidth="1.5"
					fill="none"
					opacity="0.9"
				/>
			</g>

			{/* Head & Crown */}
			<g id="athena-head">
				{/* Regal Cybernetic Diadem / Neural Crown */}
				<path
					d="M40,36 L52,24 L64,30 L76,24 L88,36 L82,42 L64,36 L46,42 Z"
					fill="url(#athena-crown)"
					stroke="#f472b6"
					strokeWidth="1.2"
					className="athena-shimmer"
				/>
				<circle
					cx="64"
					cy="32"
					r="2.5"
					fill="#ffffff"
					filter="url(#athena-prism-glow)"
				/>

				{/* Face / Jaw Base */}
				<path
					d="M44,44 L46,68 L56,80 L64,84 L72,80 L82,68 L84,44 Z"
					fill="url(#athena-face)"
					stroke="#7e22ce"
					strokeWidth="1.2"
				/>

				{/* Glowing Lavender Circuit Traces on Cheeks */}
				<path
					d="M48,60 L52,66 L56,66"
					stroke="#c084fc"
					strokeWidth="1"
					fill="none"
					opacity="0.8"
				/>
				<circle cx="56" cy="66" r="1" fill="#e879f9" />
				<path
					d="M80,60 L76,66 L72,66"
					stroke="#c084fc"
					strokeWidth="1"
					fill="none"
					opacity="0.8"
				/>
				<circle cx="72" cy="66" r="1" fill="#e879f9" />

				{/* Eyes: Calculating Intelligent Optics */}
				<g id="athena-optics">
					{/* Left Eye */}
					<polygon
						points="50,54 58,52 60,56 52,58"
						fill="#120224"
						stroke="#c084fc"
						strokeWidth="1"
					/>
					<circle
						cx="55"
						cy="55"
						r="1.8"
						fill="#e879f9"
						filter="url(#athena-glow)"
					/>
					<circle cx="55" cy="55" r="0.8" fill="#ffffff" />

					{/* Right Eye */}
					<polygon
						points="78,54 70,52 68,56 76,58"
						fill="#120224"
						stroke="#c084fc"
						strokeWidth="1"
					/>
					<circle
						cx="73"
						cy="55"
						r="1.8"
						fill="#e879f9"
						filter="url(#athena-glow)"
					/>
					<circle cx="73" cy="55" r="0.8" fill="#ffffff" />
				</g>

				{/* Speaking Audio Wave or Poised Lip */}
				{isSpeaking ? (
					<g transform="translate(56, 70)">
						<line
							x1="0"
							y1="2"
							x2="16"
							y2="2"
							stroke="#e879f9"
							strokeWidth="1.5"
							filter="url(#athena-glow)"
						/>
						<polygon points="8,0 12,4 8,4" fill="#ffffff" />
					</g>
				) : (
					<line
						x1="58"
						y1="73"
						x2="70"
						y2="73"
						stroke="#9333ea"
						strokeWidth="1.2"
						strokeLinecap="round"
					/>
				)}
			</g>

			{/* Status Indicator */}
			{showStatusRing && (
				<g id="athena-status">
					<circle
						cx="108"
						cy="20"
						r="6"
						fill={
							isCheckpoint
								? "#f59e0b"
								: isWorking
									? "#a855f7"
									: isSpeaking
										? "#e879f9"
										: isThinking
											? "#c084fc"
											: "#10b981"
						}
						filter="url(#athena-glow)"
					/>
					<circle cx="108" cy="20" r="2.5" fill="#ffffff" />
				</g>
			)}

			{/* Telemetry Monogram */}
			<text
				x="64"
				y="120"
				textAnchor="middle"
				fill="#7e22ce"
				fontSize="7"
				fontFamily="monospace"
				fontWeight="bold"
				letterSpacing="1.5"
			>
				{"ATHENA // PRD"}
			</text>
			{accentColor ? (
				<rect
					fill="none"
					height="120"
					opacity="0.7"
					rx="12"
					stroke={accentColor}
					strokeWidth="2"
					width="120"
					x="4"
					y="4"
				/>
			) : null}
		</svg>
	);
};
