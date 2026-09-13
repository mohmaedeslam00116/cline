import { codeToHtml } from "shiki";
import { useEffect, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import type { LensTranslations } from "@/lib/lens-i18n";
import { lintPersonaPrompt } from "./persona-studio-model";

interface MarkdownPromptEditorProps {
	readonly onChange: (value: string) => void;
	readonly translations: LensTranslations["personaStudio"];
	readonly value: string;
}

export function MarkdownPromptEditor({
	onChange,
	translations: t,
	value,
}: MarkdownPromptEditorProps) {
	const [highlightedHtml, setHighlightedHtml] = useState("");
	const lintItems = lintPersonaPrompt(value);

	useEffect(() => {
		let active = true;
		void codeToHtml(value || " ", {
			lang: "markdown",
			theme: "github-dark-default",
		}).then((html) => {
			if (active) setHighlightedHtml(html);
		});
		return () => {
			active = false;
		};
	}, [value]);

	return (
		<section aria-labelledby="system-prompt-title">
			<h3 className="text-base font-semibold" id="system-prompt-title">
				{t.systemPromptTitle}
			</h3>
			<p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
				{t.systemPromptDescription}
			</p>
			<div className="mt-4 grid min-h-80 grid-cols-2 overflow-hidden rounded-xl border border-border max-[960px]:grid-cols-1">
				<div className="min-h-72 border-r border-border max-[960px]:border-b max-[960px]:border-r-0">
					<div className="border-b border-border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
						{t.markdownSource}
					</div>
					<Textarea
						aria-label={t.systemPromptTitle}
						aria-invalid={lintItems.length > 0 ? true : undefined}
						className="min-h-72 resize-y rounded-none border-0 bg-transparent font-mono text-xs leading-6 shadow-none focus-visible:ring-0"
						data-studio-field="instructions"
						onChange={(event) => onChange(event.target.value)}
						spellCheck
						value={value}
					/>
				</div>
				<div className="min-h-72 bg-[#0d1117] text-slate-100">
					<div className="border-b border-white/10 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-slate-400">
						{t.highlightedPreview}
					</div>
					<div
						aria-hidden="true"
						className="h-72 overflow-auto p-3 text-xs leading-6 [&_.shiki]:!bg-transparent [&_code]:whitespace-pre-wrap"
						data-highlight-ready={highlightedHtml ? "true" : "false"}
						dangerouslySetInnerHTML={{ __html: highlightedHtml }}
					/>
				</div>
			</div>
			<div aria-live="polite" className="mt-2 min-h-5">
				{lintItems.map((item) => (
					<p className="text-xs text-destructive" key={item.message}>
						{item.message}
					</p>
				))}
			</div>
		</section>
	);
}
