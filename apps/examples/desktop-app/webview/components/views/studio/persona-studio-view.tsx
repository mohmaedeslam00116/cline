"use client";

import { Bot } from "lucide-react";
import { PageFrame, PageHeader } from "@/components/views/page-layout";
import { getLensTranslations } from "@/lib/lens-i18n";

export interface PersonaStudioViewProps {
	readonly workspaceRoot?: string;
}

export function PersonaStudioView({ workspaceRoot }: PersonaStudioViewProps) {
	const t = getLensTranslations().personaStudio;

	return (
		<PageFrame className="h-full" contentClassName="max-w-none">
			<PageHeader icon={Bot} title={t.title} description={t.description} />
			<p className="font-mono text-xs text-muted-foreground">
				{workspaceRoot || "Global personas only"}
			</p>
		</PageFrame>
	);
}
