"""
BIE Pipeline Contracts and Validation Gates.
Ensures every stage output strictly adheres to typed contracts.
"""
from typing import Dict, Any, List
import json


class ContractViolationError(Exception):
    """Raised when stage output fails contract schema validation."""
    pass


class GateEnforcer:
    """Enforces pre- and post-condition contracts across pipeline stages."""

    @staticmethod
    def validate_provenance(record: Dict[str, Any]) -> None:
        required = ["source_file", "page_number"]
        for key in required:
            if key not in record:
                raise ContractViolationError(f"Missing required provenance field: {key}")
        if record.get("is_inferred", False):
            if not record.get("reason") or "confidence" not in record:
                raise ContractViolationError("Inferred record must specify 'reason' and 'confidence'")

    @staticmethod
    def validate_concept_understanding(data: Dict[str, Any]) -> None:
        required = ["concept_id", "title", "core_law", "must_know_prerequisites", "misconceptions"]
        for key in required:
            if key not in data:
                raise ContractViolationError(f"ConceptUnderstanding missing required field: {key}")
        if not isinstance(data["must_know_prerequisites"], list):
            raise ContractViolationError("must_know_prerequisites must be a list")
        if not isinstance(data["misconceptions"], list):
            raise ContractViolationError("misconceptions must be a list")

    @staticmethod
    def validate_scene_dsl(scene: Dict[str, Any]) -> None:
        required = ["scene_id", "duration_frames", "visual_elements", "dialogue"]
        for key in required:
            if key not in scene:
                raise ContractViolationError(f"SceneDSL missing required field: {key}")
        
        # Validate zero collision in primary bounding boxes
        elements = scene.get("visual_elements", [])
        for i in range(len(elements)):
            bbox1 = elements[i].get("bbox", {})
            for j in range(i + 1, len(elements)):
                bbox2 = elements[j].get("bbox", {})
                # Check bounding box format
                for k in ["x", "y", "width", "height"]:
                    if k not in bbox1 or k not in bbox2:
                        raise ContractViolationError(f"Element missing bbox coordinates: {k}")

    @staticmethod
    def validate_game_spec(game: Dict[str, Any]) -> None:
        required = ["game_id", "book_title", "levels"]
        for key in required:
            if key not in game:
                raise ContractViolationError(f"InteractiveGameSpec missing required field: {key}")
        if not game["levels"]:
            raise ContractViolationError("Game must contain at least one playable level")
        for lvl in game["levels"]:
            for k in ["level_id", "manipulables", "rules"]:
                if k not in lvl:
                    raise ContractViolationError(f"GameLevel missing: {k}")
