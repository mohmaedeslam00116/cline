import type React from "react";
import type { PersonaAvatarProps } from "./types";

export const EchoAvatar: React.FC<PersonaAvatarProps> = ({
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
				{/* Neon Violet Glow */}
				<filter id="echo-glow" x="-20%" y="-20%" width="140%" height="140%">
					<feGaussianBlur stdDeviation="3.5" result="blur" />
					<feMerge>
						<feMergeNode in="blur" />
						<feMergeNode in="SourceGraphic" />
					</feMerge>
				</filter>

				{/* High-Frequency Acoustic Bloom */}
				<filter
					id="echo-sound-bloom"
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
				<linearGradient id="echo-armor" x1="0%" y1="0%" x2="100%" y2="100%">
					<stop offset="0%" stopColor="#31104b" />
					<stop offset="60%" stopColor="#190729" />
					<stop offset="100%" stopColor="#0b0213" />
				</linearGradient>

				<linearGradient id="echo-visor" x1="0%" y1="0%" x2="100%" y2="0%">
					<stop offset="0%" stopColor="#c084fc" />
					<stop offset="50%" stopColor="#a78bfa" />
					<stop offset="100%" stopColor="#818cf8" />
				</linearGradient>

				<radialGradient id="echo-ambient-glow" cx="50%" cy="50%" r="50%">
					<stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.2" />
					<stop offset="70%" stopColor="#08020e" stopOpacity="0" />
				</radialGradient>

				<style>{`
					@keyframes echo-wave-radiate {
						0% { r: 10px; opacity: 0.8; }
						100% { r: 30px; opacity: 0; }
					}
					@keyframes echo-eq-dance {
						0%, 100% { transform: scaleY(0.4); }
						50% { transform: scaleY(1.6); }
					}
					.echo-wave {
						animation: echo-wave-radiate 1.8s ease-out infinite;
					}
					.echo-bar {
						transform-origin: center bottom;
						animation: echo-eq-dance 0.7s ease-in-out infinite alternate;
					}
				`}</style>
			</defs>

			{/* Background Cyber Hex Shield */}
			<polygon
				points="64,4 116,24 116,92 64,124 12,92 12,24"
				fill="#08020e"
				stroke={isCheckpoint ? "#f59e0b" : "#4c1d95"}
				strokeWidth="2"
			/>

			{/* Violet Corner HUD Brackets */}
			<path
				d="M18,30 L18,26 L26,26"
				stroke="#a78bfa"
				strokeWidth="1.5"
				fill="none"
				opacity="0.85"
			/>
			<path
				d="M110,30 L110,26 L102,26"
				stroke="#a78bfa"
				strokeWidth="1.5"
				fill="none"
				opacity="0.85"
			/>
			<path
				d="M18,86 L18,90 L26,90"
				stroke="#a78bfa"
				strokeWidth="1.5"
				fill="none"
				opacity="0.85"
			/>
			<path
				d="M110,86 L110,90 L102,90"
				stroke="#a78bfa"
				strokeWidth="1.5"
				fill="none"
				opacity="0.85"
			/>

			{/* Telemetry Wave Backing Grid */}
			<line
				x1="28"
				y1="46"
				x2="100"
				y2="46"
				stroke="#2e1065"
				strokeWidth="0.8"
				strokeDasharray="4 4"
			/>
			<line
				x1="28"
				y1="84"
				x2="100"
				y2="84"
				stroke="#2e1065"
				strokeWidth="0.8"
				strokeDasharray="4 4"
			/>

			{/* Ambient Telemetry Aura */}
			{showGlow && (
				<circle
					cx="64"
					cy="58"
					r="38"
					fill="url(#echo-ambient-glow)"
					opacity={isWorking ? "1" : "0.5"}
				/>
			)}

			{/* Acoustic Headset Telemetry Waves (Radiating from Left Headset) */}
			{(isThinking || isSpeaking || isWorking) && (
				<g id="echo-soundwaves" opacity="0.75">
					<circle
						cx="32"
						cy="52"
						r="14"
						stroke="#c084fc"
						strokeWidth="1"
						fill="none"
						className="echo-wave"
					/>
					<circle
						cx="96"
						cy="52"
						r="14"
						stroke="#c084fc"
						strokeWidth="1"
						fill="none"
						className="echo-wave"
						style={{ animationDelay: "0.6s" }}
					/>
				</g>
			)}

			{/* Floating Markdown / Documentation Hologlyph (Right side) */}
			<g id="echo-doc-glyph" transform="translate(98, 38)" opacity="0.8">
				<rect
					x="0"
					y="0"
					width="14"
					height="18"
					rx="2"
					fill="#1e1035"
					stroke="#a78bfa"
					strokeWidth="1"
				/>
				<line x1="3" y1="4" x2="11" y2="4" stroke="#c084fc" strokeWidth="1" />
				<line x1="3" y1="8" x2="9" y2="8" stroke="#818cf8" strokeWidth="0.8" />
				<line
					x1="3"
					y1="12"
					x2="11"
					y2="12"
					stroke="#818cf8"
					strokeWidth="0.8"
				/>
			</g>

			{/* Communicator Armor Shoulders */}
			<g id="echo-shoulders">
				<path
					d="M20,94 L42,82 L54,92 L46,116 L22,106 Z"
					fill="url(#echo-armor)"
					stroke="#8b5cf6"
					strokeWidth="1.2"
				/>
				<path
					d="M108,94 L86,82 L74,92 L82,116 L106,106 Z"
					fill="url(#echo-armor)"
					stroke="#8b5cf6"
					strokeWidth="1.2"
				/>
				<path
					d="M44,88 L64,96 L84,88 L80,118 L48,118 Z"
					fill="#170626"
					stroke="#5b21b6"
					strokeWidth="1.5"
				/>

				{/* Soundwave Frequency Bars on Chest */}
				<g
					id="echo-chest-frequency"
					transform="translate(54, 100)"
					opacity="0.9"
				>
					<rect
						x="0"
						y="4"
						width="2"
						height="8"
						fill="#818cf8"
						className="echo-bar"
						style={{ animationDelay: "0ms" }}
					/>
					<rect
						x="5"
						y="1"
						width="2"
						height="12"
						fill="#a78bfa"
						className="echo-bar"
						style={{ animationDelay: "200ms" }}
					/>
					<rect
						x="10"
						y="0"
						width="2"
						height="14"
						fill="#c084fc"
						className="echo-bar"
						style={{ animationDelay: "400ms" }}
					/>
					<rect
						x="15"
						y="1"
						width="2"
						height="12"
						fill="#a78bfa"
						className="echo-bar"
						style={{ animationDelay: "200ms" }}
					/>
					<rect
						x="20"
						y="4"
						width="2"
						height="8"
						fill="#818cf8"
						className="echo-bar"
						style={{ animationDelay: "0ms" }}
					/>
				</g>
			</g>

			{/* Head & Acoustic Telemetry Headset */}
			<g id="echo-head">
				{/* Armored Helmet Shell */}
				<path
					d="M38,56 L42,32 L64,20 L86,32 L90,56 L80,78 L64,86 L48,78 Z"
					fill="#1c092d"
					stroke="#6d28d9"
					strokeWidth="1.4"
				/>

				{/* Headset Earcups */}
				<rect
					x="30"
					y="44"
					width="8"
					height="16"
					rx="3"
					fill="#0d0317"
					stroke="#a78bfa"
					strokeWidth="1.2"
				/>
				<rect
					x="90"
					y="44"
					width="8"
					height="16"
					rx="3"
					fill="#0d0317"
					stroke="#a78bfa"
					strokeWidth="1.2"
				/>

				{/* Visor / HUD Display */}
				<g id="echo-visor-group">
					<path
						d="M44,48 L64,44 L84,48 L82,58 L64,56 L46,58 Z"
						fill="#090111"
						stroke="#c084fc"
						strokeWidth="1.2"
					/>
					{/* Visor Beam */}
					<path
						d="M47,50 L64,46 L81,50 L79,56 L64,54 L49,56 Z"
						fill="url(#echo-visor)"
						filter="url(#echo-sound-bloom)"
					/>
					{/* Typography / Glyph Dots */}
					<circle cx="56" cy="51" r="1.8" fill="#ffffff" />
					<circle cx="64" cy="51" r="1.8" fill="#ffffff" />
					<circle cx="72" cy="51" r="1.8" fill="#ffffff" />
				</g>

				{/* Speaking Audio Wave or Microphone Boom */}
				{isSpeaking ? (
					<g transform="translate(56, 70)">
						<line
							x1="0"
							y1="2"
							x2="16"
							y2="2"
							stroke="#c084fc"
							strokeWidth="1.5"
							filter="url(#echo-glow)"
						/>
						<polygon points="8,0 12,4 8,4" fill="#ffffff" />
					</g>
				) : (
					<g opacity="0.8">
						{/* Headset Mic Boom */}
						<path
							d="M38,58 L46,68 L56,68"
							stroke="#a78bfa"
							strokeWidth="1.2"
							fill="none"
							strokeLinecap="round"
						/>
						<circle cx="56" cy="68" r="1.5" fill="#c084fc" />
					</g>
				)}
			</g>

			{/* Status Indicator */}
			{showStatusRing && (
				<g id="echo-status">
					<circle
						cx="108"
						cy="20"
						r="6"
						fill={
							isCheckpoint
								? "#f59e0b"
								: isWorking
									? "#8b5cf6"
									: isSpeaking
										? "#c084fc"
										: isThinking
											? "#a855f7"
											: "#10b981"
						}
						filter="url(#echo-glow)"
					/>
					<circle cx="108" cy="20" r="2.5" fill="#ffffff" />
				</g>
			)}

			{/* Telemetry Monogram */}
			<text
				x="64"
				y="120"
				textAnchor="middle"
				fill="#7c3aed"
				fontSize="7"
				fontFamily="monospace"
				fontWeight="bold"
				letterSpacing="1.5"
			>
				ECHO // DOCS
			</text>
		</svg>
	);
};
