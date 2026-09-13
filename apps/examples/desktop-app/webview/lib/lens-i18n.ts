/**
 * LENS Workstation — Bilingual Arabic/English Localization (ADR-0004 & AGENTS.md).
 * Brand Line: Research, in focus.
 * Arabic Expression: نظرة أعمق. فهم أوضح.
 */

export type LensLocale = "en" | "ar";

export interface LensTranslations {
	readonly brand: {
		readonly name: string;
		readonly tagline: string;
		readonly phase1Badge: string;
		readonly zeroTrustBadge: string;
		readonly untrustedBadgeExact: string;
		readonly lensActive: string;
	};
	readonly evidencePanel: {
		readonly title: string;
		readonly description: string;
		readonly refresh: string;
		readonly backToChat: string;
		readonly metricBundles: string;
		readonly metricBundlesDesc: string;
		readonly metricClaims: string;
		readonly metricClaimsDesc: string;
		readonly metricPolicy: string;
		readonly metricPolicyDecisions: string;
		readonly metricPolicyFailClosed: string;
		readonly tabEvidence: string;
		readonly tabPolicy: string;
		readonly emptyBundlesTitle: string;
		readonly emptyBundlesDesc: string;
		readonly emptyDecisions: string;
		readonly emptyAudit: string;
		readonly zeroTrustContract: string;
		readonly zeroTrustExplanation: string;
		readonly digestLabel: string;
		readonly createdLabel: string;
		readonly claimsVerified: string;
		readonly recentDecisionsTitle: string;
		readonly auditTrailTitle: string;
		readonly approvedBadge: string;
		readonly deniedBadge: string;
		readonly errorTitle: string;
		readonly retryButton: string;
	};
	readonly toolApproval: {
		readonly title: string;
		readonly description: string;
		readonly grantCheckpoint: string;
		readonly failClosed: string;
		readonly readOnlyInspection: string;
		readonly mutationBlocked: string;
		readonly fileModification: string;
		readonly terminalExecution: string;
		readonly pendingNow: string;
		readonly iteration: string;
		readonly request: string;
	};
	readonly sidebar: {
		readonly evidenceAndClaims: string;
		readonly evidenceTooltip: string;
	};
	readonly personaStudio: {
		readonly navigationLabel: string;
		readonly navigationTooltip: string;
		readonly title: string;
		readonly description: string;
		readonly libraryLabel: string;
		readonly searchLabel: string;
		readonly searchPlaceholder: string;
		readonly newPersona: string;
		readonly newPersonaDescription: string;
		readonly builtinBadge: string;
		readonly workspaceBadge: string;
		readonly globalBadge: string;
		readonly globalOnly: string;
		readonly loading: string;
		readonly loadError: string;
		readonly retry: string;
		readonly emptyLibrary: string;
		readonly builtinTemplate: string;
		readonly builtinTemplateDescription: string;
		readonly duplicateToCustomize: string;
		readonly savePersona: string;
		readonly draftDescription: string;
		readonly idLabel: string;
		readonly nameLabel: string;
		readonly avatarCalibration: string;
		readonly avatarCalibrationDescription: string;
		readonly neonAccent: string;
		readonly neonAccentPicker: string;
	};
	readonly modes: {
		readonly modeGroupLabel: string;
		readonly actName: string;
		readonly actTitle: string;
		readonly actDesc: string;
		readonly planName: string;
		readonly planTitle: string;
		readonly planDesc: string;
		readonly yoloName: string;
		readonly yoloTitle: string;
		readonly yoloDesc: string;
		readonly ultraName: string;
		readonly ultraTitle: string;
		readonly ultraDesc: string;
	};
	readonly planReview: {
		readonly badge: string;
		readonly reviewRequired: string;
		readonly approved: string;
		readonly userReviewRequired: string;
		readonly openQuestions: string;
		readonly proposedChanges: string;
		readonly verificationPlan: string;
		readonly automatedTests: string;
		readonly manualVerification: string;
		readonly approveButton: string;
		readonly approvingButton: string;
		readonly approvedFooter: string;
		readonly reviewFooter: string;
		readonly expand: string;
		readonly collapse: string;
	};
	readonly walkthrough: {
		readonly badge: string;
		readonly verificationComplete: string;
		readonly changesMade: string;
		readonly verificationResults: string;
		readonly expand: string;
		readonly collapse: string;
	};
	readonly ultraPipeline: {
		readonly badge: string;
		readonly subtitle: string;
		readonly tabPrd: string;
		readonly tabArchitect: string;
		readonly tabTasks: string;
		readonly tabCode: string;
		readonly tabQa: string;
		readonly statusInProgress: string;
		readonly statusVerified: string;
		readonly statusSelfCorrecting: string;
		readonly goalsTitle: string;
		readonly userStoriesTitle: string;
		readonly competitiveAnalysisTitle: string;
		readonly requirementPoolTitle: string;
		readonly techStackTitle: string;
		readonly fileListTitle: string;
		readonly classDiagramTitle: string;
		readonly sequenceDiagramTitle: string;
		readonly dependenciesTitle: string;
		readonly apiSpecTitle: string;
		readonly logicAnalysisTitle: string;
		readonly taskDagTitle: string;
		readonly testExecutionTitle: string;
		readonly retriesTitle: string;
		readonly verificationPassed: string;
		readonly copyDeliverable: string;
		readonly copied: string;
		readonly expand: string;
		readonly collapse: string;
	};
	readonly ultraAgency: {
		readonly badge: string;
		readonly subtitle: string;
		readonly squadBarTitle: string;
		readonly collaborationFeedTitle: string;
		readonly checkpoint1Title: string;
		readonly checkpoint1Desc: string;
		readonly checkpoint2Title: string;
		readonly checkpoint2Desc: string;
		readonly approveAndProceed: string;
		readonly addFeedback: string;
		readonly sendFeedback: string;
		readonly feedbackPlaceholder: string;
		readonly feedbackSent: string;
		readonly statusActive: string;
		readonly statusConsulting: string;
		readonly statusWaiting: string;
		readonly statusDone: string;
		readonly configureSquad: string;
		readonly presetCore: string;
		readonly presetFull: string;
		readonly presetRapid: string;
		readonly checkpointGates: string;
		readonly checkpointGatesDesc: string;
		readonly squadLabel: string;
		readonly squadPresetsLabel: string;
		readonly specialistPersonasLabel: string;
		readonly agentsSuffix: string;
		readonly deliverablesAriaLabel: string;
		readonly researchTabLabel: string;
		readonly untrustedBadgeExact: string;
		readonly qaStatusFailed: string;
		readonly proceedingButton: string;
		readonly tabOrion: string;
		readonly tabLyra: string;
		readonly tabAthena: string;
		readonly tabAtlas: string;
		readonly tabVector: string;
		readonly tabCipher: string;
		readonly tabSentinel: string;
		readonly tabEcho: string;
		readonly tabPrdLabel: string;
		readonly tabArchLabel: string;
		readonly tabTasksLabel: string;
		readonly tabCodeLabel: string;
		readonly tabQaLabel: string;
		readonly tabDocsLabel: string;
		readonly tabVectorLabel: string;
		readonly tabLyraLabel: string;
		readonly roleOrchestrator: string;
		readonly roleResearcher: string;
		readonly roleProductLead: string;
		readonly roleArchitect: string;
		readonly roleDataArchitect: string;
		readonly roleEngineer: string;
		readonly roleQaLead: string;
		readonly roleDocs: string;
		readonly cyberGallery: string;
		readonly cyberGalleryTitle: string;
		readonly cyberGallerySubtitle: string;
		readonly cyberGalleryBadge: string;
		readonly stateIdle: string;
		readonly stateThinking: string;
		readonly stateSpeaking: string;
		readonly stateWorking: string;
		readonly stateCheckpoint: string;
		readonly primaryDeliverable: string;
		readonly coreResponsibilities: string;
		readonly systemPromptSeed: string;
		readonly statusLabel: string;
		readonly targetLabel: string;
		readonly warRoomTitle: string;
		readonly warRoomSubtitle: string;
		readonly warRoomButton: string;
		readonly splitScreen: string;
		readonly fullScreen: string;
		readonly exitFullScreen: string;
		readonly closeWarRoom: string;
		readonly filterAll: string;
		readonly simulationPlay: string;
		readonly simulationPause: string;
		readonly simulationStep: string;
		readonly simulationReset: string;
		readonly checkpointGate1Title: string;
		readonly checkpointGate2Title: string;
		readonly requestChanges: string;
		readonly checkpointApproved: string;
		readonly checkpointPending: string;
		readonly checkpointRejected: string;
		readonly handoffTo: string;
		readonly broadcastToAll: string;
		readonly telemetryActiveSquad: string;
		readonly telemetryMessages: string;
		readonly telemetryToolCalls: string;
		readonly stageStrategy: string;
		readonly stageResearch: string;
		readonly stageArchitecture: string;
		readonly stageDevelopment: string;
		readonly stageQa: string;
		readonly stageDocumentation: string;
		readonly deliverablesForSignOff: string;
		readonly teamMemoryProposalsTitle: string;
		readonly teamMemoryProposalsDesc: string;
		readonly editProposal: string;
		readonly saveProposal: string;
		readonly approveProposal: string;
		readonly excludeProposal: string;
		readonly learningTopicLabel: string;
		readonly learningContentLabel: string;
		readonly discardProposalsOnReject: string;
		readonly proposalsApprovedBadge: string;
		readonly proposalsExcludedBadge: string;
		readonly proposalAttributionBy: string;
		readonly committedMemoryNoticeSingular: string;
		readonly committedMemoryNoticePlural: string;
		readonly userDirective: string;
		readonly cancel: string;
		readonly copyCodeSnippet: string;
		readonly codeSnippetCopied: string;
		readonly openArtifact: string;
		readonly outputLabel: string;
		readonly liveSwarmBadge: string;
		readonly gatePendingBadge: string;
		readonly squadRosterLabel: string;
		readonly filterPersonaAria: string;
		readonly noFilteredMessages: string;
		readonly ultraSopProtocol: string;
		readonly directivePlaceholder: string;
		readonly directiveReceived: string;
		readonly directiveRealigning: string;
		readonly gateApprovedProceeding: string;
		readonly proceedingImmediately: string;
		readonly gateModificationsRequested: string;
		readonly reallocatingResources: string;
		readonly untrustedEvidenceBadge: string;
		readonly sendButton: string;
		readonly gate1Deliv1Title: string;
		readonly gate1Deliv1Summary: string;
		readonly gate1Deliv2Title: string;
		readonly gate1Deliv2Summary: string;
		readonly gate2Deliv1Title: string;
		readonly gate2Deliv1Summary: string;
		readonly gate2Deliv2Title: string;
		readonly gate2Deliv2Summary: string;
		readonly scenarioMsg1: string;
		readonly scenarioMsg2: string;
		readonly scenarioArtifactTitle: string;
		readonly scenarioArtifactSummary: string;
		readonly scenarioMsg3: string;
		readonly scenarioMsg4: string;
		readonly scenarioMsg5: string;
		readonly scenarioMsg6: string;
		readonly scenarioMsg7: string;
	};
}

