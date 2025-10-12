# Global Agent Guidelines

- When designing or updating UI components, avoid defaulting to purple color schemes. Explore diverse palettes so each experience feels distinct.
- When building applets that rely on OpenAI API calls, always use the Models List endpoint (GET /v1/models or `client.models.list()` in the official SDK) to refresh the available models for the provided API key. Filter the returned models into UI-friendly buckets (chat/vision/images/audio/embeddings), cache per key, handle unauthorized keys gracefully by keeping the last known list, and surface appropriate loading and error states.
