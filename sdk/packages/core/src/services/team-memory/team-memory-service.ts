import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import {
	ApprovedTeamLearningInputSchema,
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
		} catch (error: any) {
			if (error?.code !== "ENOENT") {
				throw error;
			}
		}

		try {
			conventionsContent = await this.readCategory("conventions");
		} catch (error: any) {
			if (error?.code !== "ENOENT") {
				throw error;
			}
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
	stageLearning(
		topic: string,
		learning: string,
		options?: { personaId?: string; id?: string },
	): StagedTeamLearning {
		const trimmedTopic = topic.trim();
		const trimmedLearning = learning.trim();

		if (!trimmedTopic) {
			throw new Error("Learning topic cannot be empty");
		}
		if (!trimmedLearning) {
			throw new Error("Learning content cannot be empty");
		}

		const staged: StagedTeamLearning = {
			id:
				options?.id ??
				`learning-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
			topic: trimmedTopic,
			learning: trimmedLearning,
			timestamp: new Date().toISOString(),
			...(options?.personaId ? { personaId: options.personaId } : {}),
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
	 * Commits staged learnings to .lens/memory/learnings.md after human
	 * approval at a Checkpoint Gate, then clears the in-memory staging queue.
	 * If approvedLearnings is provided, only those items (with developer edits)
	 * are committed. Otherwise all staged learnings are committed.
	 */
	async commitStagedLearnings(
		approvedLearnings?: StagedTeamLearning[],
	): Promise<number> {
		let toCommit: StagedTeamLearning[] = [];

		if (approvedLearnings) {
			if (this.stagedLearnings.length > 0) {
				// Reconcile approved items against legitimate staged proposals
				for (const item of approvedLearnings) {
					const match = this.stagedLearnings.find(
						(s) => s.id && item.id && s.id === item.id,
					);
					if (match) {
						toCommit.push({
							id: match.id,
							topic: item.topic.trim() || match.topic,
							learning: item.learning.trim() || match.learning,
							timestamp: match.timestamp,
							personaId: match.personaId,
						});
					}
				}
			} else {
				// Fallback when approvedLearnings are passed directly (e.g. seeded in tests or standalone)
				for (const item of approvedLearnings) {
					const parsed = ApprovedTeamLearningInputSchema.parse(item);
					toCommit.push(parsed);
				}
			}
		} else {
			toCommit = [...this.stagedLearnings];
		}

		if (toCommit.length === 0) {
			this.stagedLearnings = [];
			return 0;
		}

		const count = toCommit.length;
		let currentContent = "";
		try {
			currentContent = await this.readCategory("learnings");
		} catch (error: any) {
			if (error?.code === "ENOENT") {
				currentContent = TEAM_MEMORY_TEMPLATES.learnings;
			} else {
				throw error;
			}
		}

		const newEntries = toCommit
			.map((entry) => {
				const dateStr = entry.timestamp.slice(0, 10);
				const personaBadge = entry.personaId ? ` [${entry.personaId}]` : "";
				return `\n### ${entry.topic}${personaBadge} (${dateStr})\n${entry.learning}\n`;
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
