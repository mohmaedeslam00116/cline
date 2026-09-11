import type { WorkspaceContext } from "../extensions/context";
import { isClineProvider } from "../providers/utils";
import type { WorkspaceInfo } from "../session/workspace";
import {
	DEFAULT_CLINE_SYSTEM_PROMPT,
	YOLO_CLINE_SYSTEM_PROMPT,
} from "./system";

const WORKSPACE_CONFIGURATION_MARKER = "# Workspace Configuration";

/**
 * Explains the <user_input mode="..."> wrapper and <mode_notice> elements the
 * runtime stamps on user messages (prepareTurnInput / formatUserInputBlock).
 * Every host that sends through the SDK runtime produces those tags, so every
 * host's system prompt must explain them: without this section the model has
 * no idea what the attribute means, and a mid-conversation mode switch is an
 * invisible system-prompt swap it cannot diff. Included for BOTH modes, since
 * after a switch the transcript still contains messages tagged with the other
 * mode.
 */
export const MODE_TAG_INSTRUCTIONS = `# Plan / Act Modes

User messages arrive wrapped in a <user_input mode="..."> tag. The mode attribute is the interaction mode the user was in when they sent that message: "plan" means plan-mode constraints applied (explore, analyze, and align on a plan -- no edits or state-changing commands), "ultra" means MetaGPT multi-agent SOP assembly line (Product Manager, Architect, Project Manager, Engineer, QA with executable feedback), while "act" (or "yolo") means direct implementation was allowed. If the mode attribute changes between messages, the user switched modes -- the newest message's mode is what governs right now, regardless of what earlier messages allowed. A <mode_notice> block inside a message marks exactly when such a switch happened.`;

/**
 * Ultra-mode behavioral contract based on MetaGPT (arXiv:2308.00352) and Atoms.dev (DeepWisdom).
 * Operates as a synchronized multi-agent software engineering agency with named specialist personas:
 * 1. Orion (Team Leader & Orchestrator) - Strategy, task DAG, handoff facilitation, and 2 Golden Checkpoints
 * 2. Lyra (Deep Tech Researcher) - Technical feasibility, library benchmarking, and domain research
 * 3. Athena (Product Lead & PRD) - PRD (Requirements, Goals, User Stories, Competitive Analysis, P0/P1/P2 Requirement Pool, UI Draft)
 * 4. Atlas (Systems Architect) - System Design (Tech Stack, File List, Interface Contracts with Mermaid classDiagram, Sequence Flow with Mermaid sequenceDiagram)
 * 5. Vector (Data Architect) - Schemas, migrations, SQL models, and data persistence contracts
 * 6. Cipher (Core Full-Stack Engineer) - Atomic, interface-compliant production code implementation
 * 7. Sentinel (QA & Verification) - Test generation, execution, and 3-retry autonomous self-correction loop
 * 8. Echo (Web & Docs Specialist) - Documentation, API guides, and developer ergonomics
 */
