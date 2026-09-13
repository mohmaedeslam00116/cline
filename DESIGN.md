---
name: LENS Workstation
description: Research, in focus.
colors:
  brand-violet: "#6e56cf"
  brand-violet-hover: "#7d66d9"
  focus-violet: "#6958ad"
  graphite-canvas: "#121216"
  graphite-surface: "#18191b"
  graphite-raised: "#212225"
  graphite-border: "#2f2f37"
  graphite-input: "#2e3135"
  text-primary: "#fcfcfd"
  text-muted: "#b0b4ba"
typography:
  headline:
    fontFamily: "Inter Variable, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: "1.875rem"
    letterSpacing: "-0.00625em"
  title:
    fontFamily: "Inter Variable, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: "1.75rem"
    letterSpacing: "-0.005em"
  body:
    fontFamily: "Inter Variable, sans-serif"
    fontSize: "0.93333rem"
    fontWeight: 400
    lineHeight: "1.4rem"
  label:
    fontFamily: "Inter Variable, sans-serif"
    fontSize: "0.8rem"
    fontWeight: 500
    lineHeight: "1rem"
    letterSpacing: "0.0025em"
  code:
    fontFamily: "Geist Mono Variable, ui-monospace, Consolas, monospace"
    fontSize: "0.86667rem"
    fontWeight: 400
    lineHeight: "1.25rem"
rounded:
  xs: "4px"
  sm: "6px"
  md: "8px"
  lg: "12px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.brand-violet}"
    textColor: "{colors.text-primary}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "8px 12px"
    height: "36px"
  button-primary-hover:
    backgroundColor: "{colors.brand-violet-hover}"
    textColor: "{colors.text-primary}"
  input:
    backgroundColor: "transparent"
    textColor: "{colors.text-primary}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "4px 12px"
    height: "36px"
  panel:
    backgroundColor: "{colors.graphite-surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "16px"
---

# Design System: LENS Workstation

## Overview

**Creative North Star: "The Focused Research Bench"**

LENS Workstation is a dense, precise Windows desktop harness for autonomous developer research and coding. It should feel native to a serious engineering tool: persistent navigation, information-rich split panes, compact controls, and clear agent state. The interface recedes so evidence, code, capability boundaries, and decisions stay in focus.

The visual identity pairs graphite tonal layers with a disciplined violet signal. Color marks selection, focus, and action—not decoration. Typography is quiet and technical, geometry is restrained, and motion explains state changes instead of adding spectacle.

**Key Characteristics:**

- Dark graphite hierarchy with violet operational signals.
- Compact, information-dense Windows desktop layouts.
- Inter for interface language and Geist Mono for code or machine data.
- Borders and tonal changes establish structure; effects remain restrained.
- Accessibility state is explicit in labels, focus rings, validation, and status text.

## Colors

The palette is a near-neutral graphite field with one focused violet voice and high-contrast text.

### Primary

- **Signal Violet:** the interactive accent for primary actions, selected navigation, and deliberate emphasis.
- **Lifted Violet:** the hover and pressed response for the primary accent.

### Neutral

- **Graphite Canvas:** the application background and deepest work surface.
- **Graphite Surface:** sidebars, cards, and persistent panels.
- **Raised Graphite:** selected rows, grouped controls, and secondary containers.
- **Structural Graphite:** borders and field outlines.
- **Paper White:** primary text and high-priority icons.
- **Instrument Gray:** supporting copy, metadata, and de-emphasized labels.

### Named Rules

**The One Signal Rule.** Violet identifies the current action or focus; do not scatter it across passive decoration.

**The Semantic Accent Rule.** Persona-specific neon colors may identify an avatar, but they never replace the application accent for controls.

## Typography

**Display Font:** Inter Variable (with sans-serif fallback)

**Body Font:** Inter Variable (with sans-serif fallback)

**Label/Mono Font:** Geist Mono Variable (with Consolas and monospace fallbacks)

**Character:** Inter keeps dense desktop controls legible without feeling generic, while Geist Mono separates prompts, paths, identifiers, and evidence from interface prose.

