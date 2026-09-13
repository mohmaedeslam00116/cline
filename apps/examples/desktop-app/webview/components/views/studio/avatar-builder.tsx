import type { AgentChassis } from "@cline/shared/browser";
import { PersonaAvatar } from "@/components/personas/svg/persona-avatar";
import type { PersonaActivityState } from "@/components/personas/svg/types";
import { Input } from "@/components/ui/input";
import type { LensTranslations } from "@/lib/lens-i18n";
import { cn } from "@/lib/utils";

const CHASSIS: readonly AgentChassis[] = [
	"orion",
	"lyra",
	"athena",
	"atlas",
	"cipher",
	"vector",
	"sentinel",
	"echo",
];

const ACTIVITY_STATES: readonly PersonaActivityState[] = [
	"idle",
	"thinking",
	"speaking",
	"working",
	"checkpoint",
];

const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

interface AvatarBuilderProps {
	readonly accentColor: string;
	readonly chassis: AgentChassis;
	readonly onAccentColorChange: (accentColor: string) => void;
	readonly onChassisChange: (chassis: AgentChassis) => void;
	readonly translations: LensTranslations["personaStudio"];
}

export function AvatarBuilder({
	accentColor,
	chassis,
	onAccentColorChange,
	onChassisChange,
	translations: t,
}: AvatarBuilderProps) {
	const previewAccent = HEX_COLOR_PATTERN.test(accentColor)
		? accentColor
		: "#22d3ee";

	return (
		<section aria-labelledby="avatar-calibration-title">
			<div className="flex items-end justify-between gap-4">
				<div>
					<h3 className="text-base font-semibold" id="avatar-calibration-title">
						{t.avatarCalibration}
					</h3>
					<p className="mt-1 text-sm text-muted-foreground">
						{t.avatarCalibrationDescription}
					</p>
				</div>
				<label className="grid gap-1.5 text-xs font-medium text-muted-foreground">
					{t.neonAccent}
					<span className="flex items-center gap-2">
						<Input
							aria-label={t.neonAccentPicker}
							className="size-9 cursor-pointer p-1"
							onChange={(event) => onAccentColorChange(event.target.value)}
							type="color"
							value={previewAccent}
						/>
						<Input
							aria-label={t.neonAccent}
							className="w-28 font-mono uppercase"
							data-studio-field="avatar.accentColor"
							onChange={(event) => onAccentColorChange(event.target.value)}
							spellCheck={false}
							value={accentColor}
						/>
					</span>
				</label>
			</div>

			<div className="mt-4 grid grid-cols-4 gap-2 max-[980px]:grid-cols-2">
				{CHASSIS.map((candidate) => (
					<button
						aria-label={`${candidate[0]?.toUpperCase()}${candidate.slice(1)} chassis`}
						aria-pressed={candidate === chassis}
						className={cn(
							"flex items-center gap-2 rounded-xl border border-border px-2.5 py-2 text-left text-xs capitalize outline-none transition-colors hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-ring",
							candidate === chassis && "bg-surface-hover text-foreground",
						)}
						key={candidate}
						onClick={() => onChassisChange(candidate)}
						type="button"
					>
						<PersonaAvatar
							accentColor={candidate === chassis ? previewAccent : undefined}
							personaId={candidate}
							showGlow={false}
							size={28}
							state="idle"
							title={`${candidate} chassis`}
						/>
						{candidate}
					</button>
				))}
			</div>

			<div className="mt-5 grid grid-cols-[minmax(8rem,1.5fr)_repeat(4,minmax(4.5rem,1fr))] items-end gap-2 max-[900px]:grid-cols-3">
				{ACTIVITY_STATES.map((state) => (
					<figure
						className={cn(
							"grid min-h-24 place-items-center rounded-xl border border-border bg-background/55 px-2 py-3",
							state === "working" && "min-h-36 max-[900px]:col-span-2",
						)}
						data-testid="persona-state-preview"
						key={state}
					>
						<PersonaAvatar
							accentColor={previewAccent}
							personaId={chassis}
							showStatusRing
							size={state === "working" ? 112 : 58}
							state={state}
							title={`${chassis} ${state} preview`}
						/>
						<figcaption className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
							{state}
						</figcaption>
					</figure>
				))}
			</div>
		</section>
	);
}
