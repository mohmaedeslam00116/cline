import { Loader2, Plus, RotateCcw, Search } from "lucide-react";
import { PersonaAvatar } from "@/components/personas/svg/persona-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { LensTranslations } from "@/lib/lens-i18n";
import { cn } from "@/lib/utils";
import type { PersonaLibraryEntry } from "./persona-studio-model";

interface PersonaLibraryPanelProps {
	readonly entries: readonly PersonaLibraryEntry[];
	readonly loadError: string | null;
	readonly loadState: "loading" | "ready" | "error";
	readonly onNew: () => void;
	readonly onRetry: () => void;
	readonly onSelect: (key: PersonaLibraryEntry["key"]) => void;
	readonly query: string;
	readonly selectedKey: string;
	readonly setQuery: (query: string) => void;
	readonly translations: LensTranslations["personaStudio"];
}

function scopeLabel(
	entry: PersonaLibraryEntry,
	t: LensTranslations["personaStudio"],
) {
	if (entry.kind === "builtin") return t.builtinBadge;
	return entry.scope === "workspace" ? t.workspaceBadge : t.globalBadge;
}

export function PersonaLibraryPanel({
	entries,
	loadError,
	loadState,
	onNew,
	onRetry,
	onSelect,
	query,
	selectedKey,
	setQuery,
	translations: t,
}: PersonaLibraryPanelProps) {
	return (
		<aside
			aria-label={t.libraryLabel}
			className="flex min-h-0 flex-col border-r border-border bg-sidebar/35"
		>
			<div className="space-y-3 border-b border-border p-4">
				<Button className="w-full justify-center" onClick={onNew} type="button">
					<Plus className="size-4" />
					{t.newPersona}
				</Button>
				<label className="relative block">
					<span className="sr-only">{t.searchLabel}</span>
					<Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						aria-label={t.searchLabel}
						className="pl-9"
						onChange={(event) => setQuery(event.target.value)}
						placeholder={t.searchPlaceholder}
						value={query}
					/>
				</label>
			</div>

			{loadState === "error" ? (
				<div className="border-b border-border px-4 py-3 text-sm" role="alert">
					<p className="text-destructive">{t.loadError}</p>
					{loadError ? (
						<p className="mt-1 text-xs text-muted-foreground">{loadError}</p>
					) : null}
					<Button
						className="mt-2 h-8 px-2"
						onClick={onRetry}
						type="button"
						variant="outline"
					>
						<RotateCcw className="size-3.5" />
						{t.retry}
					</Button>
				</div>
			) : null}

			<ScrollArea className="min-h-0 flex-1">
				<div className="space-y-1 p-2">
					{loadState === "loading" ? (
						<div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
							<Loader2 className="size-3.5 animate-spin" />
							{t.loading}
						</div>
					) : null}
					{entries.map((entry) => (
						<button
							aria-current={entry.key === selectedKey ? "true" : undefined}
							className={cn(
								"group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left outline-none transition-colors hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-ring",
								entry.key === selectedKey &&
									"bg-surface-hover text-foreground",
							)}
							key={entry.key}
							onClick={() => onSelect(entry.key)}
							type="button"
						>
							<span
								className="grid size-11 shrink-0 place-items-center rounded-xl border bg-background/80"
								style={{ borderColor: entry.accentColor }}
							>
								<PersonaAvatar
									personaId={entry.chassis}
									showGlow={false}
									size={36}
									state="idle"
									title={`${entry.name} avatar`}
								/>
							</span>
							<span className="min-w-0 flex-1">
								<span className="block truncate text-sm font-medium">
									{entry.name}
								</span>
								<span className="block truncate text-xs text-muted-foreground">
									{entry.role}
								</span>
							</span>
							<Badge className="shrink-0 text-[10px]" variant="outline">
								{scopeLabel(entry, t)}
							</Badge>
						</button>
					))}
					{entries.length === 0 ? (
						<p className="px-3 py-8 text-center text-sm text-muted-foreground">
							{t.emptyLibrary}
						</p>
					) : null}
				</div>
			</ScrollArea>
		</aside>
	);
}
