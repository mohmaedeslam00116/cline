/**
 * Post-Edit Validation Subsystem
 *
 * Automated compiler/linter syntax checking and self-correction hooks for @cline/core.
 */

export {
	detectWorkspaceValidators,
	findValidatorsForFile,
} from "./detector";
export {
	createPostEditValidationExtension,
	createPostEditValidationHooks,
	extractModifiedFilesFromEditor,
	extractModifiedFilesFromPatch,
	formatValidationDiagnostics,
	POST_EDIT_VALIDATION_EXTENSION_NAME,
} from "./post-edit-validation";
export {
	DEFAULT_MAX_OUTPUT_CHARS,
	DEFAULT_VALIDATION_TIMEOUT_MS,
	defaultValidationRunner,
} from "./runner";
export type {
	CorePostEditValidationConfig,
	PostEditValidationOptions,
	PostEditValidationRunner,
	ValidationDiagnostic,
	ValidationRunnerResult,
	ValidatorDefinition,
} from "./types";
