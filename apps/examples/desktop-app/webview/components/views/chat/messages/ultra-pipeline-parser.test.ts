import { describe, expect, it } from "vitest";
import {
	parseArchitectDesign,
	parsePRD,
	parseProjectManagerTasks,
	parseQAFeedback,
	parseUltraPipeline,
} from "./ultra-pipeline-parser";

const SAMPLE_METAGPT_OUTPUT = `
# Ultra Mode: MetaGPT Multi-Agent Collaborative Framework

## Product Manager: PRD
### Product Goals
1. Create a user-friendly color meter
2. Real-time RGB updates

### User Stories
- As a user, I want to inspect screen colors so that I can get hex codes.
- As a designer, I want instant updates so that I can calibrate palettes.

### Competitive Analysis
- ColorCop: Simple but lacks real-time updates.
- Just Color Picker: Feature rich but cluttered.

### Requirement Pool
- ("GUI for color meter", "P0")
- ("RGB pixel sampling", "P0")
- ("Unit tests and CI", "P1")

### UI Design draft
Minimalist floating palette showing current hex/RGB values.

## Architect: System Design
### Implementation approach
Built with Tkinter and Pillow for cross-platform desktop pixel reading.

### Python package name
"color_meter"

### File list
- "main.py"
- "picker.py"
- "tests.py"

\`\`\`mermaid
classDiagram
    class ColorPicker {
        +get_color() str
        +sample_pixel(x, y) tuple
    }
\`\`\`

\`\`\`mermaid
sequenceDiagram
    User->>ColorPicker: click pixel
    ColorPicker->>Display: update RGB
\`\`\`

## Project Manager: Tasks
### Required third-party packages
- "Pillow>=9.0.0"
- "pytest>=7.0.0"

### Logic Analysis
- ("main.py", "Application entry point and GUI window")
- ("picker.py", "Pixel sampling engine and clipboard sync")
- ("tests.py", "Unit tests verifying color accuracy")

### Task list
- "picker.py"
- "main.py"
- "tests.py"

## QA Engineer: Verification & Executable Feedback
### Generated Unit tests
All tests passed in 0.42s (4 assertions).
Retry 0/3 - verification passed cleanly.
`;

