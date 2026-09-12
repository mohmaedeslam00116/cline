import type React from "react";
import type { PersonaAvatarProps } from "./types";

export const LyraAvatar: React.FC<PersonaAvatarProps> = ({
	size = 48,
	state = "idle",
	className = "",
	showGlow = true,
	showStatusRing = true,
	interactive = false,
	title = "Lyra - Deep Tech Researcher",
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
			role="img"
			aria-label={title}
			xmlns="http://www.w3.org/2000/svg"
		>
			<defs>
				{/* Neon Cyan Glow */}
				<filter id="lyra-glow" x="-20%" y="-20%" width="140%" height="140%">
					<feGaussianBlur stdDeviation="3.5" result="blur" />
					<feMerge>
						<feMergeNode in="blur" />
						<feMergeNode in="SourceGraphic" />
					</feMerge>
				</filter>

				{/* High-Intensity Monocle Laser Bloom */}
				<filter
					id="lyra-lens-glow"
					x="-30%"
					y="-30%"
					width="160%"
					height="160%"
				>
					<feGaussianBlur stdDeviation="2" result="blur1" />
					<feGaussianBlur stdDeviation="4.5" result="blur2" />
					<feMerge>
						<feMergeNode in="blur2" />
						<feMergeNode in="blur1" />
						<feMergeNode in="SourceGraphic" />
					</feMerge>
				</filter>

				{/* Gradients */}
				<linearGradient id="lyra-armor" x1="0%" y1="0%" x2="100%" y2="100%">
					<stop offset="0%" stopColor="#164e63" />
					<stop offset="50%" stopColor="#083344" />
					<stop offset="100%" stopColor="#021824" />
				</linearGradient>

				<linearGradient
					id="lyra-cyber-hair"
					x1="0%"
					y1="0%"
					x2="100%"
					y2="100%"
				>
					<stop offset="0%" stopColor="#22d3ee" />
					<stop offset="60%" stopColor="#0e7490" />
					<stop offset="100%" stopColor="#082f49" />
				</linearGradient>

				<linearGradient id="lyra-spectrum" x1="0%" y1="0%" x2="100%" y2="0%">
					<stop offset="0%" stopColor="#06b6d4" />
					<stop offset="50%" stopColor="#2dd4bf" />
					<stop offset="100%" stopColor="#38bdf8" />
				</linearGradient>

				<style>{`
					@keyframes lyra-reticle-spin {
						0% { transform: rotate(0deg); }
						100% { transform: rotate(360deg); }
					}
					@keyframes lyra-pulse-spectrum {
						0%, 100% { transform: scaleY(0.6); opacity: 0.6; }
						50% { transform: scaleY(1.4); opacity: 1; }
					}
					@keyframes lyra-data-float {
						0% { transform: translateY(0px); opacity: 0.3; }
						50% { transform: translateY(-4px); opacity: 1; }
						100% { transform: translateY(0px); opacity: 0.3; }
					}
					@keyframes lyra-scanner-arc {
						0% { stroke-dashoffset: 60; }
						50% { stroke-dashoffset: 0; }
						100% { stroke-dashoffset: -60; }
					}
					.lyra-spin {
						transform-origin: 52px 52px;
						animation: lyra-reticle-spin 4s linear infinite;
					}
					.lyra-bar-1 { animation: lyra-pulse-spectrum 0.7s ease-in-out infinite; transform-origin: center bottom; }
					.lyra-bar-2 { animation: lyra-pulse-spectrum 0.9s ease-in-out infinite 0.2s; transform-origin: center bottom; }
					.lyra-bar-3 { animation: lyra-pulse-spectrum 0.6s ease-in-out infinite 0.4s; transform-origin: center bottom; }
					.lyra-node-float { animation: lyra-data-float 2.5s ease-in-out infinite; }
				`}</style>
			</defs>

			{/* Background Cyber Hex Shield */}
			<polygon
				points="64,4 116,24 116,92 64,124 12,92 12,24"
				fill="#040b14"
				stroke={isCheckpoint ? "#f59e0b" : "#0e7490"}
				strokeWidth="2"
			/>

			{/* Cyan Corner HUD Brackets */}
			<path
				d="M18,30 L18,26 L26,26"
				stroke="#22d3ee"
				strokeWidth="1.5"
				fill="none"
				opacity="0.85"
			/>
			<path
				d="M110,30 L110,26 L102,26"
				stroke="#22d3ee"
				strokeWidth="1.5"
				fill="none"
				opacity="0.85"
			/>
			<path
				d="M18,86 L18,90 L26,90"
				stroke="#22d3ee"
				strokeWidth="1.5"
				fill="none"
				opacity="0.85"
			/>
			<path
				d="M110,86 L110,90 L102,90"
				stroke="#22d3ee"
				strokeWidth="1.5"
				fill="none"
				opacity="0.85"
			/>

			{/* Research Data Grid Backing */}
			<line
				x1="28"
				y1="44"
				x2="100"
				y2="44"
				stroke="#083344"
				strokeWidth="0.8"
				strokeDasharray="4 4"
			/>
			<line
				x1="28"
				y1="84"
				x2="100"
				y2="84"
				stroke="#083344"
				strokeWidth="0.8"
				strokeDasharray="4 4"
			/>

			{/* Floating Holographic Spectrogram Bars (Left side) */}
			<g id="lyra-spectrogram" transform="translate(18, 50)" opacity="0.8">
				<rect
					x="0"
					y="4"
					width="2"
					height="14"
					fill="#06b6d4"
					className="lyra-bar-1"
				/>
				<rect
					x="4"
					y="0"
					width="2"
					height="18"
					fill="#22d3ee"
					className="lyra-bar-2"
				/>
				<rect
					x="8"
					y="6"
					width="2"
					height="12"
					fill="#2dd4bf"
					className="lyra-bar-3"
				/>
				<rect
					x="12"
					y="2"
					width="2"
					height="16"
					fill="#06b6d4"
					className="lyra-bar-1"
				/>
			</g>

			{/* Floating Data Nodes (Right side) */}
			<g id="lyra-data-nodes" className="lyra-node-float" opacity="0.75">
				<circle
					cx="106"
					cy="48"
					r="2"
					fill="#22d3ee"
					filter="url(#lyra-glow)"
				/>
				<line
					x1="106"
					y1="48"
					x2="100"
					y2="56"
					stroke="#06b6d4"
					strokeWidth="0.75"
				/>
				<circle cx="100" cy="56" r="1.5" fill="#2dd4bf" />
				<circle cx="104" cy="68" r="2" fill="#38bdf8" />
			</g>

			{/* Ambient Researcher Glow */}
			{showGlow && (
				<circle
					cx="64"
					cy="58"
					r="38"
					fill="radial-gradient(circle, rgba(34,211,238,0.18) 0%, rgba(4,11,20,0) 70%)"
					opacity={isWorking ? "0.95" : "0.5"}
				/>
			)}

			{/* Cyber Armor Shoulders & High Tech Lab Collar */}
			<g id="lyra-collar">
				<path
					d="M24,98 L42,86 L54,94 L46,116 L28,106 Z"
					fill="url(#lyra-armor)"
					stroke="#06b6d4"
					strokeWidth="1.2"
				/>
				<path
					d="M104,98 L86,86 L74,94 L82,116 L100,106 Z"
					fill="url(#lyra-armor)"
					stroke="#06b6d4"
					strokeWidth="1.2"
				/>
				<path
					d="M44,90 L64,98 L84,90 L80,118 L48,118 Z"
					fill="#041a29"
					stroke="#0e7490"
					strokeWidth="1.5"
				/>
				{/* Neural Core Jewel on collar */}
				<polygon
					points="64,96 70,102 64,108 58,102"
					fill="#22d3ee"
					filter="url(#lyra-glow)"
				/>
			</g>

			{/* Head & Cybernetic Features */}
			<g id="lyra-head">
				{/* Sleek Cyber Hair / Bangs */}
				<path
					d="M40,48 C36,32 50,22 64,22 C78,22 92,32 88,48 C86,40 76,34 64,34 C52,34 42,40 40,48 Z"
					fill="url(#lyra-cyber-hair)"
					stroke="#22d3ee"
					strokeWidth="1"
				/>
				{/* Asymmetrical side fringe */}
				<path
					d="M84,36 L92,54 L84,52 L80,42 Z"
					fill="url(#lyra-cyber-hair)"
					opacity="0.9"
				/>

				{/* Face / Jaw Base */}
				<path
					d="M44,46 L46,68 L56,80 L64,84 L72,80 L82,68 L84,46 Z"
					fill="#082032"
					stroke="#0e7490"
					strokeWidth="1"
				/>

				{/* Right Eye (Normal Cybernetic Optic) */}
				<circle
					cx="74"
					cy="54"
					r="3.5"
					fill="#04121e"
					stroke="#22d3ee"
					strokeWidth="1"
				/>
				<circle cx="74" cy="54" r="1.5" fill="#38bdf8" />

				{/* Left Eye: Holographic Scanner Monocle (Signature) */}
				<g id="lyra-scanner-monocle">
					{/* Outer Targeting Ring */}
					<circle
						cx="54"
						cy="54"
						r="9"
						fill="#021422"
						stroke="#06b6d4"
						strokeWidth="1.2"
					/>
					{/* Rotating Crosshair Reticle */}
					<g className={isThinking || isWorking ? "lyra-spin" : ""}>
						<circle
							cx="54"
							cy="54"
							r="6.5"
							stroke="#22d3ee"
							strokeWidth="1"
							strokeDasharray="4 3"
							fill="none"
						/>
						<line
							x1="54"
							y1="45"
							x2="54"
							y2="49"
							stroke="#00f0ff"
							strokeWidth="1.2"
						/>
						<line
							x1="54"
							y1="59"
							x2="54"
							y2="63"
							stroke="#00f0ff"
							strokeWidth="1.2"
						/>
						<line
							x1="45"
							y1="54"
							x2="49"
							y2="54"
							stroke="#00f0ff"
							strokeWidth="1.2"
						/>
						<line
							x1="59"
							y1="54"
							x2="63"
							y2="54"
							stroke="#00f0ff"
							strokeWidth="1.2"
						/>
					</g>
					{/* Glowing Core Diode */}
					<circle
						cx="54"
						cy="54"
						r="2.8"
						fill="#ffffff"
						filter="url(#lyra-lens-glow)"
					/>

					{/* Temple Cyber-Mount Cable */}
					<path
						d="M45,54 L36,50 L34,44"
						stroke="#22d3ee"
						strokeWidth="1.5"
						fill="none"
						strokeLinecap="round"
					/>
					<circle
						cx="34"
						cy="44"
						r="1.8"
						fill="#06b6d4"
						filter="url(#lyra-glow)"
					/>
				</g>

				{/* Research Neural Visor Arch */}
				<path
					d="M42,42 Q64,36 86,42"
					stroke="#00f0ff"
					strokeWidth="1.5"
					fill="none"
					filter="url(#lyra-glow)"
					opacity="0.8"
				/>

				{/* Speaking Audio Wave or Neutral Cyber-Lip */}
				{isSpeaking ? (
					<g transform="translate(56, 70)">
						<line
							x1="0"
							y1="2"
							x2="16"
							y2="2"
							stroke="#22d3ee"
							strokeWidth="1.5"
							filter="url(#lyra-glow)"
						/>
						<polygon points="8,0 12,4 8,4" fill="#00f0ff" />
					</g>
				) : (
					<line
						x1="58"
						y1="72"
						x2="70"
						y2="72"
						stroke="#0e7490"
						strokeWidth="1.2"
						strokeLinecap="round"
					/>
				)}
			</g>

			{/* Status Indicator Dot */}
			{showStatusRing && (
				<g id="lyra-status-indicator">
					<circle
						cx="108"
						cy="20"
						r="6"
						fill={
							isCheckpoint
								? "#f59e0b"
								: isWorking
									? "#06b6d4"
									: isSpeaking
										? "#22d3ee"
										: isThinking
											? "#a855f7"
											: "#10b981"
						}
						filter="url(#lyra-glow)"
					/>
					<circle cx="108" cy="20" r="2.5" fill="#ffffff" />
				</g>
			)}

			{/* Telemetry Monogram */}
			<text
				x="64"
				y="120"
				textAnchor="middle"
				fill="#0e7490"
				fontSize="7"
				fontFamily="monospace"
				fontWeight="bold"
				letterSpacing="1.5"
			>
				LYRA // RESEARCH
			</text>
		</svg>
	);
};
