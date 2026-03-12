# FlowAssist Career

FlowAssist Career to aplikacja do szybkiej transformacji danych CV w kompletne wyniki kariery:
- ustrukturyzowane CV,
- analiza profilu zawodowego,
- roadmapy rozwoju (conservative / ambitious / pivot),
- PDF generowany ze struktury danych (bez obrazkowego layoutu AI).

## Co robi aplikacja

### 1) Start (wejscie)
Na zakladce `Start` uzytkownik:
- dolacza CV (`PDF`, `DOCX`, `JPG`, `PNG`),
- opcjonalnie wkleja dane tekstowe,
- dopisuje kontekst (np. zmiana branzy, rynek docelowy),
- uruchamia analize jednym CTA.

### 2) Unified Ingestion Pipeline
Router ingestii (`src/lib/ingestion/router.ts`) obsluguje 4 typy wejscia:
- `PDF` -> ekstrakcja tekstu lub fallback multimodal,
- `DOCX` -> ekstrakcja tekstu,
- `JPG/PNG` -> parsowanie multimodalne,
- sam tekst -> normalizacja bez pliku.

Kazde wejscie zwraca ten sam kontrakt:
- `rawText`
- `normalizedCv`
- `confidence`
- `warnings`

### 3) Structured CV Generation
Warstwa AI (`src/services/aiService.ts`) buduje dane dokumentu:
- `generateStructuredCv()`
- `generateCareerAnalysis()`
- `generateCareerRoadmaps()`

Funkcja `generateVisualCV()` jest oznaczona jako deprecated i nie jest uzywana w glownym flow.

### 4) Career Intelligence
Silnik inteligencji kariery (`src/lib/career/intelligence.ts`) wylicza:
- szacowana obecna rola,
- poziom seniority,
- najsilniejsze kompetencje,
- luki kompetencyjne,
- 3 warianty roadmap z uzasadnieniem, timeline, ryzykiem i next actions.

### 5) Wynik i PDF
Zakladka `CV` pokazuje:
- nowe CV,
- profil zawodowy,
- braki kompetencyjne,
- mozliwe kierunki,
- plan dzialania,
- przycisk pobrania PDF.

PDF renderowany jest z danych strukturalnych przez:
- `src/lib/renderers/pdfRenderer.ts`
- `src/services/pdfService.ts`

Opcjonalna warstwa ATS pozostaje wspierana.

### 6) Nawigacja produktu
Dolna, persistent nawigacja:
- `START`
- `CV`
- `PLAN`
- `PROFIL`

Routing tabow jest utrzymywany przez hash + stan aplikacji.

### 7) Persistencja i historia
Warstwa persistencji (`src/lib/persistence/*`) przechowuje:
- `CareerProfile`
- `CareerAnalysis`
- `CareerRoadmap`
- `GeneratedCvVersion`

Uzytkownik moze wracac do historii i otwierac poprzednie wersje.

### 8) Embedding hooks (placeholder)
Przygotowane miejsca pod dalsza integracje:
- `src/lib/embeddings/provider.ts`
- `src/lib/embeddings/similarity.ts`
- `src/lib/embeddings/memory.ts`

TODO oznacza miejsca, gdzie ma wejsc Gemini Embedding 2.

## Struktura projektu (najwazniejsze)

- `src/components/` - UI i ekrany zakladek
- `src/state/AppState.tsx` - glowny store aplikacji
- `src/lib/ingestion/` - routing wejscia CV
- `src/lib/career/` - logika inteligencji kariery
- `src/lib/renderers/` - render dokumentu PDF
- `src/lib/persistence/` - lokalna warstwa historii i profilu
- `src/services/` - orchestration AI + PDF
- `src/types.ts` - kontrakty domenowe

## Wymagania

- Node.js 20+
- NPM
- klucz Gemini w `.env.local`

## Konfiguracja lokalna

1. Zainstaluj zaleznosci:
   ```bash
   npm install
   ```

2. Utworz `.env.local` na bazie `.env.example` i ustaw:
   ```env
   GEMINI_API_KEY=...
   ```

3. Uruchom dev server:
   ```bash
   npm run dev
   ```

## Skrypty

- `npm run dev` - start lokalny
- `npm run lint` - typecheck (`tsc --noEmit`)
- `npm run build` - build produkcyjny
- `npm run preview` - podglad buildu

## Notatki produktowe

- Interfejs utrzymuje premium terminal aesthetic i mobile-first.
- AI ma byc warstwa "embedded", nie chatbot-first.
- Wejscie jest szybkie: jeden ekran startowy, jedna glowna akcja.

## Dokumenty pomocnicze

- migracja i decyzje: `docs/migration-notes.md`
- przykladowe dane testowe: `examples/test-cv-input.txt`
- przykladowy roadmap JSON: `examples/generated-roadmap.json`
