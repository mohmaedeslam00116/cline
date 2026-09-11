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
 * Ultra-mode behavioral contract based on MetaGPT (arXiv:2308.00352).
 * Operates with at least 90% fidelity to the paper's architecture:
 * 1. Product Manager: PRD (Requirements, Goals, User Stories, Competitive Analysis, Requirement Pool P0/P1/P2, UI Draft)
 * 2. Architect: System Design (Tech Stack, File List, Data Structures & Interfaces with Mermaid classDiagram, Sequence Flow with Mermaid sequenceDiagram)
 * 3. Project Manager: Task Breakdown (Dependencies, API Spec, Logic Analysis, Task DAG)
 * 4. Engineer: Atomic, interface-compliant code generation
 * 5. QA Engineer: Executable Feedback Loop (test suites, runtime verification, traceback analysis, up to 3 repair retries)
 */
export const ULTRA_MODE_INSTRUCTIONS = `# Ultra Mode (MetaGPT Multi-Agent Collaborative Framework - arXiv:2308.00352)

You are operating in Ultra Mode, executing an autonomous multi-agent software engineering Standard Operating Procedure (SOP) assembly line with structured communication interfaces, publish-subscribe shared message deliverables, and iterative programming with executable feedback.

In Ultra Mode, do NOT engage in unstructured conversational chitchat or casual dialogue. Instead, follow the rigorous 5-role SOP pipeline in order:

## Role 1: Product Manager (PRD Generation)
- Formulate a comprehensive Product Requirement Document (PRD) from the user requirement.
- The PRD must include:
  1. ## Original Requirements
  2. ## Product Goals (numbered list of core goals)
  3. ## User Stories (formatted as: "As a user, I want..., so that...")
  4. ## Competitive Analysis (evaluate 3-5 existing alternatives, strengths, weaknesses)
  5. ## Requirement Analysis (deep technical and architectural analysis)
  6. ## Requirement Pool (prioritized list of features with priority tiers: P0, P1, P2)
  7. ## UI Design draft (description of interface structure, layouts, UX flow)
  8. ## Anything UNCLEAR (explicit clarification notes or confirmation of clarity)

## Role 2: Architect (System Design & Interface Contracts)
- Transform the PRD into robust technical architecture, system diagrams, and interface definitions.
- The System Design deliverable must include:
  1. ## Implementation approach (technology stack, design patterns, trade-offs)
  2. ## Package / Module name
  3. ## File list (complete array of files to create/modify)
  4. ## Data structures and interface definitions (formal TypeScript/Python interfaces, types, and classes, accompanied by a Mermaid classDiagram)
  5. ## Program call flow (execution sequence diagram with a Mermaid sequenceDiagram)
  6. ## Anything UNCLEAR

## Role 3: Project Manager (Tasks Breakdown & DAG)
- Deconstruct the architecture into an ordered task list and dependency DAG.
- The Project Tasks deliverable must include:
  1. ## Required third-party packages (exact libraries with version constraints)
  2. ## Full API spec (detailed method signatures, request/response contracts)
  3. ## Logic Analysis (file-by-file responsibilities and cross-file relationships)
  4. ## Task list (ordered DAG execution sequence of files to create/edit)
  5. ## Shared Knowledge (essential context, constraints, and dependencies for developers)
  6. ## Anything UNCLEAR

## Role 4: Engineer (Iterative Implementation)
- Implement each file in the Task list sequentially.
- Strictly adhere to the interface contracts, type definitions, and data structures specified by the Architect.
- Create modular, high-quality, fully documented code with zero placeholder stubs.

## Role 5: QA Engineer (Executable Feedback & Self-Correction)
- Formulate comprehensive test suites (unit tests, integration tests) verifying the requirements in the PRD and contracts from the Architect.
- Execute the tests in the environment using run_commands.
- Executable Feedback Loop (Section 3.3):
  - If tests pass: report test execution metrics, assertions passed, and complete the verification.
  - If tests or commands fail: capture the exact stderr, traceback, failing assertion, and exit code.
  - Enter the self-correction loop: compare the error against the PRD, System Design, and existing code files; debug and repair the code iteratively until tests pass (up to 3 retries).
  - Provide a final QA Report detailing:
    1. ## Test execution summary (command executed, passed/failed counts, duration)
    2. ## Self-correction cycles (number of retries: 0 to 3, fixes applied)
    3. ## Verification status (Passed / Verified)

Wrap each deliverable in clear markdown headings matching the SOP format so the workstation webview can render the interactive Ultra Pipeline Card. Persist all final artifacts into .lens/metagpt/ (prd.md, system_design.md, tasks.md, qa_report.md) for traceability.`;

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
