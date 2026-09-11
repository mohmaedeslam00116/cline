/**
 * Parser for MetaGPT Multi-Agent Collaborative Framework deliverables (arXiv:2308.00352).
 * Extracts structured SOP assembly line deliverables:
 * 1. Product Manager (PRD)
 * 2. Architect (System Design & Diagrams)
 * 3. Project Manager (Tasks Breakdown & DAG)
 * 4. Engineer (Code generation)
 * 5. QA Engineer (Executable feedback & test verification)
 */

export type ProductManagerPRD = {
	goals: string[];
	userStories: string[];
	competitiveAnalysis: string[];
	requirementPool: Array<{ requirement: string; priority: string }>;
	uiDesignDraft?: string;
	rawMarkdown?: string;
};

export type ArchitectDesign = {
	implementationApproach?: string;
	packageName?: string;
	fileList: string[];
	classDiagram?: string;
	sequenceDiagram?: string;
	rawMarkdown?: string;
};

export type ProjectManagerTasks = {
	packages: string[];
	apiSpec?: string;
	logicAnalysis: Array<{ file: string; description: string }>;
	taskList: string[];
	sharedKnowledge?: string;
	rawMarkdown?: string;
};

export type EngineerCode = {
	filesImplemented: string[];
	summary?: string;
	rawMarkdown?: string;
};

export type QAFeedback = {
	testExecutionSummary?: string;
	retries: number;
	maxRetries: number;
	status: "in_progress" | "passed" | "self_correcting" | "failed";
	errors?: string[];
	rawMarkdown?: string;
};

export type UltraPipeline = {
	prd?: ProductManagerPRD;
	architect?: ArchitectDesign;
	tasks?: ProjectManagerTasks;
	engineer?: EngineerCode;
	qa?: QAFeedback;
	rawMarkdown: string;
};

/**
 * Extracts list items (bullet points, numbered items, or python/json arrays) from a section.
 */
