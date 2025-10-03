# GPT-5 Personas Chat – Multi-Agent Instructions

Here’s a fast snapshot + a ready-to-use multi-agent spec you can hand to any AI/dev tool.

## What the App Does (Bullet Overview)

- Runs a two-persona chat that auto-alternates replies (A ↔ B).
- Lets you set name, emoji avatar, prompt, and bubble background color for each persona.
- Moderator input: add a guiding message and extend the discussion by X more exchanges at any time.
- Typing indicators show who’s composing on each turn.
- Separate screens: Setup (API/model/settings/personas/history) and Chat (conversation + extend/save).
- Model + temperature controls with safe clamping (0–2) to avoid temp-format errors.
- Memory: save, load, and delete past conversations (stored in localStorage).
- Clipboard-friendly API key input with optional “remember locally”.
- Vanilla, single-file HTML/JS (no external libraries) for maximum compatibility.

## agents.yaml (Handoff File for Other AI)

```yaml
project:
  name: "GPT-5 Personas Chat"
  version: "2.0"
  overview: >
    A no-dependency (vanilla HTML+JS) two-persona debate/sandbox that alternates turns,
    supports moderator-directed extensions, conversation memory, and per-persona styling.

  primary_objectives:
    - Maintain a robust, dependency-free build that runs in mobile browsers.
    - Provide an ergonomic Setup screen and a clean Chat screen.
    - Ensure reliable OpenAI API calls with guardrails for temperature and errors.
    - Persist conversations and settings locally without a backend.

  success_criteria:
    - Openable on Android/iOS/desktop directly from local storage/downloads.
    - No console errors in Chrome/Edge/Safari mobile and desktop.
    - Conversations can be saved/loaded/deleted; visual state remains consistent.
    - Moderator “Extend Discussion” executes exactly N new exchanges (A↔B) with guidance applied.
```
