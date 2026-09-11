import { cn } from "@/lib/utils";

export function LensLogo({ className }: { className?: string }) {
	return (
		<svg
			aria-hidden="true"
			className={cn("inline-block shrink-0", className)}
			fill="none"
			viewBox="0 0 96 96"
			xmlns="http://www.w3.org/2000/svg"
		>
			{/* Viewfinder Focus Brackets */}
			<path
				d="M12 24V16C12 13.7909 13.7909 12 16 12H24"
				stroke="currentColor"
				strokeLinecap="round"
				strokeWidth="2.5"
			/>
			<path
				d="M84 24V16C84 13.7909 82.2091 12 80 12H72"
				stroke="currentColor"
				strokeLinecap="round"
				strokeWidth="2.5"
			/>
			<path
				d="M84 72V80C84 82.2091 82.2091 84 80 84H72"
				stroke="currentColor"
				strokeLinecap="round"
				strokeWidth="2.5"
			/>
			<path
				d="M12 72V80C12 82.2091 13.7909 84 16 84H24"
				stroke="currentColor"
				strokeLinecap="round"
				strokeWidth="2.5"
			/>

			{/* Outer Concentric Guide Ring */}
			<circle
				cx="48"
				cy="48"
				opacity="0.3"
				r="32"
				stroke="currentColor"
				strokeDasharray="2 3"
				strokeWidth="1.5"
			/>
			<circle
				cx="48"
				cy="48"
				opacity="0.5"
				r="26"
				stroke="currentColor"
				strokeWidth="1.5"
			/>

			{/* Aperture Iris Blades */}
			<g transform="translate(48, 48)">
				<g>
					<path
						d="M0 -22 C9 -22 20 -13 22 0 L13 4 C11 -5 5 -11 0 -13 Z"
						fill="currentColor"
					/>
				</g>
				<g transform="rotate(60)">
					<path
						d="M0 -22 C9 -22 20 -13 22 0 L13 4 C11 -5 5 -11 0 -13 Z"
						fill="currentColor"
					/>
				</g>
				<g transform="rotate(120)">
					<path
						d="M0 -22 C9 -22 20 -13 22 0 L13 4 C11 -5 5 -11 0 -13 Z"
						fill="currentColor"
					/>
				</g>
				<g transform="rotate(180)">
					<path
						d="M0 -22 C9 -22 20 -13 22 0 L13 4 C11 -5 5 -11 0 -13 Z"
						fill="currentColor"
					/>
				</g>
				<g transform="rotate(240)">
					<path
						d="M0 -22 C9 -22 20 -13 22 0 L13 4 C11 -5 5 -11 0 -13 Z"
						fill="currentColor"
					/>
				</g>
				<g transform="rotate(300)">
					<path
						d="M0 -22 C9 -22 20 -13 22 0 L13 4 C11 -5 5 -11 0 -13 Z"
						fill="currentColor"
					/>
				</g>

				{/* Center Optic Core */}
				<circle cx="0" cy="0" fill="currentColor" r="6" />
				<circle cx="-1.5" cy="-1.5" fill="var(--background, #000)" r="1.5" />
			</g>
		</svg>
	);
}

export const ClineLogo = LensLogo;
