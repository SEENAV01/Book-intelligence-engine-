"""
M301 Real Execution Acceptance Runner.
Authoritative entry point running the full BIE pipeline.
Outputs:
1. Complete Remotion video code for all lessons
2. Interactive Revision Game code for the book
3. EXECUTION_MANIFEST.json with stage latencies and QA audit.
"""
import sys
import os
import json
import time

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from bie_core.models import (
    StructuredDocument,
    Chapter,
    Section,
    ProvenanceRecord
)
from canonical_pipeline import CanonicalPipeline


def main():
    print("=" * 70)
    print(" BIE PRODUCTION ENGINE: FULL-BOOK COMPILATION ")
    print("=" * 70)

    video_output_dir = os.path.join(BASE_DIR, "generated_video_code")
    game_output_dir = os.path.join(BASE_DIR, "generated_game_code")

    pipeline = CanonicalPipeline(
        video_out_dir=video_output_dir,
        game_out_dir=game_output_dir
    )

    # Ingest representative multi-chapter academic textbook
    document = StructuredDocument(
        id="book_physics_earth_systems",
        title="Modern Physics & Earth Dynamics",
        author="BIE Academic Publishing",
        total_pages=240,
        chapters=[
            Chapter(
                id="ch01_electrostatics",
                number=1,
                title="Electrostatics and Coulomb Interaction",
                sections=[
                    Section(id="sec01_charge", title="Electric Charge and Coulomb's Law"),
                    Section(id="sec02_field", title="Electric Field Lines and Flux")
                ]
            ),
            Chapter(
                id="ch02_geodynamics",
                number=2,
                title="Geodynamics and Plate Tectonics",
                sections=[
                    Section(id="sec03_tectonics", title="Plate Tectonics and Boundary Dynamics")
                ]
            ),
            Chapter(
                id="ch03_gravitation",
                number=3,
                title="Universal Gravitation & Orbital Mechanics",
                sections=[
                    Section(id="sec04_gravity", title="Gravitational Force and Freefall")
                ]
            )
        ]
    )

    # Simulate learner readiness: learner needs prerequisite bridge on action-reaction
    learner_readiness = {
        "prereq_newtons_third_law": False,
        "prereq_litho_astheno": True
    }

    print(f"\n[1/6] Ingesting Document: '{document.title}' ({len(document.chapters)} chapters)")
    print("[2/6] Running Concept Understanding & Prerequisite-Plus Layer...")
    print("[3/6] Planning Pedagogy & Evaluating Learner Readiness Gates...")
    print("[4/6] Compiling Dialogue Scripts, 2D Spatial Layouts & Real Video Staging...")
    print("[5/6] Generating Complete Remotion Video Code for All Lessons...")
    print("[6/6] Generating Interactive Revision Game Code for the Book...")

    manifest = pipeline.run_pipeline(document, learner_readiness_status=learner_readiness)

    print("\n" + "=" * 70)
    print(" COMPILATION COMPLETE: ACCEPTANCE AUDIT ")
    print("=" * 70)
    print(f"Status: {manifest['status']}")
    print(f"Total Chapters Processed: {manifest['total_chapters']}")
    print(f"Total Lessons Generated: {manifest['total_lessons_generated']}")
    print(f"Total Latency: {manifest['total_latency_seconds']}s")
    print(f"\nDeliverable A (Video Code): {manifest['deliverable_roots']['video_code_dir']}")
    print(f"Deliverable B (Revision Game Code): {manifest['deliverable_roots']['revision_game_dir']}")
    print(f"\nPrerequisite Bridges Inserted: {len(manifest['prerequisite_bridges_inserted'])}")
    for b in manifest['prerequisite_bridges_inserted']:
        print(f"  • Lesson '{b['lesson_id']}': Remediating '{b['target_prerequisite']}'")

    print("\nClosed-Loop Layout QA Audit:")
    all_passed = True
    for lesson_id, audit in manifest['qa_audit'].items():
        pass_str = "PASS (0.0 collision)" if audit['passed'] else f"FAIL ({audit['collision_score']})"
        print(f"  • {lesson_id}: {pass_str}")
        if not audit['passed']:
            all_passed = False

    print("\nGenerated Artifacts:")
    print(f"  • Video Code Files: {len(manifest['video_code_artifacts'])}")
    print(f"  • Game Code Files: {len(manifest['revision_game_artifacts'])}")
    print(f"  • Manifest: /app/bie/EXECUTION_MANIFEST.json")

    if all_passed and manifest['status'] == 'SUCCESS':
        print("\n>>> BIE ACCEPTANCE: CERTIFIED PRODUCTION READY <<<")
        return 0
    else:
        print("\n>>> BIE ACCEPTANCE: FAILED QA AUDIT <<<")
        return 1


if __name__ == "__main__":
    sys.exit(main())