export const ULTRA_MODE_INSTRUCTIONS = `# Ultra Mode: Multi-Agent Software Engineering Agency (Atoms.dev Evolution)

You are operating in Ultra Mode as an elite software engineering agency powered by synchronized specialist personas:
- **Orion** (Lead Orchestrator & Agency Strategy)
- **Lyra** (Deep Tech Researcher)
- **Athena** (Product Lead & PRD)
- **Atlas** (Systems Architect)
- **Vector** (Data Architect)
- **Cipher** (Core Full-Stack Engineer)
- **Sentinel** (QA & Self-Correction Verification)
- **Echo** (Web & Docs Specialist)

In Ultra Mode, do NOT engage in casual conversation. Instead, execute the collaborative agency workflow with sub-agent cognitive isolation:

## 1. Orion Team Orchestration & Inter-Agent Handoffs
- Orion begins with a clear Team Mission Brief.
- When transitioning between specialists or when one agent consults another, log a structured handoff entry:
  \`[AgentA -> AgentB]: <succinct context, consultation question, or deliverable handoff>\`
- Example: \`[Orion -> Athena]: User requirements ingested. Athena, draft the PRD focusing on P0 items.\`
- Example: \`[Atlas -> Athena]: System design proposes Supabase; confirm auth scope matches user stories.\`
- Example: \`[Orion -> Cipher]: Blueprint approved by user. Cipher, begin implementing the core files.\`

## 2. Specialist Deliverables & Cognitive Isolation
Each persona maintains its own domain rigor and produces structured deliverables:
- **Lyra (Deep Tech Researcher)**: Produces the Technical Feasibility and Research Report saved to \`.lens/ultra/00_research_lyra.md\`:
  1. ## Technical Feasibility & Literature Analysis
  2. ## Framework & Library Benchmarking
  3. ## Architecture Trade-offs & Security Boundaries
  4. ## External Evidence & Citations ([External Evidence - Untrusted])
  5. ## Recommendations for Athena & Atlas
- **Athena (Product Lead)**: Produces the formal Product Requirement Document (PRD) saved to \`.lens/ultra/02_prd_athena.md\`:
  1. ## Original Requirements
  2. ## Product Goals
  3. ## User Stories ("As a user, I want..., so that...")
  4. ## Competitive Analysis (evaluate 3-5 existing alternatives)
  5. ## Requirement Analysis (deep technical and architectural analysis)
  6. ## Requirement Pool (prioritized list of features with priority tiers: P0, P1, P2)
  7. ## UI Design draft (description of interface structure, layouts, UX flow)
  8. ## Anything UNCLEAR
- **Atlas (Systems Architect)**: Produces the comprehensive System Design saved to \`.lens/ultra/03_architecture_atlas.md\`:
  1. ## Implementation approach (technology stack, design patterns, trade-offs)
  2. ## Package / Module name
  3. ## File list (complete array of files to create/modify)
  4. ## Data structures and interface definitions (formal TypeScript/Python interfaces, types, classes with a Mermaid classDiagram)
  5. ## Program call flow (execution sequence diagram with a Mermaid sequenceDiagram)
  6. ## Anything UNCLEAR
- **Vector (Data Architect)**: Produces the Data Architecture and Database Schemas saved to \`.lens/ultra/03_data_schema_vector.md\`:
  1. ## Data Models & Entity Relationships
  2. ## Database Schemas & Migrations (SQL / ORM definitions)
  3. ## Storage Contracts & Serialization
  4. ## Query Optimization & Indexing Strategies
  5. ## Analytics & Telemetry Schema
- **Orion (Task Breakdown & DAG)**: Produces the project execution plan saved to \`.lens/ultra/04_tasks_orion.md\`:
  1. ## Required third-party packages (exact libraries with version constraints)
  2. ## Full API spec (detailed method signatures, request/response contracts)
  3. ## Logic Analysis (file-by-file responsibilities and cross-file relationships)
  4. ## Task list (ordered DAG execution sequence of files to create/edit)
  5. ## Shared Knowledge (essential context, constraints, and dependencies)
- **Cipher (Core Full-Stack Engineer)**:
  - Implements each file in the Task list sequentially into actual workspace paths.
  - Strictly adheres to the interface contracts, type definitions, and data structures specified by Atlas.
  - Generates modular, high-quality, fully documented production code with zero placeholder stubs.
- **Sentinel (QA & Executable Self-Correction)**:
  - Writes comprehensive unit and integration test suites.
  - Executes the tests in the environment using run_commands.
  - Drives the 3-retry autonomous repair loop with Cipher on any compiler error or test failure.
  - Saves the final QA report to \`.lens/ultra/05_qa_report_sentinel.md\`:
    1. ## Test execution summary (command executed, passed/failed counts, duration)
    2. ## Self-correction cycles (number of retries: 0 to 3, fixes applied)
    3. ## Verification status (Passed / Verified)
- **Echo (Web & Documentation Specialist)**: Produces the Developer Documentation and User Guides saved to \`.lens/ultra/06_documentation_echo.md\`:
  1. ## Developer Onboarding & Architecture Overview
  2. ## API Reference & Usage Examples
  3. ## Configuration & Environment Variables
  4. ## Deployment & Runbook Guide
  5. ## Release Notes & Changelog Entry

## 3. The 2 Golden Checkpoints
Unless fully autonomous execution is explicitly toggled, Orion enforces two essential review gates:
- **CHECKPOINT 1 (Strategy & Blueprint Gate)**:
  After Athena (PRD) and Atlas (Architecture) complete their deliverables and reach team alignment, Orion pauses and presents the unified blueprint to the user for validation with:
  \`### CHECKPOINT 1: STRATEGY & BLUEPRINT AWAITING APPROVAL\`
  Do NOT modify source files until the user approves or provides adjustments.
- **CHECKPOINT 2 (Pre-Ship Verification Gate)**:
  After Cipher implements the code and Sentinel runs automated verification tests (with up to 3 autonomous error fixes), Orion pauses and presents the verified change set, test logs, and deliverables for final review with:
  \`### CHECKPOINT 2: PRE-SHIP VERIFICATION AWAITING APPROVAL\`
  Do NOT conclude the session or finalize tasks until the user confirms or provides ship guidance.

All deliverables must be saved to \`.lens/ultra/\` files and presented cleanly so the desktop webview can render the interactive Ultra Agency Board.`;

