"""
Unit tests for Prerequisite-Plus Concept Understanding Engine.
Verifies grounding provenance, misconceptions, notation, and explicit inference tagging.
"""
import pytest
from bie_core.models import Chapter, Section, ContentBlock, ProvenanceRecord
from concept_understanding import ConceptUnderstandingEngine


def test_prerequisite_plus_electric_charge():
    engine = ConceptUnderstandingEngine()
    ch = Chapter(
        id="ch1",
        number=1,
        title="Electrostatics",
        sections=[
            Section(id="sec1", title="Electric Charge and Coulomb's Law")
        ]
    )

    concepts = engine.analyze_chapter(ch, source_file="physics_textbook.pdf")
    assert len(concepts) == 1
    cu = concepts[0]

    # Verify basic concept attributes
    assert cu.title == "Electric Charge & Coulomb's Law"
    assert "Coulomb" in cu.core_law or "F = k" in cu.core_law

    # Verify Prerequisite-Plus must-know prerequisites
    assert len(cu.must_know_prerequisites) >= 2
    must_knows = [p for p in cu.must_know_prerequisites if p.is_must_know]
    assert len(must_knows) >= 2

    # Verify AI inference tagging (must have confidence and reason)
    inferred_prereqs = [p for p in cu.must_know_prerequisites if p.is_inferred]
    assert len(inferred_prereqs) >= 1
    for p in inferred_prereqs:
        assert p.confidence > 0.8
        assert p.reason is not None and len(p.reason) > 5

    # Verify Notation and Misconceptions
    assert len(cu.symbols_and_notation) >= 2
    assert any("q" in s.symbol for s in cu.symbols_and_notation)

    assert len(cu.misconceptions) >= 2
    assert any("asymmetry" in m.id or "friction" in m.id for m in cu.misconceptions)

    # Verify Provenance
    assert cu.provenance is not None
    assert cu.provenance.source_file == "physics_textbook.pdf"
    assert cu.provenance.page_number > 0


def test_prerequisite_plus_tectonic_plates():
    engine = ConceptUnderstandingEngine()
    ch = Chapter(
        id="ch2",
        number=2,
        title="Physical Geography",
        sections=[
            Section(id="sec1", title="Plate Tectonics and Boundaries")
        ]
    )

    concepts = engine.analyze_chapter(ch, source_file="geography_textbook.pdf")
    assert len(concepts) == 1
    cu = concepts[0]

    assert cu.title == "Plate Tectonics & Boundary Dynamics"
    assert len(cu.misconceptions) >= 2
    # Verify real-world phenomena attached
    assert len(cu.real_world_phenomena) >= 1
    assert any("mp4" in p.get("url", "") for p in cu.real_world_phenomena)
