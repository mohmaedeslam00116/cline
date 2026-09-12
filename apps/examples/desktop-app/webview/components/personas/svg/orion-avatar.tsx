import type React from "react";
import type { PersonaAvatarProps } from "./types";

export const OrionAvatar: React.FC<PersonaAvatarProps> = ({
	size = 48,
	state = "idle",
	className = "",
	showGlow = true,
	showStatusRing = true,
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
			role="img"
			aria-label={title}
			xmlns="http://www.w3.org/2000/svg"
		>
			<defs>
				{/* Neon Blue Ambient Glow */}
				<filter id="orion-glow" x="-20%" y="-20%" width="140%" height="140%">
					<feGaussianBlur stdDeviation="3.5" result="blur" />
					<feMerge>
						<feMergeNode in="blur" />
						<feMergeNode in="SourceGraphic" />
					</feMerge>
				</filter>

				{/* Visor Laser Intense Bloom */}
				<filter
					id="orion-visor-glow"
					x="-30%"
					y="-30%"
					width="160%"
					height="160%"
				>
					<feGaussianBlur stdDeviation="2" result="blur1" />
					<feGaussianBlur stdDeviation="5" result="blur2" />
					<feMerge>
						<feMergeNode in="blur2" />
						<feMergeNode in="blur1" />
						<feMergeNode in="SourceGraphic" />
					</feMerge>
				</filter>

				{/* Linear Gradients */}
				<linearGradient id="orion-armor" x1="0%" y1="0%" x2="100%" y2="100%">
					<stop offset="0%" stopColor="#1e293b" />
					<stop offset="50%" stopColor="#0f172a" />
					<stop offset="100%" stopColor="#090d16" />
				</linearGradient>

				<linearGradient id="orion-helmet" x1="0%" y1="0%" x2="0%" y2="100%">
					<stop offset="0%" stopColor="#334155" />
					<stop offset="40%" stopColor="#1e293b" />
					<stop offset="100%" stopColor="#0f172a" />
				</linearGradient>

				<linearGradient id="orion-visor" x1="0%" y1="0%" x2="100%" y2="0%">
					<stop offset="0%" stopColor="#00f0ff" />
					<stop offset="50%" stopColor="#38bdf8" />
					<stop offset="100%" stopColor="#00f0ff" />
				</linearGradient>

				<linearGradient id="orion-gold" x1="0%" y1="0%" x2="100%" y2="100%">
					<stop offset="0%" stopColor="#fbbf24" />
					<stop offset="100%" stopColor="#d97706" />
				</linearGradient>

				<radialGradient id="orion-ambient-glow" cx="50%" cy="50%" r="50%">
					<stop offset="0%" stopColor="#38bdf8" stopOpacity="0.15" />
					<stop offset="70%" stopColor="#060911" stopOpacity="0" />
				</radialGradient>

				<style>{`
					@keyframes orion-breathe {
						0%, 100% { opacity: 0.85; transform: scale(1); }
						50% { opacity: 1; transform: scale(1.02); }
					}
					@keyframes orion-scan {
						0% { transform: translateX(-24px); opacity: 0; }
						30% { opacity: 1; }
						70% { opacity: 1; }
						100% { transform: translateX(24px); opacity: 0; }
					}
					@keyframes orion-radar {
						0% { transform: rotate(0deg); }
						100% { transform: rotate(360deg); }
					}
					@keyframes orion-speak-pulse {
						0%, 100% { transform: scaleY(1); }
						50% { transform: scaleY(1.8); }
					}
					@keyframes orion-checkpoint {
						0%, 100% { stroke: #eab308; stroke-opacity: 1; }
						50% { stroke: #f97316; stroke-opacity: 0.4; }
					}
					.orion-active-scan {
						animation: orion-scan 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
					}
					.orion-radar-spin {
						transform-origin: 64px 64px;
						animation: orion-radar 6s linear infinite;
					}
					.orion-voice-bar {
						transform-origin: center bottom;
						animation: orion-speak-pulse 0.6s ease-in-out infinite alternate;
					}
					.orion-gate-alert {
						animation: orion-checkpoint 1.2s ease-in-out infinite;
					}
				`}</style>
			</defs>

			{/* Background Chassis / Cyber Hex Shield */}
			<polygon
				points="64,4 116,24 116,92 64,124 12,92 12,24"
				fill="#060911"
				stroke={isCheckpoint ? "#f59e0b" : "#1e293b"}
				strokeWidth="2"
				className={isCheckpoint ? "orion-gate-alert" : ""}
			/>

			{/* Corner Cyber HUD Accents */}
			<path
				d="M18,30 L18,26 L26,26"
				stroke="#38bdf8"
				strokeWidth="1.5"
				fill="none"
				opacity="0.8"
			/>
			<path
				d="M110,30 L110,26 L102,26"
				stroke="#38bdf8"
				strokeWidth="1.5"
				fill="none"
				opacity="0.8"
			/>
			<path
				d="M18,86 L18,90 L26,90"
				stroke="#38bdf8"
				strokeWidth="1.5"
				fill="none"
				opacity="0.8"
			/>
			<path
				d="M110,86 L110,90 L102,90"
				stroke="#38bdf8"
				strokeWidth="1.5"
				fill="none"
				opacity="0.8"
			/>

			{/* Ambient Tech Grid Backing */}
			<line
				x1="28"
				y1="64"
				x2="100"
				y2="64"
				stroke="#1e293b"
				strokeWidth="0.75"
				strokeDasharray="3 3"
				opacity="0.6"
			/>
			<line
				x1="64"
				y1="28"
				x2="64"
				y2="100"
				stroke="#1e293b"
				strokeWidth="0.75"
				strokeDasharray="3 3"
				opacity="0.6"
			/>

			{/* Radar / Compass Orbit (Active in thinking & working states) */}
			{(isThinking || isWorking) && (
				<g className="orion-radar-spin" opacity="0.45">
					<circle
						cx="64"
						cy="64"
						r="46"
						stroke="#00f0ff"
						strokeWidth="1"
						strokeDasharray="4 8"
						fill="none"
					/>
					<line
						x1="64"
						y1="18"
						x2="64"
						y2="28"
						stroke="#00f0ff"
						strokeWidth="1.5"
					/>
					<line
						x1="110"
						y1="64"
						x2="100"
						y2="64"
						stroke="#00f0ff"
						strokeWidth="1.5"
					/>
					<line
						x1="64"
						y1="110"
						x2="64"
						y2="100"
						stroke="#00f0ff"
						strokeWidth="1.5"
					/>
					<line
						x1="18"
						y1="64"
						x2="28"
						y2="64"
						stroke="#00f0ff"
						strokeWidth="1.5"
					/>
				</g>
			)}

			{/* Ambient Cyber Aura */}
			{showGlow && (
				<circle
					cx="64"
					cy="60"
					r="38"
					fill="url(#orion-ambient-glow)"
					opacity={isWorking ? "0.9" : "0.5"}
				/>
			)}

			{/* Tactical Cyber-Armor Shoulders & Collar */}
			<g id="orion-shoulders">
				{/* Left & Right Shoulder Pauldrons */}
				<path
					d="M22,96 L40,84 L52,94 L46,114 L26,104 Z"
					fill="url(#orion-armor)"
					stroke="#3b82f6"
					strokeWidth="1.2"
					opacity="0.9"
				/>
				<path
					d="M106,96 L88,84 L76,94 L82,114 L102,104 Z"
					fill="url(#orion-armor)"
					stroke="#3b82f6"
					strokeWidth="1.2"
					opacity="0.9"
				/>

				{/* Chest Collar Armor */}
				<path
					d="M44,88 L64,98 L84,88 L80,118 L48,118 Z"
					fill="#0b111e"
					stroke="#1e3a8a"
					strokeWidth="1.5"
				/>

				{/* Gold Commander Chevron on Chest */}
				<path
					d="M58,104 L64,109 L70,104 L64,99 Z"
					fill="url(#orion-gold)"
					filter="url(#orion-glow)"
				/>
			</g>

			{/* Tactical Command Helmet */}
			<g id="orion-helmet-group">
				{/* Helmet Shell Outline */}
				<path
					d="M38,58 L42,34 L64,22 L86,34 L90,58 L82,78 L64,86 L46,78 Z"
					fill="url(#orion-helmet)"
					stroke="#475569"
					strokeWidth="1.5"
				/>

				{/* Side Communication Antennas */}
				<path
					d="M36,44 L32,38 L32,54 Z"
					fill="#1e293b"
					stroke="#38bdf8"
					strokeWidth="1"
				/>
				<circle
					cx="32"
					cy="38"
					r="1.5"
					fill="#00f0ff"
					filter="url(#orion-visor-glow)"
				/>

				<path
					d="M92,44 L96,38 L96,54 Z"
					fill="#1e293b"
					stroke="#38bdf8"
					strokeWidth="1"
				/>
				<circle
					cx="96"
					cy="38"
					r="1.5"
					fill="#00f0ff"
					filter="url(#orion-visor-glow)"
				/>

				{/* Tactical Crest / Forehead Armor */}
				<polygon
					points="64,24 72,35 64,38 56,35"
					fill="url(#orion-gold)"
					opacity="0.9"
				/>
				<line
					x1="64"
					y1="24"
					x2="64"
					y2="38"
					stroke="#ffffff"
					strokeWidth="0.8"
					opacity="0.8"
				/>

				{/* Cheeks / Jaw Plating */}
				<path
					d="M46,68 L52,78 L64,83 L76,78 L82,68 L78,64 L50,64 Z"
					fill="#090d16"
					stroke="#1e293b"
					strokeWidth="1"
				/>

				{/* Glowing Dual-Slit Tactical Visor */}
				<g id="orion-visor-element">
					{/* Visor Housing */}
					<path
						d="M44,50 L64,45 L84,50 L82,59 L64,57 L46,59 Z"
						fill="#030712"
						stroke="#0284c7"
						strokeWidth="1"
					/>

					{/* Glowing Visor Beam */}
					<path
						d="M48,52 L64,48 L80,52 L78,57 L64,55 L50,57 Z"
						fill="url(#orion-visor)"
						filter="url(#orion-visor-glow)"
						opacity={isSpeaking ? "1" : "0.9"}
					/>

					{/* Central Focus Aperture */}
					<circle
						cx="64"
						cy="51.5"
						r="2.5"
						fill="#ffffff"
						filter="url(#orion-visor-glow)"
					/>

					{/* Laser Scan Sweep in Thinking State */}
					{isThinking && (
						<g className="orion-active-scan">
							<line
								x1="64"
								y1="46"
								x2="64"
								y2="58"
								stroke="#ffffff"
								strokeWidth="2.5"
								filter="url(#orion-visor-glow)"
							/>
						</g>
					)}
				</g>

				{/* Mouth Filter / Audio Equalizer (Speaking State) */}
				{isSpeaking ? (
					<g id="orion-voice-eq" transform="translate(52, 70)">
						<rect
							x="0"
							y="4"
							width="2"
							height="6"
							fill="#00f0ff"
							className="orion-voice-bar"
							style={{ animationDelay: "0ms" }}
						/>
						<rect
							x="5"
							y="2"
							width="2"
							height="8"
							fill="#38bdf8"
							className="orion-voice-bar"
							style={{ animationDelay: "150ms" }}
						/>
						<rect
							x="10"
							y="0"
							width="2"
							height="10"
							fill="#ffffff"
							className="orion-voice-bar"
							style={{ animationDelay: "300ms" }}
						/>
						<rect
							x="15"
							y="2"
							width="2"
							height="8"
							fill="#38bdf8"
							className="orion-voice-bar"
							style={{ animationDelay: "150ms" }}
						/>
						<rect
							x="20"
							y="4"
							width="2"
							height="6"
							fill="#00f0ff"
							className="orion-voice-bar"
							style={{ animationDelay: "0ms" }}
						/>
					</g>
				) : (
					/* Tactical Breath Filter Slits */
					<g opacity="0.6">
						<line
							x1="58"
							y1="72"
							x2="70"
							y2="72"
							stroke="#38bdf8"
							strokeWidth="1"
							strokeLinecap="round"
						/>
						<line
							x1="60"
							y1="75"
							x2="68"
							y2="75"
							stroke="#38bdf8"
							strokeWidth="1"
							strokeLinecap="round"
						/>
					</g>
				)}
			</g>

			{/* Status LED & Badge Indicator */}
			{showStatusRing && (
				<g id="orion-status-indicator">
					<circle
						cx="108"
						cy="20"
						r="6"
						fill={
							isCheckpoint
								? "#f59e0b"
								: isWorking
									? "#3b82f6"
									: isSpeaking
										? "#00f0ff"
										: isThinking
											? "#a855f7"
											: "#10b981"
						}
						filter="url(#orion-glow)"
					/>
					<circle cx="108" cy="20" r="2.5" fill="#ffffff" />
				</g>
			)}

			{/* Telemetry Monogram */}
			<text
				x="64"
				y="120"
				textAnchor="middle"
				fill="#64748b"
				fontSize="7"
				fontFamily="monospace"
				fontWeight="bold"
				letterSpacing="1.5"
			>
				{isCheckpoint ? "CHECKPOINT" : "ORION // LEAD"}
			</text>
		</svg>
	);
};
