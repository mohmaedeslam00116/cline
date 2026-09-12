import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import {
	DEFAULT_TEAM_MEMORY_BUDGET_CHARS,
	formatTeamMemorySummary,
	type StagedTeamLearning,
	TEAM_MEMORY_FILES,
	TEAM_MEMORY_TEMPLATES,
	type TeamMemoryCategory,
} from "@cline/shared";

export interface TeamMemoryServiceOptions {
	workspaceRoot: string;
	tokenBudgetChars?: number;
}

/**
 * Structured Agent Team Memory Service.
 * Manages institutional repository memory under <workspace>/.lens/memory/
 * with transparent Markdown files (decisions.md, conventions.md, learnings.md),
 * stratified system prompt summaries, and human-in-the-loop checkpoint governance.
 */
export class TeamMemoryService {
	readonly workspaceRoot: string;
	readonly memoryDir: string;
	readonly tokenBudgetChars: number;
	private stagedLearnings: StagedTeamLearning[] = [];

	constructor(options: TeamMemoryServiceOptions) {
		if (!options.workspaceRoot || !options.workspaceRoot.trim()) {
			throw new Error("workspaceRoot must be a valid non-empty path");
		}
		this.workspaceRoot = resolve(options.workspaceRoot);
		this.memoryDir = join(this.workspaceRoot, ".lens", "memory");
		this.tokenBudgetChars =
			options.tokenBudgetChars ?? DEFAULT_TEAM_MEMORY_BUDGET_CHARS;
	}

	/**
	 * Resolves the absolute path to a category file.
	 */
	getCategoryFilePath(category: TeamMemoryCategory): string {
		const fileName = TEAM_MEMORY_FILES[category];
		if (!fileName) {
			throw new Error(`Unknown team memory category: ${category}`);
		}
		return join(this.memoryDir, fileName);
	}

	/**
	 * Initializes the .lens/memory/ directory and creates default templates
	 * for any missing memory files.
	 */
	async initialize(): Promise<void> {
		await mkdir(this.memoryDir, { recursive: true });

		const categories: TeamMemoryCategory[] = [
			"decisions",
			"conventions",
			"learnings",
		];

		for (const category of categories) {
			const filePath = this.getCategoryFilePath(category);
			try {
				await readFile(filePath, "utf-8");
			} catch (error: any) {
				if (error?.code === "ENOENT") {
					await writeFile(filePath, TEAM_MEMORY_TEMPLATES[category], "utf-8");
				} else {
					throw error;
				}
			}
		}
	}

	/**
	 * Reads the full content of a specific memory category.
	 * If the file does not exist, initializes it and returns the default template.
	 */
	async readCategory(category: TeamMemoryCategory): Promise<string> {
		const filePath = this.getCategoryFilePath(category);
		try {
			return await readFile(filePath, "utf-8");
		} catch (error: any) {
			if (error?.code === "ENOENT") {
				await this.initialize();
				return await readFile(filePath, "utf-8");
			}
			throw error;
		}
	}

	/**
	 * Writes content directly to a memory category file.
	 */
	async writeCategory(
		category: TeamMemoryCategory,
		content: string,
	): Promise<void> {
		await mkdir(this.memoryDir, { recursive: true });
		const filePath = this.getCategoryFilePath(category);
		await writeFile(filePath, content, "utf-8");
	}

	/**
	 * Generates a concise, token-budgeted stratified summary of active
	 * decisions and conventions for system prompt injection.
	 */
	async generateStratifiedSummary(tokenBudgetChars?: number): Promise<string> {
		let decisionsContent = "";
		let conventionsContent = "";

		try {
			decisionsContent = await this.readCategory("decisions");
		} catch {
			// fallback to empty if missing
		}

		try {
			conventionsContent = await this.readCategory("conventions");
		} catch {
			// fallback to empty if missing
		}

		return formatTeamMemorySummary({
			decisionsContent,
			conventionsContent,
			maxChars: tokenBudgetChars ?? this.tokenBudgetChars,
		});
	}

	/**
	 * Stages a newly discovered operational learning in runtime memory.
	 * Does NOT mutate persistent disk files directly during agent execution.
	 */
	stageLearning(topic: string, learning: string): StagedTeamLearning {
		const trimmedTopic = topic.trim();
		const trimmedLearning = learning.trim();

		if (!trimmedTopic) {
			throw new Error("Learning topic cannot be empty");
		}
		if (!trimmedLearning) {
			throw new Error("Learning content cannot be empty");
		}

		const staged: StagedTeamLearning = {
			topic: trimmedTopic,
			learning: trimmedLearning,
			timestamp: new Date().toISOString(),
		};

		this.stagedLearnings.push(staged);
		return staged;
	}

	/**
	 * Returns all currently staged learnings awaiting Checkpoint Gate approval.
	 */
	getStagedLearnings(): StagedTeamLearning[] {
		return [...this.stagedLearnings];
	}

	/**
	 * Commits all staged learnings to .lens/memory/learnings.md after human
	 * approval at a Checkpoint Gate, then clears the in-memory staging queue.
	 */
	async commitStagedLearnings(): Promise<number> {
		if (this.stagedLearnings.length === 0) {
			return 0;
		}

		const count = this.stagedLearnings.length;
		let currentContent = "";
		try {
			currentContent = await this.readCategory("learnings");
		} catch {
			currentContent = TEAM_MEMORY_TEMPLATES.learnings;
		}

		const newEntries = this.stagedLearnings
			.map((entry) => {
				const dateStr = entry.timestamp.slice(0, 10);
				return `\n### ${entry.topic} (${dateStr})\n${entry.learning}\n`;
			})
			.join("");

		const updatedContent = `${currentContent.trimEnd()}\n${newEntries}`;
		await this.writeCategory("learnings", updatedContent);

		this.stagedLearnings = [];
		return count;
	}

	/**
	 * Clears all staged learnings without committing them to disk (e.g. if rejected).
	 */
	clearStagedLearnings(): void {
		this.stagedLearnings = [];
	}
}
