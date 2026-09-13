import type React from "react";
import type { PersonaAvatarProps } from "./types";

export const AtlasAvatar: React.FC<PersonaAvatarProps> = ({
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
			aria-label={title ?? (onClick ? "Atlas avatar" : undefined)}
			xmlns="http://www.w3.org/2000/svg"
		>
			<defs>
				{/* Emerald Glow */}
				<filter id="atlas-glow" x="-20%" y="-20%" width="140%" height="140%">
					<feGaussianBlur stdDeviation="3.5" result="blur" />
					<feMerge>
						<feMergeNode in="blur" />
						<feMergeNode in="SourceGraphic" />
					</feMerge>
				</filter>

				{/* Quantum Cube Intense Bloom */}
				<filter
					id="atlas-cube-glow"
					x="-30%"
					y="-30%"
					width="160%"
					height="160%"
				>
					<feGaussianBlur stdDeviation="2" result="b1" />
					<feGaussianBlur stdDeviation="4.5" result="b2" />
					<feMerge>
						<feMergeNode in="b2" />
						<feMergeNode in="b1" />
						<feMergeNode in="SourceGraphic" />
					</feMerge>
				</filter>

				{/* Gradients */}
				<linearGradient id="atlas-armor" x1="0%" y1="0%" x2="100%" y2="100%">
					<stop offset="0%" stopColor="#064e3b" />
					<stop offset="50%" stopColor="#022c22" />
					<stop offset="100%" stopColor="#01140e" />
				</linearGradient>

				<linearGradient id="atlas-helmet" x1="0%" y1="0%" x2="0%" y2="100%">
					<stop offset="0%" stopColor="#047857" />
					<stop offset="50%" stopColor="#065f46" />
					<stop offset="100%" stopColor="#022c22" />
				</linearGradient>

				<linearGradient
					id="atlas-tesseract"
					x1="0%"
					y1="0%"
					x2="100%"
					y2="100%"
				>
					<stop offset="0%" stopColor="#34d399" />
					<stop offset="50%" stopColor="#10b981" />
					<stop offset="100%" stopColor="#059669" />
				</linearGradient>

				<radialGradient id="atlas-ambient-glow" cx="50%" cy="50%" r="50%">
					<stop offset="0%" stopColor="#10b981" stopOpacity="0.18" />
					<stop offset="70%" stopColor="#020e09" stopOpacity="0" />
				</radialGradient>

				<style>{`
					@keyframes atlas-cube-spin {
						0% { transform: rotate(0deg) scale(1); }
						50% { transform: rotate(180deg) scale(1.08); }
						100% { transform: rotate(360deg) scale(1); }
					}
					@keyframes atlas-grid-pulse {
						0%, 100% { opacity: 0.3; }
						50% { opacity: 0.8; }
					}
					.atlas-tesseract-spin {
						transform-origin: 26px 44px;
						animation: atlas-cube-spin 8s linear infinite;
					}
					.atlas-grid { animation: atlas-grid-pulse 3s ease-in-out infinite; }
				`}</style>
			</defs>

			{/* Background Cyber Hex Shield */}
			<polygon
				points="64,4 116,24 116,92 64,124 12,92 12,24"
				fill="#020e09"
				stroke={isCheckpoint ? "#f59e0b" : "#065f46"}
				strokeWidth="2"
			/>

			{/* Emerald Corner HUD Brackets */}
			<path
				d="M18,30 L18,26 L26,26"
				stroke="#10b981"
				strokeWidth="1.5"
				fill="none"
				opacity="0.85"
			/>
			<path
				d="M110,30 L110,26 L102,26"
				stroke="#10b981"
				strokeWidth="1.5"
				fill="none"
				opacity="0.85"
			/>
			<path
				d="M18,86 L18,90 L26,90"
				stroke="#10b981"
				strokeWidth="1.5"
				fill="none"
				opacity="0.85"
			/>
			<path
				d="M110,86 L110,90 L102,90"
				stroke="#10b981"
				strokeWidth="1.5"
				fill="none"
				opacity="0.85"
			/>

			{/* Isometric Architectural Blueprint Grid */}
			<g
				className="atlas-grid"
				stroke="#047857"
				strokeWidth="0.6"
				strokeDasharray="3 3"
			>
				<line x1="24" y1="50" x2="104" y2="50" />
				<line x1="24" y1="74" x2="104" y2="74" />
				<line x1="44" y1="20" x2="44" y2="104" />
				<line x1="84" y1="20" x2="84" y2="104" />
			</g>

			{/* Ambient Systems Glow */}
			{showGlow && (
				<circle
					cx="64"
					cy="58"
					r="38"
					fill="url(#atlas-ambient-glow)"
					opacity={isWorking ? "0.95" : "0.5"}
				/>
			)}

			{/* Floating 3D Isometric Quantum Cube / Blueprint Model (Top Left) */}
			<g
				id="atlas-quantum-tesseract"
				className="atlas-tesseract-spin"
				filter="url(#atlas-cube-glow)"
			>
				{/* Front Top Isometric Face */}
				<polygon
					points="26,34 35,39 26,44 17,39"
					fill="url(#atlas-tesseract)"
					opacity="0.85"
				/>
				{/* Front Left Isometric Face */}
				<polygon
					points="17,39 26,44 26,54 17,49"
					fill="#047857"
					opacity="0.9"
				/>
				{/* Front Right Isometric Face */}
				<polygon
					points="26,44 35,39 35,49 26,54"
					fill="#065f46"
					opacity="0.95"
				/>
				{/* Outer Wireframe Edges */}
				<line
					x1="26"
					y1="34"
					x2="35"
					y2="39"
					stroke="#6ee7b7"
					strokeWidth="1"
				/>
				<line
					x1="35"
					y1="39"
					x2="26"
					y2="44"
					stroke="#6ee7b7"
					strokeWidth="1"
				/>
				<line
					x1="26"
					y1="44"
					x2="17"
					y2="39"
					stroke="#6ee7b7"
					strokeWidth="1"
				/>
				<line
					x1="17"
					y1="39"
					x2="26"
					y2="34"
					stroke="#6ee7b7"
					strokeWidth="1"
				/>
				<line
					x1="26"
					y1="44"
					x2="26"
					y2="54"
					stroke="#6ee7b7"
					strokeWidth="1"
				/>
				<line
					x1="17"
					y1="39"
					x2="17"
					y2="49"
					stroke="#6ee7b7"
					strokeWidth="1"
				/>
				<line
					x1="35"
					y1="39"
					x2="35"
					y2="49"
					stroke="#6ee7b7"
					strokeWidth="1"
				/>
			</g>

			{/* Heavy Reinforced Architectural Armor Shoulders */}
			<g id="atlas-pauldrons">
				<path
					d="M20,94 L42,82 L54,92 L46,116 L22,106 Z"
					fill="url(#atlas-armor)"
					stroke="#10b981"
					strokeWidth="1.3"
				/>
				{/* Blueprint topology circuit on left shoulder */}
				<line
					x1="26"
					y1="98"
					x2="36"
					y2="92"
					stroke="#34d399"
					strokeWidth="1"
				/>
				<circle cx="36" cy="92" r="1.5" fill="#6ee7b7" />

				<path
					d="M108,94 L86,82 L74,92 L82,116 L106,106 Z"
					fill="url(#atlas-armor)"
					stroke="#10b981"
					strokeWidth="1.3"
				/>
				{/* Blueprint topology circuit on right shoulder */}
				<line
					x1="102"
					y1="98"
					x2="92"
					y2="92"
					stroke="#34d399"
					strokeWidth="1"
				/>
				<circle cx="92" cy="92" r="1.5" fill="#6ee7b7" />

				<path
					d="M44,88 L64,96 L84,88 L80,118 L48,118 Z"
					fill="#022c22"
					stroke="#047857"
					strokeWidth="1.5"
				/>
				{/* Systems Foundation Keystone Motif */}
				<polygon
					points="64,96 72,104 64,112 56,104"
					fill="#10b981"
					filter="url(#atlas-glow)"
				/>
			</g>

			{/* Head & Architectural Drafting Visor */}
			<g id="atlas-helmet-group">
				{/* Angular Cyber-Helmet Shell */}
				<path
					d="M38,56 L42,34 L64,22 L86,34 L90,56 L80,78 L64,86 L48,78 Z"
					fill="url(#atlas-helmet)"
					stroke="#059669"
					strokeWidth="1.4"
				/>

				{/* Dual-Tier Drafting Ocular Goggles */}
				<g id="atlas-ocular-goggles">
					{/* Goggle Housing */}
					<path
						d="M44,48 L64,44 L84,48 L82,60 L64,58 L46,60 Z"
						fill="#01140e"
						stroke="#10b981"
						strokeWidth="1.2"
					/>

					{/* Precision Crosshair Recticles */}
					<circle
						cx="54"
						cy="53"
						r="4.5"
						fill="#022c22"
						stroke="#34d399"
						strokeWidth="1"
					/>
					<line
						x1="54"
						y1="48"
						x2="54"
						y2="58"
						stroke="#6ee7b7"
						strokeWidth="0.8"
					/>
					<line
						x1="49"
						y1="53"
						x2="59"
						y2="53"
						stroke="#6ee7b7"
						strokeWidth="0.8"
					/>
					<circle
						cx="54"
						cy="53"
						r="1.8"
						fill="#ffffff"
						filter="url(#atlas-glow)"
					/>

					<circle
						cx="74"
						cy="53"
						r="4.5"
						fill="#022c22"
						stroke="#34d399"
						strokeWidth="1"
					/>
					<line
						x1="74"
						y1="48"
						x2="74"
						y2="58"
						stroke="#6ee7b7"
						strokeWidth="0.8"
					/>
					<line
						x1="69"
						y1="53"
						x2="79"
						y2="53"
						stroke="#6ee7b7"
						strokeWidth="0.8"
					/>
					<circle
						cx="74"
						cy="53"
						r="1.8"
						fill="#ffffff"
						filter="url(#atlas-glow)"
					/>
				</g>

				{/* Jaw Rebreather / Architecture Filter */}
				{isSpeaking ? (
					<g transform="translate(56, 71)">
						<line
							x1="0"
							y1="2"
							x2="16"
							y2="2"
							stroke="#34d399"
							strokeWidth="1.5"
							filter="url(#atlas-glow)"
						/>
						<polygon points="8,0 12,4 8,4" fill="#ffffff" />
					</g>
				) : (
					<g opacity="0.7">
						<line
							x1="56"
							y1="72"
							x2="72"
							y2="72"
							stroke="#10b981"
							strokeWidth="1.2"
						/>
						<line
							x1="58"
							y1="75"
							x2="70"
							y2="75"
							stroke="#10b981"
							strokeWidth="1"
						/>
					</g>
				)}
			</g>

			{/* Status Indicator */}
			{showStatusRing && (
				<g id="atlas-status">
					<circle
						cx="108"
						cy="20"
						r="6"
						fill={
							isCheckpoint
								? "#f59e0b"
								: isWorking
									? "#10b981"
									: isSpeaking
										? "#34d399"
										: isThinking
											? "#a855f7"
											: "#059669"
						}
						filter="url(#atlas-glow)"
					/>
					<circle cx="108" cy="20" r="2.5" fill="#ffffff" />
				</g>
			)}

			{/* Telemetry Monogram */}
			<text
				x="64"
				y="120"
				textAnchor="middle"
				fill="#059669"
				fontSize="7"
				fontFamily="monospace"
				fontWeight="bold"
				letterSpacing="1.5"
			>
				{"ATLAS // ARCHITECT"}
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
