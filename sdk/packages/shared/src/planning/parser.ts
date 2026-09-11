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
	// Check for explicit implementation plan heading (e.g. "# Implementation Plan", "# Plan: ...", "# [Goal] Implementation Plan")
	const planHeadingRegex =
		/^#\s+(?:Implementation\s+Plan\b|Plan:\s*.+|\[?.+\]?\s+Implementation\s+Plan\b|.+Implementation\s+Plan\b).*$/im;
	const headingMatch = planHeadingRegex.exec(markdown);
	if (!headingMatch) {
		return null;
	}

	const hasChangesSection = /^##\s+Proposed Changes/im.test(markdown);
	const hasReviewSection = /^##\s+User Review Required/im.test(markdown);

	// Require an explicit plan heading and both required structured sections
	if (!hasReviewSection || !hasChangesSection) {
		return null;
	}

	const startIndex = headingMatch.index;
	const textFromHeading = markdown.slice(startIndex);

	// Extract Goal
	const goalMatch = /^#\s+(.+)$/m.exec(textFromHeading);
	const goal = goalMatch ? goalMatch[1].trim() : "Implementation Plan";

	// Extract Sections by split on `## `
	const rawSections = textFromHeading.split(/\n(?=##\s+)/);

	const userReviewRequired: string[] = [];
	const openQuestions: string[] = [];
	const proposedChanges: ProposedChangeItem[] = [];
	const verificationPlan: VerificationPlan = { automated: [], manual: [] };

	let matchedLength = 0;
	if (rawSections.length > 0) {
		matchedLength += rawSections[0].length;
	}

	for (let i = 1; i < rawSections.length; i++) {
		const section = rawSections[i];
		const headerMatch = /^##\s+(.+)$/m.exec(section);
		if (!headerMatch) break;

		const title = headerMatch[1].trim().toLowerCase();
		const isKnownSection =
			title.includes("user review") ||
			title.includes("open question") ||
			title.includes("proposed change") ||
			title.includes("verification");

		if (!isKnownSection) {
			break;
		}

		matchedLength += 1 + section.length;
		const body = section.replace(/^##\s+.+$/m, "").trim();

		if (title.includes("user review")) {
			// Extract lines, blockquotes, or bullet points
			const lines = body.split("\n");
			for (const line of lines) {
				const cleaned = line.replace(/^[>\s*-]+/, "").trim();
				if (
					cleaned &&
					!/^\[!(?:IMPORTANT|NOTE|WARNING|CAUTION|TIP)\]/i.test(cleaned)
				) {
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

	let rawMarkdown = textFromHeading.slice(0, matchedLength).trim();
	const rawLines = rawMarkdown.split("\n");
	while (rawLines.length > 0) {
		const lastLine = rawLines[rawLines.length - 1].trim();
		if (!lastLine) {
			rawLines.pop();
			continue;
		}
		if (/^(?:#{1,6}\s|[-*+]\s|\d+\.\s|>\s*|\[|```|`|\||\t)/.test(lastLine)) {
			break;
		}
		rawLines.pop();
	}
	rawMarkdown = rawLines.join("\n").trim();
	const hasRequestFeedback = /RequestFeedback:\s*true/i.test(rawMarkdown);
	const hasUserFacing = /UserFacing:\s*true/i.test(rawMarkdown);

	return {
		goal,
		userReviewRequired,
		openQuestions,
		proposedChanges,
		verificationPlan,
		rawMarkdown,
		status: "pending_approval",
		metadata: {
			RequestFeedback: hasRequestFeedback || true,
			UserFacing: hasUserFacing || true,
		},
	};
}

/**
 * Parse an Antigravity 2 walkthrough artifact from markdown.
 */
export function parseWalkthrough(markdown: string): WalkthroughArtifact | null {
	if (!markdown || typeof markdown !== "string") {
		return null;
	}

	const walkthroughHeadingRegex = /^#\s+Walkthrough\b.*$/im;
	const headingMatch = walkthroughHeadingRegex.exec(markdown);
	if (!headingMatch) {
		return null;
	}

	const hasChangesSection =
		/^##\s+(?:Changes\s+Made|Completed\s+Changes|Summary)/im.test(markdown);
	const hasVerificationSection =
		/^##\s+(?:Verification|Test\s+Results|Validation)/im.test(markdown);

	if (!hasChangesSection && !hasVerificationSection) {
		return null;
	}

	const startIndex = headingMatch.index;
	const textFromHeading = markdown.slice(startIndex);

	const titleMatch = /^#\s+(.+)$/m.exec(textFromHeading);
	const title = titleMatch ? titleMatch[1].trim() : "Walkthrough";

	const changesMade: string[] = [];
	const verificationResults: string[] = [];

	const rawSections = textFromHeading.split(/\n(?=##\s+)/);
	let matchedLength = 0;
	if (rawSections.length > 0) {
		matchedLength += rawSections[0].length;
	}

	for (let i = 1; i < rawSections.length; i++) {
		const section = rawSections[i];
		const headerMatch = /^##\s+(.+)$/m.exec(section);
		if (!headerMatch) break;

		const secTitle = headerMatch[1].trim().toLowerCase();
		const isKnownSection =
			secTitle.includes("change") ||
			secTitle.includes("accomplished") ||
			secTitle.includes("summary") ||
			secTitle.includes("verif") ||
			secTitle.includes("test") ||
			secTitle.includes("result") ||
			secTitle.includes("validation");

		if (!isKnownSection) {
			break;
		}

		matchedLength += 1 + section.length;
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
			secTitle.includes("result") ||
			secTitle.includes("validation")
		) {
			verificationResults.push(...lines);
		}
	}

	const rawMarkdown = textFromHeading.slice(0, matchedLength).trim();

	return {
		title,
		changesMade,
		verificationResults,
		rawMarkdown,
	};
}