export const LENS_TRANSLATIONS: Record<LensLocale, LensTranslations> = {
	en: {
		brand: {
			name: "LENS Workstation",
			tagline: "Research, in focus.",
			phase1Badge: "Phase 1: Read-Only Containment",
			zeroTrustBadge: "Zero-Trust: Untrusted Research Data",
			untrustedBadgeExact: "[External Evidence - Untrusted]",
			lensActive: "LENS: Active",
		},
		evidencePanel: {
			title: "LENS Evidence & Claims",
			description:
				"Research Loop (Loop 1) Evidence Store — immutable, content-addressed bundles and policy audit trail.",
			refresh: "Refresh",
			backToChat: "Back to Chat",
			metricBundles: "Evidence Bundles",
			metricBundlesDesc: "Content-addressed SHA-256 artifacts",
			metricClaims: "Synthesized Claims",
			metricClaimsDesc: "BM25 verified passage hits",
			metricPolicy: "Policy Enforcement",
			metricPolicyDecisions: "Decisions",
			metricPolicyFailClosed: "fail-closed denials",
			tabEvidence: "Evidence Bundles",
			tabPolicy: "Policy & Grants Audit",
			emptyBundlesTitle: "No Evidence Bundles for this session",
			emptyBundlesDesc:
				"When the agent runs research passes in Loop 1, immutable content-addressed bundles will appear here, tagged with verified claims and source citations.",
			emptyDecisions:
				"No tool approval decisions recorded for this session yet.",
			emptyAudit:
				"Grant registry is empty for this session (Phase-1 read-only containment).",
			zeroTrustContract: "Zero-Trust Boundary Contract",
			zeroTrustExplanation:
				"All claims in this bundle are marked contentIsUntrusted: true. They inform coding decisions but cannot authorize tool elevation or policy override. Excerpts are retrieved on demand via get_evidence_detail.",
			digestLabel: "digest",
			createdLabel: "Created",
			claimsVerified: "Claims Verified",
			recentDecisionsTitle: "Recent Tool Call Decisions",
			auditTrailTitle: "Append-Only Grant Registry Audit Trail",
			approvedBadge: "Approved",
			deniedBadge: "Policy Denied (Fail Closed)",
			errorTitle: "Failed to load evidence data",
			retryButton: "Retry",
		},
		toolApproval: {
			title: "Tool approval required",
			description:
				"Review each tool call and policy grant checkpoint before execution.",
			grantCheckpoint: "Grant Checkpoint:",
			failClosed: "(Phase-1 Fail Closed)",
			readOnlyInspection: "Read-Only Inspection",
			mutationBlocked: "Mutation Blocked",
			fileModification: "File Modification",
			terminalExecution: "Terminal Command",
			pendingNow: "Pending now",
			iteration: "Iteration",
			request: "Request",
		},
		sidebar: {
			evidenceAndClaims: "Evidence & Claims",
			evidenceTooltip: "View research evidence bundles and policy checkpoints",
		},
		personaStudio: {
			navigationLabel: "Persona Studio",
			navigationTooltip: "Create and manage specialist personas",
			title: "Persona Studio",
			description: "Calibrate identity, capabilities, and system prompts.",
			libraryLabel: "Persona library",
			searchLabel: "Search personas",
			searchPlaceholder: "Search ID, name, or role",
			newPersona: "New persona",
			newPersonaDescription: "Start from a least-privilege specialist template.",
			builtinBadge: "Built-in",
			workspaceBadge: "Workspace",
			globalBadge: "Global",
			globalOnly: "Global personas only",
			loading: "Loading custom personas…",
			loadError: "Unable to load custom personas.",
			retry: "Retry",
			emptyLibrary: "No personas match this filter.",
			builtinTemplate: "Built-in template",
			builtinTemplateDescription:
				"Built-in personas are immutable. Duplicate this template to tune its identity, access, and operating prompt.",
			duplicateToCustomize: "Duplicate to customize",
			savePersona: "Save persona",
			draftDescription:
				"Configure the specialist contract before it enters an execution loop.",
			idLabel: "ID",
			nameLabel: "Name",
			avatarCalibration: "Avatar calibration",
			avatarCalibrationDescription:
				"Select a chassis and verify its signal across every operational state.",
			neonAccent: "Neon accent",
			neonAccentPicker: "Neon accent color picker",
		},
		modes: {
			modeGroupLabel: "Agent interaction mode",
			actName: "Code",
			actTitle: "Code (Act)",
			actDesc: "Implementation mode with tool approvals",
			planName: "Architect",
			planTitle: "Architect (Plan)",
			planDesc:
				"Read-only design and analysis. File edits and mutating commands are blocked.",
			yoloName: "Autonomous",
			yoloTitle: "Autonomous (YOLO)",
			yoloDesc: "Autonomous execution with all tools auto-approved",
			ultraName: "Ultra",
			ultraTitle: "Ultra (MetaGPT Multi-Agent Pipeline)",
			ultraDesc:
				"Multi-agent collaborative SOP pipeline (PM -> Architect -> Project Manager -> Engineer -> QA) with executable feedback.",
		},
		planReview: {
			badge: "Architect Plan",
			reviewRequired: "Review Required",
			approved: "Approved",
			userReviewRequired: "User Review Required",
			openQuestions: "Open Questions",
			proposedChanges: "Proposed Changes",
			verificationPlan: "Verification Plan",
			automatedTests: "Automated Tests:",
			manualVerification: "Manual Verification:",
			approveButton: "Approve & Proceed",
			approvingButton: "Approving...",
			approvedFooter: "Plan approved. Workstation is executing in Code mode.",
			reviewFooter:
				"Review the implementation steps above. Proceed when ready to begin coding.",
			expand: "Expand",
			collapse: "Collapse",
		},
		walkthrough: {
			badge: "Task Walkthrough",
			verificationComplete: "Verification Complete",
			changesMade: "Changes Made",
			verificationResults: "Verification & Validation Results",
			expand: "Expand",
			collapse: "Collapse",
		},
		ultraPipeline: {
			badge: "MetaGPT Assembly Line",
			subtitle: "Multi-Agent Software Engineering Pipeline (arXiv:2308.00352)",
			tabPrd: "1. PRD (PM)",
			tabArchitect: "2. Design (Architect)",
			tabTasks: "3. Tasks (PM)",
			tabCode: "4. Code (Engineer)",
			tabQa: "5. QA & Verification",
			statusInProgress: "In Progress",
			statusVerified: "Verified",
			statusSelfCorrecting: "Self-Correcting",
			goalsTitle: "Product Goals",
			userStoriesTitle: "User Stories",
			competitiveAnalysisTitle: "Competitive Analysis",
			requirementPoolTitle: "Requirement Pool",
			techStackTitle: "Implementation Approach",
			fileListTitle: "Project Files",
			classDiagramTitle: "Data Structures & Interfaces",
			sequenceDiagramTitle: "Program Call Flow",
			dependenciesTitle: "Third-Party Packages",
			apiSpecTitle: "API Specification",
			logicAnalysisTitle: "Logic Analysis",
			taskDagTitle: "Task Execution DAG",
			testExecutionTitle: "Test Execution & Results",
			retriesTitle: "Executable Feedback Cycles",
			verificationPassed: "All Tests Passed & Contracts Verified",
			copyDeliverable: "Copy Deliverable",
			copied: "Copied!",
			expand: "Expand",
			collapse: "Collapse",
			priorityLabel: "Priority",
			requirementLabel: "Requirement",
			uiDraftTitle: "UI Design Draft",
			engineerTitle: "Engineer Implementation",
			engineerDesc:
				"Implementation files adhering to Architect interfaces and task list:",
			errorTracebacksTitle: "Captured Error Tracebacks",
			footerPhase: "Ultra Mode • SOP Phase:",
		},
		ultraAgency: {
			badge: "Ultra Mode Agency",
			subtitle: "Multi-Agent Software Engineering Squad (Atoms.dev Evolution)",
			squadBarTitle: "Active Squad Lineup",
			collaborationFeedTitle: "Team Collaboration & Handoffs",
			checkpoint1Title: "Checkpoint 1: Strategy & Blueprint Gate",
			checkpoint1Desc:
				"Orion has paused execution. Review Athena's PRD and Atlas's Architecture before code generation.",
			checkpoint2Title: "Checkpoint 2: Pre-Ship Verification Gate",
			checkpoint2Desc:
				"Cipher has implemented the code and Sentinel has completed automated test verification.",
			approveAndProceed: "Approve & Proceed",
			addFeedback: "Add Guidance / Adjustments",
			sendFeedback: "Send Guidance",
			feedbackPlaceholder:
				"Instruct Orion or any specialist (e.g. 'Adjust auth to Supabase')...",
			feedbackSent: "Guidance sent to squad",
			statusActive: "Active: Writing...",
			statusConsulting: "Consulting",
			statusWaiting: "Waiting",
			statusDone: "Completed",
			configureSquad: "Configure Squad",
			presetCore: "Core Software Squad",
			presetFull: "Full Product Agency",
			presetRapid: "Rapid Prototyper",
			checkpointGates: "Interactive Checkpoint Gates",
			checkpointGatesDesc:
				"Orion pauses at Checkpoints 1 & 2 for human direction",
			squadLabel: "Squad",
			squadPresetsLabel: "Squad Presets",
			specialistPersonasLabel: "Specialist Personas",
			agentsSuffix: "agents",
			deliverablesAriaLabel: "Agency Specialist Deliverables",
			researchTabLabel: "Research",
			untrustedBadgeExact: "[External Evidence - Untrusted]",
			qaStatusFailed: "Verification Failed",
			proceedingButton: "Proceeding...",
			tabOrion: "Orion (Strategy & Tasks)",
			tabLyra: "Lyra (Research)",
			tabAthena: "Athena (PRD)",
			tabAtlas: "Atlas (Architecture)",
			tabVector: "Vector (Data Schema)",
			tabCipher: "Cipher (Code)",
			tabSentinel: "Sentinel (QA & Verification)",
			tabEcho: "Echo (Docs)",
			tabPrdLabel: "PRD",
			tabArchLabel: "Architecture",
			tabTasksLabel: "Task DAG",
			tabCodeLabel: "Code",
			tabQaLabel: "QA Report",
			tabDocsLabel: "Docs",
			tabVectorLabel: "Data Schema",
			tabLyraLabel: "Research",
			roleOrchestrator: "Orchestrator",
			roleResearcher: "Researcher",
			roleProductLead: "Product Lead",
			roleArchitect: "Architect",
			roleDataArchitect: "Data Architect",
			roleEngineer: "Engineer",
			roleQaLead: "QA Lead",
			roleDocs: "Docs",
			cyberGallery: "Cyber Gallery",
			cyberGalleryTitle: "Cyberpunk Agency Persona Squad",
			cyberGallerySubtitle:
				"High-precision SVG avatars with live activity telemetry & state indicators",
			cyberGalleryBadge: "8 Specialist Vectors",
			stateIdle: "Idle / Ready",
			stateThinking: "Thinking / Scanning",
			stateSpeaking: "Speaking / Inter-Agent",
			stateWorking: "Working / Tool Exec",
			stateCheckpoint: "Checkpoint Gate",
			primaryDeliverable: "Primary Deliverable",
			coreResponsibilities: "Core Responsibilities",
			systemPromptSeed: "System Prompt Seed",
			statusLabel: "STATUS:",
			targetLabel: "Target:",
			warRoomTitle: "Agency War Room",
			warRoomSubtitle: "Autonomous Multi-Agent Swarm Stream & Live Checkpoints",
			warRoomButton: "War Room",
			splitScreen: "Split View",
			fullScreen: "Full Screen",
			exitFullScreen: "Exit Full Screen",
			closeWarRoom: "Close War Room",
			filterAll: "All Agents",
			simulationPlay: "Play Swarm",
			simulationPause: "Pause",
			simulationStep: "Next Step",
			simulationReset: "Reset",
			checkpointGate1Title: "Checkpoint 1: Architecture & PRD Sign-off",
			checkpointGate2Title: "Checkpoint 2: Pre-Ship Quality Audit",
			requestChanges: "Request Changes",
			checkpointApproved: "Checkpoint Approved",
			checkpointPending: "Awaiting Your Approval",
			checkpointRejected: "Changes Requested",
			handoffTo: "Handoff to",
			broadcastToAll: "Broadcast to Swarm",
			telemetryActiveSquad: "Active Swarm",
			telemetryMessages: "Messages",
			telemetryToolCalls: "Tool Calls",
			stageStrategy: "Strategy & SOP",
			stageResearch: "Deep Research",
			stageArchitecture: "Architecture & DAG",
			stageDevelopment: "Core Implementation",
			stageQa: "QA Verification",
			stageDocumentation: "Technical Documentation",
			deliverablesForSignOff: "Deliverables For Sign-Off:",
			teamMemoryProposalsTitle: "Proposed Team Memory Updates",
			teamMemoryProposalsDesc:
				"Review operational learnings discovered during this run before committing to persistent memory.",
			editProposal: "Edit",
			saveProposal: "Save",
			approveProposal: "Approve",
			excludeProposal: "Exclude",
			learningTopicLabel: "Topic",
			learningContentLabel: "Learning",
			discardProposalsOnReject:
				"Discard memory proposals on change request",
			proposalsApprovedBadge: "Approved for Commit",
			proposalsExcludedBadge: "Excluded",
			proposalAttributionBy: "by",
			committedMemoryNoticeSingular:
				"(1 team memory learning committed)",
			committedMemoryNoticePlural:
				"({count} team memory learnings committed)",
			userDirective: "User Directive:",
			cancel: "Cancel",
			copyCodeSnippet: "Copy code snippet",
			codeSnippetCopied: "Copied!",
			openArtifact: "Open artifact",
			outputLabel: "Output:",
			liveSwarmBadge: "LIVE SWARM",
			gatePendingBadge: "GATE PENDING",
			squadRosterLabel: "Squad:",
			filterPersonaAria: "Filter messages",
			noFilteredMessages: "No messages match this persona filter.",
			ultraSopProtocol: "Ultra SOP Dual-Loop Protocol",
			directivePlaceholder: "Dispatch direct command to Ultra Swarm...",
			directiveReceived: "Directive received:",
			directiveRealigning:
				"Orion re-aligning squad priorities and dispatching tasks.",
			gateApprovedProceeding: "User verified and approved",
			proceedingImmediately: "Proceeding immediately!",
			gateModificationsRequested: "User requested modifications on",
			reallocatingResources:
				"Orion reallocating resources for design adjustment.",
			untrustedEvidenceBadge: "[External Evidence - Untrusted]",
			sendButton: "Send",
			gate1Deliv1Title: "PRD-001 Specification",
			gate1Deliv1Summary: "User stories (P0, P1, P2) & zero-trust boundaries",
			gate1Deliv2Title: "System Architecture & DAG",
			gate1Deliv2Summary:
				"Component hierarchy, state contracts & interface seams",
			gate2Deliv1Title: "Test Execution Report",
			gate2Deliv1Summary:
				"180/180 Vitest suites passed. 0 regression failures.",
			gate2Deliv2Title: "Atomic ChangeSet Manifest",
			gate2Deliv2Summary:
				"Validated SHA-256 base hashes & rollback transactions.",
			scenarioMsg1:
				"Initializing Ultra SOP Swarm session. We are targeting high-reliability dual-loop execution with zero-trust research boundaries. Lyra, initiate technical research pass.",
			scenarioMsg2:
				"Research pass complete. Synthesized 8 verified claims from repo documentation and secondary evidence. Zero-trust containment contract verified.",
			scenarioArtifactTitle: "EvidenceBundle #842",
			scenarioArtifactSummary: "8 verified claims, 0 untrusted elevations.",
			scenarioMsg3:
				"PRD-001 drafted with user stories P0 (Split-Screen War Room), P1 (Live Agent SVG Bubbles), P2 (Checkpoint Gates). Handing off requirements to Atlas for architecture modeling.",
			scenarioMsg4:
				"Architecture blueprint formulated. Module decomposition complete with ResizablePanelGroup layout. Pausing execution at Checkpoint Gate 1 for user sign-off.",
			scenarioMsg5:
				"Checkpoint Gate 1 cleared! Commencing core implementation. Constructing reactive War Room context and SVG message bubbles.",
			scenarioMsg6:
				"Code implementation complete. Executed test runner: all 180 unit tests and persona avatar assertions passed! Checkpoint Gate 2: Pre-Ship Quality Audit reached.",
			scenarioMsg7:
				"Checkpoint Gate 2 approved! Synchronized bilingual documentation and changelog entries. Ultra Swarm execution successfully finalized.",
		},
	},
	ar: {
		brand: {
			name: "محطة عمل لينس",
			tagline: "نظرة أعمق. فهم أوضح.",
			phase1Badge: "المرحلة 1: احتواء للقراءة فقط",
			zeroTrustBadge: "انعدام الثقة: بيانات بحث غير موثوقة",
			untrustedBadgeExact: "[أدلة خارجية - غير موثوقة]",
			lensActive: "لينس: نشط",
		},
		evidencePanel: {
			title: "أدلة وادعاءات لينس",
			description:
				"مخزن أدلة حلقة البحث (الحلقة 1) — حزم غير قابلة للتغيير ومعنونة بالمحتوى وسجل تدقيق السياسات.",
			refresh: "تحديث",
			backToChat: "العودة إلى المحادثة",
			metricBundles: "حزم الأدلة",
			metricBundlesDesc: "عناصر معنونة بالمحتوى بتجزئة SHA-256",
			metricClaims: "الادعاءات المستخلصة",
			metricClaimsDesc: "فقرات متطابقة تم التحقق منها بـ BM25",
			metricPolicy: "إنفاذ السياسة",
			metricPolicyDecisions: "قرارات",
			metricPolicyFailClosed: "حالات رفض مغلقة افتراضياً",
			tabEvidence: "حزم الأدلة",
			tabPolicy: "تدقيق السياسات والتفويضات",
			emptyBundlesTitle: "لا توجد حزم أدلة لهذه الجلسة",
			emptyBundlesDesc:
				"عندما يشغّل الوكيل جولات بحثية في الحلقة 1، ستظهر هنا حزم معنونة بالمحتوى غير قابلة للتعديل، موسومة بادعاءات موثقة واستشهادات للمصادر.",
			emptyDecisions:
				"لم يتم تسجيل أي قرارات موافقة على الأدوات لهذه الجلسة بعد.",
			emptyAudit:
				"سجل التفويضات فارغ لهذه الجلسة (احتواء المرحلة الأولى للقراءة فقط).",
			zeroTrustContract: "عقد حدود انعدام الثقة",
			zeroTrustExplanation:
				"جميع الادعاءات في هذه الحزمة موسومة بـ contentIsUntrusted: true. تفيد القرارات البرمجية ولكن لا يمكنها منح ترقية صلاحيات أو تجاوز السياسة. يتم استرجاع الاقتباسات عند الطلب عبر get_evidence_detail.",
			digestLabel: "التجزئة",
			createdLabel: "تاريخ الإنشاء",
			claimsVerified: "ادعاءات تم التحقق منها",
			recentDecisionsTitle: "أحدث قرارات استدعاء الأدوات",
			auditTrailTitle: "سجل تدقيق التفويضات غير القابل للتعديل",
			approvedBadge: "مقبول",
			deniedBadge: "مرفوض بالسياسة (إغلاق آمن)",
			errorTitle: "فشل تحميل بيانات الأدلة",
			retryButton: "إعادة المحاولة",
		},
		toolApproval: {
			title: "مطلوب الموافقة على الأداة",
			description:
				"راجع كل استدعاء للأداة ونقاط تفتيش تفويض السياسة قبل التنفيذ.",
			grantCheckpoint: "نقطة تفتيش التفويض:",
			failClosed: "(إغلاق آمن للمرحلة 1)",
			readOnlyInspection: "فحص للقراءة فقط",
			mutationBlocked: "تعديل محظور",
			fileModification: "تعديل الملفات",
			terminalExecution: "أمر طرفية",
			pendingNow: "معلق الآن",
			iteration: "التكرار",
			request: "الطلب",
		},
		sidebar: {
			evidenceAndClaims: "الأدلة والادعاءات",
			evidenceTooltip: "عرض حزم أدلة البحث ونقاط تفتيش السياسة",
		},
		personaStudio: {
			navigationLabel: "استوديو الشخصيات",
			navigationTooltip: "إنشاء شخصيات وكلاء متخصصة وإدارتها",
			title: "استوديو الشخصيات",
			description: "معايرة الهوية والصلاحيات ومطالبات النظام.",
			libraryLabel: "مكتبة الشخصيات",
			searchLabel: "البحث في الشخصيات",
			searchPlaceholder: "البحث بالمعرف أو الاسم أو الدور",
			newPersona: "شخصية جديدة",
			newPersonaDescription: "ابدأ من قالب متخصص بأقل قدر من الصلاحيات.",
			builtinBadge: "مدمجة",
			workspaceBadge: "مساحة العمل",
			globalBadge: "عامة",
			globalOnly: "الشخصيات العامة فقط",
			loading: "جارٍ تحميل الشخصيات المخصصة…",
			loadError: "تعذر تحميل الشخصيات المخصصة.",
			retry: "إعادة المحاولة",
			emptyLibrary: "لا توجد شخصيات تطابق عامل التصفية.",
			builtinTemplate: "قالب مدمج",
			builtinTemplateDescription:
				"الشخصيات المدمجة غير قابلة للتعديل. أنشئ نسخة لضبط الهوية والصلاحيات ومطالبة التشغيل.",
			duplicateToCustomize: "إنشاء نسخة للتخصيص",
			savePersona: "حفظ الشخصية",
			draftDescription:
				"اضبط عقد الوكيل المتخصص قبل دخوله في حلقة التنفيذ.",
			idLabel: "المعرف",
			nameLabel: "الاسم",
			avatarCalibration: "معايرة الصورة الرمزية",
			avatarCalibrationDescription:
				"اختر الهيكل وتحقق من إشارته في جميع حالات التشغيل.",
			neonAccent: "لون النيون",
			neonAccentPicker: "منتقي لون النيون",
		},
		modes: {
			modeGroupLabel: "نمط تفاعل الوكيل",
			actName: "كود",
			actTitle: "كود (تنفيذ)",
			actDesc: "وضع التنفيذ البرمجي مع طلب الموافقة على الأدوات",
			planName: "معمار",
			planTitle: "معمار (تخطيط)",
			planDesc: "وضع التصميم والتحليل للقراءة فقط مع حظر التعديل",
			yoloName: "تلقائي",
			yoloTitle: "تلقائي (شامل)",
			yoloDesc:
				"وضع التنفيذ التلقائي المستقل مع الموافقة التلقائية على جميع الأدوات",
			ultraName: "ألترا",
			ultraTitle: "ألترا (فريق متعدد الوكلاء - MetaGPT)",
			ultraDesc:
				"مسار عمل هندسي تعاوني متعدد الوكلاء (مدير منتج -> مهندس معماري -> مدير مشروع -> مهندس برمجي -> مهندس جودة) مع تغذية راجعة تنفيذية.",
		},
		planReview: {
			badge: "خطة المعمار",
			reviewRequired: "مطلوب المراجعة",
			approved: "تمت الموافقة",
			userReviewRequired: "مراجعة المستخدم مطلوبة",
			openQuestions: "الأسئلة المفتوحة",
			proposedChanges: "التغييرات المقترحة",
			verificationPlan: "خطة التحقق",
			automatedTests: "الاختبارات المؤتمتة:",
			manualVerification: "التحقق اليدوي:",
			approveButton: "موافقة ومتابعة",
			approvingButton: "جارٍ الموافقة...",
			approvedFooter: "تمت الموافقة على الخطة. محطة العمل تنفذ في وضع الكود.",
			reviewFooter:
				"راجع خطوات التنفيذ أعلاه. تابع عند الاستعداد لبدء كتابة الكود.",
			expand: "توسيع",
			collapse: "طي",
		},
		walkthrough: {
			badge: "مراجعة إنجاز المهمة",
			verificationComplete: "اكتمل التحقق",
			changesMade: "التغييرات المنجزة",
			verificationResults: "نتائج التحقق والمطابقة",
			expand: "توسيع",
			collapse: "طي",
		},
		ultraPipeline: {
			badge: "خط تجميع MetaGPT",
			subtitle: "مسار الهندسة البرمجية متعدد الوكلاء (arXiv:2308.00352)",
			tabPrd: "1. المتطلبات (مدير المنتج)",
			tabArchitect: "2. التصميم (المعمار)",
			tabTasks: "3. المهام (مدير المشروع)",
			tabCode: "4. الكود (المهندس)",
			tabQa: "5. الجودة والتحقق",
			statusInProgress: "قيد التنفيذ",
			statusVerified: "تم التحقق",
			statusSelfCorrecting: "تصحيح ذاتي جاري",
			goalsTitle: "أهداف المنتج",
			userStoriesTitle: "قصص المستخدمين",
			competitiveAnalysisTitle: "التحليل التنافسي",
			requirementPoolTitle: "مجمع المتطلبات",
			techStackTitle: "نهج التنفيذ البرمجي",
			fileListTitle: "ملفات المشروع",
			classDiagramTitle: "هياكل البيانات والواجهات",
			sequenceDiagramTitle: "مخطط تسلسل الاستدعاء",
			dependenciesTitle: "الحزم الخارجية المطلوبة",
			apiSpecTitle: "مواصفات الواجهات البرمجية",
			logicAnalysisTitle: "التحليل المنطقي",
			taskDagTitle: "مخطط تسلسل المهام (DAG)",
			testExecutionTitle: "تنفيذ ونتائج الاختبارات",
			retriesTitle: "دورات التغذية الراجعة التنفيذية",
			verificationPassed: "تم اجتياز جميع الاختبارات وتأكيد العقود",
			copyDeliverable: "نسخ المخرجات",
			copied: "تم النسخ!",
			expand: "توسيع",
			collapse: "طي",
			priorityLabel: "الأولوية",
			requirementLabel: "المتطلب",
			uiDraftTitle: "مسودة واجهة المستخدم",
			engineerTitle: "تنفيذ المهندس البرمجي",
			engineerDesc:
				"ملفات التنفيذ البرمجي الملتزمة بواجهات المعمار وقائمة المهام:",
			errorTracebacksTitle: "سجلات أخطاء التنفيذ الملتقطة",
			footerPhase: "الوضع المتطور • مرحلة إجراءات التشغيل القياسية:",
		},
		ultraAgency: {
			badge: "وكالة الوضع المتطور",
			subtitle: "فريق هندسة برمجيات متعدد الوكلاء (تطور Atoms.dev)",
			squadBarTitle: "طاقم الفريق النشط",
			collaborationFeedTitle: "سجل التشاور والتسليم المتبادل",
			checkpoint1Title: "المحطة 1: بوابة مراجعة التخطيط والمعمارية",
			checkpoint1Desc:
				"أوقف Orion التنفيذ لمراجعة وثيقة PRD والمخطط المعماري قبل بدء كتابة الكود.",
			checkpoint2Title: "المحطة 2: بوابة مراجعة الجودة قبل الشحن",
			checkpoint2Desc:
				"أكمل Cipher كتابة الكود وأنجز Sentinel كافة الاختبارات المؤتمتة بنجاح.",
			approveAndProceed: "موافقة ومتابعة",
			addFeedback: "إضافة توجيهات / تعديلات",
			sendFeedback: "إرسال التوجيهات",
			feedbackPlaceholder: "وجه Orion أو أي متخصص بتعديل مطلوب...",
			feedbackSent: "تم إرسال التوجيهات للفريق",
			statusActive: "نشط: يكتب...",
			statusConsulting: "يتشاور",
			statusWaiting: "ينتظر",
			statusDone: "مكتمل",
			configureSquad: "تخصيص الفريق",
			presetCore: "فريق البرمجيات الأساسي",
			presetFull: "وكالة المنتج المتكاملة",
			presetRapid: "فريق النماذج الأولية السريع",
			checkpointGates: "بوابات الموافقة التفاعلية",
			checkpointGatesDesc: "يتوقف Orion عند المحطتين 1 و 2 لأخذ توجيه المستخدم",
			squadLabel: "الفريق",
			squadPresetsLabel: "قوالب الفريق المسبقة",
			specialistPersonasLabel: "المتخصصون",
			agentsSuffix: "وكلاء",
			deliverablesAriaLabel: "مخرجات المتخصصين",
			researchTabLabel: "الأبحاث",
			untrustedBadgeExact: "[External Evidence - Untrusted]",
			qaStatusFailed: "فشل التحقق",
			proceedingButton: "جارٍ المتابعة...",
			tabOrion: "Orion (الاستراتيجية والمهام)",
			tabLyra: "Lyra (الأبحاث)",
			tabAthena: "Athena (المتطلبات PRD)",
			tabAtlas: "Atlas (المعمارية)",
			tabVector: "Vector (قواعد البيانات)",
			tabCipher: "Cipher (الكود)",
			tabSentinel: "Sentinel (الجودة والتحقق)",
			tabEcho: "Echo (التوثيق)",
			tabPrdLabel: "المتطلبات (PRD)",
			tabArchLabel: "المعمارية",
			tabTasksLabel: "قائمة المهام",
			tabCodeLabel: "الكود",
			tabQaLabel: "تقرير الجودة",
			tabDocsLabel: "التوثيق",
			tabVectorLabel: "مخطط البيانات",
			tabLyraLabel: "الأبحاث",
			roleOrchestrator: "منسق الفريق",
			roleResearcher: "باحث تقني",
			roleProductLead: "مسؤول المنتج",
			roleArchitect: "مهندس المعمارية",
			roleDataArchitect: "مهندس البيانات",
			roleEngineer: "مهندس البرمجيات",
			roleQaLead: "مسؤول الجودة",
			roleDocs: "التوثيق",
			cyberGallery: "معرض السايبربانك",
			cyberGalleryTitle: "فريق شخصيات الوكالة السايبربانكية",
			cyberGallerySubtitle:
				"شخصيات SVG عالية الدقة مع مؤشرات نشاط حية وتيليمتري لحالة العمل",
			cyberGalleryBadge: "8 شخصيات متخصصة",
			stateIdle: "جاهز / خامل",
			stateThinking: "تفكير / مسح ليزري",
			stateSpeaking: "تحدث / حوار بين الوكلاء",
			stateWorking: "عمل / تنفيذ الأدوات",
			stateCheckpoint: "بوابة فحص وموافقة",
			primaryDeliverable: "المخرج الأساسي",
			coreResponsibilities: "المسؤوليات الرئيسية",
			systemPromptSeed: "بذرة التوجيه الأساسي",
			statusLabel: "الحالة:",
			targetLabel: "الهدف:",
			warRoomTitle: "غرفة عمليات الوكالة",
			warRoomSubtitle: "بث عمليات سرب الوكلاء المستقل والبوابات التفاعلية",
			warRoomButton: "غرفة العمليات",
			splitScreen: "عرض منقسم",
			fullScreen: "ملء الشاشة",
			exitFullScreen: "إنهاء ملء الشاشة",
			closeWarRoom: "إغلاق غرفة العمليات",
			filterAll: "كافة الوكلاء",
			simulationPlay: "تشغيل السرب",
			simulationPause: "إيقاف مؤقت",
			simulationStep: "الخطوة التالية",
			simulationReset: "إعادة ضبط",
			checkpointGate1Title: "المحطة 1: اعتماد المعمارية والمواصفات",
			checkpointGate2Title: "المحطة 2: فحص الجودة قبل الشحن",
			requestChanges: "طلب تعديلات",
			checkpointApproved: "تم اعتماد المحطة",
			checkpointPending: "بانتظار موافقتك",
			checkpointRejected: "تم طلب تعديلات",
			handoffTo: "تسليم إلى",
			broadcastToAll: "بث لكافة الفريق",
			telemetryActiveSquad: "السرب النشط",
			telemetryMessages: "رسائل",
			telemetryToolCalls: "أدوات منفذة",
			stageStrategy: "الاستراتيجية وإجراءات التشغيل",
			stageResearch: "الأبحاث المعمقة",
			stageArchitecture: "المعمارية وهيكلة المهام",
			stageDevelopment: "التنفيذ البرمجي",
			stageQa: "فحص الجودة",
			stageDocumentation: "التوثيق الفني",
			deliverablesForSignOff: "المخرجات المطلوبة للاعتماد:",
			teamMemoryProposalsTitle: "تحديثات ذاكرة الفريق المقترحة",
			teamMemoryProposalsDesc:
				"راجع الدروس التشغيلية المكتشفة خلال هذه الجلسة قبل تثبيتها في الذاكرة الدائمة.",
			editProposal: "تعديل",
			saveProposal: "حفظ",
			approveProposal: "موافقة",
			excludeProposal: "استبعاد",
			learningTopicLabel: "الموضوع",
			learningContentLabel: "الدرس المستفاد",
			discardProposalsOnReject:
				"تجاهل مقترحات الذاكرة عند طلب التعديلات",
			proposalsApprovedBadge: "معتمد للحفظ",
			proposalsExcludedBadge: "مستبعد",
			proposalAttributionBy: "بواسطة",
			committedMemoryNoticeSingular:
				"(تم اعتماد توثيق واحد في ذاكرة الفريق)",
			committedMemoryNoticePlural:
				"(تم اعتماد {count} توثيقات في ذاكرة الفريق)",
			userDirective: "توجيه المستخدم:",
			cancel: "إلغاء",
			copyCodeSnippet: "نسخ الكود",
			codeSnippetCopied: "تم النسخ!",
			openArtifact: "فتح المخرج",
			outputLabel: "المخرجات:",
			liveSwarmBadge: "سرب نشط",
			gatePendingBadge: "بوابة معلقة",
			squadRosterLabel: "الفريق:",
			filterPersonaAria: "تصفية الرسائل",
			noFilteredMessages: "لا توجد رسائل مطابقة لهذا الوكيل.",
			ultraSopProtocol: "بروتوكول الحلقة المزدوجة Ultra SOP",
			directivePlaceholder: "أرسل أمراً مباشراً لسرب الوكلاء...",
			directiveReceived: "تم استلام التوجيه:",
			directiveRealigning: "يقوم Orion بإعادة ترتيب الأولويات وتوزيع المهام.",
			gateApprovedProceeding: "قام المستخدم بمراجعة واعتماد",
			proceedingImmediately: "المتابعة الفورية!",
			gateModificationsRequested: "طلب المستخدم تعديلات على",
			reallocatingResources: "يقوم Orion بإعادة توزيع الموارد لتعديل التصميم.",
			untrustedEvidenceBadge: "[أدلة خارجية - غير موثوقة]",
			sendButton: "إرسال",
			gate1Deliv1Title: "مواصفات المتطلبات PRD-001",
			gate1Deliv1Summary: "قصص المستخدم (P0, P1, P2) وحدود انعدام الثقة",
			gate1Deliv2Title: "معمارية النظام ومخطط المهام",
			gate1Deliv2Summary: "التسلسل الهيكلي للمكونات وعقود الحالة ونقاط الربط",
			gate2Deliv1Title: "تقرير تنفيذ الاختبارات",
			gate2Deliv1Summary:
				"نجاح كافة اختبارات Vitest الـ 180 بدون أي أخطاء تراجع.",
			gate2Deliv2Title: "سجل التغييرات الذري",
			gate2Deliv2Summary: "التحقق من تجزئات SHA-256 الأساسية ومعاملات التراجع.",
			scenarioMsg1:
				"بدء جلسة سرب Ultra SOP. نستهدف تنفيذاً عالي الموثوقية بالحلقة المزدوجة مع حدود بحث صفرية الثقة. Lyra، ابدئي جولة البحث الفني.",
			scenarioMsg2:
				"اكتملت جولة البحث. تم استخلاص 8 ادعاءات تم التحقق منها من وثائق المستودع والأدلة الثانوية. تم تأكيد عقد احتواء انعدام الثقة.",
			scenarioArtifactTitle: "حزمة الأدلة #842",
			scenarioArtifactSummary: "8 ادعاءات مؤكدة، 0 ترقيات غير موثوقة.",
			scenarioMsg3:
				"تمت صياغة PRD-001 مع قصص المستخدم P0 (غرفة العمليات المنقسمة)، P1 (فقاعات وكلاء SVG الحية)، P2 (بوابات التحقق). تسليم المتطلبات إلى Atlas لبناء المعمارية.",
			scenarioMsg4:
				"تمت صياغة المخطط المعماري. اكتمل تقسيم الوحدات مع تخطيط ResizablePanelGroup. إيقاف التنفيذ مؤقتاً عند بوابة التحقق 1 لموافقة المستخدم.",
			scenarioMsg5:
				"تمت الموافقة على بوابة التحقق 1! بدء التنفيذ الأساسي وبناء سياق غرفة العمليات وفقاعات الرسائل التفاعلية.",
			scenarioMsg6:
				"اكتمل تنفيذ الكود البرمجي. تم تشغيل الاختبارات: نجاح كافة اختبارات الوحدة الـ 180 وتأكيدات صور الوكلاء! تم الوصول لبوابة التحقق 2.",
			scenarioMsg7:
				"تم اعتماد بوابة التحقق 2! تمت مزامنة التوثيق الثنائي وسجل التغييرات. اكتمل تنفيذ سرب Ultra بنجاح.",
		},
	},
};

export function getLensLocale(): LensLocale {
	// English-only across LENS Workstation UI per design decision
	return "en";
}

export function getLensTranslations(locale?: LensLocale): LensTranslations {
	return LENS_TRANSLATIONS[locale ?? getLensLocale()];
}

export function getLensDirection(locale?: LensLocale): "ltr" | "rtl" {
	return (locale ?? getLensLocale()) === "ar" ? "rtl" : "ltr";
}
