"""
Unit tests for M150: Director Script & Voiceover Pacing Compiler.
Verifies calibrated duration calculations, Socratic speaker dialogues,
visual cue synchronization, and emotional inflection metadata.
"""
import pytest
from bie_core.models import (
    LessonUnit,
    PrerequisiteBridge,
    ConceptUnderstanding,
    ProvenanceRecord,
    MisconceptionItem
)
from script_compiler import ScriptCompiler


def test_script_compiler_pacing_and_dialogue():
    compiler = ScriptCompiler(default_wpm=150, fps=30)

    # Test duration calculator
    short_line = "Hello world"
    duration = compiler.calculate_duration_frames(short_line)
    # Minimum 60 frames
    assert duration >= 60

    longer_text = "This is a detailed academic explanation of electrostatic force vectors spanning over thirty words to ensure that speech tempo calculations allocate accurate frame budgets across video rendering."
    dur_long = compiler.calculate_duration_frames(longer_text)
    assert dur_long > duration
    assert dur_long > 150  # ~5-6 seconds at 30fps

    # Test full script generation
    prov = ProvenanceRecord(source_file="physics.pdf", page_number=1, source_text_hash="abc123456789")
    concept = ConceptUnderstanding(
        concept_id="c_coulomb",
        title="Coulomb's Law",
        chapter_id="ch1",
        core_law="F = k * (|q1 * q2|) / r^2",
        must_know_prerequisites=[],
        helpful_background=[],
        symbols_and_notation=[],
        misconceptions=[
            MisconceptionItem(
                id="misc1",
                myth="Friction creates brand new electric charge.",
                reality="Charge is strictly conserved; friction transfers valence electrons.",
                explanation="Triboelectric transfer occurs via electron affinity differences.",
                trap_scenario="Does a rubbed balloon create new electrons?"
            )
        ],
        readiness_checks=[],
        visual_metaphors=["Springs under tension"],
        real_world_phenomena=[
            {
                "title": "Lightning Bolt",
                "type": "real_video_clip",
                "url": "https://example.com/video.mp4",
                "description": "Dielectric breakdown of atmospheric air."
            }
        ],
        provenance=prov
    )

    bridge = PrerequisiteBridge(
        bridge_id="bridge_newton",
        target_prerequisite_id="prereq_newtons_third_law",
        explanation="Action and reaction forces must be equal in magnitude.",
        analogy="Two skaters pushing off each other",
        duration_seconds=60
    )

    lesson = LessonUnit(
        lesson_id="l1",
        chapter_id="ch1",
        title="Lesson 1: Coulomb's Law",
        target_concept_id="c_coulomb",
        duration_seconds=420,
        prerequisite_bridge=bridge,
        pedagogical_phases=[],
        learning_objectives=[]
    )

    dialogue_lines = compiler.compile_lesson_script(lesson, concept)

    assert len(dialogue_lines) >= 6
    speakers = set(d.speaker for d in dialogue_lines)
    assert "Dr. Maya (Lead Instructor)" in speakers
    assert "Alex (Curious Student)" in speakers  # Socratic dialogue partner

    # Verify visual cues and durations exist for all lines
    total_frames = 0
    for line in dialogue_lines:
        assert line.duration_frames >= 60
        assert len(line.visual_cue) > 10
        assert line.emotion in [
            "curious_and_engaging",
            "supportive_and_clear",
            "dramatic_and_authoritative",
            "precise_and_clear",
            "insightful_and_illuminating",
            "motivational"
        ]
        total_frames += line.duration_frames

    assert total_frames > 500  # Multi-scene pacing
