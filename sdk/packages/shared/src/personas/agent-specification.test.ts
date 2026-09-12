import { describe, expect, it } from "vitest";
import {
	AgentChassisSchema,
	AgentFrontmatterSchema,
	AgentStageSchema,
	parseAgentSpecification,
	serializeAgentSpecification,
} from "./agent-specification";

describe("Universal Agent Specification (.agent.md)", () => {
	const validSpec = `---
id: solidity-auditor
name: Solidity Auditor
version: 1.2.0
description: Specialist in smart contract auditing, reentrancy detection, and formal verification
role: Security Auditor
stage: qa
avatar:
  chassis: sentinel
  accentColor: "#10b981"
tools:
  - read_file
  - run_command
toolPolicy: require_approval
model: claude-3-7-sonnet
temperature: 0.2
---

# Solidity Auditor Guidelines
You are an expert smart contract security auditor specializing in EVM bytecode analysis, Slither AST checks, and Foundry invariant tests.
Always verify CEI (Checks-Effects-Interactions) patterns before certifying any transfer function.
`;

	describe("parseAgentSpecification", () => {
		it("successfully parses valid .agent.md content into CustomPersonaRecord", () => {
			const result = parseAgentSpecification(validSpec, {
				scope: "workspace",
				filePath: "/path/to/.lens/personas/solidity-auditor.agent.md",
			});

			expect(result.success).toBe(true);
			expect(result.persona).toBeDefined();
			expect(result.errors).toBeUndefined();

			const persona = result.persona!;
			expect(persona.frontmatter.id).toBe("solidity-auditor");
			expect(persona.frontmatter.name).toBe("Solidity Auditor");
			expect(persona.frontmatter.version).toBe("1.2.0");
			expect(persona.frontmatter.description).toContain(
				"smart contract auditing",
			);
			expect(persona.frontmatter.role).toBe("Security Auditor");
			expect(persona.frontmatter.stage).toBe("qa");
			expect(persona.frontmatter.avatar.chassis).toBe("sentinel");
			expect(persona.frontmatter.avatar.accentColor).toBe("#10b981");
			expect(persona.frontmatter.tools).toEqual([
				"read_file",
				"run_command",
			]);
			expect(persona.frontmatter.toolPolicy).toBe("require_approval");
			expect(persona.frontmatter.model).toBe("claude-3-7-sonnet");
			expect(persona.frontmatter.temperature).toBe(0.2);
			expect(persona.scope).toBe("workspace");
			expect(persona.filePath).toBe(
				"/path/to/.lens/personas/solidity-auditor.agent.md",
			);
			expect(persona.isBuiltin).toBe(false);
			expect(persona.instructions).toContain(
				"You are an expert smart contract security auditor",
			);
		});

		it("handles Windows CRLF line endings and UTF-8 BOM seamlessly", () => {
			const crlfSpec = `\uFEFF---\r\nid: win-agent\r\nname: Win Agent\r\ndescription: Test Windows CRLF\r\nrole: Tester\r\nstage: development\r\navatar:\r\n  chassis: cipher\r\n  accentColor: "#3b82f6"\r\n---\r\n\r\nInstructions with CRLF\r\n`;
			const result = parseAgentSpecification(crlfSpec);

			expect(result.success).toBe(true);
			expect(result.persona?.frontmatter.id).toBe("win-agent");
			expect(result.persona?.instructions).toBe(
				"Instructions with CRLF",
			);
		});

		it("applies sensible defaults for optional frontmatter fields", () => {
			const minimalSpec = `---
id: minimal-agent
name: Minimal Agent
description: Basic description
role: Worker
stage: research
avatar:
  chassis: lyra
  accentColor: cyan
---

Minimal instructions
`;
			const result = parseAgentSpecification(minimalSpec);

			expect(result.success).toBe(true);
			expect(result.persona?.frontmatter.version).toBe("1.0.0");
			expect(result.persona?.frontmatter.tools).toEqual([]);
			expect(result.persona?.frontmatter.toolPolicy).toBe("auto");
			expect(result.persona?.frontmatter.model).toBeUndefined();
			expect(result.persona?.frontmatter.temperature).toBeUndefined();
		});

		it("returns error diagnostics when input is empty or whitespace", () => {
			const result = parseAgentSpecification("   ");
			expect(result.success).toBe(false);
			expect(result.errors).toEqual(["Agent specification content is empty"]);
		});

		it("returns error diagnostics when frontmatter delimiters are missing", () => {
			const result = parseAgentSpecification(
				"# Just Markdown\nWithout frontmatter",
			);
			expect(result.success).toBe(false);
			expect(result.errors?.[0]).toContain(
				"Missing or malformed YAML frontmatter",
			);
		});

		it("returns error diagnostics when YAML syntax is invalid", () => {
			const malformedYaml = `---
id: bad-yaml
name: [unclosed array
stage: research
---
Body
`;
			const result = parseAgentSpecification(malformedYaml);
			expect(result.success).toBe(false);
			expect(result.errors?.[0]).toContain("YAML parse error");
		});

		it("returns error diagnostics when YAML evaluates to a primitive or array", () => {
			const arrayYaml = `---
- item1
- item2
---
Body
`;
			const result = parseAgentSpecification(arrayYaml);
			expect(result.success).toBe(false);
			expect(result.errors?.[0]).toContain(
				"YAML frontmatter must evaluate to an object",
			);
		});

		it("validates field schemas and identifies specific validation failures", () => {
			const invalidFieldsSpec = `---
id: "Invalid ID with Caps and Spaces!"
name: ""
description: ""
role: ""
stage: invalid_stage
avatar:
  chassis: invalid_chassis
  accentColor: "invalid-color-12345!"
tools: "not an array"
temperature: 99
---
`;
			const result = parseAgentSpecification(invalidFieldsSpec);
			expect(result.success).toBe(false);
			expect(result.errors?.length).toBeGreaterThanOrEqual(6);

			const errorText = result.errors!.join("\n");
			expect(errorText).toContain("[id]");
			expect(errorText).toContain("[name]");
			expect(errorText).toContain("[stage]");
			expect(errorText).toContain("[avatar.chassis]");
			expect(errorText).toContain("[avatar.accentColor]");
			expect(errorText).toContain("[tools]");
			expect(errorText).toContain("[temperature]");
		});
	});

	describe("serializeAgentSpecification", () => {
		it("serializes frontmatter and instructions into valid .agent.md", () => {
			const frontmatter = {
				id: "mobile-dev",
				name: "Mobile Developer",
				version: "2.1.0",
				description: "Flutter & React Native cross-platform architect",
				role: "Mobile Specialist",
				stage: "development" as const,
				avatar: {
					chassis: "vector" as const,
					accentColor: "#f59e0b",
				},
				tools: ["read_file", "edit_file"],
				toolPolicy: "auto" as const,
				model: "claude-3-5-sonnet",
				temperature: 0.7,
			};
			const instructions =
				"# Mobile Guidelines\nAlways ensure 60fps animations.";

			const serialized = serializeAgentSpecification(
				frontmatter,
				instructions,
			);
			expect(serialized).toContain("---");
			expect(serialized).toContain("id: mobile-dev");
			expect(serialized).toContain("chassis: vector");
			expect(serialized).toContain("accentColor: \"#f59e0b\"");
			expect(serialized).toContain(
				"# Mobile Guidelines\nAlways ensure 60fps animations.",
			);

			// Verify round-trip parsing matches original
			const parsed = parseAgentSpecification(serialized);
			expect(parsed.success).toBe(true);
			expect(parsed.persona?.frontmatter).toEqual(frontmatter);
			expect(parsed.persona?.instructions).toBe(instructions);
		});

		it("serializes cleanly when instructions are empty", () => {
			const frontmatter = {
				id: "bare-agent",
				name: "Bare Agent",
				version: "1.0.0",
				description: "No instructions agent",
				role: "Worker",
				stage: "architecture" as const,
				avatar: {
					chassis: "athena" as const,
					accentColor: "#8b5cf6",
				},
				tools: [],
				toolPolicy: "auto" as const,
			};

			const serialized = serializeAgentSpecification(frontmatter, "");
			expect(serialized.startsWith("---\n")).toBe(true);
			expect(serialized.endsWith("---\n")).toBe(true);

			const parsed = parseAgentSpecification(serialized);
			expect(parsed.success).toBe(true);
			expect(parsed.persona?.instructions).toBe("");
		});
	});

	describe("Zod Enum Integrity", () => {
		it("covers all 6 official stages", () => {
			expect(AgentStageSchema.options).toEqual([
				"strategy",
				"research",
				"architecture",
				"development",
				"qa",
				"documentation",
			]);
		});

		it("covers all 8 Cyberpunk vector chassis", () => {
			expect(AgentChassisSchema.options).toEqual([
				"orion",
				"lyra",
				"athena",
				"atlas",
				"cipher",
				"vector",
				"sentinel",
				"echo",
			]);
		});
	});
});
