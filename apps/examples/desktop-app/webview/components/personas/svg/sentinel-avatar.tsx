import type React from "react";
import type { PersonaAvatarProps } from "./types";

export const SentinelAvatar: React.FC<PersonaAvatarProps> = ({
	size = 48,
	state = "idle",
	className = "",
	showGlow = true,
	showStatusRing = true,
	interactive = false,
	title = "Sentinel - QA & Verification",
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
				{/* Crimson Rose Glow */}
				<filter id="sentinel-glow" x="-20%" y="-20%" width="140%" height="140%">
					<feGaussianBlur stdDeviation="3.5" result="blur" />
					<feMerge>
						<feMergeNode in="blur" />
						<feMergeNode in="SourceGraphic" />
					</feMerge>
				</filter>

				{/* Radar Laser Bloom */}
				<filter
					id="sentinel-laser-bloom"
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
				<linearGradient id="sentinel-armor" x1="0%" y1="0%" x2="100%" y2="100%">
					<stop offset="0%" stopColor="#4c0519" />
					<stop offset="60%" stopColor="#25020c" />
					<stop offset="100%" stopColor="#0f0105" />
				</linearGradient>

				<linearGradient id="sentinel-visor" x1="0%" y1="0%" x2="100%" y2="0%">
					<stop offset="0%" stopColor="#fb7185" />
					<stop offset="50%" stopColor="#fda4af" />
					<stop offset="100%" stopColor="#f43f5e" />
				</linearGradient>

				<linearGradient
					id="sentinel-emerald"
					x1="0%"
					y1="0%"
					x2="100%"
					y2="100%"
				>
					<stop offset="0%" stopColor="#34d399" />
					<stop offset="100%" stopColor="#059669" />
				</linearGradient>

				<style>{`
					@keyframes sentinel-radar-expand {
						0% { r: 12px; opacity: 0.8; }
						100% { r: 42px; opacity: 0; }
					}
					@keyframes sentinel-shield-pulse {
						0%, 100% { transform: scale(1); }
						50% { transform: scale(1.08); }
					}
					.sentinel-radar {
						animation: sentinel-radar-expand 2s ease-out infinite;
					}
					.sentinel-shield {
						transform-origin: 64px 105px;
						animation: sentinel-shield-pulse 2.2s ease-in-out infinite;
					}
				`}</style>
			</defs>

			{/* Background Cyber Hex Shield */}
			<polygon
				points="64,4 116,24 116,92 64,124 12,92 12,24"
				fill="#0d0205"
				stroke={isCheckpoint ? "#f59e0b" : "#881337"}
				strokeWidth="2"
			/>

			{/* Crimson Corner HUD Brackets */}
			<path
				d="M18,30 L18,26 L26,26"
				stroke="#f43f5e"
				strokeWidth="1.5"
				fill="none"
				opacity="0.85"
			/>
			<path
				d="M110,30 L110,26 L102,26"
				stroke="#f43f5e"
				strokeWidth="1.5"
				fill="none"
				opacity="0.85"
			/>
			<path
				d="M18,86 L18,90 L26,90"
				stroke="#f43f5e"
				strokeWidth="1.5"
				fill="none"
				opacity="0.85"
			/>
			<path
				d="M110,86 L110,90 L102,90"
				stroke="#f43f5e"
				strokeWidth="1.5"
				fill="none"
				opacity="0.85"
			/>

			{/* Verification Grid & Radar Crosshairs */}
			<line
				x1="28"
				y1="46"
				x2="100"
				y2="46"
				stroke="#4c0519"
				strokeWidth="0.8"
				strokeDasharray="4 4"
			/>
			<line
				x1="28"
				y1="84"
				x2="100"
				y2="84"
				stroke="#4c0519"
				strokeWidth="0.8"
				strokeDasharray="4 4"
			/>

			{/* Test Diagnostic Radar Pulse Ring (Active in Thinking / Working) */}
			{(isThinking || isWorking) && (
				<circle
					cx="64"
					cy="54"
					r="24"
					stroke="#f43f5e"
					strokeWidth="1.2"
					fill="none"
					className="sentinel-radar"
				/>
			)}

			{/* Ambient Guardian Aura */}
			{showGlow && (
				<circle
					cx="64"
					cy="58"
					r="38"
					fill="radial-gradient(circle, rgba(244,63,94,0.2) 0%, rgba(13,2,5,0) 70%)"
					opacity={isWorking ? "1" : "0.5"}
				/>
			)}

			{/* Guardian Heavy Armor Shoulders */}
			<g id="sentinel-shoulders">
				<path
					d="M20,94 L42,82 L54,92 L46,116 L22,106 Z"
					fill="url(#sentinel-armor)"
					stroke="#f43f5e"
					strokeWidth="1.2"
				/>
				<path
					d="M108,94 L86,82 L74,92 L82,116 L106,106 Z"
					fill="url(#sentinel-armor)"
					stroke="#f43f5e"
					strokeWidth="1.2"
				/>
				<path
					d="M44,88 L64,96 L84,88 L80,118 L48,118 Z"
					fill="#1c030a"
					stroke="#9f1239"
					strokeWidth="1.5"
				/>

				{/* Prominent Verification Shield Emblem on Breastplate */}
				<g id="sentinel-shield-sigil" className="sentinel-shield">
					{/* Shield Contour */}
					<path
						d="M56,98 L72,98 L74,106 L64,114 L54,106 Z"
						fill="#0c1d14"
						stroke="#10b981"
						strokeWidth="1.2"
						filter="url(#sentinel-glow)"
					/>
					{/* Green Verification Checkmark */}
					<path
						d="M59,105 L63,109 L70,102"
						stroke="#34d399"
						strokeWidth="1.8"
						strokeLinecap="round"
						strokeLinejoin="round"
						fill="none"
					/>
				</g>
			</g>

			{/* Aegis Guardian Helmet & Diagnostic Visor */}
			<g id="sentinel-head">
				{/* Armored Helmet Shell */}
				<path
					d="M38,56 L42,32 L64,20 L86,32 L90,56 L80,78 L64,86 L48,78 Z"
					fill="#20030a"
					stroke="#be123c"
					strokeWidth="1.4"
				/>

				{/* Crown Crest Fin */}
				<polygon
					points="64,20 70,30 64,34 58,30"
					fill="#f43f5e"
					opacity="0.9"
				/>

				{/* Heavy Angular Visor with Crosshair Scanning Focus */}
				<g id="sentinel-visor-group">
					<path
						d="M44,48 L64,44 L84,48 L82,58 L64,56 L46,58 Z"
						fill="#0a0104"
						stroke="#fb7185"
						strokeWidth="1.2"
					/>
					{/* Visor Core Beam */}
					<path
						d="M47,50 L64,46 L81,50 L79,56 L64,54 L49,56 Z"
						fill="url(#sentinel-visor)"
						filter="url(#sentinel-laser-bloom)"
					/>
					{/* Central Diagnostic Ocular */}
					<circle
						cx="64"
						cy="51"
						r="3"
						fill="#ffffff"
						filter="url(#sentinel-laser-bloom)"
					/>
				</g>

				{/* Speaking Audio Wave or Heavy Jaw Grill */}
				{isSpeaking ? (
					<g transform="translate(56, 70)">
						<line
							x1="0"
							y1="2"
							x2="16"
							y2="2"
							stroke="#fda4af"
							strokeWidth="1.5"
							filter="url(#sentinel-glow)"
						/>
						<polygon points="8,0 12,4 8,4" fill="#ffffff" />
					</g>
				) : (
					<g opacity="0.8">
						<line
							x1="56"
							y1="72"
							x2="72"
							y2="72"
							stroke="#f43f5e"
							strokeWidth="1.2"
						/>
						<line
							x1="58"
							y1="75"
							x2="70"
							y2="75"
							stroke="#fb7185"
							strokeWidth="1"
						/>
					</g>
				)}
			</g>

			{/* Status Indicator */}
			{showStatusRing && (
				<g id="sentinel-status">
					<circle
						cx="108"
						cy="20"
						r="6"
						fill={
							isCheckpoint
								? "#f59e0b"
								: isWorking
									? "#f43f5e"
									: isSpeaking
										? "#fb7185"
										: isThinking
											? "#c084fc"
											: "#10b981"
						}
						filter="url(#sentinel-glow)"
					/>
					<circle cx="108" cy="20" r="2.5" fill="#ffffff" />
				</g>
			)}

			{/* Telemetry Monogram */}
			<text
				x="64"
				y="120"
				textAnchor="middle"
				fill="#be123c"
				fontSize="7"
				fontFamily="monospace"
				fontWeight="bold"
				letterSpacing="1.5"
			>
				SENTINEL // QA
			</text>
		</svg>
	);
};