describe("ultra-pipeline-parser", () => {
	it("parses PRD sections correctly", () => {
		const prd = parsePRD(SAMPLE_METAGPT_OUTPUT);
		expect(prd).toBeDefined();
		expect(prd?.goals.length).toBe(2);
		expect(prd?.goals[0]).toContain("color meter");
		expect(prd?.userStories.length).toBe(2);
		expect(prd?.competitiveAnalysis.length).toBe(2);
		expect(prd?.requirementPool.length).toBe(3);
		expect(prd?.requirementPool[0].priority).toBe("P0");
		expect(prd?.uiDesignDraft).toContain("Minimalist floating palette");
	});

	it("parses Architect System Design with Mermaid diagrams", () => {
		const arch = parseArchitectDesign(SAMPLE_METAGPT_OUTPUT);
		expect(arch).toBeDefined();
		expect(arch?.implementationApproach).toContain("Tkinter and Pillow");
		expect(arch?.packageName).toBe("color_meter");
		expect(arch?.fileList).toContain("main.py");
		expect(arch?.fileList).toContain("picker.py");
		expect(arch?.classDiagram).toContain("class ColorPicker");
		expect(arch?.sequenceDiagram).toContain("User->>ColorPicker");
	});

	it("parses Project Manager Tasks breakdown and DAG", () => {
		const tasks = parseProjectManagerTasks(SAMPLE_METAGPT_OUTPUT);
		expect(tasks).toBeDefined();
		expect(tasks?.packages).toContain("Pillow>=9.0.0");
		expect(tasks?.logicAnalysis.length).toBe(3);
		expect(tasks?.logicAnalysis[0].file).toBe("main.py");
		expect(tasks?.taskList).toEqual(["picker.py", "main.py", "tests.py"]);
	});

	it("parses QA feedback with retries and status", () => {
		const qa = parseQAFeedback(SAMPLE_METAGPT_OUTPUT);
		expect(qa).toBeDefined();
		expect(qa?.status).toBe("passed");
		expect(qa?.retries).toBe(0);
		expect(qa?.maxRetries).toBe(3);
	});

	it("parses full UltraPipeline", () => {
		const pipeline = parseUltraPipeline(SAMPLE_METAGPT_OUTPUT);
		expect(pipeline).not.toBeNull();
		expect(pipeline?.prd).toBeDefined();
		expect(pipeline?.architect).toBeDefined();
		expect(pipeline?.tasks).toBeDefined();
		expect(pipeline?.qa).toBeDefined();
	});

	it("parses Engineer code implementation", () => {
		const sampleWithEngineer = `${SAMPLE_METAGPT_OUTPUT}\n## Engineer: Code Implementation\n### Files Implemented\n- "picker.py"\n- "main.py"\n`;
		const pipeline = parseUltraPipeline(sampleWithEngineer);
		expect(pipeline).not.toBeNull();
		expect(pipeline?.engineer).toBeDefined();
		expect(pipeline?.engineer?.filesImplemented).toContain("picker.py");
		expect(pipeline?.engineer?.filesImplemented).toContain("main.py");
	});

	it("scopes rawMarkdown to MetaGPT sections preserving surrounding commentary", () => {
		const textWithSurroundings = `Here is my initial analysis before Ultra Mode.\n\n${SAMPLE_METAGPT_OUTPUT}\n\nLet me know if you want any modifications!`;
		const pipeline = parseUltraPipeline(textWithSurroundings);
		expect(pipeline).not.toBeNull();
		expect(pipeline?.rawMarkdown).not.toContain("Here is my initial analysis");
		expect(pipeline?.rawMarkdown).not.toContain(
			"Let me know if you want any modifications!",
		);
		expect(pipeline?.rawMarkdown).toContain("## Product Manager: PRD");
		expect(pipeline?.rawMarkdown).toContain("All tests passed in 0.42s");
	});

	it("returns null for non-MetaGPT ordinary chat text", () => {
		expect(parseUltraPipeline("Hello, how can I help you today?")).toBeNull();
		expect(parseUltraPipeline("")).toBeNull();
	});

	it("parses inter-agent collaboration feed entries", () => {
		const textWithFeed = `
[Orion -> Athena]: Requirements ingested. Draft the PRD focusing on P0 items.
[Atlas -> Athena]: System design proposes Supabase; confirm auth scope.
[Orion -> Cipher]: Blueprint approved by human director. Implement core files.
${SAMPLE_METAGPT_OUTPUT}
`;
		const pipeline = parseUltraPipeline(textWithFeed);
		expect(pipeline).not.toBeNull();
		expect(pipeline?.collaborationFeed).toHaveLength(3);
		expect(pipeline?.collaborationFeed[0]).toEqual({
			from: "Orion",
			to: "Athena",
			message: "Requirements ingested. Draft the PRD focusing on P0 items.",
		});
		expect(pipeline?.collaborationFeed[1].from).toBe("Atlas");
		expect(pipeline?.collaborationFeed[2].to).toBe("Cipher");
	});

	it("parses Checkpoint 1 and Checkpoint 2 gates awaiting approval", () => {
		const textWithCp1 = `${SAMPLE_METAGPT_OUTPUT}\n### CHECKPOINT 1: STRATEGY & BLUEPRINT AWAITING APPROVAL\n`;
		const pipeline1 = parseUltraPipeline(textWithCp1);
		expect(pipeline1?.checkpointStatus).toBeDefined();
		expect(pipeline1?.checkpointStatus?.gate).toBe(1);
		expect(pipeline1?.checkpointStatus?.isAwaitingApproval).toBe(true);

		const textWithCp2 = `${SAMPLE_METAGPT_OUTPUT}\n### CHECKPOINT 2: PRE-SHIP VERIFICATION COMPLETE\n`;
		const pipeline2 = parseUltraPipeline(textWithCp2);
		expect(pipeline2?.checkpointStatus).toBeDefined();
		expect(pipeline2?.checkpointStatus?.gate).toBe(2);
		expect(pipeline2?.checkpointStatus?.isAwaitingApproval).toBe(true);
	});

	it("parses specialist deliverables for Lyra and Vector", () => {
		const textWithSpecialists = `
## Lyra: Technical Research
### Research Findings
Benchmarked Prisma vs Drizzle for SQLite; selected Drizzle for zero overhead.

## Vector: Data Schemas
### Database Schema
CREATE TABLE users (id TEXT PRIMARY KEY, email TEXT NOT NULL);

${SAMPLE_METAGPT_OUTPUT}
`;
		const pipeline = parseUltraPipeline(textWithSpecialists);
		expect(pipeline).not.toBeNull();
		expect(pipeline?.lyra).toBeDefined();
		expect(pipeline?.lyra?.findings).toContain("Benchmarked Prisma vs Drizzle");
		expect(pipeline?.vector).toBeDefined();
		expect(pipeline?.vector?.schemas).toContain("CREATE TABLE users");
	});
});
