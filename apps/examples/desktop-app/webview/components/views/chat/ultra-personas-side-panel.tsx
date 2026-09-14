"use client";

import { Radio, Sparkles, Users, Workflow } from "lucide-react";
import type { ReactNode } from "react";
import { PersonaAvatar, PersonaGallery } from "@/components/personas";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { usePersonaCatalog } from "@/hooks/use-persona-catalog";
import { useSquadConfig } from "@/hooks/use-squad-config";
import { getLensTranslations } from "@/lib/lens-i18n";
import { cn } from "@/lib/utils";
import { SquadConfigurator } from "./squad-configurator";

export function UltraPersonasSidePanel({
	open,
	onOpenChange,
	trigger,
	workspaceRoot,
}: {
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	trigger?: ReactNode;
	workspaceRoot?: string;
}) {
	const [config] = useSquadConfig();

	return (
		<Sheet onOpenChange={onOpenChange} open={open}>
			{trigger ? <SheetTrigger asChild>{trigger}</SheetTrigger> : null}
			<SheetContent
				className="flex w-full flex-col border-l border-border bg-background p-0 shadow-2xl sm:max-w-md"
				dir="ltr"
				side="right"
			>
				<SheetHeader className="shrink-0 border-b border-border/70 bg-muted/20 p-5 text-left">
					<div className="flex items-center gap-3">
						<div className="flex size-9 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
							<Workflow className="size-4.5" />
						</div>
						<div className="min-w-0">
							<SheetTitle className="flex items-center gap-2 text-base font-semibold">
								Ultra squad
								<Badge
									className="font-mono text-[10px] uppercase"
									variant="outline"
								>
									{config.activePersonaIds.length} active
								</Badge>
							</SheetTitle>
							<SheetDescription className="mt-0.5 text-xs">
								Assemble specialists and checkpoint policy for the next mission.
							</SheetDescription>
						</div>
					</div>
				</SheetHeader>
				<ScrollArea className="min-h-0 flex-1">
					<div className="p-5">
						<SquadConfigurator workspaceRoot={workspaceRoot} />
					</div>
				</ScrollArea>
			</SheetContent>
		</Sheet>
	);
}

export function UltraSquadShowcase({
	onOpenPanel,
	onOpenWarRoom,
	workspaceRoot,
}: {
	onOpenPanel?: () => void;
	onOpenWarRoom?: () => void;
	workspaceRoot?: string;
}) {
	const [config] = useSquadConfig();
	const catalog = usePersonaCatalog(workspaceRoot);
	const t = getLensTranslations().ultraAgency;
	const activePersonas = config.activePersonaIds
		.map((personaId) => catalog.byId.get(personaId))
		.filter((persona) => persona !== undefined);

	return (
		<div
			className="mb-4 w-full rounded-2xl border border-[#1E1E1E] bg-[#111111] p-4 shadow-lg sm:p-5"
			dir="ltr"
		>
			<div className="flex flex-col justify-between gap-3 border-b border-[#1E1E1E] pb-3 sm:flex-row sm:items-center">
				<div className="flex items-center gap-2.5">
					<div className="flex size-9 items-center justify-center rounded-xl border border-[#1E1E1E] bg-[#161616] text-slate-300 shadow-xs">
						<Workflow className="size-5" />
					</div>
					<div>
						<div className="flex items-center gap-2">
							<h3 className="text-sm font-semibold text-foreground">
								{t.badge}
							</h3>
							<Badge
								className="border-[#1E1E1E] bg-[#161616] text-xs text-slate-300"
								variant="outline"
							>
								{config.activePersonaIds.length} agents active
							</Badge>
						</div>
						<p className="mt-0.5 text-xs text-muted-foreground">{t.subtitle}</p>
					</div>
				</div>

				<div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
					{onOpenWarRoom ? (
						<Button
							className="h-8 gap-1.5 border-[#1E1E1E] bg-[#161616] text-xs text-slate-200 hover:border-slate-600 hover:bg-[#1E1E1E]"
							onClick={onOpenWarRoom}
							size="sm"
							type="button"
							variant="outline"
						>
							<Radio className="size-3.5 text-slate-300" />
							{t.warRoomButton}
						</Button>
					) : null}
					<Dialog>
						<DialogTrigger asChild>
							<Button
								className="h-8 gap-1.5 border-[#1E1E1E] bg-[#161616] text-xs text-slate-200 hover:border-slate-600 hover:bg-[#1E1E1E]"
								size="sm"
								type="button"
								variant="outline"
							>
								<Sparkles className="size-3.5 text-slate-300" />
								{t.cyberGallery}
							</Button>
						</DialogTrigger>
						<DialogContent className="h-[85vh] max-w-5xl border-0 bg-transparent p-0 shadow-none sm:max-w-5xl">
							<DialogTitle className="sr-only">
								{t.cyberGalleryTitle}
							</DialogTitle>
							<PersonaGallery className="h-full" />
						</DialogContent>
					</Dialog>
					<Button
						className="h-8 gap-1.5 border-[#1E1E1E] bg-[#161616] text-xs text-slate-200 hover:border-slate-600 hover:bg-[#1E1E1E]"
						onClick={onOpenPanel}
						size="sm"
						type="button"
						variant="outline"
					>
						<Users className="size-3.5" />
						Configure squad
					</Button>
				</div>
			</div>

			<div className="grid grid-cols-2 gap-2 pt-3 sm:grid-cols-4 xl:grid-cols-8">
				{activePersonas.map((persona) => (
					<button
						className={cn(
							"flex min-w-0 flex-col items-center rounded-xl border border-border/70 bg-card/60 p-2 text-center outline-none transition-colors hover:border-primary/45 hover:bg-card focus-visible:ring-2 focus-visible:ring-primary/70",
						)}
						key={persona.id}
						onClick={onOpenPanel}
						type="button"
					>
						<PersonaAvatar
							accentColor={persona.avatar.accentColor}
							chassis={persona.avatar.chassis}
							personaId={persona.id}
							showGlow
							showStatusRing
							size={44}
							state="idle"
							title={`${persona.name} — ${persona.role}`}
						/>
						<span className="mt-1 max-w-full truncate text-xs font-semibold text-foreground">
							{persona.name}
						</span>
						<span className="max-w-full truncate text-[10px] text-muted-foreground">
							{persona.role}
						</span>
					</button>
				))}
			</div>
		</div>
	);
}
