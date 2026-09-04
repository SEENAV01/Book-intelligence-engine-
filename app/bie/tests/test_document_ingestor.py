"""
Unit tests for M001: Ingestion & Spatial Document Intelligence Engine.
Verifies parsing of Markdown, real binary PDF streams, bounding box extraction,
and cryptographic SHA-256 provenance preservation.
"""
import os
import pytest
from bie_core.contracts import GateEnforcer
from document_ingestor import DocumentIngestor, DocumentIngestionError


def test_markdown_ingestion():
    sample_md = """# Modern Physics and Planetary Dynamics

## Chapter 1: Electrostatics & Fields
### Coulomb's Law
Electric charge is a fundamental physical property of matter.
Like charges repel, while opposite charges attract.

$$ F = k * (|q1 * q2|) / (r^2) $$

> Common Misconception: Charges are created out of nothing by rubbing objects.
Reality: Charges are merely transferred between surfaces.

## Chapter 2: Plate Tectonics
### Continental Drift
Lithospheric plates float atop the semi-fluid asthenosphere.
"""
    doc = DocumentIngestor.ingest_markdown(sample_md, source_file="physics_textbook.md")

    assert doc.title == "Modern Physics and Planetary Dynamics"
    assert len(doc.chapters) == 2

    ch1 = doc.chapters[0]
    assert "Electrostatics" in ch1.title
    assert len(ch1.sections) >= 1

    sec1 = ch1.sections[0]
    assert "Coulomb" in sec1.title
    assert len(sec1.blocks) >= 4

    # Verify formulas and callouts classified correctly
    formula_blocks = [b for b in sec1.blocks if b.block_type == "formula"]
    callout_blocks = [b for b in sec1.blocks if b.block_type == "callout"]
    assert len(formula_blocks) >= 1
    assert len(callout_blocks) >= 1

    # Verify Provenance and SHA-256 grounding hashes on all blocks
    for ch in doc.chapters:
        for sec in ch.sections:
            for b in sec.blocks:
                prov = b.provenance
                assert prov.source_file == "physics_textbook.md"
                assert prov.page_number >= 1
                assert len(prov.source_text_hash) == 12
                # Validate GateEnforcer
                GateEnforcer.validate_provenance(prov.to_dict())
                # Validate Bounding Box
                assert 0.0 <= prov.bbox["x"] <= 100.0
                assert 0.0 <= prov.bbox["y"] <= 100.0
                assert prov.bbox["width"] > 0
                assert prov.bbox["height"] > 0


def test_synthetic_binary_pdf_ingestion(tmp_path):
    pdf_path = str(tmp_path / "sample_academic.pdf")

    chapters_spec = [
        {
            "title": "Quantum Foundations",
            "section": "Wave-Particle Duality",
            "core_law": "E = h * nu",
            "misconception": "Photons are tiny solid billiard balls",
            "phenomenon": "Double slit electron diffraction"
        },
        {
            "title": "Geological Systems",
            "section": "Subduction Zones",
            "core_law": "v_plate = delta_x / delta_t",
            "misconception": "Crust floats on molten liquid core directly",
            "phenomenon": "Pacific Ring of Fire volcanic chains"
        }
    ]

    DocumentIngestor.create_synthetic_pdf(
        output_path=pdf_path,
        title="Modern Physics & Geology",
        chapters=chapters_spec
    )

    assert os.path.exists(pdf_path)
    assert os.path.getsize(pdf_path) > 500  # Valid binary PDF size

    # Ingest the real binary PDF
    doc = DocumentIngestor.ingest_pdf(pdf_path, document_title="Modern Physics & Geology")

    assert doc.title == "Modern Physics & Geology"
    assert doc.total_pages == 2
    assert len(doc.chapters) >= 2

    # Verify content was extracted
    all_blocks = [b for ch in doc.chapters for s in ch.sections for b in s.blocks]
    assert len(all_blocks) >= 4
    for b in all_blocks:
        assert b.provenance.source_file == "sample_academic.pdf"
        assert b.provenance.page_number in [1, 2]
        assert len(b.provenance.source_text_hash) == 12
