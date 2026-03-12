# FlowAssist Career Refactor Notes

## What changed
- Replaced editor-like bottom navigation with product tabs: Start, CV, Plan, Profil.
- Added persistent hash routing and app state context.
- Replaced image-first CV generation with structured CV + PDF renderer.
- Added unified ingestion router for PDF, DOCX, image, and pasted text.
- Added career intelligence and history persistence using local storage models.
- Added embedding placeholder hooks for future Gemini Embedding 2 integration.

## Migration notes
- `generateVisualCV()` is deprecated and should not be used in new flows.
- `compileATSFriendlyPDF()` now renders from `StructuredCvDocument` instead of image bytes.
- `Step1Input` accepts a single primary CV file plus text/context fields.
- `ui-lab` is excluded from root type-checking to keep the main app validation stable.

## Next sprint suggestions
- Move persistence from localStorage to a real SQLite-backed repository.
- Add dynamic imports for heavier tabs to reduce the 500 kB chunk warning.
- Add dedicated parser dependencies for offline PDF and DOCX extraction when needed.
