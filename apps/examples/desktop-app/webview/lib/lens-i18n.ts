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
		readonly pendingNow: string;
		readonly iteration: string;
		readonly request: string;
	};
	readonly sidebar: {
		readonly evidenceAndClaims: string;
		readonly evidenceTooltip: string;
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
			pendingNow: "Pending now",
			iteration: "Iteration",
			request: "Request",
		},
		sidebar: {
			evidenceAndClaims: "Evidence & Claims",
			evidenceTooltip: "View research evidence bundles and policy checkpoints",
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
			pendingNow: "معلق الآن",
			iteration: "التكرار",
			request: "الطلب",
		},
		sidebar: {
			evidenceAndClaims: "الأدلة والادعاءات",
			evidenceTooltip: "عرض حزم أدلة البحث ونقاط تفتيش السياسة",
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
