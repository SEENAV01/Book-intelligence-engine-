"""
Unit tests for Scene DSL and Layout QA.
Verifies zero bounding box collision and real-world video footage element integration.
"""
import pytest
from bie_core.models import Chapter, Section
from concept_understanding import ConceptUnderstandingEngine
from lesson_planner import LessonPlanner
from script_compiler import ScriptCompiler
from scene_dsl import SceneDSLEngine
from auto_repair_pipeline import LayoutQAVerifier


def test_scene_dsl_zero_collision_and_real_phenomenon():
    concept_engine = ConceptUnderstandingEngine()
    planner = LessonPlanner()
    compiler = ScriptCompiler()
    scene_engine = SceneDSLEngine()

    ch = Chapter(
        id="ch_geo",
        number=1,
        title="Earth Science",
        sections=[Section(id="sec_tectonics", title="Plate Tectonics")]
    )
    concepts = concept_engine.analyze_chapter(ch)
    lessons = planner.plan_curriculum([ch], {ch.id: concepts})
    lesson = lessons[0]
    concept = concepts[0]

    dialogue = compiler.compile_lesson_script(lesson, concept)
    scene = scene_engine.compile_lesson_scene(lesson, concept, dialogue)

    # 1. Verify Zero Collision QA
    is_passed, collision_score, errors = LayoutQAVerifier.audit_scene_layout(scene)
    assert is_passed is True
    assert collision_score == 0.0
    assert len(errors) == 0

    # 2. Verify Real Phenomenon Video Element Present
    video_elements = [e for e in scene.visual_elements if e.element_type == "real_video_clip"]
    assert len(video_elements) == 1
    vid = video_elements[0]
    assert "source_url" in vid.properties
    assert "mp4" in vid.properties["source_url"]
    assert "overlay_label" in vid.properties
    assert "Real-Life" in vid.properties["overlay_label"]


def test_auto_repair_injected_collision():
    from auto_repair_pipeline import AutoRepairPipeline, LayoutQAVerifier
    from bie_core.models import VisualElement, SceneDSL, DialogueLine

    # Create scene with intentionally overlapping elements
    elem1 = VisualElement(
        id="box_a",
        element_type="text",
        bbox={"x": 30.0, "y": 30.0, "width": 40.0, "height": 30.0},
        properties={"font_size": 24},
        start_frame=0,
        duration_frames=100,
        layer_z=1
    )
    elem2 = VisualElement(
        id="box_b",
        element_type="text",
        bbox={"x": 40.0, "y": 35.0, "width": 40.0, "height": 30.0},
        properties={"font_size": 24},
        start_frame=0,
        duration_frames=100,
        layer_z=1
    )

    bad_scene = SceneDSL(
        scene_id="collision_test",
        title="Collision Scene",
        duration_frames=100,
        fps=30,
        visual_elements=[elem1, elem2],
        dialogue=[]
    )

    # Initial audit must fail
    passed_init, score_init, errors_init = LayoutQAVerifier.audit_scene_layout(bad_scene)
    assert passed_init is False
    assert score_init > 0.0
    assert len(errors_init) >= 1

    # Apply auto repair
    repaired_scene, passed_after, iters = AutoRepairPipeline.repair_scene(bad_scene)
    assert passed_after is True
    assert iters <= 3
    final_pass, final_score, final_errors = LayoutQAVerifier.audit_scene_layout(repaired_scene)
    assert final_pass is True
    assert final_score == 0.0
    assert len(final_errors) == 0

