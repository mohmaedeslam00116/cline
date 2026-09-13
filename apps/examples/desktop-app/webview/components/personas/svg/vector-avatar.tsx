import type React from "react";
import type { PersonaAvatarProps } from "./types";

export const VectorAvatar: React.FC<PersonaAvatarProps> = ({
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
			aria-label={title ?? (onClick ? "Vector avatar" : undefined)}
			xmlns="http://www.w3.org/2000/svg"
		>
			<defs>
				{/* Gold Cyber Glow */}
				<filter id="vector-glow" x="-20%" y="-20%" width="140%" height="140%">
					<feGaussianBlur stdDeviation="3.5" result="blur" />
					<feMerge>
						<feMergeNode in="blur" />
						<feMergeNode in="SourceGraphic" />
					</feMerge>
				</filter>

				{/* High-Intensity Gold Laser Bloom */}
				<filter id="vector-bloom" x="-30%" y="-30%" width="160%" height="160%">
					<feGaussianBlur stdDeviation="2" result="b1" />
					<feGaussianBlur stdDeviation="5" result="b2" />
					<feMerge>
						<feMergeNode in="b2" />
						<feMergeNode in="b1" />
						<feMergeNode in="SourceGraphic" />
					</feMerge>
				</filter>

				{/* Gradients */}
				<linearGradient id="vector-armor" x1="0%" y1="0%" x2="100%" y2="100%">
					<stop offset="0%" stopColor="#713f12" />
					<stop offset="60%" stopColor="#451a03" />
					<stop offset="100%" stopColor="#1a0a01" />
				</linearGradient>

				<linearGradient id="vector-gold-core" x1="0%" y1="0%" x2="100%" y2="0%">
					<stop offset="0%" stopColor="#fef08a" />
					<stop offset="50%" stopColor="#facc15" />
					<stop offset="100%" stopColor="#eab308" />
				</linearGradient>

				<radialGradient id="vector-ambient-glow" cx="50%" cy="50%" r="50%">
					<stop offset="0%" stopColor="#facc15" stopOpacity="0.2" />
					<stop offset="70%" stopColor="#0a0701" stopOpacity="0" />
				</radialGradient>

				<style>{`
					@keyframes vector-stream {
						0% { transform: translateY(-10px); opacity: 0; }
						50% { opacity: 1; }
						100% { transform: translateY(10px); opacity: 0; }
					}
					@keyframes vector-disk-spin {
						0% { transform: rotateY(0deg); }
						100% { transform: rotateY(360deg); }
					}
					.vector-stream-flow {
						animation: vector-stream 1.6s linear infinite;
					}
				`}</style>
			</defs>

			{/* Background Cyber Hex Shield */}
			<polygon
				points="64,4 116,24 116,92 64,124 12,92 12,24"
				fill="#0a0701"
				stroke={isCheckpoint ? "#f59e0b" : "#854d0e"}
				strokeWidth="2"
			/>

			{/* Gold Corner HUD Brackets */}
			<path
				d="M18,30 L18,26 L26,26"
				stroke="#facc15"
				strokeWidth="1.5"
				fill="none"
				opacity="0.85"
			/>
			<path
				d="M110,30 L110,26 L102,26"
				stroke="#facc15"
				strokeWidth="1.5"
				fill="none"
				opacity="0.85"
			/>
			<path
				d="M18,86 L18,90 L26,90"
				stroke="#facc15"
				strokeWidth="1.5"
				fill="none"
				opacity="0.85"
			/>
			<path
				d="M110,86 L110,90 L102,90"
				stroke="#facc15"
				strokeWidth="1.5"
				fill="none"
				opacity="0.85"
			/>

			{/* Relational Database Matrix Grid */}
			<line
				x1="28"
				y1="44"
				x2="100"
				y2="44"
				stroke="#713f12"
				strokeWidth="0.8"
				strokeDasharray="4 4"
			/>
			<line
				x1="28"
				y1="84"
				x2="100"
				y2="84"
				stroke="#713f12"
				strokeWidth="0.8"
				strokeDasharray="4 4"
			/>

			{/* Ambient Data Aura */}
			{showGlow && (
				<circle
					cx="64"
					cy="58"
					r="38"
					fill="url(#vector-ambient-glow)"
					opacity={isWorking ? "1" : "0.5"}
				/>
			)}

			{/* Relational Table / Data Streams (Left & Right Flanks) */}
			<g id="vector-flank-streams" opacity="0.8">
				{/* Left Data Bus */}
				<line
					x1="22"
					y1="42"
					x2="22"
					y2="78"
					stroke="#ca8a04"
					strokeWidth="1"
				/>
				<circle
					cx="22"
					cy="48"
					r="2"
					fill="#facc15"
					filter="url(#vector-glow)"
				/>
				<circle cx="22" cy="62" r="1.5" fill="#fef08a" />
				<circle
					cx="22"
					cy="74"
					r="2"
					fill="#facc15"
					filter="url(#vector-glow)"
				/>

				{/* Right Data Bus */}
				<line
					x1="106"
					y1="42"
					x2="106"
					y2="78"
					stroke="#ca8a04"
					strokeWidth="1"
				/>
				<circle
					cx="106"
					cy="48"
					r="2"
					fill="#facc15"
					filter="url(#vector-glow)"
				/>
				<circle cx="106" cy="62" r="1.5" fill="#fef08a" />
				<circle
					cx="106"
					cy="74"
					r="2"
					fill="#facc15"
					filter="url(#vector-glow)"
				/>
			</g>

			{/* Database Storage Platter Coils on Shoulders */}
			<g id="vector-shoulders">
				<path
					d="M20,94 L42,82 L54,92 L46,116 L22,106 Z"
					fill="url(#vector-armor)"
					stroke="#eab308"
					strokeWidth="1.2"
				/>
				{/* Storage Platter Discs (Left) */}
				<ellipse
					cx="32"
					cy="94"
					rx="8"
					ry="3"
					fill="#1a0a01"
					stroke="#facc15"
					strokeWidth="1"
				/>
				<ellipse
					cx="32"
					cy="98"
					rx="8"
					ry="3"
					fill="#1a0a01"
					stroke="#facc15"
					strokeWidth="1"
				/>

				<path
					d="M108,94 L86,82 L74,92 L82,116 L106,106 Z"
					fill="url(#vector-armor)"
					stroke="#eab308"
					strokeWidth="1.2"
				/>
				{/* Storage Platter Discs (Right) */}
				<ellipse
					cx="96"
					cy="94"
					rx="8"
					ry="3"
					fill="#1a0a01"
					stroke="#facc15"
					strokeWidth="1"
				/>
				<ellipse
					cx="96"
					cy="98"
					rx="8"
					ry="3"
					fill="#1a0a01"
					stroke="#facc15"
					strokeWidth="1"
				/>

				<path
					d="M44,88 L64,96 L84,88 L80,118 L48,118 Z"
					fill="#271302"
					stroke="#854d0e"
					strokeWidth="1.5"
				/>
				{/* Database Cylinder Emblem on Chest */}
				<g transform="translate(56, 98)" filter="url(#vector-glow)">
					<ellipse cx="8" cy="2" rx="7" ry="2" fill="url(#vector-gold-core)" />
					<rect x="1" y="2" width="14" height="6" fill="#ca8a04" />
					<ellipse cx="8" cy="8" rx="7" ry="2" fill="url(#vector-gold-core)" />
				</g>
			</g>

			{/* Head & Ocular Visor */}
			<g id="vector-head">
				{/* Tactical Cyber-Helmet with Cooling Fins */}
				<path
					d="M38,56 L42,32 L64,20 L86,32 L90,56 L80,78 L64,86 L48,78 Z"
					fill="#1a0d02"
					stroke="#a16207"
					strokeWidth="1.4"
				/>

				{/* Gold Forehead Database Crest */}
				<polygon
					points="64,22 72,32 64,36 56,32"
					fill="url(#vector-gold-core)"
					opacity="0.9"
				/>

				{/* Panoramic Multi-Spectral Data Visor */}
				<g id="vector-visor">
					<path
						d="M44,48 L64,44 L84,48 L82,58 L64,56 L46,58 Z"
						fill="#0a0501"
						stroke="#facc15"
						strokeWidth="1.2"
					/>
					{/* Visor Core Beam */}
					<path
						d="M47,50 L64,46 L81,50 L79,56 L64,54 L49,56 Z"
						fill="url(#vector-gold-core)"
						filter="url(#vector-bloom)"
					/>
					{/* Dual Optic Focus Reticles */}
					<circle cx="55" cy="51" r="2.5" fill="#ffffff" />
					<circle cx="73" cy="51" r="2.5" fill="#ffffff" />
				</g>

				{/* Speaking Audio Wave or Filter */}
				{isSpeaking ? (
					<g transform="translate(56, 70)">
						<line
							x1="0"
							y1="2"
							x2="16"
							y2="2"
							stroke="#fde047"
							strokeWidth="1.5"
							filter="url(#vector-glow)"
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
							stroke="#eab308"
							strokeWidth="1.2"
						/>
						<line
							x1="58"
							y1="75"
							x2="70"
							y2="75"
							stroke="#facc15"
							strokeWidth="1"
						/>
					</g>
				)}
			</g>

			{/* Status Indicator */}
			{showStatusRing && (
				<g id="vector-status">
					<circle
						cx="108"
						cy="20"
						r="6"
						fill={
							isCheckpoint
								? "#f59e0b"
								: isWorking
									? "#eab308"
									: isSpeaking
										? "#facc15"
										: isThinking
											? "#c084fc"
											: "#10b981"
						}
						filter="url(#vector-glow)"
					/>
					<circle cx="108" cy="20" r="2.5" fill="#ffffff" />
				</g>
			)}

			{/* Telemetry Monogram */}
			<text
				x="64"
				y="120"
				textAnchor="middle"
				fill="#ca8a04"
				fontSize="7"
				fontFamily="monospace"
				fontWeight="bold"
				letterSpacing="1.5"
			>
				{"VECTOR // DATA"}
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
