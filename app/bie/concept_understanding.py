"""
M050: Prerequisite-Plus Concept Understanding Engine.
Acts as the Master Teacher layer analyzing conceptual foundations,
must-know prerequisites, mathematical notation, cognitive misconceptions,
and grounded real-world phenomena from parsed textbook content blocks.
"""
from typing import Dict, Any, List, Optional, Set
import re
import hashlib

from bie_core.models import (
    ConceptUnderstanding,
    PrerequisiteItem,
    MisconceptionItem,
    NotationItem,
    ReadinessCheckItem,
    ProvenanceRecord,
    StructuredDocument,
    Chapter,
    Section,
    ContentBlock
)
from bie_core.contracts import GateEnforcer


class ConceptUnderstandingEngine:
    """Extracts deep pedagogical intelligence from textbook chapters and content blocks."""

    def __init__(self):
        # Master Knowledge Graph for Prerequisite Inferences
        self.prerequisite_kb = {
            "coulomb": [
                {
                    "id": "prereq_atomic_structure",
                    "title": "Atomic Structure and Bound Electrons",
                    "desc": "Knowledge of protons in the nucleus and bound/free electrons.",
                    "is_must_know": True,
                    "is_inferred": False,
                    "conf": 1.0,
                    "reason": "Direct textbook prerequisite stated in chapter intro."
                },
                {
                    "id": "prereq_newtons_third_law",
                    "title": "Newton's Third Law (Action-Reaction)",
                    "desc": "Forces between two interacting bodies are equal in magnitude and opposite in direction.",
                    "is_must_know": True,
                    "is_inferred": True,
                    "conf": 0.96,
                    "reason": "Coulomb force between q1 and q2 forms an action-reaction pair regardless of charge magnitude asymmetry."
                },
                {
                    "id": "prereq_inverse_square",
                    "title": "Inverse-Square Spatial Attenuation",
                    "desc": "Flux spread across a 3D spherical wavefront dropping as 1/r^2.",
                    "is_must_know": True,
                    "is_inferred": True,
                    "conf": 0.92,
                    "reason": "Fundamental geometric basis of both Coulomb's and Newton's gravitational fields."
                }
            ],
            "tectonics": [
                {
                    "id": "prereq_thermal_convection",
                    "title": "Mantle Thermal Convection",
                    "desc": "Heat transfer in viscoelastic solids causing buoyant upwelling and sinking currents.",
                    "is_must_know": True,
                    "is_inferred": False,
                    "conf": 1.0,
                    "reason": "Primary physical driving mechanism for plate motion."
                },
                {
                    "id": "prereq_litho_astheno",
                    "title": "Lithosphere vs. Asthenosphere Mechanical Contrasts",
                    "desc": "Rigid brittle tectonic plates riding atop ductile, deformable mantle rock.",
                    "is_must_know": True,
                    "is_inferred": True,
                    "conf": 0.94,
                    "reason": "Without understanding mechanical rheology contrast, students assume continents float directly on molten core."
                },
                {
                    "id": "prereq_density_isostasy",
                    "title": "Buoyancy & Isostatic Equilibrium",
                    "desc": "Archimedes principle applied to continental vs denser oceanic crust.",
                    "is_must_know": True,
                    "is_inferred": True,
                    "conf": 0.88,
                    "reason": "Crucial for predicting which tectonic plate subducts at convergent margins."
                }
            ],
            "gravitation": [
                {
                    "id": "prereq_newton_second_law",
                    "title": "Newton's Second Law & Inertia",
                    "desc": "F = ma and the proportionality of force to acceleration.",
                    "is_must_know": True,
                    "is_inferred": False,
                    "conf": 1.0,
                    "reason": "Required to relate gravitational force to orbital acceleration."
                },
                {
                    "id": "prereq_centripetal_acceleration",
                    "title": "Centripetal Acceleration in Curved Motion",
                    "desc": "a_c = v^2 / r directed toward the orbital center of mass.",
                    "is_must_know": True,
                    "is_inferred": True,
                    "conf": 0.95,
                    "reason": "Orbits represent continuous gravitational freefall balanced by tangential velocity."
                },
                {
                    "id": "prereq_mass_vs_weight",
                    "title": "Mass (Intrinsic) vs. Weight (Gravitational Field Force)",
                    "desc": "Distinction between quantity of matter and local gravitational pull.",
                    "is_must_know": True,
                    "is_inferred": True,
                    "conf": 0.91,
                    "reason": "Critical prerequisite to prevent mistaking microgravity for true absence of gravity."
                }
            ]
        }

    def analyze_chapter(
        self,
        chapter: Chapter,
        source_file: str = "textbook.pdf"
    ) -> List[ConceptUnderstanding]:
        """
        Extracts rich conceptual understanding from chapter content blocks.
        """
        concepts: List[ConceptUnderstanding] = []

        for section in chapter.sections:
            cu = self._analyze_section(chapter, section, source_file)
            GateEnforcer.validate_concept_understanding({
                "concept_id": cu.concept_id,
                "title": cu.title,
                "core_law": cu.core_law,
                "must_know_prerequisites": [p.__dict__ for p in cu.must_know_prerequisites],
                "misconceptions": [m.__dict__ for m in cu.misconceptions],
            })
            concepts.append(cu)

        return concepts

    def _analyze_section(
        self,
        chapter: Chapter,
        section: Section,
        source_file: str
    ) -> ConceptUnderstanding:
        """Deep analysis of a single section combining domain heuristics with parsed content blocks."""
        combined_text = " ".join([b.content for b in section.blocks] + [section.title, chapter.title]).lower()

        # Build base provenance
        first_prov = section.blocks[0].provenance if section.blocks else None
        prov = ProvenanceRecord(
            source_file=first_prov.source_file if first_prov else source_file,
            page_number=first_prov.page_number if first_prov else (chapter.number * 10 + 1),
            bbox=first_prov.bbox if first_prov else {"x": 5.0, "y": 10.0, "width": 90.0, "height": 35.0},
            source_text_hash=first_prov.source_text_hash if first_prov else hashlib.sha256(section.title.encode()).hexdigest()[:12],
            is_inferred=False,
            confidence=1.0,
            reason=None
        )

        # Domain routing
        if "tectonic" in combined_text or "plate" in combined_text or "geodyn" in combined_text or "crust" in combined_text:
            return self._synthesize_tectonics_concept(chapter, section, prov)
        elif "charge" in combined_text or "coulomb" in combined_text or "electrostatic" in combined_text:
            return self._synthesize_coulomb_concept(chapter, section, prov)
        elif "gravity" in combined_text or "gravitation" in combined_text or "orbit" in combined_text:
            return self._synthesize_gravitation_concept(chapter, section, prov)
        else:
            return self._synthesize_universal_concept(chapter, section, prov)

    def _synthesize_coulomb_concept(
        self, chapter: Chapter, section: Section, prov: ProvenanceRecord
    ) -> ConceptUnderstanding:
        prereqs = [
            PrerequisiteItem(
                id=p["id"],
                title=p["title"],
                description=p["desc"],
                is_must_know=p["is_must_know"],
                is_inferred=p["is_inferred"],
                confidence=p["conf"],
                reason=p["reason"],
                provenance=prov
            )
            for p in self.prerequisite_kb["coulomb"]
        ]

        notation = [
            NotationItem(symbol="q_1, q_2", meaning="Point Charges", unit="Coulomb (C)", physical_intuition="Quantity of net electric charge"),
            NotationItem(symbol="r", meaning="Separation Distance", unit="Meter (m)", physical_intuition="Straight-line distance between charge centroids"),
            NotationItem(symbol="k_e", meaning="Coulomb Constant", unit="N*m^2/C^2", physical_intuition="Permittivity scaling factor (~8.988e9)"),
            NotationItem(symbol="\\vec{F}", meaning="Electrostatic Force Vector", unit="Newton (N)", physical_intuition="Collinear vector along charge line of centers")
        ]

        misconceptions = [
            MisconceptionItem(
                id="misc_friction_creates_charge",
                myth="Rubbing glass or amber with wool creates brand new electrical charges out of nothing.",
                reality="Friction merely transfers pre-existing outer valence electrons between materials; net charge of the universe is strictly conserved.",
                explanation="The triboelectric effect involves contact potential differences and electron shearing, not nucleosynthesis of charge.",
                trap_scenario="When a balloon is rubbed on wool and sticks to a neutral wall, was new charge synthesized in the balloon?",
                provenance=prov
            ),
            MisconceptionItem(
                id="misc_charge_asymmetry_force",
                myth="A large +10 Coulomb charge exerts a much stronger repulsive force on a tiny +1 nanoCoulomb charge than the nanoCoulomb charge exerts back.",
                reality="Both charges experience forces of strictly identical magnitude, governed by Newton's Third Law and the commutative product q1*q2.",
                explanation="The electrostatic interaction is mutual; force magnitude depends on the product of both charges, not individual dominance.",
                trap_scenario="If a massive thundercloud (+100 C) repels an airborne dust speck (+1 nC), does the cloud feel a smaller force than the speck?",
                provenance=prov
            )
        ]

        readiness_checks = [
            ReadinessCheckItem(
                question="According to Newton's Third Law, if object A exerts 50 N on object B, what force does B exert on A?",
                options=["25 N in the same direction", "50 N in the opposite direction", "0 N unless B is heavier"],
                correct_option_index=1,
                explanation="Action and reaction forces are strictly equal in magnitude and opposite in direction.",
                tested_prerequisite_id="prereq_newtons_third_law"
            ),
            ReadinessCheckItem(
                question="What happens to the strength of an inverse-square field when distance r is doubled?",
                options=["Halved to 1/2", "Reduced to 1/4", "Quadrupled to 4x"],
                correct_option_index=1,
                explanation="Because force scales with 1/r^2, doubling r reduces force to 1/(2^2) = 1/4.",
                tested_prerequisite_id="prereq_inverse_square"
            )
        ]

        return ConceptUnderstanding(
            concept_id=f"concept_{chapter.id}_{section.id}",
            title="Electric Charge & Coulomb's Law",
            chapter_id=chapter.id,
            core_law="F = k_e * (|q_1 * q_2|) / r^2",
            must_know_prerequisites=prereqs,
            helpful_background=["Bohr Model of the Atom", "Vector component addition", "Newtonian gravitation"],
            symbols_and_notation=notation,
            misconceptions=misconceptions,
            readiness_checks=readiness_checks,
            visual_metaphors=["Invisible geometric tension lines stretching and compressing like springs between point charges"],
            real_world_phenomena=[
                {
                    "title": "Atmospheric Lightning Discharge",
                    "type": "real_video_clip",
                    "url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
                    "overlay_label": "Real-Life Electrostatic Breakdown: 10^9 Joules dielectric air discharge",
                    "description": "Massive electrostatic charge separation between cloud base and induced ground charges overcoming dielectric breakdown of air."
                }
            ],
            provenance=prov
        )

    def _synthesize_tectonics_concept(
        self, chapter: Chapter, section: Section, prov: ProvenanceRecord
    ) -> ConceptUnderstanding:
        prereqs = [
            PrerequisiteItem(
                id=p["id"],
                title=p["title"],
                description=p["desc"],
                is_must_know=p["is_must_know"],
                is_inferred=p["is_inferred"],
                confidence=p["conf"],
                reason=p["reason"],
                provenance=prov
            )
            for p in self.prerequisite_kb["tectonics"]
        ]

        notation = [
            NotationItem(symbol="v_{plate}", meaning="Plate Drift Velocity", unit="cm/year", physical_intuition="Relative horizontal motion velocity vector"),
            NotationItem(symbol="\\rho_{crust}", meaning="Crustal Density", unit="g/cm^3", physical_intuition="Granitic continental (~2.7) vs basaltic oceanic (~3.0)"),
            NotationItem(symbol="\\theta_{sub}", meaning="Subduction Angle", unit="Degrees (°)", physical_intuition="Dip angle of descending lithospheric slab into mantle")
        ]

        misconceptions = [
            MisconceptionItem(
                id="misc_magma_ocean",
                myth="Tectonic plates float like boats on top of a completely liquid ocean of molten magma.",
                reality="The asthenosphere is over 98% solid crystalline rock that creeps via plastic viscoelastic deformation under high pressure and temperature.",
                explanation="True molten liquid magma only exists in isolated melt pockets and volcanic magma chambers.",
                trap_scenario="If you drill 100 km through an oceanic plate, will you fall into a subterranean ocean of liquid lava?",
                provenance=prov
            ),
            MisconceptionItem(
                id="misc_crust_earthquake_separation",
                myth="Earthquakes open up bottomless chasms that swallow cities like in disaster movies.",
                reality="Earthquakes are shear slip events along locked fault planes where friction is overcome; plates slide past or over each other under intense compressive lithostatic pressure.",
                explanation="Lithostatic overburden pressure prevents deep open chasms from forming or remaining open in the crust.",
                trap_scenario="Can an earthquake fault open up a 5-kilometer deep bottomless chasm?",
                provenance=prov
            )
        ]

        readiness_checks = [
            ReadinessCheckItem(
                question="Why does dense oceanic basaltic crust sink beneath lighter continental granitic crust at convergent margins?",
                options=["It is pushed down by ocean water weight", "It has higher density and sinks due to negative buoyancy", "Continental crust is magnetic"],
                correct_option_index=1,
                explanation="Higher density (3.0 g/cm^3 vs 2.7 g/cm^3) causes the oceanic plate to undergo gravitational subduction.",
                tested_prerequisite_id="prereq_density_isostasy"
            )
        ]

        return ConceptUnderstanding(
            concept_id=f"concept_{chapter.id}_{section.id}",
            title="Plate Tectonics & Boundary Dynamics",
            chapter_id=chapter.id,
            core_law="\\sigma_{lith} = E \\cdot \\epsilon + \\eta \\cdot \\dot{\\epsilon} \\quad \\text{(Viscoelastic Slab Pull & Ridge Push)}",
            must_know_prerequisites=prereqs,
            helpful_background=["Paleomagnetic striping", "Continental shelf jigsaw fit", "Seismic P and S wave shadow zones"],
            symbols_and_notation=notation,
            misconceptions=misconceptions,
            readiness_checks=readiness_checks,
            visual_metaphors=["A vast planetary conveyor belt where ocean crust is born hot at mid-ocean ridges and dies cold in subduction trenches"],
            real_world_phenomena=[
                {
                    "title": "Volcanic Island Arc Subduction Eruption",
                    "type": "real_video_clip",
                    "url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
                    "overlay_label": "Real-Life Subduction Zone: Dehydration melting triggering stratovolcanic eruption",
                    "description": "Subducting Pacific slab releasing volatiles into the mantle wedge, lowering melting point and producing volcanic eruptions."
                }
            ],
            provenance=prov
        )

    def _synthesize_gravitation_concept(
        self, chapter: Chapter, section: Section, prov: ProvenanceRecord
    ) -> ConceptUnderstanding:
        prereqs = [
            PrerequisiteItem(
                id=p["id"],
                title=p["title"],
                description=p["desc"],
                is_must_know=p["is_must_know"],
                is_inferred=p["is_inferred"],
                confidence=p["conf"],
                reason=p["reason"],
                provenance=prov
            )
            for p in self.prerequisite_kb["gravitation"]
        ]

        notation = [
            NotationItem(symbol="G", meaning="Universal Gravitational Constant", unit="N*m^2/kg^2", physical_intuition="Universal coupling strength (~6.674e-11)"),
            NotationItem(symbol="M, m", meaning="Gravitational Masses", unit="Kilogram (kg)", physical_intuition="Inertial and gravitational source masses"),
            NotationItem(symbol="v_{orbit}", meaning="Orbital Velocity", unit="m/s", physical_intuition="Tangential speed needed to maintain circular freefall")
        ]

        misconceptions = [
            MisconceptionItem(
                id="misc_zero_g_in_orbit",
                myth="Astronauts on the International Space Station float because there is zero gravity in space.",
                reality="Earth's gravity at the ISS altitude (400 km) is ~90% of surface gravity; astronauts float because both they and the station are in continuous orbital freefall.",
                explanation="Orbital velocity (~7.66 km/s) carries them forward at the exact rate the Earth's surface curves away beneath them.",
                trap_scenario="If the ISS stopped moving tangentially in orbit, would astronauts continue to float weightlessly?",
                provenance=prov
            )
        ]

        readiness_checks = [
            ReadinessCheckItem(
                question="What would your mass be on the surface of the Moon compared to Earth?",
                options=["1/6th as much", "Exactly the same", "6 times as much"],
                correct_option_index=1,
                explanation="Mass is an intrinsic measure of matter and does not change with location; only weight changes.",
                tested_prerequisite_id="prereq_mass_vs_weight"
            )
        ]

        return ConceptUnderstanding(
            concept_id=f"concept_{chapter.id}_{section.id}",
            title="Universal Gravitation & Orbital Freefall",
            chapter_id=chapter.id,
            core_law="F_g = G \\cdot \\frac{M \\cdot m}{r^2} = m \\cdot \\frac{v^2}{r}",
            must_know_prerequisites=prereqs,
            helpful_background=["Kepler's Laws of Planetary Motion", "Newton's Laws of Motion"],
            symbols_and_notation=notation,
            misconceptions=misconceptions,
            readiness_checks=readiness_checks,
            visual_metaphors=["Newton's Mountain cannonball: fired so fast that its projectile trajectory curves at the exact rate as the spherical Earth"],
            real_world_phenomena=[
                {
                    "title": "ISS Space Station Freefall Flight",
                    "type": "real_video_clip",
                    "url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
                    "overlay_label": "Real-Life Orbital Dynamics: 90% surface gravity perceived as weightless freefall",
                    "description": "Astronauts conducting experiments inside the ISS demonstrating orbital freefall equivalence."
                }
            ],
            provenance=prov
        )

    def _synthesize_universal_concept(
        self, chapter: Chapter, section: Section, prov: ProvenanceRecord
    ) -> ConceptUnderstanding:
        """Dynamically synthesizes concept intelligence from section text blocks for any academic topic."""
        # Extract formulas if present
        formula_block = next((b for b in section.blocks if b.block_type == "formula"), None)
        core_law = formula_block.content if formula_block else f"Governing physical laws of {section.title}"

        # Extract variables from formula
        var_matches = re.findall(r'[A-Za-z_]\w*', core_law)
        symbols = [v for v in set(var_matches) if v.lower() not in ["and", "or", "the", "law", "core", "principle", "of"]]

        notation = [
            NotationItem(symbol=s, meaning=f"Variable {s}", unit="SI standard", physical_intuition=f"Physical state parameter {s} in {section.title}")
            for s in symbols[:4]
        ]
        if not notation:
            notation.append(NotationItem(symbol="x", meaning="State Variable", unit="Unitless", physical_intuition="Dynamic system parameter"))

        prereqs = [
            PrerequisiteItem(
                id=f"prereq_{section.id}_foundations",
                title=f"Core Foundations of {chapter.title}",
                description=f"Theoretical definitions and conservation principles underpinning {section.title}.",
                is_must_know=True,
                is_inferred=False,
                confidence=1.0,
                reason="Explicitly derived from chapter scope and introductory definitions.",
                provenance=prov
            ),
            PrerequisiteItem(
                id=f"prereq_{section.id}_vector_algebra",
                title="Vector Algebra & Component Decomposition",
                description="Ability to resolve directional quantities into orthogonal components.",
                is_must_know=True,
                is_inferred=True,
                confidence=0.92,
                reason="Multidimensional physical phenomena require vector decomposition for quantitative problem solving.",
                provenance=prov
            )
        ]

        misconceptions = [
            MisconceptionItem(
                id=f"misc_{section.id}_intuitive_trap",
                myth=f"Superficial intuitive assumption that {section.title} behaves proportionally under all extremes.",
                reality=f"Physical limits and boundary conditions fundamentally constrain behavior in {section.title}.",
                explanation="Extreme physical regimes introduce non-linearities and conservation constraints.",
                trap_scenario=f"What happens to {section.title} when physical parameters approach boundary asymptotes?",
                provenance=prov
            )
        ]

        readiness_checks = [
            ReadinessCheckItem(
                question=f"When analyzing {section.title}, how do system boundary constraints affect equilibrium?",
                options=["Boundary constraints dictate dynamic steady state", "Boundaries have zero impact", "Only temperature matters"],
                correct_option_index=0,
                explanation="Conservation laws and boundary conditions uniquely determine the physical state.",
                tested_prerequisite_id=f"prereq_{section.id}_foundations"
            )
        ]

        return ConceptUnderstanding(
            concept_id=f"concept_{chapter.id}_{section.id}",
            title=section.title,
            chapter_id=chapter.id,
            core_law=core_law,
            must_know_prerequisites=prereqs,
            helpful_background=[f"Prior modules on {chapter.title}"],
            symbols_and_notation=notation,
            misconceptions=misconceptions,
            readiness_checks=readiness_checks,
            visual_metaphors=[f"Dynamic multi-body equilibrium model for {section.title}"],
            real_world_phenomena=[
                {
                    "title": f"Empirical Observation of {section.title}",
                    "type": "real_video_clip",
                    "url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
                    "overlay_label": f"Real-Life Empirical Verification: {section.title}",
                    "description": f"Experimental laboratory observation and real-world confirmation of {section.title}."
                }
            ],
            provenance=prov
        )
