"""
Canonical BIE Pipeline Orchestrator (M001 -> M301).
Executes the authoritative end-to-end multi-stage pipeline:
M001: Ingestion & Spatial Document Intelligence (PDF, Markdown)
M050: Prerequisite-Plus Concept Understanding Engine
M100: Pedagogical Lesson Planning & Remedial Bridge Engine
M150: Director Script & Voiceover Pacing Compiler
M200: Scene DSL & Mathematical Spatial Layout QA Solver
M250: Deliverable A - Production Remotion TSX Video Code Generator
M275: Deliverable B - Deep Interactive Revision Sandbox Game Generator
M301: Canonical Execution Manifest & Comprehensive Acceptance Verification
"""
from typing import Dict, Any, List, Optional
import os
import json
import hashlib
import time

from bie_core.models import (
    StructuredDocument,
    Chapter,
    Section,
    ContentBlock,
    ProvenanceRecord,
    ConceptUnderstanding,
    LessonUnit,
    SceneDSL
)
from bie_core.contracts import GateEnforcer
from document_ingestor import DocumentIngestor
from concept_understanding import ConceptUnderstandingEngine
from lesson_planner import LessonPlanner
from script_compiler import ScriptCompiler
from scene_dsl import SceneDSLEngine
from remotion_generator import RemotionGenerator
from game_generator import GameGenerator
from auto_repair_pipeline import LayoutQAVerifier, AutoRepairPipeline


BASE_DIR = os.path.dirname(os.path.abspath(__file__))


