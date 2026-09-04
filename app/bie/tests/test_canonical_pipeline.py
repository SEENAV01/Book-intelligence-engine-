"""
End-to-End Canonical Pipeline Integration Test.
Runs the complete BIE compiler on a multi-chapter book and verifies both deliverables:
1. Complete Remotion Video Code (All Lessons across all chapters)
2. Interactive Revision Game Code (Playable simulation sandbox)
3. Full Execution & Provenance Manifest
"""
import os
import json
import pytest
from bie_core.models import (
    StructuredDocument,
    Chapter,
    Section,
    ContentBlock,
    ProvenanceRecord
)
from canonical_pipeline import CanonicalPipeline


def test_canonical_pipeline_end_to_end(tmp_path):
    video_dir = str(tmp_path / "generated_video_code")
    game_dir = str(tmp_path / "generated_game_code")

    pipeline = CanonicalPipeline(
        video_out_dir=video_dir,
        game_out_dir=game_dir
    )

    # Build a multi-chapter textbook document
    doc = StructuredDocument(
        id="doc_science_101",
        title="Comprehensive Physical Sciences",
        author="BIE Academic Press",
        total_pages=150,
        chapters=[
            Chapter(
                id="ch1",
                number=1,
                title="Electrostatics & Fields",
                sections=[
                    Section(id="sec1", title="Electric Charge and Coulomb's Law"),
                    Section(id="sec2", title="Electric Field Lines and Flux")
                ]
            ),
            Chapter(
                id="ch2",
                number=2,
                title="Geodynamics & Earth Systems",
                sections=[
                    Section(id="sec3", title="Plate Tectonics and Boundaries")
                ]
            )
        ]
    )

    # Simulate learner is unready for Newton's 3rd law in Chapter 1
    readiness_status = {
        "prereq_newtons_third_law": False
    }

    manifest = pipeline.run_pipeline(
        document=doc,
        learner_readiness_status=readiness_status
    )

    # 1. Verify Manifest Status & Structure
    assert manifest["status"] == "SUCCESS"
    assert manifest["document_title"] == "Comprehensive Physical Sciences"
    assert manifest["total_chapters"] == 2
    assert manifest["total_lessons_generated"] == 3

    # 2. Verify Prerequisite Bridge was inserted
    bridges = manifest["prerequisite_bridges_inserted"]
    assert len(bridges) >= 1
    assert any(b["target_prerequisite"] == "prereq_newtons_third_law" for b in bridges)

    # 3. Verify Deliverable A: Video Code Generated for all lessons
    assert os.path.exists(os.path.join(video_dir, "Root.tsx"))
    assert os.path.exists(os.path.join(video_dir, "BIELesson.tsx"))
    for lesson_num in range(1, 4):
        # We have 3 lessons across the 2 chapters
        lesson_dirs = [d for d in os.listdir(video_dir) if d.startswith("lesson_")]
        assert len(lesson_dirs) == 3

    for l_dir in [d for d in os.listdir(video_dir) if d.startswith("lesson_")]:
        props_file = os.path.join(video_dir, l_dir, "props.json")
        vtt_file = os.path.join(video_dir, l_dir, "captions.vtt")
        assert os.path.exists(props_file)
        assert os.path.exists(vtt_file)

    # 4. Verify Deliverable B: Interactive Revision Game Code Generated
    assert os.path.exists(os.path.join(game_dir, "book_game_data.json"))
    assert os.path.exists(os.path.join(game_dir, "index.html"))
    assert os.path.exists(os.path.join(game_dir, "InteractiveRevisionGame.tsx"))

    with open(os.path.join(game_dir, "book_game_data.json")) as f:
        game_spec = json.load(f)
    assert len(game_spec["levels"]) == 3  # 1 level per concept/section

    # 5. Verify Zero Layout Collisions in QA Audit
    qa_audit = manifest["qa_audit"]
    for lesson_id, result in qa_audit.items():
        assert result["passed"] is True
        assert result["collision_score"] == 0.0


def test_canonical_pipeline_from_synthetic_pdf(tmp_path):
    from document_ingestor import DocumentIngestor

    pdf_file = str(tmp_path / "quantum_mechanics.pdf")
    video_dir = str(tmp_path / "pdf_video_code")
    game_dir = str(tmp_path / "pdf_game_code")

    chapters_spec = [
        {
            "title": "Quantum Foundations",
            "section": "Wave-Particle Duality",
            "core_law": "E = h * nu",
            "misconception": "Photons are localized tiny billiard balls",
            "phenomenon": "Double slit diffraction"
        }
    ]
    DocumentIngestor.create_synthetic_pdf(pdf_file, "Quantum Foundations", chapters_spec)

    pipeline = CanonicalPipeline(video_out_dir=video_dir, game_out_dir=game_dir)
    manifest = pipeline.run_from_pdf(pdf_file, document_title="Quantum Foundations")

    assert manifest["status"] == "SUCCESS"
    assert manifest["total_chapters"] >= 1
    assert manifest["total_lessons_generated"] >= 1
    assert os.path.exists(os.path.join(video_dir, "Root.tsx"))
    assert os.path.exists(os.path.join(game_dir, "index.html"))

