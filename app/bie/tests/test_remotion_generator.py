"""
Unit tests for Remotion Code Generator.
Verifies full-lesson TSX code generation, Root.tsx, BIELesson.tsx, props.json, and WebVTT captions.
"""
import os
import pytest
from bie_core.models import Chapter, Section
from concept_understanding import ConceptUnderstandingEngine
from lesson_planner import LessonPlanner
from script_compiler import ScriptCompiler
from scene_dsl import SceneDSLEngine
from remotion_generator import RemotionGenerator


def test_remotion_generator_all_lessons(tmp_path):
    out_dir = str(tmp_path / "video_code")
    generator = RemotionGenerator(output_dir=out_dir)

    concept_engine = ConceptUnderstandingEngine()
    planner = LessonPlanner()
    compiler = ScriptCompiler()
    scene_engine = SceneDSLEngine()

    ch = Chapter(
        id="ch1",
        number=1,
        title="Physics",
        sections=[
            Section(id="sec1", title="Coulomb's Law"),
            Section(id="sec2", title="Electric Field")
        ]
    )
    concepts = concept_engine.analyze_chapter(ch)
    all_concepts = {c.concept_id: c for c in concepts}
    lessons = planner.plan_curriculum([ch], {ch.id: concepts})

    scenes = {}
    for lesson in lessons:
        c = all_concepts[lesson.target_concept_id]
        dlg = compiler.compile_lesson_script(lesson, c)
        scenes[lesson.lesson_id] = scene_engine.compile_lesson_scene(lesson, c, dlg)

    artifacts = generator.generate_all_lessons_code(lessons, scenes, all_concepts)

    # Verify Root.tsx
    assert "Root.tsx" in artifacts
    root_path = artifacts["Root.tsx"]
    assert os.path.exists(root_path)
    with open(root_path) as f:
        root_content = f.read()
    assert "RemotionRoot" in root_content
    assert lessons[0].lesson_id in root_content
    assert lessons[1].lesson_id in root_content

    # Verify BIELesson.tsx
    assert "BIELesson.tsx" in artifacts
    with open(artifacts["BIELesson.tsx"]) as f:
        bie_content = f.read()
    assert "BIELesson" in bie_content
    assert "spring(" in bie_content
    assert "Video" in bie_content

    # Verify props.json and captions.vtt for every lesson
    for lesson in lessons:
        props_key = f"{lesson.lesson_id}/props.json"
        vtt_key = f"{lesson.lesson_id}/captions.vtt"
        assert props_key in artifacts
        assert vtt_key in artifacts
        assert os.path.exists(artifacts[props_key])
        assert os.path.exists(artifacts[vtt_key])
        with open(artifacts[vtt_key]) as f:
            assert "WEBVTT" in f.read()
