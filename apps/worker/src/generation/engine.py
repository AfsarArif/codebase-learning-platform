"""
Content generation engine.

Transforms repository knowledge into educational assets:
lessons, flashcards, quizzes, mini-games, and interview questions.
"""

import json
import logging
from dataclasses import dataclass
from typing import Any

from ..config import config

logger = logging.getLogger(__name__)


@dataclass
class GeneratedLesson:
    """A generated learning lesson."""

    title: str
    description: str
    order_index: int
    difficulty: str
    estimated_minutes: int
    content_markdown: str
    track: str | None = None
    concept_id: str | None = None
    resources: list[dict] | None = None


@dataclass
class GeneratedFlashcard:
    """A generated flashcard."""

    front_text: str
    back_text: str
    tags: list[str]
    difficulty: str


@dataclass
class GeneratedQuiz:
    """A generated quiz."""

    title: str
    quiz_type: str
    questions: list[dict]


@dataclass
class GeneratedInterviewQuestion:
    """A generated interview question."""

    question_type: str
    prompt_text: str
    reference_answer: str
    difficulty: str
    tags: list[str]
    source_files: list[str]


class ContentGenerationEngine:
    """
    Generates educational content from repository analysis data.

    Uses LLM prompts to transform codebase understanding into
    structured lessons, flashcards, quizzes, and interview questions.
    """

    def __init__(self, llm_client: Any | None = None):
        self.llm = llm_client

    def generate_lessons(
        self,
        repo_name: str,
        concepts: list[dict],
        architecture: dict,
        track: str = "newcomer",
    ) -> list[GeneratedLesson]:
        """
        Generate a sequence of learning lessons from repository concepts.
        """
        lessons = []
        for i, concept in enumerate(concepts):
            lesson = GeneratedLesson(
                title=f"Lesson {i + 1}: {concept.get('name', 'Unknown Concept')}",
                description=concept.get('description', ''),
                order_index=i + 1,
                difficulty=concept.get('difficulty', 'beginner'),
                estimated_minutes=concept.get('estimated_minutes', 15),
                content_markdown=self._generate_lesson_content(
                    repo_name, concept, architecture
                ),
                track=track,
                concept_id=concept.get('id'),
                resources=concept.get('resources', []),
            )
            lessons.append(lesson)

        return lessons

    def generate_flashcards(
        self,
        repo_name: str,
        concepts: list[dict],
        count: int = 20,
        difficulty: str = "beginner",
    ) -> list[GeneratedFlashcard]:
        """
        Generate flashcards from repository concepts.
        """
        flashcards = []

        for concept in concepts[:count]:
            # File → Responsibility mapping
            if concept.get('files'):
                for f in concept['files'][:3]:
                    flashcards.append(GeneratedFlashcard(
                        front_text=f"What is the purpose of `{f}`?",
                        back_text=concept.get('description', f'A file in the {repo_name} codebase.'),
                        tags=[concept.get('name', 'general'), 'file-mapping'],
                        difficulty=difficulty,
                    ))

            # Concept → Definition
            flashcards.append(GeneratedFlashcard(
                front_text=f"What is {concept.get('name', 'this concept')}?",
                back_text=concept.get('description', 'A concept in the codebase.'),
                tags=[concept.get('name', 'general'), 'definition'],
                difficulty=difficulty,
            ))

        return flashcards

    def generate_quiz(
        self,
        repo_name: str,
        concepts: list[dict],
        count: int = 10,
        difficulty: str = "beginner",
    ) -> GeneratedQuiz:
        """
        Generate a quiz with questions about the repository.
        """
        questions = []
        for i, concept in enumerate(concepts[:count]):
            questions.append({
                "id": f"q_{i}",
                "text": f"Which directory contains {concept.get('name', 'this feature')}?",
                "type": "multiple_choice",
                "options": [
                    concept.get('path', 'src/'),
                    "tests/",
                    "docs/",
                    "config/",
                ],
                "correctAnswer": concept.get('path', 'src/'),
                "explanation": concept.get('description', ''),
                "difficulty": difficulty,
            })

        return GeneratedQuiz(
            title=f"{repo_name} Architecture Quiz",
            quiz_type="multiple_choice",
            questions=questions,
        )

    def generate_interview_questions(
        self,
        repo_name: str,
        concepts: list[dict],
        mode: str = "conceptual",
        count: int = 10,
        difficulty: str = "intermediate",
    ) -> list[GeneratedInterviewQuestion]:
        """
        Generate interview questions grounded in the repository.
        """
        questions = []

        for i, concept in enumerate(concepts[:count]):
            files = concept.get('files', ['src/'])

            if mode == "conceptual":
                prompt = f"Explain the architecture and design decisions behind {concept.get('name', 'this feature')} in the {repo_name} codebase."
                answer = concept.get('description', 'See source files for details.')

            elif mode == "implementation":
                prompt = f"Walk me through the implementation of {concept.get('name', 'this feature')}. What are the key functions and how do they interact?"
                answer = f"The implementation can be found in: {', '.join(files)}. {concept.get('description', '')}"

            elif mode == "debug":
                prompt = f"Imagine a bug in {concept.get('name', 'this feature')}. What could go wrong and how would you diagnose it?"
                answer = f"Check the relevant files: {', '.join(files)}. Look for issues in error handling, data flow, and integration points."

            else:  # system_design
                prompt = f"How would you extend {concept.get('name', 'this feature')} to support a new requirement?"
                answer = f"Based on the current architecture ({', '.join(files)}), you would need to consider..."

            questions.append(GeneratedInterviewQuestion(
                question_type="intermediate" if difficulty == "intermediate" else "basic",
                prompt_text=prompt,
                reference_answer=answer,
                difficulty=difficulty,
                tags=[concept.get('name', 'general')],
                source_files=files,
            ))

        return questions

    def _generate_lesson_content(
        self,
        repo_name: str,
        concept: dict,
        architecture: dict,
    ) -> str:
        """
        Generate Markdown lesson content for a concept.
        In production, this would use the LLM with the lesson prompt template.
        """
        concept_name = concept.get('name', 'Unknown Concept')
        concept_desc = concept.get('description', '')
        files = concept.get('files', [])

        return f"""## {concept_name}

### Why This Matters
Understanding {concept_name} is essential because {concept_desc}

### What You'll Learn
- The role of {concept_name} in {repo_name}
- Key files and modules involved
- How this concept connects to the rest of the architecture

### Prerequisites
- Basic understanding of the {repo_name} project structure
- Familiarity with {architecture.get('architecture_style', 'the architecture style')}

### Files Covered
{chr(10).join(f'- `{f}`' for f in files) if files else 'No specific files listed.'}

### Step-by-Step Explanation
{concept_desc}

### Key Terms
- **{concept_name}**: {concept_desc}

### Common Confusion Points
- The boundaries between this concept and related modules

### Practice Questions
1. What is the primary responsibility of {concept_name}?
2. Which files implement this concept?

### Suggested Next
Continue to the next lesson in this track.
"""
