/**
 * Antigravity 2 Implementation Plan & Walkthrough Types
 */

export type ProposedFileAction = "modify" | "new" | "delete";

export type PlanApprovalStatus =
	| "draft"
	| "pending_approval"
	| "approved"
	| "rejected";

export interface ProposedChangeItem {
	action: ProposedFileAction;
	file: string;
	component?: string;
	description?: string;
}

export interface VerificationPlan {
	automated: string[];
	manual: string[];
}

export interface ImplementationPlanArtifact {
	goal: string;
	userReviewRequired: string[];
	openQuestions: string[];
	proposedChanges: ProposedChangeItem[];
	verificationPlan: VerificationPlan;
	rawMarkdown?: string;
	status: PlanApprovalStatus;
}

export interface WalkthroughArtifact {
	title: string;
	changesMade: string[];
	verificationResults: string[];
	rawMarkdown?: string;
}

export interface PlanGateOptions {
	mode?: string;
	onPlanDetected?: (plan: ImplementationPlanArtifact) => void;
}
