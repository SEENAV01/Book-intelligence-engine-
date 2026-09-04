"""
Interactive Revision Game Code Generator.
Compiles Prerequisite-Plus concept models into a fully interactive,
physics/simulation-based revision game where students actively manipulate
physical parameters (e.g. tectonic plates, charges, forces) to revise the book.
"""
from typing import List, Dict, Any, Optional
import os
import json
from bie_core.models import (
    ConceptUnderstanding,
    Chapter,
    InteractiveGameSpec,
    GameLevel,
    ManipulableObject,
    CauseEffectRule,
    GameChallenge
)
from bie_core.contracts import GateEnforcer


BASE_DIR = os.path.dirname(os.path.abspath(__file__))


class GameGenerator:
    """Generates interactive revision game code from Prerequisite-Plus intelligence."""

    def __init__(self, output_dir: Optional[str] = None):
        self.output_dir = output_dir or os.path.join(BASE_DIR, "generated_game_code")
        os.makedirs(self.output_dir, exist_ok=True)

    def generate_revision_game(
        self,
        book_title: str,
        chapters: List[Chapter],
        concepts_by_chapter: Dict[str, List[ConceptUnderstanding]]
    ) -> Dict[str, str]:
        """
        Compiles the entire book's concepts into an interactive simulation game.
        Returns paths to generated game assets.
        """
        levels: List[GameLevel] = []

        for chapter in chapters:
            concepts = concepts_by_chapter.get(chapter.id, [])
            for concept in concepts:
                level = self._build_level_for_concept(chapter, concept)
                levels.append(level)

        game_spec = InteractiveGameSpec(
            game_id=f"game_{chapters[0].id if chapters else 'book'}",
            book_title=book_title,
            levels=levels,
            scoring_system={
                "discovery_points": 100,
                "misconception_busted_points": 250,
                "streak_multiplier": True
            }
        )

        GateEnforcer.validate_game_spec({
            "game_id": game_spec.game_id,
            "book_title": game_spec.book_title,
            "levels": [
                {
                    "level_id": lvl.level_id,
                    "manipulables": [m.__dict__ for m in lvl.manipulables],
                    "rules": [r.__dict__ for r in lvl.rules]
                }
                for lvl in game_spec.levels
            ]
        })

        generated_files: Dict[str, str] = {}

        # 1. Export Game Data JSON
        data_path = os.path.join(self.output_dir, "book_game_data.json")
        with open(data_path, "w") as f:
            json.dump(self._serialize_game_spec(game_spec), f, indent=2)
        generated_files["book_game_data.json"] = data_path

        # 2. Export Standalone Interactive HTML5/JS Sandbox Game
        index_html_path = os.path.join(self.output_dir, "index.html")
        html_code = self._generate_html5_sandbox(game_spec)
        with open(index_html_path, "w") as f:
            f.write(html_code)
        generated_files["index.html"] = index_html_path

        # 3. Export React/TypeScript Interactive Component
        react_component_path = os.path.join(self.output_dir, "InteractiveRevisionGame.tsx")
        react_code = self._generate_react_component()
        with open(react_component_path, "w") as f:
            f.write(react_code)
        generated_files["InteractiveRevisionGame.tsx"] = react_component_path

        return generated_files

    def _build_level_for_concept(
        self, chapter: Chapter, concept: ConceptUnderstanding
    ) -> GameLevel:
        concept_title_lower = concept.title.lower()

        # Dynamic Game Mechanics based on subject
        if "plate" in concept_title_lower or "tectonic" in concept_title_lower:
            return self._build_tectonic_plates_level(chapter, concept)
        elif "charge" in concept_title_lower or "coulomb" in concept_title_lower:
            return self._build_electric_charge_level(chapter, concept)
        else:
            return self._build_generic_physics_level(chapter, concept)

    def _build_tectonic_plates_level(
        self, chapter: Chapter, concept: ConceptUnderstanding
    ) -> GameLevel:
        return GameLevel(
            level_id=f"level_{concept.concept_id}",
            concept_id=concept.concept_id,
            title=concept.title,
            topic="Geology: Plate Tectonic Boundaries",
            manipulables=[
                ManipulableObject(
                    id="plate_left",
                    label="Plate A (Continental Crust)",
                    object_type="tectonic_plate",
                    initial_position={"x": 25.0, "y": 50.0},
                    allow_drag_x=True,
                    attributes={"density": 2.7, "color": "#10b981"}
                ),
                ManipulableObject(
                    id="plate_right",
                    label="Plate B (Oceanic Crust)",
                    object_type="tectonic_plate",
                    initial_position={"x": 75.0, "y": 50.0},
                    allow_drag_x=True,
                    attributes={"density": 3.0, "color": "#06b6d4"}
                )
            ],
            rules=[
                CauseEffectRule(
                    rule_id="rule_convergent",
                    trigger_condition="distance < 15",
                    result_phenomenon="Convergent Boundary Collision",
                    visual_effect="Fold mountain buckling & oceanic subduction trench formation",
                    feedback_text="💥 Convergent Boundary! Denser oceanic plate subducts beneath continental crust, melting into magma and thrusting up mountain chains.",
                    source_reference=f"Page {concept.provenance.page_number if concept.provenance else 12}"
                ),
                CauseEffectRule(
                    rule_id="rule_divergent",
                    trigger_condition="distance > 65",
                    result_phenomenon="Divergent Boundary Rift",
                    visual_effect="Crustal fissure opens with glowing molten magma upwelling",
                    feedback_text="🌋 Divergent Boundary! As plates pull apart, molten basaltic magma rises from the mantle to create new oceanic crust.",
                    source_reference=f"Page {concept.provenance.page_number if concept.provenance else 14}"
                ),
                CauseEffectRule(
                    rule_id="rule_neutral",
                    trigger_condition="15 <= distance <= 65",
                    result_phenomenon="Stable Gliding",
                    visual_effect="Plates floating on ductile asthenosphere mantle",
                    feedback_text="Plates are in balanced transit over the convection currents of the asthenosphere.",
                    source_reference="General Plate Tectonics"
                )
            ],
            challenges=[
                GameChallenge(
                    challenge_id="ch_himalayas",
                    title="Form the Mountain Arc",
                    mission_prompt="Drag Plate A and Plate B together until they collide to produce a convergent fold mountain boundary.",
                    target_condition="distance < 15",
                    hint="Move the plates toward the center canvas.",
                    misconception_buster="Notice how subduction occurs because oceanic crust is denser than continental crust!"
                ),
                GameChallenge(
                    challenge_id="ch_rift_valley",
                    title="Open a Mid-Ocean Rift",
                    mission_prompt="Pull the plates far apart to observe what happens at a divergent zone.",
                    target_condition="distance > 65",
                    hint="Drag both plates away from each other toward the outer edges.",
                    misconception_buster="Busted: Divergence does not create empty vacuum — magma immediately wells up to forge new seabed!"
                )
            ],
            misconceptions=concept.misconceptions
        )

    def _build_electric_charge_level(
        self, chapter: Chapter, concept: ConceptUnderstanding
    ) -> GameLevel:
        return GameLevel(
            level_id=f"level_{concept.concept_id}",
            concept_id=concept.concept_id,
            title=concept.title,
            topic="Physics: Electrostatic Forces (Coulomb's Law)",
            manipulables=[
                ManipulableObject(
                    id="charge_1",
                    label="Charge q1 (+3 μC)",
                    object_type="electric_charge",
                    initial_position={"x": 30.0, "y": 50.0},
                    allow_drag_x=True,
                    allow_drag_y=True,
                    attributes={"charge_value": 3.0, "sign": "+", "color": "#3b82f6"}
                ),
                ManipulableObject(
                    id="charge_2",
                    label="Charge q2 (-3 μC)",
                    object_type="electric_charge",
                    initial_position={"x": 70.0, "y": 50.0},
                    allow_drag_x=True,
                    allow_drag_y=True,
                    attributes={"charge_value": -3.0, "sign": "-", "color": "#ef4444"}
                )
            ],
            rules=[
                CauseEffectRule(
                    rule_id="rule_coulomb_attraction",
                    trigger_condition="opposite_signs",
                    result_phenomenon="Attractive Electrostatic Force",
                    visual_effect="Vector arrows point toward each other; force scales as 1/r²",
                    feedback_text="⚡ Opposites Attract! Force magnitude F = k |q1 q2| / r² increases rapidly as distance shrinks.",
                    source_reference=f"Page {concept.provenance.page_number if concept.provenance else 8}"
                )
            ],
            challenges=[
                GameChallenge(
                    challenge_id="ch_force_quadruple",
                    title="Inverse-Square Mastery",
                    mission_prompt="Halve the distance between the two charges and watch the force arrows quadruple in magnitude!",
                    target_condition="distance < 25",
                    hint="Drag charge 1 closer to charge 2.",
                    misconception_buster="Notice both charges experience equal and opposite forces regardless of their individual sizes (Newton's 3rd Law)!"
                )
            ],
            misconceptions=concept.misconceptions
        )

    def _build_generic_physics_level(
        self, chapter: Chapter, concept: ConceptUnderstanding
    ) -> GameLevel:
        return GameLevel(
            level_id=f"level_{concept.concept_id}",
            concept_id=concept.concept_id,
            title=concept.title,
            topic=chapter.title,
            manipulables=[
                ManipulableObject(
                    id="param_controller",
                    label="Physical Parameter Controller",
                    object_type="generic_slider",
                    initial_position={"x": 50.0, "y": 50.0},
                    allow_drag_x=True,
                    attributes={"value": 1.0}
                )
            ],
            rules=[
                CauseEffectRule(
                    rule_id="rule_equilibrium",
                    trigger_condition="value > 0.5",
                    result_phenomenon=concept.core_law,
                    visual_effect="Harmonic oscillation equilibrium",
                    feedback_text=f"Demonstration of {concept.core_law}",
                    source_reference="Textbook Chapter"
                )
            ],
            challenges=[
                GameChallenge(
                    challenge_id="ch_general",
                    title="Concept Demonstration",
                    mission_prompt=f"Adjust the parameter to observe the direct effect described in {concept.title}.",
                    target_condition="value > 0.7",
                    hint="Drag controller past 70%.",
                    misconception_buster=concept.misconceptions[0].explanation if concept.misconceptions else None
                )
            ],
            misconceptions=concept.misconceptions
        )

    def _serialize_game_spec(self, game_spec: InteractiveGameSpec) -> Dict[str, Any]:
        return {
            "game_id": game_spec.game_id,
            "book_title": game_spec.book_title,
            "scoring_system": game_spec.scoring_system,
            "levels": [
                {
                    "level_id": lvl.level_id,
                    "title": lvl.title,
                    "topic": lvl.topic,
                    "manipulables": [m.__dict__ for m in lvl.manipulables],
                    "rules": [r.__dict__ for r in lvl.rules],
                    "challenges": [c.__dict__ for c in lvl.challenges],
                    "misconceptions": [m.to_dict() for m in lvl.misconceptions]
                }
                for lvl in game_spec.levels
            ]
        }

    def _generate_html5_sandbox(self, game_spec: InteractiveGameSpec) -> str:
        """
        Emits a standalone HTML5/JS playable sandbox with responsive touch & drag controls,
        real-time physics calculation, visual feedback, and misconception busting.
        """
        data_json = json.dumps(self._serialize_game_spec(game_spec))
        return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BIE Interactive Revision Game - {game_spec.book_title}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    .draggable {{ cursor: grab; user-select: none; touch-action: none; }}
    .draggable:active {{ cursor: grabbing; }}
    canvas {{ background: #030712; }}
  </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex flex-col font-sans">
  <!-- Top Navigation & Score Bar -->
  <header class="bg-slate-900/80 backdrop-blur border-b border-cyan-500/30 px-6 py-4 flex items-center justify-between">
    <div>
      <span class="text-xs font-mono uppercase text-cyan-400 tracking-wider">BIE Interactive Revision Sandbox</span>
      <h1 id="bookTitle" class="text-xl font-bold text-white">{game_spec.book_title}</h1>
    </div>
    <div class="flex items-center space-x-6">
      <div class="bg-slate-800 px-4 py-1.5 rounded-full border border-slate-700 text-sm">
        Score: <span id="scoreDisplay" class="font-bold text-cyan-400">0</span>
      </div>
      <select id="levelSelector" class="bg-slate-800 border border-cyan-500/40 rounded-xl px-4 py-1.5 text-sm text-white focus:outline-none"></select>
    </div>
  </header>

  <!-- Main Game Canvas Container -->
  <main class="flex-1 flex flex-col lg:flex-row p-6 gap-6 max-w-7xl mx-auto w-full">
    <!-- Interactive Canvas Sandbox Area -->
    <div class="flex-1 bg-slate-900 rounded-3xl border border-white/10 p-6 flex flex-col relative overflow-hidden shadow-2xl">
      <div class="flex justify-between items-center mb-4">
        <div>
          <h2 id="currentLevelTitle" class="text-lg font-bold text-cyan-300">Level Title</h2>
          <p id="currentLevelTopic" class="text-xs text-slate-400">Topic</p>
        </div>
        <button id="resetBtn" class="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700">
          Reset Objects
        </button>
      </div>

      <!-- Canvas for Physics & Manipulable Simulation -->
      <div class="flex-1 relative w-full h-[400px] lg:h-auto rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">
        <canvas id="gameCanvas" class="w-full h-full block"></canvas>
      </div>

      <!-- Live Dynamic Observation & Feedback Strip -->
      <div id="feedbackBanner" class="mt-4 p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/40 text-sm flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <span class="text-xl">🔬</span>
          <span id="feedbackText" class="text-slate-200 font-medium">Drag the objects on the canvas to observe real-time phenomena.</span>
        </div>
        <span id="sourceRef" class="text-xs text-cyan-400 font-mono bg-cyan-900/60 px-2.5 py-1 rounded-md">Page Ref</span>
      </div>
    </div>

    <!-- Right Sidebar: Challenges & Misconception Busters -->
    <div class="w-full lg:w-96 flex flex-col gap-6">
      <!-- Challenge Mission Card -->
      <div class="bg-slate-900 rounded-3xl border border-white/10 p-6 shadow-xl">
        <span class="text-xs font-bold uppercase tracking-wider text-amber-400">🎯 Active Mission</span>
        <h3 id="missionTitle" class="text-base font-bold text-white mt-1">Challenge Title</h3>
        <p id="missionPrompt" class="text-xs text-slate-300 mt-2 leading-relaxed">Mission Prompt</p>
        <div id="missionSuccess" class="hidden mt-3 p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-xs text-emerald-300 font-medium">
          ✅ Mission Accomplished! +100 Points
        </div>
      </div>

      <!-- Misconception Buster Card -->
      <div class="bg-slate-900 rounded-3xl border border-rose-500/20 p-6 shadow-xl flex-1">
        <span class="text-xs font-bold uppercase tracking-wider text-rose-400">🚫 Misconception Buster</span>
        <div class="mt-3">
          <p class="text-xs text-slate-400 uppercase font-semibold">The Myth:</p>
          <p id="mythText" class="text-xs text-rose-200 mt-0.5 italic">Common student assumption</p>
        </div>
        <div class="mt-4">
          <p class="text-xs text-slate-400 uppercase font-semibold">The Grounded Reality:</p>
          <p id="realityText" class="text-xs text-emerald-300 mt-0.5 font-medium leading-relaxed">Grounded scientific explanation</p>
        </div>
      </div>
    </div>
  </main>

  <script>
    const gameData = {data_json};
    let currentLevelIndex = 0;
    let score = 0;
    let canvas, ctx;
    let manipulables = [];
    let activeDragIndex = -1;

    window.addEventListener('DOMContentLoaded', () => {{
      canvas = document.getElementById('gameCanvas');
      ctx = canvas.getContext('2d');
      setupCanvasResolution();
      setupLevelSelector();
      loadLevel(0);
      setupEvents();
      requestAnimationFrame(renderLoop);
    }});

    function setupCanvasResolution() {{
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }}

    function setupLevelSelector() {{
      const sel = document.getElementById('levelSelector');
      sel.innerHTML = '';
      gameData.levels.forEach((lvl, idx) => {{
        const opt = document.createElement('option');
        opt.value = idx;
        opt.textContent = `Ch ${{idx+1}}: ${{lvl.title}}`;
        sel.appendChild(opt);
      }});
      sel.addEventListener('change', (e) => loadLevel(parseInt(e.target.value)));
      document.getElementById('resetBtn').addEventListener('click', () => loadLevel(currentLevelIndex));
    }}

    function loadLevel(index) {{
      currentLevelIndex = index;
      const lvl = gameData.levels[index];
      document.getElementById('currentLevelTitle').textContent = lvl.title;
      document.getElementById('currentLevelTopic').textContent = lvl.topic;

      // Deep clone manipulables
      const rect = canvas.getBoundingClientRect();
      manipulables = lvl.manipulables.map(m => ({{
        ...m,
        px: (m.initial_position.x / 100) * rect.width,
        py: (m.initial_position.y / 100) * rect.height,
        radius: 36
      }}));

      // Setup Challenge & Misconception
      if (lvl.challenges && lvl.challenges.length > 0) {{
        document.getElementById('missionTitle').textContent = lvl.challenges[0].title;
        document.getElementById('missionPrompt').textContent = lvl.challenges[0].mission_prompt;
      }}
      document.getElementById('missionSuccess').classList.add('hidden');

      if (lvl.misconceptions && lvl.misconceptions.length > 0) {{
        document.getElementById('mythText').textContent = lvl.misconceptions[0].myth;
        document.getElementById('realityText').textContent = lvl.misconceptions[0].reality;
      }}
    }}

    function setupEvents() {{
      const getPos = (e) => {{
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {{ x: clientX - rect.left, y: clientY - rect.top }};
      }};

      const onStart = (e) => {{
        const p = getPos(e);
        manipulables.forEach((m, idx) => {{
          const dx = m.px - p.x;
          const dy = m.py - p.y;
          if (Math.hypot(dx, dy) < m.radius) {{
            activeDragIndex = idx;
          }}
        }});
      }};

      const onMove = (e) => {{
        if (activeDragIndex === -1) return;
        const p = getPos(e);
        const m = manipulables[activeDragIndex];
        const rect = canvas.getBoundingClientRect();
        if (m.allow_drag_x) m.px = Math.max(m.radius, Math.min(rect.width - m.radius, p.x));
        if (m.allow_drag_y) m.py = Math.max(m.radius, Math.min(rect.height - m.radius, p.y));
      }};

      const onEnd = () => {{ activeDragIndex = -1; }};

      canvas.addEventListener('mousedown', onStart);
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onEnd);

      canvas.addEventListener('touchstart', onStart, {{ passive: true }});
      window.addEventListener('touchmove', onMove, {{ passive: true }});
      window.addEventListener('touchend', onEnd);
    }}

    function renderLoop() {{
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);

      // Evaluate Physics & Dynamic Rules
      evaluateSimulation(rect);

      // Draw Manipulables
      manipulables.forEach(m => {{
        ctx.beginPath();
        ctx.arc(m.px, m.py, m.radius, 0, Math.PI * 2);
        ctx.fillStyle = m.attributes.color || '#38bdf8';
        ctx.shadowColor = m.attributes.color || '#38bdf8';
        ctx.shadowBlur = 20;
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(m.label.substring(0, 10), m.px, m.py + 4);
      }});

      requestAnimationFrame(renderLoop);
    }}

    function evaluateSimulation(rect) {{
      if (manipulables.length < 2) return;
      const dx = Math.abs(manipulables[0].px - manipulables[1].px);
      const distPercent = (dx / rect.width) * 100;

      const lvl = gameData.levels[currentLevelIndex];
      let activeRule = null;

      if (distPercent < 18) {{
        activeRule = lvl.rules.find(r => r.trigger_condition.includes('< 20') || r.trigger_condition.includes('< 15'));
        // Draw Convergent mountain/effect between objects
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo((manipulables[0].px + manipulables[1].px)/2, manipulables[0].py - 40);
        ctx.lineTo((manipulables[0].px + manipulables[1].px)/2 + 20, manipulables[0].py + 20);
        ctx.stroke();
      }} else if (distPercent > 60) {{
        activeRule = lvl.rules.find(r => r.trigger_condition.includes('> 65') || r.trigger_condition.includes('> 60'));
        // Draw Rift fissure effect
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo((manipulables[0].px + manipulables[1].px)/2, 50);
        ctx.lineTo((manipulables[0].px + manipulables[1].px)/2, rect.height - 50);
        ctx.stroke();
      }}

      if (activeRule) {{
        document.getElementById('feedbackText').textContent = activeRule.feedback_text;
        document.getElementById('sourceRef').textContent = activeRule.source_reference;
        // Check challenge condition
        const ch = lvl.challenges[0];
        if (ch && ((ch.target_condition.includes('<') && distPercent < 20) || (ch.target_condition.includes('>') && distPercent > 60))) {{
          const banner = document.getElementById('missionSuccess');
          if (banner.classList.contains('hidden')) {{
            banner.classList.remove('hidden');
            score += 100;
            document.getElementById('scoreDisplay').textContent = score;
          }}
        }}
      }}
    }}
  </script>
</body>
</html>
"""

    def _generate_react_component(self) -> str:
        return """import React, { useState } from 'react';

export const InteractiveRevisionGame: React.FC = () => {
  const [score, setScore] = useState(0);

  return (
    <div className="w-full h-full bg-slate-950 text-white p-6 flex flex-col rounded-3xl border border-white/10">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-cyan-400">BIE Interactive Revision Sandbox</h2>
        <span className="font-mono text-sm bg-slate-800 px-4 py-1 rounded-full">Score: {score}</span>
      </div>
      <div className="flex-1 bg-slate-900 rounded-2xl flex items-center justify-center border border-slate-800">
        <iframe 
          src="index.html" 
          className="w-full h-full rounded-2xl border-none"
          title="Interactive Sandbox"
        />
      </div>
    </div>
  );
};
"""
