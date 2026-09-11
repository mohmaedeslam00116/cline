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