function extractListItems(sectionContent: string): string[] {
	const items: string[] = [];
	const lines = sectionContent.split("\n");
	for (const line of lines) {
		const trimmed = line.trim();
		// Bullet or numbered markdown list
		const match = trimmed.match(/^(?:[-*+]|\d+\.)\s+(.+)$/);
		if (match?.[1]) {
			items.push(match[1].replace(/^["']|["'],?$/g, "").trim());
			continue;
		}
		// Python / JSON array element line: "item", or 'item',
		const quoteMatch = trimmed.match(/^["']([^"']+)["'],?$/);
		if (quoteMatch?.[1]) {
			items.push(quoteMatch[1].trim());
		}
	}
	return items;
}

/**
 * Extracts a section by looking for markdown headers.
 */
function extractSection(
	content: string,
	headerKeywords: string[],
): string | undefined {
	for (const keyword of headerKeywords) {
		const pattern = new RegExp(
			`(?:\n|^)#{1,4}\\s+(?:(?:\\d+\\.\\s*)?${keyword}[^\n]*)\n([\\s\\S]*?)(?=(?:\n#{1,4}\\s+)|\n---|\n___|\n\\*{3,}|$)`,
			"i",
		);
		const match = pattern.exec(content);
		if (match?.[1]?.trim()) {
			return match[1].trim();
		}
	}
	return undefined;
}

/**
 * Parses Product Manager PRD from content.
 */
export function parsePRD(content: string): ProductManagerPRD | undefined {
	const goalsSec = extractSection(content, ["Product Goals", "Goals"]);
	const storiesSec = extractSection(content, ["User Stories", "Stories"]);
	const compSec = extractSection(content, [
		"Competitive Analysis",
		"Competitors",
	]);
	const poolSec = extractSection(content, ["Requirement Pool", "Requirements"]);
	const uiSec = extractSection(content, [
		"UI Design draft",
		"UI Design",
		"User Interface",
	]);

	const hasAny = Boolean(goalsSec || storiesSec || compSec || poolSec);
	if (!hasAny) {
		return undefined;
	}

	const goals = goalsSec ? extractListItems(goalsSec) : [];
	const userStories = storiesSec ? extractListItems(storiesSec) : [];
	const competitiveAnalysis = compSec ? extractListItems(compSec) : [];

	const requirementPool: Array<{ requirement: string; priority: string }> = [];
	if (poolSec) {
		const poolLines = poolSec.split("\n");
		for (const line of poolLines) {
			const trimmed = line.trim();
			// Match tuple: ("requirement", "P0")
			const tupleMatch = trimmed.match(/\(["'](.+?)["'],\s*["'](P\d+)["']\)/i);
			if (tupleMatch?.[1] && tupleMatch[2]) {
				requirementPool.push({
					requirement: tupleMatch[1].trim(),
					priority: tupleMatch[2].toUpperCase().trim(),
				});
				continue;
			}
			// Match markdown: - [P0] Requirement or - Requirement (P0)
			const mdMatch = trimmed.match(
				/^[-*+]\s+(?:\[(P\d+)\]\s+)?(.+?)(?:\s*\((P\d+)\))?$/i,
			);
			if (mdMatch?.[2]) {
				const priority = (mdMatch[1] || mdMatch[3] || "P0").toUpperCase();
				requirementPool.push({
					requirement: mdMatch[2].trim(),
					priority,
				});
			}
		}
	}

	return {
		goals,
		userStories,
		competitiveAnalysis,
		requirementPool,
		uiDesignDraft: uiSec,
		rawMarkdown: [goalsSec, storiesSec, compSec, poolSec]
			.filter(Boolean)
			.join("\n\n"),
	};
}

/**
 * Extracts Mermaid diagrams from content.
 */
function extractMermaidDiagram(
	content: string,
	type: "classDiagram" | "sequenceDiagram",
): string | undefined {
	const pattern = new RegExp(
		`\`\`\`mermaid[\\s\\n]+(${type}[\\s\\S]*?)\`\`\``,
		"i",
	);
	const match = pattern.exec(content);
	return match?.[1]?.trim();
}

/**
 * Parses Architect System Design from content.
 */
export function parseArchitectDesign(
	content: string,
): ArchitectDesign | undefined {
	const approachSec = extractSection(content, [
		"Implementation approach",
		"Architecture",
		"Technical Approach",
	]);
	const pkgSec = extractSection(content, [
		"Python package name",
		"Package name",
		"Module name",
		"Project name",
	]);
	const filesSec = extractSection(content, ["File list", "Files"]);
	const classDiagram = extractMermaidDiagram(content, "classDiagram");
	const sequenceDiagram = extractMermaidDiagram(content, "sequenceDiagram");

	const hasAny = Boolean(
		approachSec || pkgSec || filesSec || classDiagram || sequenceDiagram,
	);
	if (!hasAny) {
		return undefined;
	}

	const packageName = pkgSec
		? pkgSec
				.replace(/```[a-z]*|```/g, "")
				.replace(/^["']|["']$/g, "")
				.trim()
		: undefined;
	const fileList = filesSec ? extractListItems(filesSec) : [];

	return {
		implementationApproach: approachSec,
		packageName,
		fileList,
		classDiagram,
		sequenceDiagram,
		rawMarkdown: [approachSec, filesSec].filter(Boolean).join("\n\n"),
	};
}

/**
 * Parses Project Manager Tasks breakdown from content.
 */
export function parseProjectManagerTasks(
	content: string,
): ProjectManagerTasks | undefined {
	const pkgSec = extractSection(content, [
		"Required Python third-party packages",
		"Required third-party packages",
		"Dependencies",
	]);
	const apiSec = extractSection(content, ["Full API spec", "API spec"]);
	const logicSec = extractSection(content, [
		"Logic Analysis",
		"Component Logic",
	]);
	const taskListSec = extractSection(content, ["Task list", "Tasks"]);
	const sharedSec = extractSection(content, ["Shared Knowledge", "Context"]);

	const hasAny = Boolean(pkgSec || apiSec || logicSec || taskListSec);
	if (!hasAny) {
		return undefined;
	}

	const packages = pkgSec ? extractListItems(pkgSec) : [];
	const taskList = taskListSec ? extractListItems(taskListSec) : [];

	const logicAnalysis: Array<{ file: string; description: string }> = [];
	if (logicSec) {
		const lines = logicSec.split("\n");
		for (const line of lines) {
			const trimmed = line.trim();
			// Tuple format: ("main.py", "Entry point")
			const tupleMatch = trimmed.match(/\(["'](.+?)["'],\s*["'](.+?)["']\)/);
			if (tupleMatch?.[1] && tupleMatch[2]) {
				logicAnalysis.push({
					file: tupleMatch[1].trim(),
					description: tupleMatch[2].trim(),
				});
				continue;
			}
			// Markdown bullet format: - `main.py`: Entry point
			const bulletMatch = trimmed.match(/^[-*+]\s+`?([^`:]+)`?:\s*(.+)$/);
			if (bulletMatch?.[1] && bulletMatch[2]) {
				logicAnalysis.push({
					file: bulletMatch[1].trim(),
					description: bulletMatch[2].trim(),
				});
			}
		}
	}

	return {
		packages,
		apiSpec: apiSec,
		logicAnalysis,
		taskList,
		sharedKnowledge: sharedSec,
		rawMarkdown: [pkgSec, logicSec, taskListSec].filter(Boolean).join("\n\n"),
	};
}

/**
 * Parses QA Engineer verification & executable feedback from content.
 */
export function parseQAFeedback(content: string): QAFeedback | undefined {
	const qaSec = extractSection(content, [
		"QA Engineer",
		"Generated Unit tests",
		"Executable Feedback",
		"Test execution",
		"Verification Results",
	]);

	const hasQA =
		Boolean(qaSec) ||
		/executable feedback/i.test(content) ||
		/self-correction/i.test(content) ||
		/unit tests/i.test(content);

	if (!hasQA) {
		return undefined;
	}

	// Detect retry counter
	let retries = 0;
	const retryMatch =
		content.match(/retry\s*(\d+)(?:\s*\/\s*3)?/i) ||
		content.match(/self-correction\s*cycle\s*(\d+)/i);
	if (retryMatch?.[1]) {
		retries = Number.parseInt(retryMatch[1], 10) || 0;
	}

	// Detect status
	let status: QAFeedback["status"] = "in_progress";
	if (
		/all tests pass/i.test(content) ||
		/tests? (?:passed|succeeded)/i.test(content) ||
		/verification complete/i.test(content)
	) {
		status = "passed";
	} else if (
		/self-correct/i.test(content) ||
		/debug(?:ging)?/i.test(content) ||
		retries > 0
	) {
		status = "self_correcting";
	} else if (/test(?:s)? failed/i.test(content)) {
		status = "failed";
	}

	// Extract error snippets if any
	const errors: string[] = [];
	const errorMatches = content.match(
		/(?:Traceback|Error|FAIL)[^\n]+(?:\n\s+[^\n]+)*/g,
	);
	if (errorMatches) {
		for (const err of errorMatches.slice(0, 3)) {
			errors.push(err.trim());
		}
	}

	// Trim trailing conversational remarks if assistant writes concluding prose after QA deliverables
	let cleanedQaSec = qaSec;
	if (cleanedQaSec) {
		const tailMatch = cleanedQaSec.match(
			/\n\n+\s*(?:let me know|please|feel free|hope this helps|i have|you can|in summary|all changes|if you)[\s\S]*$/i,
		);
		if (tailMatch?.index !== undefined) {
			cleanedQaSec = cleanedQaSec.slice(0, tailMatch.index).trim();
		}
	}

	return {
		testExecutionSummary: cleanedQaSec,
		retries,
		maxRetries: 3,
		status,
		errors: errors.length > 0 ? errors : undefined,
		rawMarkdown: cleanedQaSec,
	};
}

/**
 * Parses Engineer implementation summary from content.
 */
export function parseEngineerCode(content: string): EngineerCode | undefined {
	const codeSec = extractSection(content, [
		"Engineer",
		"Code Implementation",
		"Implementation",
		"Source Code",
	]);
	if (!codeSec) {
		return undefined;
	}
	const filesSec =
		extractSection(codeSec, [
			"Files Implemented",
			"Implemented Files",
			"Modified Files",
			"Files",
		]) ?? codeSec;
	return {
		filesImplemented: extractListItems(filesSec),
		summary: codeSec,
		rawMarkdown: codeSec,
	};
}

/**
 * Parses a full UltraPipeline from markdown text.
 * Returns null if the text does not contain sufficient hallmarks of a MetaGPT SOP pipeline.
 */
export function parseUltraPipeline(content: string): UltraPipeline | null {
	if (!content || typeof content !== "string") {
		return null;
	}

	// Check for MetaGPT hallmarks
	const hasMetaGPTHallmark =
		/metagpt/i.test(content) ||
		/ultra mode/i.test(content) ||
		/product manager/i.test(content) ||
		/product requirement document/i.test(content) ||
		/requirement pool/i.test(content) ||
		/executable feedback/i.test(content);

	if (!hasMetaGPTHallmark) {
		return null;
	}

	const prd = parsePRD(content);
	const architect = parseArchitectDesign(content);
	const tasks = parseProjectManagerTasks(content);
	const engineer = parseEngineerCode(content);
	const qa = parseQAFeedback(content);

	// Need at least 2 distinct SOP sections to qualify as a structured Ultra Pipeline
	const stageCount = [
		Boolean(prd),
		Boolean(architect),
		Boolean(tasks),
		Boolean(engineer),
		Boolean(qa),
	].filter(Boolean).length;

	if (stageCount < 2) {
		return null;
	}

	// Compute rawMarkdown starting from the first matched MetaGPT section header
	// and ending at the last matched stage's content, so conversational framing
	// before and after the pipeline deliverables is preserved.
	const METAGPT_SECTION_KEYWORDS = [
		"Product Manager",
		"PRD",
		"Product Requirements Document",
		"Architect",
		"System Design",
		"Project Manager",
		"Tasks Breakdown",
		"Tasks DAG",
		"Engineer",
		"Code Implementation",
		"QA Engineer",
		"QA & Verification",
		"QA and Test",
		"QA Feedback",
		"Executable Feedback",
	];

	let firstHeaderIndex = -1;
	for (const keyword of METAGPT_SECTION_KEYWORDS) {
		const regex = new RegExp(
			`(?:\n|^)#{1,4}\\s+(?:(?:\\d+\\.\\s*)?${keyword}[^\n]*)`,
			"i",
		);
		const match = regex.exec(content);
		if (match) {
			const matchStart = match.index + (match[0].startsWith("\n") ? 1 : 0);
			if (firstHeaderIndex === -1 || matchStart < firstHeaderIndex) {
				firstHeaderIndex = matchStart;
			}
		}
	}

	const stagesRaw = [
		prd?.rawMarkdown,
		architect?.rawMarkdown,
		tasks?.rawMarkdown,
		engineer?.rawMarkdown,
		qa?.rawMarkdown,
	].filter((s): s is string => typeof s === "string" && s.length > 0);

	let lastEndIndex = content.length;
	if (firstHeaderIndex !== -1 && stagesRaw.length > 0) {
		let maxEnd = firstHeaderIndex;
		for (const raw of stagesRaw) {
			const idx = content.lastIndexOf(raw);
			if (idx !== -1) {
				const end = idx + raw.length;
				if (end > maxEnd) {
					maxEnd = end;
				}
			}
		}
		lastEndIndex = maxEnd;
	}

	const rawMarkdown =
		firstHeaderIndex !== -1 && firstHeaderIndex < lastEndIndex
			? content.slice(firstHeaderIndex, lastEndIndex).trim()
			: content;

	return {
		prd,
		architect,
		tasks,
		engineer,
		qa,
		rawMarkdown,
	};
}
