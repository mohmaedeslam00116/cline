"use client";

import type { SquadConfig } from "@cline/shared/browser";
import { ChevronDown, Users } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { useSquadConfig } from "@/hooks/use-squad-config";
import { cn } from "@/lib/utils";
import { SquadConfigurator } from "./squad-configurator";

export type SquadConfigPopoverProps = {
	onConfigChange?: (config: SquadConfig) => void;
	className?: string;
	workspaceRoot?: string;
};

export function SquadConfigPopover({
	onConfigChange,
	className,
	workspaceRoot,
}: SquadConfigPopoverProps) {
	const [config] = useSquadConfig();
	const [isOpen, setIsOpen] = useState(false);

	return (
		<Popover onOpenChange={setIsOpen} open={isOpen}>
			<PopoverTrigger asChild>
				<Button
					aria-label="Configure squad"
					className={cn(
						"h-7 gap-1.5 border-primary/35 px-2 text-xs font-medium text-primary hover:border-primary/60 hover:bg-primary/8",
						className,
					)}
					size="sm"
					title="Configure squad"
					type="button"
					variant="outline"
				>
					<Users className="size-3.5" />
					<span>Squad ({config.activePersonaIds.length})</span>
					<ChevronDown className="size-3 opacity-60" />
				</Button>
			</PopoverTrigger>
			<PopoverContent
				align="start"
				className="w-[24rem] max-w-[calc(100vw-2rem)] rounded-xl border-border bg-popover p-4 shadow-xl"
				sideOffset={8}
			>
				<header className="mb-4 border-b border-border/70 pb-3">
					<div className="flex items-center justify-between gap-3">
						<h2 className="text-sm font-semibold text-foreground">
							Ultra squad
						</h2>
						<span className="font-mono text-[10px] uppercase tracking-[0.08em] text-primary">
							{config.presetId}
						</span>
					</div>
					<p className="mt-1 text-xs text-muted-foreground">
						Deploy built-in and custom specialists under Orion.
					</p>
				</header>
				<SquadConfigurator
					compact
					onConfigChange={onConfigChange}
					workspaceRoot={workspaceRoot}
				/>
			</PopoverContent>
		</Popover>
	);
}
