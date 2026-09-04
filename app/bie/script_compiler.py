"""
M150: Director Script & Voiceover Pacing Compiler.
Converts structured lesson plans and Prerequisite-Plus concepts into director-level
conversational voiceover scripts with synchronized visual cues, WPM-calibrated pacing,
and Socratic inquiry pairs.
"""
from typing import List, Dict, Any, Optional
import math
from bie_core.models import (
    LessonUnit,
    ConceptUnderstanding,
    DialogueLine
)


class ScriptCompiler:
    """Compiles engaging conversational audio scripts and visual cues with calibrated pacing."""

    def __init__(self, default_wpm: int = 145, fps: int = 30):
        self.default_wpm = default_wpm
        self.fps = fps

    def calculate_duration_frames(self, text: str, pause_seconds: float = 0.6) -> int:
        """
        Calculates realistic spoken audio duration in frames based on word count,
        speech tempo (WPM), and conversational pause cadence.
        """
        words = len(text.split())
        seconds = (words / self.default_wpm) * 60.0 + pause_seconds
        # Minimum duration of 2.0 seconds (60 frames at 30 fps) for comprehensibility
        return max(60, int(math.ceil(seconds * self.fps)))

    def compile_lesson_script(
        self,
        lesson: LessonUnit,
        concept: ConceptUnderstanding,
        fps: Optional[int] = None
    ) -> List[DialogueLine]:
        """
        Generates a sequence of DialogueLine objects for the lesson with synchronized cues.
        """
        active_fps = fps or self.fps
        script_lines: List[DialogueLine] = []

        # 1. Hook: Phenomenon Curiosity
        hook_text = (
            f"Welcome. Today we explore {concept.title} — moving beyond textbook definitions "
            f"to discover how nature actually behaves in the real physical universe."
        )
        script_lines.append(
            DialogueLine(
                speaker="Dr. Maya (Lead Instructor)",
                text=hook_text,
                duration_frames=self.calculate_duration_frames(hook_text),
                emotion="curious_and_engaging",
                visual_cue="Fade in luminous dark-slate canvas with ambient particle constellation and title typography"
            )
        )

        # 2. Prerequisite Bridge (if present)
        if lesson.prerequisite_bridge:
            bridge = lesson.prerequisite_bridge
            bridge_text = (
                f"Before we tackle the core formula, let's strengthen our foundation. "
                f"{bridge.explanation}. You can picture this intuitively as {bridge.analogy}."
            )
            script_lines.append(
                DialogueLine(
                    speaker="Alex (Curious Student)",
                    text="Wait, why do we need to review that first?",
                    duration_frames=self.calculate_duration_frames("Wait, why do we need to review that first?"),
                    emotion="curious_and_engaging",
                    visual_cue="Display learner inquiry badge in upper-right quadrant"
                )
            )
            script_lines.append(
                DialogueLine(
                    speaker="Dr. Maya (Lead Instructor)",
                    text=bridge_text,
                    duration_frames=self.calculate_duration_frames(bridge_text),
                    emotion="supportive_and_clear",
                    visual_cue=f"Animate prerequisite bridge card [{bridge.target_prerequisite_id}] with spring transition"
                )
            )

        # 3. Real-World Phenomenon Footage
        if concept.real_world_phenomena:
            phenomenon = concept.real_world_phenomena[0]
            phenom_text = (
                f"Observe this real-world event: {phenomenon['description']}. "
                f"This isn't an abstract equation; it is governing the real world right now."
            )
            script_lines.append(
                DialogueLine(
                    speaker="Dr. Maya (Lead Instructor)",
                    text=phenom_text,
                    duration_frames=self.calculate_duration_frames(phenom_text),
                    emotion="dramatic_and_authoritative",
                    visual_cue=f"Trigger real-life video overlay: '{phenomenon['title']}' with HUD metadata telemetry"
                )
            )

        # 4. Core Conceptual Law & Vector Mechanics
        law_text = (
            f"The underlying mathematical law is formulated as: {concept.core_law}. "
            f"Notice how each variable directly maps to a physical property of the system."
        )
        script_lines.append(
            DialogueLine(
                speaker="Dr. Maya (Lead Instructor)",
                text=law_text,
                duration_frames=self.calculate_duration_frames(law_text),
                emotion="precise_and_clear",
                visual_cue="Render dynamic vector diagram with mathematical LaTeX formula highlight and animated arrows"
            )
        )

        # 5. Misconception Socratic Refutation
        if concept.misconceptions:
            misc = concept.misconceptions[0]
            student_trap_text = f"Isn't it true that {misc.myth}?"
            script_lines.append(
                DialogueLine(
                    speaker="Alex (Curious Student)",
                    text=student_trap_text,
                    duration_frames=self.calculate_duration_frames(student_trap_text),
                    emotion="curious_and_engaging",
                    visual_cue="Display red amber trap scenario callout card"
                )
            )

            refutation_text = (
                f"That is a very common intuitive pitfall! But in reality: {misc.reality}. "
                f"{misc.explanation}"
            )
            script_lines.append(
                DialogueLine(
                    speaker="Dr. Maya (Lead Instructor)",
                    text=refutation_text,
                    duration_frames=self.calculate_duration_frames(refutation_text),
                    emotion="insightful_and_illuminating",
                    visual_cue="Shatter the misconception trap card and replace with emerald grounded truth card"
                )
            )

        # 6. Synthesis & Revision Game Handoff
        cta_text = (
            f"Now that you've mastered the fundamentals of {concept.title}, "
            f"it is time to test your intuition in the interactive revision sandbox. Let's begin!"
        )
        script_lines.append(
            DialogueLine(
                speaker="Dr. Maya (Lead Instructor)",
                text=cta_text,
                duration_frames=self.calculate_duration_frames(cta_text),
                emotion="motivational",
                visual_cue="Pulse neon interactive Revision Game badge and slide in level select button"
            )
        )

        return script_lines
