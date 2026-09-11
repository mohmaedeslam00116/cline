/**
 * Antigravity 2 Implementation Plan & Walkthrough Markdown Parser
 */

import type {
	ImplementationPlanArtifact,
	ProposedChangeItem,
	ProposedFileAction,
	VerificationPlan,
	WalkthroughArtifact,
} from "./types";

/**
 * Clean markdown link or brackets around a file path, e.g.
 * `[file.ts](file:///path/to/file.ts)` -> `file.ts` or `path/to/file.ts`
 */
export function cleanFilePath(raw: string): string {
	const linkMatch = /\[([^\]]+)\]\(([^)]+)\)/.exec(raw);
	if (linkMatch) {
		const target = linkMatch[2];
		return target.replace(/^file:\/\/\/?/, "");
	}
	const bracketMatch = /\[([^\]]+)\]/.exec(raw);
	if (bracketMatch) {
		return bracketMatch[1];
	}
	return raw.trim();
}

/**
 * Parse an Antigravity 2 implementation plan from markdown.
 */
export function parseImplementationPlan(
	markdown: string,
): ImplementationPlanArtifact | null {
	if (!markdown || typeof markdown !== "string") {
		return null;
	}

	const trimmed = markdown.trim();

	// Check if this markdown contains standard implementation plan markers
	const hasPlanHeading =
		/^#\s+(.+)$/m.test(trimmed) &&
		(/plan/i.test(trimmed) || /implementation/i.test(trimmed));
	const hasReviewSection = /##\s+User Review Required/i.test(trimmed);
	const hasChangesSection = /##\s+Proposed Changes/i.test(trimmed);

	if (!hasPlanHeading && !hasReviewSection && !hasChangesSection) {
		return null;
	}

	// Extract Goal
	const goalMatch = /^#\s+(.+)$/m.exec(trimmed);
	const goal = goalMatch ? goalMatch[1].trim() : "Implementation Plan";

	// Extract Sections by split on `## `
	const sections = trimmed.split(/\n(?=##\s+)/);

	const userReviewRequired: string[] = [];
	const openQuestions: string[] = [];
	const proposedChanges: ProposedChangeItem[] = [];
	const verificationPlan: VerificationPlan = { automated: [], manual: [] };

	for (const section of sections) {
		const headerMatch = /^##\s+(.+)$/m.exec(section);
		if (!headerMatch) continue;

		const title = headerMatch[1].trim().toLowerCase();
		const body = section.replace(/^##\s+.+$/m, "").trim();

		if (title.includes("user review")) {
			// Extract lines, blockquotes, or bullet points
			const lines = body.split("\n");
			for (const line of lines) {
				const cleaned = line.replace(/^[>\s*-]+/, "").trim();
				if (cleaned) {
					userReviewRequired.push(cleaned);
				}
			}
		} else if (title.includes("open question")) {
			const lines = body.split("\n");
			for (const line of lines) {
				const cleaned = line.replace(/^[\s*-]+/, "").trim();
				if (cleaned) {
					openQuestions.push(cleaned);
				}
			}
		} else if (title.includes("proposed change")) {
			let currentComponent: string | undefined;
			const lines = body.split("\n");

			for (const line of lines) {
				const compMatch = /^###\s+(.+)$/.exec(line);
				if (compMatch) {
					currentComponent = compMatch[1].trim();
					continue;
				}

				// Look for #### [MODIFY] [file](path) or #### [NEW] or #### [DELETE]
				const actionMatch = /^####\s*\[(MODIFY|NEW|DELETE)\]\s*(.+)$/i.exec(
					line,
				);
				if (actionMatch) {
					const rawAction = actionMatch[1].toLowerCase();
					const action: ProposedFileAction =
						rawAction === "new"
							? "new"
							: rawAction === "delete"
								? "delete"
								: "modify";
					const file = cleanFilePath(actionMatch[2]);

					proposedChanges.push({
						action,
						file,
						component: currentComponent,
					});
				}
			}
		} else if (
			title.includes("verification plan") ||
			title.includes("verification")
		) {
			const subSections = body.split(/\n(?=###\s+)/);
			for (const sub of subSections) {
				const subHeaderMatch = /^###\s+(.+)$/m.exec(sub);
				const subBody = sub.replace(/^###\s+.+$/m, "").trim();
				const subLines = subBody
					.split("\n")
					.map((l) => l.replace(/^[\s*-]+/, "").trim())
					.filter(Boolean);

				if (subHeaderMatch) {
					const subTitle = subHeaderMatch[1].toLowerCase();
					if (subTitle.includes("automated") || subTitle.includes("test")) {
						verificationPlan.automated.push(...subLines);
					} else if (subTitle.includes("manual")) {
						verificationPlan.manual.push(...subLines);
					} else {
						verificationPlan.automated.push(...subLines);
					}
				} else {
					verificationPlan.automated.push(...subLines);
				}
			}
		}
	}

	return {
		goal,
		userReviewRequired,
		openQuestions,
		proposedChanges,
		verificationPlan,
		rawMarkdown: trimmed,
		status: "pending_approval",
	};
}

/**
 * Parse an Antigravity 2 walkthrough artifact from markdown.
 */
export function parseWalkthrough(markdown: string): WalkthroughArtifact | null {
	if (!markdown || typeof markdown !== "string") {
		return null;
	}

	const trimmed = markdown.trim();
	const hasWalkthroughHeading =
		/^#\s+Walkthrough/im.test(trimmed) ||
		(/walkthrough/i.test(trimmed) && /verification/i.test(trimmed));

	if (!hasWalkthroughHeading) {
		return null;
	}

	const titleMatch = /^#\s+(.+)$/m.exec(trimmed);
	const title = titleMatch ? titleMatch[1].trim() : "Walkthrough";

	const changesMade: string[] = [];
	const verificationResults: string[] = [];

	const sections = trimmed.split(/\n(?=##\s+)/);
	for (const section of sections) {
		const headerMatch = /^##\s+(.+)$/m.exec(section);
		if (!headerMatch) continue;

		const secTitle = headerMatch[1].trim().toLowerCase();
		const body = section.replace(/^##\s+.+$/m, "").trim();
		const lines = body
			.split("\n")
			.map((l) => l.replace(/^[|>\s*-]+/, "").trim())
			.filter(Boolean);

		if (
			secTitle.includes("change") ||
			secTitle.includes("accomplished") ||
			secTitle.includes("summary")
		) {
			changesMade.push(...lines);
		} else if (
			secTitle.includes("verif") ||
			secTitle.includes("test") ||
			secTitle.includes("result")
		) {
			verificationResults.push(...lines);
		}
	}

	return {
		title,
		changesMade,
		verificationResults,
		rawMarkdown: trimmed,
	};
}
