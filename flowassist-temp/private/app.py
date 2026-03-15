# /// script
# requires-python = "==3.11.*"
# dependencies = [
#   "codewords-client==0.4.5",
#   "fastapi==0.116.1",
#   "openai==1.99.7"
# ]
# [tool.env-checker]
# env_vars = [
#   "PORT=8000",
#   "LOGLEVEL=INFO",
#   "CODEWORDS_API_KEY",
#   "CODEWORDS_RUNTIME_URI"
# ]
# ///

from textwrap import dedent
from codewords_client import logger, run_service
from fastapi import FastAPI
from pydantic import BaseModel, Field
from openai import AsyncOpenAI


# -- Models --

class SuggestedSection(BaseModel):
    type: str = Field(..., description="Section type: intro, verse, pre-chorus, chorus, post-chorus, bridge, breakdown, outro, hook, ad-lib, interlude")
    label: str = Field(..., description="Display label for the section")
    description: str = Field(..., description="Brief description of what this section should contain")
    suggested_lines: int = Field(..., description="Suggested number of lines")

class StructureResponse(BaseModel):
    sections: list[SuggestedSection] = Field(..., description="Suggested song sections in order")
    explanation: str = Field(..., description="Why this structure works")
    tips: list[str] = Field(..., description="Writing tips")

class StructureRequest(BaseModel):
    genre: str = Field(..., description="Music genre")
    mood: str = Field("", description="Mood or atmosphere")
    theme: str = Field("", description="Theme or topic")
    style_notes: str = Field("", description="Additional style notes")

class ParsedSection(BaseModel):
    type: str = Field(..., description="Detected section type")
    label: str = Field(..., description="Display label")
    lyrics: str = Field(..., description="Lyrics for this section")

class ParseResponse(BaseModel):
    sections: list[ParsedSection] = Field(..., description="Detected sections")
    detected_genre: str = Field(..., description="Detected genre")
    detected_mood: str = Field(..., description="Detected mood")
    notes: str = Field(..., description="Notes about the text")

class ParseRequest(BaseModel):
    text: str = Field(..., description="Raw lyrics text to parse")
    genre_hint: str = Field("", description="Optional genre hint")

class RhymeSuggestion(BaseModel):
    original_line: str = Field(..., description="The original line")
    suggestions: list[str] = Field(..., description="Alternative lines")
    rhyme_words: list[str] = Field(..., description="Rhyming words")

class RhymeResponse(BaseModel):
    suggestions: list[RhymeSuggestion] = Field(..., description="Per-line suggestions")
    flow_feedback: str = Field(..., description="Overall flow feedback")
    improved_version: str = Field(..., description="Improved version of the section")

class RhymeRequest(BaseModel):
    lyrics: str = Field(..., description="Current lyrics")
    section_type: str = Field("verse", description="Section type")
    genre: str = Field("hip-hop", description="Genre")
    mood: str = Field("", description="Desired mood")
    language: str = Field("polish", description="Language")


# -- AI Logic --

async def suggest_structure(req: StructureRequest) -> StructureResponse:
    client = AsyncOpenAI()
    prompt = dedent("""\
        You are an expert music producer and songwriter specializing in {genre} music.

        Suggest a complete song structure for a {genre} song.
        Mood: {mood}
        Theme: {theme}
        Additional notes: {style_notes}

        Use section types from: intro, verse, pre-chorus, chorus, post-chorus, bridge, breakdown, outro, hook, ad-lib, interlude.
        Labels should be in Polish (e.g. "Zwrotka 1", "Refren", "Bridge").
        Tips should be practical and specific to this genre.\
        """).format(
        genre=req.genre or "hip-hop",
        mood=req.mood or "uniwersalny",
        theme=req.theme or "dowolny",
        style_notes=req.style_notes or "brak"
    )
    response = await client.beta.chat.completions.parse(
        model="gpt-5-mini",
        messages=[
            {"role": "system", "content": "You are an expert music producer. Respond in Polish. Help songwriters structure songs professionally."},
            {"role": "user", "content": prompt}
        ],
        response_format=StructureResponse,
        reasoning_effort="low",
        max_completion_tokens=2048,
    )
    return response.choices[0].message.parsed


async def parse_lyrics(req: ParseRequest) -> ParseResponse:
    client = AsyncOpenAI()
    prompt = dedent("""\
        Analyze the following song lyrics and split them into sections.

        Genre hint: {genre_hint}

        <lyrics>
        {text}
        </lyrics>

        Detect sections like: intro, verse, pre-chorus, chorus, bridge, outro, hook, ad-lib, interlude.
        Label them in Polish. If you detect repeated sections, number them.
        Also detect the genre and mood.\
        """).format(
        genre_hint=req.genre_hint or "nieznany",
        text=req.text
    )
    response = await client.beta.chat.completions.parse(
        model="gpt-5-mini",
        messages=[
            {"role": "system", "content": "You are an expert music analyst. Respond in Polish. Analyze lyrics precisely."},
            {"role": "user", "content": prompt}
        ],
        response_format=ParseResponse,
        reasoning_effort="low",
        max_completion_tokens=3000,
    )
    return response.choices[0].message.parsed


