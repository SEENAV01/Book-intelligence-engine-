"""
BIE Core Domain Models.
Canonical data representations across all pipeline stages.
Retains strict provenance, grounding, and Prerequisite-Plus attributes.
"""
from __future__ import annotations
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional
import hashlib
import json


@dataclass
class ProvenanceRecord:
    source_file: str
    page_number: int
    bbox: Dict[str, float] = field(default_factory=dict)
    source_text_hash: str = ""
    is_inferred: bool = False
    confidence: float = 1.0
    reason: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "source_file": self.source_file,
            "page_number": self.page_number,
            "bbox": self.bbox,
            "source_text_hash": self.source_text_hash,
            "is_inferred": self.is_inferred,
            "confidence": self.confidence,
            "reason": self.reason,
        }


@dataclass
class ContentBlock:
    id: str
    block_type: str  # text, formula, diagram, table, heading
    content: str
    provenance: ProvenanceRecord
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class Section:
    id: str
    title: str
    blocks: List[ContentBlock] = field(default_factory=list)


@dataclass
class Chapter:
    id: str
    number: int
    title: str
    sections: List[Section] = field(default_factory=list)
    summary: str = ""


@dataclass
class StructuredDocument:
    id: str
    title: str
    author: str = ""
    chapters: List[Chapter] = field(default_factory=list)
    total_pages: int = 1
    content_hash: str = ""


# Prerequisite-Plus Models
@dataclass
class PrerequisiteItem:
    id: str
    title: str
    description: str
    is_must_know: bool = True
    is_inferred: bool = False
    confidence: float = 1.0
    reason: Optional[str] = None
    provenance: Optional[ProvenanceRecord] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "is_must_know": self.is_must_know,
            "is_inferred": self.is_inferred,
            "confidence": self.confidence,
            "reason": self.reason,
            "provenance": self.provenance.to_dict() if self.provenance else None
        }


@dataclass
class MisconceptionItem:
    id: str
    myth: str
    reality: str
    explanation: str
    trap_scenario: str
    provenance: Optional[ProvenanceRecord] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "myth": self.myth,
            "reality": self.reality,
            "explanation": self.explanation,
            "trap_scenario": self.trap_scenario,
            "provenance": self.provenance.to_dict() if self.provenance else None
        }


@dataclass
class NotationItem:
    symbol: str
    meaning: str
    unit: str
    physical_intuition: str


@dataclass
class ReadinessCheckItem:
    question: str
    options: List[str]
    correct_option_index: int
    explanation: str
    tested_prerequisite_id: str


@dataclass
class ConceptUnderstanding:
    concept_id: str
    title: str
    chapter_id: str
    core_law: str
    must_know_prerequisites: List[PrerequisiteItem] = field(default_factory=list)
    helpful_background: List[str] = field(default_factory=list)
    symbols_and_notation: List[NotationItem] = field(default_factory=list)
    misconceptions: List[MisconceptionItem] = field(default_factory=list)
    readiness_checks: List[ReadinessCheckItem] = field(default_factory=list)
    visual_metaphors: List[str] = field(default_factory=list)
    real_world_phenomena: List[Dict[str, Any]] = field(default_factory=list)
    provenance: Optional[ProvenanceRecord] = None


# Lesson Planning Models
@dataclass
class PrerequisiteBridge:
    bridge_id: str
    target_prerequisite_id: str
    explanation: str
    analogy: str
    duration_seconds: int = 60


@dataclass
class LessonUnit:
    lesson_id: str
    chapter_id: str
    title: str
    target_concept_id: str
    duration_seconds: int
    prerequisite_bridge: Optional[PrerequisiteBridge] = None
    pedagogical_phases: List[str] = field(default_factory=list)
    learning_objectives: List[str] = field(default_factory=list)


# Script & Scene DSL Models
@dataclass
class DialogueLine:
    speaker: str
    text: str
    duration_frames: int
    emotion: str = "engaging"
    visual_cue: str = ""


@dataclass
class VisualElement:
    id: str
    element_type: str  # text, formula, vector_animation, real_video_clip, diagram
    bbox: Dict[str, float]  # x, y, width, height (percentages 0-100)
    properties: Dict[str, Any] = field(default_factory=dict)
    start_frame: int = 0
    duration_frames: int = 120
    layer_z: int = 1


@dataclass
class SceneDSL:
    scene_id: str
    title: str
    duration_frames: int
    fps: int = 30
    visual_elements: List[VisualElement] = field(default_factory=list)
    dialogue: List[DialogueLine] = field(default_factory=list)
    background_theme: str = "dark_cinematic"


# Interactive Revision Game Models
@dataclass
class ManipulableObject:
    id: str
    label: str
    object_type: str  # tectonic_plate, electric_charge, mass_slider, chemical_atom
    initial_position: Dict[str, float]  # x, y
    allow_drag_x: bool = True
    allow_drag_y: bool = False
    attributes: Dict[str, Any] = field(default_factory=dict)


@dataclass
class CauseEffectRule:
    rule_id: str
    trigger_condition: str  # distance < 20, distance > 80, opposite_signs
    result_phenomenon: str  # convergent_boundary, rift_valley, coulomb_attraction
    visual_effect: str      # fold_mountains, magma_rift, attraction_vectors
    feedback_text: str
    source_reference: str


@dataclass
class GameChallenge:
    challenge_id: str
    title: str
    mission_prompt: str
    target_condition: str
    hint: str
    misconception_buster: Optional[str] = None


@dataclass
class GameLevel:
    level_id: str
    concept_id: str
    title: str
    topic: str
    manipulables: List[ManipulableObject] = field(default_factory=list)
    rules: List[CauseEffectRule] = field(default_factory=list)
    challenges: List[GameChallenge] = field(default_factory=list)
    misconceptions: List[MisconceptionItem] = field(default_factory=list)


@dataclass
class InteractiveGameSpec:
    game_id: str
    book_title: str
    levels: List[GameLevel] = field(default_factory=list)
    scoring_system: Dict[str, Any] = field(default_factory=dict)