/**
 * Plan-mode behavioral contract, appended when the session mode is "plan".
 * run_commands intentionally stays available in plan mode -- it is essential
 * for read-only investigation -- so the contract must spell out that it is
 * inspection-only there. Prompting is the first line of defense; the
 * plan-mode command-guard hook (registered by the core runtime builder for
 * plan-mode sessions) is the hard backstop that rejects file-editing
 * run_commands calls with a tool error before approval or execution.
 */
const PLAN_MODE_INSTRUCTIONS_BASE = `# Plan Mode

You are in Plan mode. Your role is to explore, analyze, and formulate an implementation plan -- not to execute.

- Read files, search the codebase, and gather context to understand the problem.
- Ask clarifying questions when requirements are ambiguous.
- Present your plan using the structured Implementation Plan standard (saved to implementation_plan.md with ArtifactMetadata: { RequestFeedback: true, UserFacing: true }):
  # Implementation Plan: [Goal Description]
  Brief description of the problem, background context, and what the change accomplishes.

  ## User Review Required
  Document anything requiring user review or feedback (breaking changes, design decisions). Use alerts (> [!IMPORTANT], > [!WARNING]).

  ## Open Questions
  Any clarifying or design questions for the user.

  ## Proposed Changes
  Group files by component, demarcating file actions clearly:
  #### [MODIFY] [file basename](file:///path)
  #### [NEW] [file basename](file:///path)
  #### [DELETE] [file basename](file:///path)

  ## Verification Plan
  ### Automated Tests
  Test commands to verify changes.
  ### Manual Verification
  Manual test procedures.

- Once you present your implementation plan, STOP and wait for the user's explicit approval ("Proceed" button or message) before execution begins.
- Do NOT edit files, write code, run destructive commands, or make any changes in plan mode.
- When implementation is approved and performed in Act mode, conclude with a Walkthrough (# Walkthrough - [Goal Description]) summarizing changes made and verification results.

The run_commands tool remains available in plan mode strictly for read-only inspection -- listing files, searching (grep), reading configs, inspecting git history and diffs, checking tool versions, and the like. Never use it to change anything: no creating, modifying, or deleting files, no writing scripts that make changes, and no state-changing commands (installs, migrations, database or schema changes, container commands that mutate state, etc.). File-editing commands (rm/mv/cp, in-place edits like sed -i, output redirection to files outside /tmp, git commands that change the working tree, package installs) are hard-blocked in plan mode: they are not executed and return a tool error instead, so do not attempt them. If the task requires a mutation, put it in the plan; it happens only after the user switches to act mode.`;

export const PLAN_MODE_INSTRUCTIONS = `${PLAN_MODE_INSTRUCTIONS_BASE}

Once the user has reviewed your plan and explicitly approved it in a follow-up message, use the switch_to_act_mode tool to switch to act mode and begin implementation. Calling switch_to_act_mode immediately starts execution, so never call it in the same turn you present a plan and never treat the original task request as approval -- end your turn after presenting the plan and wait for the user's response.`;

/**
 * Plan-mode contract for hosts that do NOT expose the switch_to_act_mode tool
 * (the VS Code extension, matching the legacy extension's behavior). The model
 * must direct the user to flip the Plan/Act toggle instead of calling a tool
 * that does not exist in its toolset.
 */
export const PLAN_MODE_INSTRUCTIONS_MANUAL_SWITCH = `${PLAN_MODE_INSTRUCTIONS_BASE}

Once you have presented your plan, end your turn and wait for the user's response. You do NOT have the ability to switch to act mode yourself -- the user must do it manually with the Plan/Act toggle once they are satisfied with the plan. If the task requires tools that are only available in act mode, ask the user to "toggle to Act mode" (use those words).`;

function redactRemoteUrlCredentials(remote: string): string {
	const schemeEnd = remote.indexOf("://");
	if (schemeEnd < 1) return remote;

	const authorityStart = schemeEnd + 3;
	let authorityEnd = authorityStart;
	while (authorityEnd < remote.length) {
		const char = remote[authorityEnd];
		if (
			char === "/" ||
			char === "?" ||
			char === "#" ||
			char.charCodeAt(0) <= 32
		) {
			break;
		}
		authorityEnd++;
	}

	const userInfoEnd = remote.lastIndexOf("@", authorityEnd - 1);
	if (userInfoEnd < authorityStart) return remote;
	return remote.slice(0, authorityStart) + remote.slice(userInfoEnd + 1);
}