async def suggest_rhymes(req: RhymeRequest) -> RhymeResponse:
    client = AsyncOpenAI()
    prompt = dedent("""\
        Analyze these {section_type} lyrics in a {genre} song.
        Language: {language}
        Mood: {mood}

        <lyrics>
        {lyrics}
        </lyrics>

        For each line:
        1. Suggest alternative lines that rhyme better or flow better
        2. List words that rhyme with the ending word

        Then provide overall flow feedback and an improved version of the entire section.
        Keep the same meaning and vibe but improve rhymes, rhythm, and flow.
        If the lyrics are in Polish, respond in Polish and suggest Polish rhymes.\
        """).format(
        section_type=req.section_type,
        genre=req.genre,
        language=req.language,
        mood=req.mood or "dowolny",
        lyrics=req.lyrics
    )
    response = await client.beta.chat.completions.parse(
        model="gpt-5-mini",
        messages=[
            {"role": "system", "content": "You are an expert lyricist and ghostwriter. Help improve lyrics with better rhymes and flow. Match the language of the input lyrics."},
            {"role": "user", "content": prompt}
        ],
        response_format=RhymeResponse,
        reasoning_effort="low",
        max_completion_tokens=3000,
    )
    return response.choices[0].message.parsed


# -- Unified Request/Response --

class AIRequest(BaseModel):
    """Unified request for all Song Scenario AI operations."""
    action: str = Field(..., description="Action to perform: 'structure', 'parse', or 'rhymes'")
    # Structure fields
    genre: str = Field("", description="Music genre (for structure/rhymes)")
    mood: str = Field("", description="Mood or atmosphere")
    theme: str = Field("", description="Theme or topic (for structure)")
    style_notes: str = Field("", description="Additional style notes (for structure)")
    # Parse fields
    text: str = Field("", description="Raw lyrics text to parse")
    genre_hint: str = Field("", description="Genre hint for parsing")
    # Rhyme fields
    lyrics: str = Field("", description="Lyrics to analyze (for rhymes)")
    section_type: str = Field("verse", description="Section type (for rhymes)")
    language: str = Field("polish", description="Language of lyrics")

class AIResponse(BaseModel):
    """Unified response for all operations."""
    action: str = Field(..., description="Which action was performed")
    # Structure response
    structure_sections: list[SuggestedSection] = Field(default_factory=list, description="Suggested sections")
    explanation: str = Field("", description="Structure explanation")
    tips: list[str] = Field(default_factory=list, description="Writing tips")
    # Parse response
    parsed_sections: list[ParsedSection] = Field(default_factory=list, description="Parsed sections")
    detected_genre: str = Field("", description="Detected genre")
    detected_mood: str = Field("", description="Detected mood")
    parse_notes: str = Field("", description="Parse notes")
    # Rhyme response
    rhyme_suggestions: list[RhymeSuggestion] = Field(default_factory=list, description="Rhyme suggestions")
    flow_feedback: str = Field("", description="Flow feedback")
    improved_version: str = Field("", description="Improved lyrics")


# -- FastAPI App --

app = FastAPI(
    title="Song Scenario AI",
    description="AI backend for Song Scenario Builder - structure suggestions, lyrics parsing, rhyme assistance",
    version="1.0.0",
)


@app.post("/", response_model=AIResponse)
async def main_endpoint(request: AIRequest) -> AIResponse:
    """Unified AI endpoint. Use 'action' field to select operation: 'structure', 'parse', or 'rhymes'."""
    if request.action == "structure":
        logger.info("STEPLOG START suggest_structure")
        logger.info("Suggesting structure", genre=request.genre, mood=request.mood)
        result = await suggest_structure(StructureRequest(
            genre=request.genre, mood=request.mood, theme=request.theme, style_notes=request.style_notes
        ))
        return AIResponse(
            action="structure",
            structure_sections=result.sections,
            explanation=result.explanation,
            tips=result.tips,
        )
    elif request.action == "parse":
        logger.info("STEPLOG START parse_lyrics")
        logger.info("Parsing lyrics", text_length=len(request.text))
        result = await parse_lyrics(ParseRequest(text=request.text, genre_hint=request.genre_hint))
        return AIResponse(
            action="parse",
            parsed_sections=result.sections,
            detected_genre=result.detected_genre,
            detected_mood=result.detected_mood,
            parse_notes=result.notes,
        )
    elif request.action == "rhymes":
        logger.info("STEPLOG START suggest_rhymes")
        logger.info("Suggesting rhymes", section_type=request.section_type, genre=request.genre)
        result = await suggest_rhymes(RhymeRequest(
            lyrics=request.lyrics, section_type=request.section_type,
            genre=request.genre, mood=request.mood, language=request.language
        ))
        return AIResponse(
            action="rhymes",
            rhyme_suggestions=result.suggestions,
            flow_feedback=result.flow_feedback,
            improved_version=result.improved_version,
        )
    else:
        raise ValueError(f"Unknown action: {request.action}. Use 'structure', 'parse', or 'rhymes'.")


if __name__ == "__main__":
    run_service(app)
