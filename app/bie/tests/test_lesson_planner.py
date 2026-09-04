"""
Unit tests for Pedagogical Lesson Planner.
Verifies prerequisite bridge insertion upon unmet readiness checks.
"""
import pytest
from bie_core.models import Chapter, Section
from concept_understanding import ConceptUnderstandingEngine
from lesson_planner import LessonPlanner


def test_prerequisite_bridge_inserted_when_unready():
    engine = ConceptUnderstandingEngine()
    planner = LessonPlanner()

    ch = Chapter(
        id="ch1",
        number=1,
        title="Physics",
        sections=[Section(id="sec1", title="Coulomb's Law")]
    )
    concepts = engine.analyze_chapter(ch)
    concepts_by_ch = {ch.id: concepts}

    # Simulate learner is UNREADY on Newton's third law prerequisite
    readiness_status = {"prereq_newtons_third_law": False}

    lessons = planner.plan_curriculum(
        chapters=[ch],
        concepts_by_chapter=concepts_by_ch,
        learner_readiness_status=readiness_status
    )

    assert len(lessons) == 1
    lesson = lessons[0]
    assert lesson.prerequisite_bridge is not None
    assert lesson.prerequisite_bridge.target_prerequisite_id == "prereq_newtons_third_law"
    assert "Newton" in lesson.prerequisite_bridge.explanation or "prereq" in lesson.prerequisite_bridge.bridge_id


def test_no_bridge_when_learner_ready():
    engine = ConceptUnderstandingEngine()
    planner = LessonPlanner()

    ch = Chapter(
        id="ch1",
        number=1,
        title="Physics",
        sections=[Section(id="sec1", title="Coulomb's Law")]
    )
    concepts = engine.analyze_chapter(ch)
    concepts_by_ch = {ch.id: concepts}

    # Simulate learner is READY
    readiness_status = {
        "prereq_atomic_structure": True,
        "prereq_newtons_third_law": True
    }

    lessons = planner.plan_curriculum(
        chapters=[ch],
        concepts_by_chapter=concepts_by_ch,
        learner_readiness_status=readiness_status
    )

    assert len(lessons) == 1
    assert lessons[0].prerequisite_bridge is None
