import { ShieldAlert, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import type { LensTranslations } from "@/lib/lens-i18n";
import {
	PERSONA_CAPABILITIES,
	toolPolicyForTools,
} from "./persona-studio-model";

interface CapabilityMatrixProps {
	readonly onToolsChange: (tools: string[]) => void;
	readonly tools: readonly string[];
	readonly translations: LensTranslations["personaStudio"];
}

const GROUPS = ["read", "write", "execute", "network"] as const;

function toggleTool(
	tools: readonly string[],
	tool: string,
	enabled: boolean,
): string[] {
	if (enabled) return tools.includes(tool) ? [...tools] : [...tools, tool];
	return tools.filter((candidate) => candidate !== tool);
}

export function CapabilityMatrix({
	onToolsChange,
	tools,
	translations: t,
}: CapabilityMatrixProps) {
	const policy = toolPolicyForTools(tools);
	const knownIds: ReadonlySet<string> = new Set(
		PERSONA_CAPABILITIES.map((capability) => capability.id),
	);
	const unknownTools = tools.filter((tool) => !knownIds.has(tool));

	return (
		<section aria-labelledby="capabilities-title">
			<div className="flex flex-wrap items-start justify-between gap-4">
				<div>
					<h3 className="text-base font-semibold" id="capabilities-title">
						{t.capabilitiesTitle}
					</h3>
					<p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
						{t.capabilitiesDescription}
					</p>
				</div>
				<Badge
					className="gap-1.5"
					variant={policy === "require_approval" ? "destructive" : "outline"}
				>
					{policy === "require_approval" ? (
						<ShieldAlert className="size-3" />
					) : (
						<ShieldCheck className="size-3" />
					)}
					{policy === "require_approval"
						? t.approvalRequired
						: t.readOnlyAutomatic}
				</Badge>
			</div>

			<div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-5 max-[760px]:grid-cols-1">
				{GROUPS.map((group) => (
					<fieldset className="space-y-1" key={group}>
						<legend className="mb-2 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
							{t.capabilityGroups[group]}
						</legend>
						{PERSONA_CAPABILITIES.filter(
							(capability) => capability.group === group,
						).map((capability) => {
							const checked = tools.includes(capability.id);
							return (
								<div
									className="flex items-center justify-between gap-4 rounded-lg px-2 py-2 hover:bg-surface-hover"
									key={capability.id}
								>
									<span>
										<span className="block font-mono text-xs">
											{capability.id}
										</span>
										<span className="mt-0.5 block text-xs text-muted-foreground">
											{capability.risk === "approval"
												? t.approvalCapability
												: t.readOnlyCapability}
										</span>
									</span>
									<Switch
										aria-label={`Allow ${capability.id}`}
										checked={checked}
										onCheckedChange={(enabled) =>
											onToolsChange(toggleTool(tools, capability.id, enabled))
										}
									/>
								</div>
							);
						})}
					</fieldset>
				))}
			</div>

			{unknownTools.length > 0 ? (
				<fieldset className="mt-5 space-y-1 border-t border-border pt-4">
					<legend className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
						{t.additionalCapabilities}
					</legend>
					{unknownTools.map((tool) => (
						<div
							className="flex items-center justify-between gap-4 rounded-lg px-2 py-2 hover:bg-surface-hover"
							key={tool}
						>
							<span className="font-mono text-xs">{tool}</span>
							<Switch
								aria-label={`Allow ${tool}`}
								checked
								onCheckedChange={(enabled) =>
									onToolsChange(toggleTool(tools, tool, enabled))
								}
							/>
						</div>
					))}
				</fieldset>
			) : null}
		</section>
	);
}
