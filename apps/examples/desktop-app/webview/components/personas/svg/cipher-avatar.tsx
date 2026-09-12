import type React from "react";
import type { PersonaAvatarProps } from "./types";

export const CipherAvatar: React.FC<PersonaAvatarProps> = ({
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
				{/* Neon Orange Glow */}
				<filter id="cipher-glow" x="-20%" y="-20%" width="140%" height="140%">
					<feGaussianBlur stdDeviation="3.5" result="blur" />
					<feMerge>
						<feMergeNode in="blur" />
						<feMergeNode in="SourceGraphic" />
					</feMerge>
				</filter>

				{/* High-Heat Laser Bloom */}
				<filter
					id="cipher-heat-glow"
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
				<linearGradient id="cipher-armor" x1="0%" y1="0%" x2="100%" y2="100%">
					<stop offset="0%" stopColor="#431407" />
					<stop offset="60%" stopColor="#1c0702" />
					<stop offset="100%" stopColor="#0a0201" />
				</linearGradient>

				<linearGradient id="cipher-hood" x1="0%" y1="0%" x2="0%" y2="100%">
					<stop offset="0%" stopColor="#291205" />
					<stop offset="50%" stopColor="#190a03" />
					<stop offset="100%" stopColor="#080301" />
				</linearGradient>

				<linearGradient id="cipher-optics" x1="0%" y1="0%" x2="100%" y2="0%">
					<stop offset="0%" stopColor="#ff781f" />
					<stop offset="50%" stopColor="#ffae19" />
					<stop offset="100%" stopColor="#ff4500" />
				</linearGradient>

				<radialGradient id="cipher-ambient-glow" cx="50%" cy="50%" r="50%">
					<stop offset="0%" stopColor="#f97316" stopOpacity="0.2" />
					<stop offset="70%" stopColor="#0b0402" stopOpacity="0" />
				</radialGradient>

				<style>{`
					@keyframes cipher-code-orbit {
						0% { transform: rotate(0deg); }
						100% { transform: rotate(360deg); }
					}
					@keyframes cipher-pulse {
						0%, 100% { opacity: 0.8; }
						50% { opacity: 1; filter: drop-shadow(0 0 6px #f97316); }
					}
					.cipher-orbit {
						transform-origin: 64px 64px;
						animation: cipher-code-orbit 10s linear infinite;
					}
					.cipher-active-pulse {
						animation: cipher-pulse 1.8s ease-in-out infinite;
					}
				`}</style>
			</defs>

			{/* Background Cyber Hex Shield */}
			<polygon
				points="64,4 116,24 116,92 64,124 12,92 12,24"
				fill="#0b0402"
				stroke={isCheckpoint ? "#f59e0b" : "#7c2d12"}
				strokeWidth="2"
			/>

			{/* Orange Corner HUD Brackets */}
			<path
				d="M18,30 L18,26 L26,26"
				stroke="#f97316"
				strokeWidth="1.5"
				fill="none"
				opacity="0.85"
			/>
			<path
				d="M110,30 L110,26 L102,26"
				stroke="#f97316"
				strokeWidth="1.5"
				fill="none"
				opacity="0.85"
			/>
			<path
				d="M18,86 L18,90 L26,90"
				stroke="#f97316"
				strokeWidth="1.5"
				fill="none"
				opacity="0.85"
			/>
			<path
				d="M110,86 L110,90 L102,90"
				stroke="#f97316"
				strokeWidth="1.5"
				fill="none"
				opacity="0.85"
			/>

			{/* Background Code & Terminal Grid */}
			<line
				x1="28"
				y1="36"
				x2="100"
				y2="36"
				stroke="#431407"
				strokeWidth="0.8"
				strokeDasharray="6 4"
			/>
			<line
				x1="28"
				y1="92"
				x2="100"
				y2="92"
				stroke="#431407"
				strokeWidth="0.8"
				strokeDasharray="6 4"
			/>

			{/* Orbiting Cryptographic Security / Code Glyphs Ring (Thinking / Working) */}
			{(isThinking || isWorking) && (
				<g id="cipher-code-ring" className="cipher-orbit" opacity="0.7">
					<circle
						cx="64"
						cy="64"
						r="46"
						stroke="#ea580c"
						strokeWidth="0.8"
						strokeDasharray="8 6"
						fill="none"
					/>
					<text
						x="64"
						y="22"
						fill="#fb923c"
						fontSize="6"
						fontFamily="monospace"
						textAnchor="middle"
					>
						&lt;/&gt;
					</text>
					<text
						x="108"
						y="66"
						fill="#fb923c"
						fontSize="6"
						fontFamily="monospace"
						textAnchor="middle"
					>
						0x1A
					</text>
					<text
						x="64"
						y="110"
						fill="#fb923c"
						fontSize="6"
						fontFamily="monospace"
						textAnchor="middle"
					>
						SHA
					</text>
					<text
						x="20"
						y="66"
						fill="#fb923c"
						fontSize="6"
						fontFamily="monospace"
						textAnchor="middle"
					>
						0xFF
					</text>
				</g>
			)}

			{/* Ambient Thermal Glow */}
			{showGlow && (
				<circle
					cx="64"
					cy="58"
					r="38"
					fill="url(#cipher-ambient-glow)"
					opacity={isWorking ? "1" : "0.55"}
				/>
			)}

			{/* Full-Stack Engineer Heavy Shoulder Pauldrons */}
			<g id="cipher-shoulders">
				<path
					d="M20,94 L42,82 L54,92 L46,116 L22,106 Z"
					fill="url(#cipher-armor)"
					stroke="#f97316"
					strokeWidth="1.2"
				/>
				{/* Glowing heat busway on left shoulder */}
				<line
					x1="28"
					y1="98"
					x2="38"
					y2="92"
					stroke="#fbbf24"
					strokeWidth="1.2"
					filter="url(#cipher-glow)"
				/>

				<path
					d="M108,94 L86,82 L74,92 L82,116 L106,106 Z"
					fill="url(#cipher-armor)"
					stroke="#f97316"
					strokeWidth="1.2"
				/>
				{/* Glowing heat busway on right shoulder */}
				<line
					x1="100"
					y1="98"
					x2="90"
					y2="92"
					stroke="#fbbf24"
					strokeWidth="1.2"
					filter="url(#cipher-glow)"
				/>

				<path
					d="M44,88 L64,96 L84,88 L80,118 L48,118 Z"
					fill="#190602"
					stroke="#7c2d12"
					strokeWidth="1.5"
				/>
				{/* Central Code Chevron */}
				<polygon
					points="64,96 72,104 64,112 56,104"
					fill="#f97316"
					filter="url(#cipher-glow)"
				/>
			</g>

			{/* Cyber Hood & Rebreather Visage */}
			<g id="cipher-head">
				{/* Tactical Cowl / Ninja Hood */}
				<path
					d="M36,54 C34,30 46,18 64,18 C82,18 94,30 92,54 L86,76 L64,86 L42,76 Z"
					fill="url(#cipher-hood)"
					stroke="#ea580c"
					strokeWidth="1.4"
				/>

				{/* Hood Peak Trim */}
				<polygon
					points="64,18 70,24 64,28 58,24"
					fill="#f97316"
					opacity="0.85"
				/>

				{/* Narrow Neon Cyber-Optics */}
				<g id="cipher-optics-group" className="cipher-active-pulse">
					{/* Left Eye Slit */}
					<polygon
						points="46,50 58,47 59,53 47,56"
						fill="url(#cipher-optics)"
						filter="url(#cipher-heat-glow)"
					/>
					<line
						x1="47"
						y1="52"
						x2="57"
						y2="50"
						stroke="#ffffff"
						strokeWidth="1"
					/>

					{/* Right Eye Slit */}
					<polygon
						points="82,50 70,47 69,53 81,56"
						fill="url(#cipher-optics)"
						filter="url(#cipher-heat-glow)"
					/>
					<line
						x1="81"
						y1="52"
						x2="71"
						y2="50"
						stroke="#ffffff"
						strokeWidth="1"
					/>
				</g>

				{/* Ballistic Rebreather Mask with Code Glyphs */}
				<g id="cipher-rebreather">
					<path
						d="M48,64 L64,60 L80,64 L74,78 L64,82 L54,78 Z"
						fill="#0d0301"
						stroke="#9a3412"
						strokeWidth="1.2"
					/>
					{/* Rebreather Core Grill */}
					{isSpeaking ? (
						<g transform="translate(56, 68)">
							<line
								x1="0"
								y1="2"
								x2="16"
								y2="2"
								stroke="#ff781f"
								strokeWidth="1.5"
								filter="url(#cipher-glow)"
							/>
							<polygon points="8,0 12,4 8,4" fill="#ffffff" />
						</g>
					) : (
						<g opacity="0.8">
							<line
								x1="56"
								y1="70"
								x2="72"
								y2="70"
								stroke="#ea580c"
								strokeWidth="1.2"
							/>
							<line
								x1="58"
								y1="74"
								x2="70"
								y2="74"
								stroke="#f97316"
								strokeWidth="1"
							/>
							<line
								x1="61"
								y1="77"
								x2="67"
								y2="77"
								stroke="#fbbf24"
								strokeWidth="0.8"
							/>
						</g>
					)}
				</g>
			</g>

			{/* Status Indicator */}
			{showStatusRing && (
				<g id="cipher-status">
					<circle
						cx="108"
						cy="20"
						r="6"
						fill={
							isCheckpoint
								? "#f59e0b"
								: isWorking
									? "#f97316"
									: isSpeaking
										? "#fb923c"
										: isThinking
											? "#c084fc"
											: "#10b981"
						}
						filter="url(#cipher-glow)"
					/>
					<circle cx="108" cy="20" r="2.5" fill="#ffffff" />
				</g>
			)}

			{/* Telemetry Monogram */}
			<text
				x="64"
				y="120"
				textAnchor="middle"
				fill="#ea580c"
				fontSize="7"
				fontFamily="monospace"
				fontWeight="bold"
				letterSpacing="1.5"
			>
				CIPHER // ENGINEER
			</text>
		</svg>
	);
};
