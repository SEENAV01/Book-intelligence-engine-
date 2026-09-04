"""
Scene DSL & Spatial Layout Engine.
Computes 2D bounding boxes, typography, layer ordering, and element placements
ensuring ZERO bounding box overlap and supporting real-life phenomenon video staging.
"""
from typing import List, Dict, Any, Tuple
from bie_core.models import (
    SceneDSL,
    VisualElement,
    DialogueLine,
    LessonUnit,
    ConceptUnderstanding
)
from bie_core.contracts import GateEnforcer, ContractViolationError


class SceneDSLEngine:
    """Computes spatial layout trees and compiles SceneDSL."""

    def compile_lesson_scene(
        self,
        lesson: LessonUnit,
        concept: ConceptUnderstanding,
        dialogue: List[DialogueLine],
        fps: int = 30
    ) -> SceneDSL:
        """
        Compiles a high-grade 2D SceneDSL for the lesson.
        Guarantees non-overlapping spatial partitioning between:
        - Header & Title
        - Left Pane: Dynamic Vector/Particle Simulation
        - Right Pane: Real-Life Phenomenon Video Footage
        - Right Lower Pane: Core Law / Math Card
        - Subtitle / Narration Bar
        """
        total_frames = sum(line.duration_frames for line in dialogue)
        elements: List[VisualElement] = []

        # 1. Top Header (y: 4% to 14%)
        elements.append(
            VisualElement(
                id="header_banner",
                element_type="text",
                bbox={"x": 5.0, "y": 4.0, "width": 90.0, "height": 10.0},
                properties={
                    "title": lesson.title,
                    "subtitle": concept.title,
                    "theme": "glow_cyan",
                    "font_size": 28
                },
                start_frame=0,
                duration_frames=total_frames,
                layer_z=2
            )
        )

        # 2. Left Pane: Dynamic Animated Simulation / Vectors (x: 5% to 48%, y: 18% to 82%)
        elements.append(
            VisualElement(
                id="vector_simulation_canvas",
                element_type="vector_animation",
                bbox={"x": 5.0, "y": 18.0, "width": 43.0, "height": 64.0},
                properties={
                    "animation_type": "spring_particles",
                    "concept_id": concept.concept_id,
                    "metaphor": concept.visual_metaphors[0] if concept.visual_metaphors else "dynamic_particles",
                    "symbols": [s.__dict__ for s in concept.symbols_and_notation]
                },
                start_frame=0,
                duration_frames=total_frames,
                layer_z=1
            )
        )

        # 3. Right Upper Pane: Real Phenomenon Video Footage (x: 51% to 95%, y: 18% to 55%)
        phenomenon_url = "assets/phenomena/default_phenomenon.mp4"
        phenomenon_title = "Real-World Observation"
        if concept.real_world_phenomena:
            phenomenon_url = concept.real_world_phenomena[0].get("url", phenomenon_url)
            phenomenon_title = concept.real_world_phenomena[0].get("title", phenomenon_title)

        elements.append(
            VisualElement(
                id="real_phenomenon_clip",
                element_type="real_video_clip",
                bbox={"x": 51.0, "y": 18.0, "width": 44.0, "height": 38.0},
                properties={
                    "source_url": phenomenon_url,
                    "overlay_label": f"🔴 Real-Life Observation: {phenomenon_title}",
                    "attribution": "BIE Science Footage Archive",
                    "aspect_ratio": "16:9",
                    "border_glow": "cyan"
                },
                start_frame=60,
                duration_frames=total_frames - 60,
                layer_z=2
            )
        )

        # 4. Right Lower Pane: Core Law & Grounded Equation Card (x: 51% to 95%, y: 58% to 82%)
        elements.append(
            VisualElement(
                id="core_law_card",
                element_type="formula_card",
                bbox={"x": 51.0, "y": 58.0, "width": 44.0, "height": 24.0},
                properties={
                    "core_law": concept.core_law,
                    "source_citation": f"Page {concept.provenance.page_number}" if concept.provenance else "Source Textbook",
                    "font_size": 18
                },
                start_frame=90,
                duration_frames=total_frames - 90,
                layer_z=2
            )
        )

        # 5. Subtitle Narration Strip (x: 5% to 95%, y: 85% to 95%)
        elements.append(
            VisualElement(
                id="subtitle_strip",
                element_type="subtitle_bar",
                bbox={"x": 5.0, "y": 85.0, "width": 90.0, "height": 10.0},
                properties={
                    "font_size": 20,
                    "background_alpha": 0.85
                },
                start_frame=0,
                duration_frames=total_frames,
                layer_z=3
            )
        )

        scene = SceneDSL(
            scene_id=f"scene_{lesson.lesson_id}",
            title=lesson.title,
            duration_frames=total_frames,
            fps=fps,
            visual_elements=elements,
            dialogue=dialogue,
            background_theme="dark_cinematic"
        )

        # Enforce zero collision validation
        collision_score = self.calculate_collision_score(elements)
        if collision_score > 0:
            raise ContractViolationError(f"Layout collision detected! Collision score: {collision_score}")

        return scene

    def calculate_collision_score(self, elements: List[VisualElement]) -> float:
        """
        Calculates total intersecting area between visual elements on the same z-layer.
        Score == 0 guarantees zero visual overlap.
        """
        score = 0.0
        n = len(elements)
        for i in range(n):
            b1 = elements[i].bbox
            for j in range(i + 1, n):
                b2 = elements[j].bbox
                # Check horizontal overlap
                left = max(b1["x"], b2["x"])
                right = min(b1["x"] + b1["width"], b2["x"] + b2["width"])
                top = max(b1["y"], b2["y"])
                bottom = min(b1["y"] + b1["height"], b2["y"] + b2["height"])

                if right > left and bottom > top:
                    overlap_area = (right - left) * (bottom - top)
                    score += overlap_area

        return round(score, 4)