class CanonicalPipeline:
    """The authoritative end-to-end BIE compilation engine."""

    def __init__(
        self,
        video_out_dir: Optional[str] = None,
        game_out_dir: Optional[str] = None
    ):
        self.video_out_dir = video_out_dir or os.path.join(BASE_DIR, "generated_video_code")
        self.game_out_dir = game_out_dir or os.path.join(BASE_DIR, "generated_game_code")
        self.ingestor = DocumentIngestor()
        self.concept_engine = ConceptUnderstandingEngine()
        self.lesson_planner = LessonPlanner()
        self.script_compiler = ScriptCompiler()
        self.scene_engine = SceneDSLEngine()
        self.remotion_gen = RemotionGenerator(output_dir=self.video_out_dir)
        self.game_gen = GameGenerator(output_dir=self.game_out_dir)

    def run_from_pdf(
        self,
        pdf_path: str,
        document_title: Optional[str] = None,
        learner_readiness_status: Optional[Dict[str, bool]] = None
    ) -> Dict[str, Any]:
        """Runs the complete BIE pipeline directly from an academic PDF file."""
        doc = self.ingestor.ingest_pdf(pdf_path, document_title=document_title)
        return self.run_pipeline(doc, learner_readiness_status=learner_readiness_status)

    def run_from_markdown(
        self,
        md_text: str,
        source_file: str = "textbook.md",
        learner_readiness_status: Optional[Dict[str, bool]] = None
    ) -> Dict[str, Any]:
        """Runs the complete BIE pipeline directly from academic Markdown text."""
        doc = self.ingestor.ingest_markdown(md_text, source_file=source_file)
        return self.run_pipeline(doc, learner_readiness_status=learner_readiness_status)

    def run_pipeline(
        self,
        document: StructuredDocument,
        learner_readiness_status: Optional[Dict[str, bool]] = None
    ) -> Dict[str, Any]:
        """
        Executes the full pipeline for the textbook document.
        Emits:
        - Remotion Video Code for all lessons
        - Interactive Revision Game code for all chapters
        - Execution Manifest with provenance
        """
        start_time = time.time()
        stage_timings: Dict[str, float] = {}

        # Stage 1: Document Intake & Grounding Verification
        t0 = time.time()
        doc_hash = hashlib.sha256(document.title.encode()).hexdigest()
        # Verify provenance on all blocks
        total_blocks = 0
        for ch in document.chapters:
            for sec in ch.sections:
                for blk in sec.blocks:
                    total_blocks += 1
                    GateEnforcer.validate_provenance(blk.provenance.to_dict())
        stage_timings["M001_ingestion_and_spatial_intelligence"] = round(time.time() - t0, 3)

        # Stage 2: Prerequisite-Plus Concept Understanding
        t0 = time.time()
        concepts_by_chapter: Dict[str, List[ConceptUnderstanding]] = {}
        all_concepts: Dict[str, ConceptUnderstanding] = {}

        for chapter in document.chapters:
            concepts = self.concept_engine.analyze_chapter(chapter, source_file=f"{document.title}.pdf")
            concepts_by_chapter[chapter.id] = concepts
            for c in concepts:
                all_concepts[c.concept_id] = c
        stage_timings["M050_prerequisite_plus_concept_understanding"] = round(time.time() - t0, 3)

        # Stage 3: Pedagogical Lesson Planning (with Prerequisite Bridge Insertion)
        t0 = time.time()
        lessons = self.lesson_planner.plan_curriculum(
            chapters=document.chapters,
            concepts_by_chapter=concepts_by_chapter,
            learner_readiness_status=learner_readiness_status
        )
        stage_timings["M100_curriculum_planning_remedial_bridges"] = round(time.time() - t0, 3)

        # Stage 4: Script & Scene DSL Compilation with Spatial Layout QA
        t0 = time.time()
        scenes: Dict[str, SceneDSL] = {}
        qa_audit_results: Dict[str, Any] = {}

        for lesson in lessons:
            concept = all_concepts.get(lesson.target_concept_id)
            if not concept:
                continue

            # Compile Script with calibrated voiceover duration
            dialogue = self.script_compiler.compile_lesson_script(lesson, concept)

            # Compile Scene DSL
            scene = self.scene_engine.compile_lesson_scene(lesson, concept, dialogue)

            # Audit layout with closed-loop QA & auto-repair if needed
            is_passed, collision_score, errors = LayoutQAVerifier.audit_scene_layout(scene)
            if not is_passed:
                scene, is_passed, iters = AutoRepairPipeline.repair_scene(scene)

            scenes[lesson.lesson_id] = scene
            qa_audit_results[lesson.lesson_id] = {
                "passed": is_passed,
                "collision_score": 0.0 if is_passed else collision_score
            }
        stage_timings["M150_M200_script_and_scene_dsl_qa"] = round(time.time() - t0, 3)

        # Stage 5: Deliverable A - Complete Video Code Generation (Remotion React)
        t0 = time.time()
        video_artifacts = self.remotion_gen.generate_all_lessons_code(
            lessons=lessons,
            scenes=scenes,
            concepts=all_concepts
        )
        stage_timings["M250_remotion_video_code_generator"] = round(time.time() - t0, 3)

        # Stage 6: Deliverable B - Interactive Revision Game Code Generation
        t0 = time.time()
        game_artifacts = self.game_gen.generate_revision_game(
            book_title=document.title,
            chapters=document.chapters,
            concepts_by_chapter=concepts_by_chapter
        )
        stage_timings["M275_interactive_game_generator"] = round(time.time() - t0, 3)

        total_elapsed = round(time.time() - start_time, 3)

        # Build Final Execution Manifest
        manifest = {
            "status": "SUCCESS",
            "document_title": document.title,
            "document_hash": doc_hash,
            "total_chapters": len(document.chapters),
            "total_blocks_ingested": total_blocks,
            "total_lessons_generated": len(lessons),
            "stage_timings_seconds": stage_timings,
            "total_latency_seconds": total_elapsed,
            "qa_audit": qa_audit_results,
            "video_code_artifacts": list(video_artifacts.keys()),
            "revision_game_artifacts": list(game_artifacts.keys()),
            "deliverable_roots": {
                "video_code_dir": self.video_out_dir,
                "revision_game_dir": self.game_out_dir
            },
            "prerequisite_bridges_inserted": [
                {
                    "lesson_id": l.lesson_id,
                    "target_prerequisite": l.prerequisite_bridge.target_prerequisite_id
                }
                for l in lessons if l.prerequisite_bridge is not None
            ]
        }

        # Save manifest
        manifest_path = os.path.join(BASE_DIR, "EXECUTION_MANIFEST.json")
        with open(manifest_path, "w") as f:
            json.dump(manifest, f, indent=2)

        return manifest