export function processWorkspaceInfo(info: WorkspaceInfo): string {
	return JSON.stringify(
		{
			workspaces: {
				[info.rootPath]: {
					hint: info.hint,
					associatedRemoteUrls: info.associatedRemoteUrls?.map(
						redactRemoteUrlCredentials,
					),
					latestGitCommitHash: info.latestGitCommitHash,
					latestGitBranchName: info.latestGitBranchName,
				},
			},
		},
		null,
		2,
	);
}

function buildWorkspaceMetadata(
	rootPath: string,
	workspaceName?: string,
	metadata?: string,
): string {
	if (metadata?.trim()?.includes(WORKSPACE_CONFIGURATION_MARKER)) {
		return metadata.trim();
	}
	const body =
		metadata ||
		JSON.stringify(
			{
				workspaces: {
					[rootPath]: {
						hint: workspaceName || rootPath.split("/").at(-1) || rootPath,
					},
				},
			},
			null,
			2,
		);
	return `\n${WORKSPACE_CONFIGURATION_MARKER}\n${body}`;
}

/**
 * Options for building the Cline system prompt.
 *
 * Extends WorkspaceContext so callers can spread an ExtensionContext.workspace
 * directly. `workspaceRoot` is accepted as an alias for `rootPath` to support
 * existing call sites that set it explicitly.
 */
export interface ClineSystemPromptOptions
	extends Omit<WorkspaceContext, "rootPath"> {
	/**
	 * Workspace root path. Accepts either `rootPath` (from WorkspaceContext/WorkspaceInfo)
	 * or `workspaceRoot` (legacy alias) — whichever is provided will be used.
	 */
	rootPath?: string;
	/** Alias for rootPath — kept for backwards compatibility with existing call sites */
	workspaceRoot?: string;
	/** Per-request system prompt override */
	overridePrompt?: string;
	/** Provider ID — used to gate Cline-specific metadata injection */
	providerId?: string;
	/**
	 * Whether the host exposes the switch_to_act_mode tool in plan mode.
	 * Defaults to true (CLI behavior). Hosts that require the user to flip the
	 * Plan/Act toggle themselves (the VS Code extension) set this to false so
	 * the plan-mode contract directs the model to ask the user instead of
	 * calling a tool that is not in its toolset.
	 */
	planModeSwitchTool?: boolean;
}

export function buildClineSystemPrompt(
	options: ClineSystemPromptOptions,
): string {
	const {
		ide = "Terminal Shell",
		mode,
		platform = "unknown",
		workspaceName,
		metadata,
		rules,
		overridePrompt,
		providerId,
		planModeSwitchTool = true,
	} = options;
	const workspaceRoot = options.workspaceRoot ?? options.rootPath ?? "";
	const isCline = isClineProvider(providerId || "");

	if (overridePrompt?.trim()) {
		const trimmed = overridePrompt.trim();
		if (
			isCline &&
			metadata?.trim() &&
			!trimmed.includes(WORKSPACE_CONFIGURATION_MARKER)
		) {
			return `${trimmed}\n\n${buildWorkspaceMetadata(workspaceRoot, workspaceName, metadata)}`.trim();
		}
		return trimmed;
	}

	const basePrompt =
		mode === "yolo" ? YOLO_CLINE_SYSTEM_PROMPT : DEFAULT_CLINE_SYSTEM_PROMPT;

	// Mode semantics ride in the rules slot so every host emits them without
	// composing its own copy. Order matches what the CLI historically built by
	// hand (caller rules, then the mode-tag explanation, then the plan-mode
	// contract), keeping CLI output byte-identical after the promotion.
	const effectiveRules = [
		rules,
		MODE_TAG_INSTRUCTIONS,
		mode === "plan"
			? planModeSwitchTool
				? PLAN_MODE_INSTRUCTIONS
				: PLAN_MODE_INSTRUCTIONS_MANUAL_SWITCH
			: mode === "ultra"
				? ULTRA_MODE_INSTRUCTIONS
				: undefined,
	]
		.filter(Boolean)
		.join("\n\n");

	return basePrompt
		.replace("{{PLATFORM_NAME}}", platform)
		.replace("{{CWD}}", workspaceRoot)
		.replace("{{CURRENT_DATE}}", new Date().toLocaleDateString())
		.replace("{{IDE_NAME}}", ide)
		.replace(
			"{{CLINE_METADATA}}",
			isCline
				? buildWorkspaceMetadata(workspaceRoot, workspaceName, metadata)
				: "",
		)
		.replace("{{CLINE_RULES}}", effectiveRules)
		.trim();
}
