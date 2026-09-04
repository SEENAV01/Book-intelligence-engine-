"""
M200: Closed-Loop Layout QA & Mathematical Auto-Repair Engine.
Audits 2D spatial layouts for overlapping bounding boxes, detects layer interference,
and applies physics-inspired separating displacement vectors and proportional scaling
within a strictly bounded 3-iteration feedback loop.
"""
from typing import Dict, Any, List, Tuple, Optional
import copy
from bie_core.models import SceneDSL, VisualElement


class LayoutQAVerifier:
    """Performs rigorous geometric bounding box overlap audits with zero-tolerance threshold."""

    @staticmethod
    def audit_scene_layout(scene: SceneDSL) -> Tuple[bool, float, List[str]]:
        """
        Audits visual elements in a scene for bounding box collisions.
        Returns: (is_passed, collision_score, error_messages)
        """
        errors: List[str] = []
        score = 0.0
        elements = scene.visual_elements
        n = len(elements)

        for i in range(n):
            b1 = elements[i].bbox
            for j in range(i + 1, n):
                b2 = elements[j].bbox

                # Elements on distinctly different z-layers (e.g. z=0 background vs z=2 HUD) can intentionally overlap
                if elements[i].layer_z != elements[j].layer_z and abs(elements[i].layer_z - elements[j].layer_z) > 1:
                    continue

                left = max(b1["x"], b2["x"])
                right = min(b1["x"] + b1["width"], b2["x"] + b2["width"])
                top = max(b1["y"], b2["y"])
                bottom = min(b1["y"] + b1["height"], b2["y"] + b2["height"])

                if right > left and bottom > top:
                    overlap_area = (right - left) * (bottom - top)
                    score += overlap_area
                    errors.append(
                        f"Collision between '{elements[i].id}' and '{elements[j].id}': "
                        f"overlap area = {overlap_area:.2f}% (x:[{left:.1f},{right:.1f}], y:[{top:.1f},{bottom:.1f}])"
                    )

        is_passed = (score == 0.0)
        return is_passed, round(score, 4), errors


class AutoRepairPipeline:
    """Applies bounded auto-repair iterations to mathematically eliminate layout collisions."""

    MAX_ITERATIONS = 3

    @classmethod
    def repair_scene(cls, scene: SceneDSL) -> Tuple[SceneDSL, bool, int]:
        """
        Iteratively adjusts colliding bounding boxes via separating displacement vectors,
        coordinate clamping, and proportional dimension reduction.
        Returns: (repaired_scene, is_success, iterations_used)
        """
        repaired_scene = copy.deepcopy(scene)
        iterations = 0

        while iterations < cls.MAX_ITERATIONS:
            is_passed, score, errors = LayoutQAVerifier.audit_scene_layout(repaired_scene)
            if is_passed:
                return repaired_scene, True, iterations

            iterations += 1
            elements = repaired_scene.visual_elements
            n = len(elements)

            # Detect all collision pairs
            for i in range(n):
                for j in range(i + 1, n):
                    e1 = elements[i]
                    e2 = elements[j]

                    if e1.layer_z != e2.layer_z and abs(e1.layer_z - e2.layer_z) > 1:
                        continue

                    b1 = e1.bbox
                    b2 = e2.bbox

                    left = max(b1["x"], b2["x"])
                    right = min(b1["x"] + b1["width"], b2["x"] + b2["width"])
                    top = max(b1["y"], b2["y"])
                    bottom = min(b1["y"] + b1["height"], b2["y"] + b2["height"])

                    if right > left and bottom > top:
                        # Collision detected. Compute separating displacement
                        overlap_x = right - left
                        overlap_y = bottom - top

                        if overlap_x < overlap_y:
                            # Horizontal separation: push e1 left, e2 right
                            shift = (overlap_x / 2.0) + 1.0
                            b1["x"] = max(2.0, b1["x"] - shift)
                            b2["x"] = min(98.0 - b2["width"], b2["x"] + shift)
                        else:
                            # Vertical separation: push e1 up, e2 down
                            shift = (overlap_y / 2.0) + 1.0
                            b1["y"] = max(2.0, b1["y"] - shift)
                            b2["y"] = min(98.0 - b2["height"], b2["y"] + shift)

                        # Scale dimensions slightly to guarantee clearance
                        b1["width"] = round(max(15.0, b1["width"] * 0.94), 2)
                        b1["height"] = round(max(8.0, b1["height"] * 0.94), 2)
                        b2["width"] = round(max(15.0, b2["width"] * 0.94), 2)
                        b2["height"] = round(max(8.0, b2["height"] * 0.94), 2)

                        # Adjust font sizes if specified
                        for e in [e1, e2]:
                            if "font_size" in e.properties:
                                e.properties["font_size"] = max(12, int(e.properties["font_size"] * 0.92))

            # Final clamp to 2% - 98% safe canvas zone
            for elem in elements:
                elem.bbox["x"] = round(max(2.0, min(elem.bbox["x"], 98.0 - elem.bbox["width"])), 2)
                elem.bbox["y"] = round(max(2.0, min(elem.bbox["y"], 98.0 - elem.bbox["height"])), 2)

        final_passed, final_score, final_errors = LayoutQAVerifier.audit_scene_layout(repaired_scene)
        return repaired_scene, final_passed, iterations