### Hierarchy

- **Headline** (600, 1.5rem, 1.875rem): top-level work-area titles.
- **Title** (600, 1.25rem, 1.75rem): panel and entity titles.
- **Body** (400, 0.93333rem, 1.4rem): descriptions, forms, and working content.
- **Label** (500, 0.8rem, 1rem): field labels, badges, and operational metadata.
- **Code** (400, 0.86667rem, 1.25rem): paths, Markdown, identifiers, and terminal-like content.

### Named Rules

**The Quiet Hierarchy Rule.** Build hierarchy with weight, spacing, and contrast before increasing type size.

## Layout

LENS uses a persistent left application rail and task-specific split panes. The Persona Studio establishes the pattern: a fixed, independently scrolling library beside a flexible editor; the editor command strip remains visible while long forms scroll. Use the 4px spacing base, with 8–16px for control rhythm and 24px for major section separation.

The shipping target is a resizable Windows desktop window. At constrained widths, panes may stack or controls may wrap to preserve reachability, but the product must not adopt mobile-first navigation or mobile visual conventions.

## Elevation & Depth

The system is flat by default. Depth comes from neighboring graphite tones, thin borders, and selected-row fills. Small shadows are reserved for detached overlays such as dialogs, popovers, and menus; persistent work surfaces should not float.

### Named Rules

**The Attached Surface Rule.** Tool panels belong to the workstation frame; reserve visible shadows for content that truly leaves that frame.

## Shapes

Controls use gently restrained corners: 4px for tight status elements, 6px for everyday buttons and fields, 8px for panels, and 12px only for larger detached surfaces. Avatar chassis can use their own geometric silhouettes, but surrounding controls stay rectangular and disciplined.

## Components

### Buttons

- **Shape:** compact, softly squared controls (6px radius; typically 36px high).
- **Primary:** Signal Violet with Paper White content and 8px × 12px padding.
- **Hover / Focus:** lift to the brighter violet; keyboard focus uses a visible three-pixel translucent ring.
- **Secondary / Ghost:** transparent or graphite surfaces with tonal hover feedback; destructive actions remain visually distinct.

### Chips

- **Style:** compact label-sized text, a quiet graphite fill or transparent background, and a one-pixel structural border.
- **State:** use chips for scope, immutability, capability category, and verification state—not as decorative tags.

### Cards / Containers

- **Corner Style:** restrained panel radius (8px).
- **Background:** Graphite Surface or Raised Graphite according to hierarchy.
- **Shadow Strategy:** none for attached panels; see Elevation & Depth for overlays.
- **Border:** one-pixel Structural Graphite.
- **Internal Padding:** 12–16px, increasing to 24px for major editor sections.

### Inputs / Fields

- **Style:** transparent or lightly tonal fill, one-pixel input border, 6px radius, compact 36px height.
- **Focus:** border shifts to the focus violet with a visible translucent ring.
- **Error / Disabled:** errors combine semantic color, `aria-invalid`, and a linked text message; disabled controls reduce opacity without losing their label.

### Navigation

The left rail uses compact 32px rows with icon, label, and tonal hover. Active destinations receive a Raised Graphite fill and stronger foreground contrast. Navigation remains persistent in desktop layouts and never competes with the current work title.

### Persona Chassis

Each persona has one of eight recognizable geometric chassis and a configurable neon accent. The same chassis must communicate idle, thinking, speaking, working, and checkpoint states without sacrificing the stable identity silhouette.

## Do's and Don'ts

### Do:

- **Do** use semantic tokens instead of isolated color literals.
- **Do** keep primary commands visible while long work surfaces scroll.
- **Do** expose identity, scope, capability, and validation state in text as well as color.
- **Do** preserve compact keyboard-friendly Windows desktop behavior when the window resizes.

### Don't:

- **Don't** use gradients, glassmorphism, or decorative glow on application chrome.
- **Don't** turn persona accent colors into competing control palettes.
- **Don't** inflate headings or whitespace until the workstation loses useful information density.
- **Don't** use raw external HTML for rendered research, prompts, or highlighted code.
