"""
Unit tests for Interactive Revision Game Engine.
Verifies interactive sandbox game code generation, physics rules,
cause-and-effect simulation mechanics, and misconception busters.
"""
import os
import json
import pytest
from bie_core.models import Chapter, Section
from concept_understanding import ConceptUnderstandingEngine
from game_generator import GameGenerator


def test_revision_game_generation(tmp_path):
    out_dir = str(tmp_path / "game_code")
    generator = GameGenerator(output_dir=out_dir)
    concept_engine = ConceptUnderstandingEngine()

    ch1 = Chapter(
        id="ch_tectonics",
        number=1,
        title="Earth Science",
        sections=[Section(id="sec_plates", title="Plate Tectonics")]
    )
    ch2 = Chapter(
        id="ch_electro",
        number=2,
        title="Physics",
        sections=[Section(id="sec_charge", title="Electric Charge and Coulomb's Law")]
    )

    concepts_by_ch = {
        ch1.id: concept_engine.analyze_chapter(ch1),
        ch2.id: concept_engine.analyze_chapter(ch2)
    }

    artifacts = generator.generate_revision_game(
        book_title="General Science & Physics",
        chapters=[ch1, ch2],
        concepts_by_chapter=concepts_by_ch
    )

    # Verify generated files
    assert "book_game_data.json" in artifacts
    assert "index.html" in artifacts
    assert "InteractiveRevisionGame.tsx" in artifacts

    # Inspect book_game_data.json
    with open(artifacts["book_game_data.json"]) as f:
        game_data = json.load(f)

    assert game_data["book_title"] == "General Science & Physics"
    assert len(game_data["levels"]) == 2

    # Level 1: Tectonic Plates
    lvl1 = game_data["levels"][0]
    assert "Plate" in lvl1["title"] or "Tectonic" in lvl1["title"]
    assert len(lvl1["manipulables"]) >= 2
    # Check convergent & divergent rules
    rule_triggers = [r["trigger_condition"] for r in lvl1["rules"]]
    assert any("< 15" in t or "< 20" in t for t in rule_triggers)
    assert any("> 65" in t or "> 60" in t for t in rule_triggers)

    # Check challenges and misconception busters
    assert len(lvl1["challenges"]) >= 2
    assert len(lvl1["misconceptions"]) >= 1

    # Level 2: Electrostatics
    lvl2 = game_data["levels"][1]
    assert "Charge" in lvl2["title"]
    assert len(lvl2["manipulables"]) >= 2

    # Inspect index.html standalone sandbox
    with open(artifacts["index.html"]) as f:
        html = f.read()
    assert "<canvas id=\"gameCanvas\"" in html
    assert "BIE Interactive Revision Sandbox" in html
    assert "evaluateSimulation" in html
    assert "renderLoop" in html
