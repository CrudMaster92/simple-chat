# Simple Chat Applet – Working Notes

This guidance applies only to files inside `dashboard/applets/simple-chat/`.

## Applet Scope
- The app is a two-persona chat simulator that alternates turns (A ↔ B) with configurable names, emojis, prompts, and bubble colors.
- Users can add a moderator message, choose the number of extra exchanges, and watch typing indicators for each persona.
- Setup and Chat live on separate screens. Setup covers OpenAI API settings, persona presets, and conversation history controls; Chat handles the live discussion and moderator extensions.
- The UI is vanilla HTML/CSS/JS with no external dependencies. Keep it lightweight and mobile-friendly.

## Functional Expectations
- Model selection and temperature inputs must validate/clamp values (temperature stays within 0–2) before making API calls.
- Conversation memory persists in `localStorage`; saving, loading, and deleting history must remain reliable.
- Extending a discussion should produce exactly the requested number of persona exchanges with the moderator guidance applied.

## Working Conventions
- Favor small, composable functions over sprawling ones and keep persona configuration logic close to UI handlers in `app.js`.
- Avoid adding build tooling or package managers; stay with the single-file static approach unless the task explicitly expands the scope.
- Retain the existing `agents.yaml` as a quick spec handoff for other tools. Update it in tandem with functional changes that alter objectives or success criteria.
