"""
M100: Pedagogical Curriculum Planner & Remedial Bridge Engine.
Plans structured lesson sequences across textbook chapters, enforcing Prerequisite-Plus bridges
whenever learner diagnostic readiness indicates conceptual gaps.
"""
from typing import List, Dict, Any, Optional
from bie_core.models import (
    LessonUnit,
    PrerequisiteBridge,
    ConceptUnderstanding,
    Chapter
)


class LessonPlanner:
    """Plans pedagogical curriculum and inserts prerequisite remediation bridges."""

    def __init__(self):
        pass

    def plan_curriculum(
        self,
        chapters: List[Chapter],
        concepts_by_chapter: Dict[str, List[ConceptUnderstanding]],
        learner_readiness_status: Optional[Dict[str, bool]] = None
    ) -> List[LessonUnit]:
        """
        Plans all lessons across chapters.
        If learner_readiness_status indicates a prerequisite is missing (False),
        a PrerequisiteBridge is automatically prepended to the lesson unit.
        """
        if learner_readiness_status is None:
            learner_readiness_status = {}

        lessons: List[LessonUnit] = []

        for chapter in chapters:
            chapter_concepts = concepts_by_chapter.get(chapter.id, [])

            for idx, concept in enumerate(chapter_concepts):
                lesson_id = f"lesson_{chapter.id}_{idx + 1}"

                # Check if any must-know prerequisite is flagged unready
                bridge: Optional[PrerequisiteBridge] = None
                unready_prereqs = []
                for prereq in concept.must_know_prerequisites:
                    is_ready = learner_readiness_status.get(prereq.id, True)
                    if not is_ready:
                        unready_prereqs.append(prereq)

                if unready_prereqs:
                    primary_prereq = unready_prereqs[0]
                    analogy = concept.visual_metaphors[0] if concept.visual_metaphors else "Essential physical foundation"
                    bridge = PrerequisiteBridge(
                        bridge_id=f"bridge_{primary_prereq.id}",
                        target_prerequisite_id=primary_prereq.id,
                        explanation=f"Before diving into {concept.title}, let's quickly refresh {primary_prereq.title}: {primary_prereq.description}",
                        analogy=analogy,
                        duration_seconds=60 * len(unready_prereqs)
                    )

                base_duration = 360
                total_duration = base_duration + (bridge.duration_seconds if bridge else 0)

                # Bloom's Taxonomy Objectives
                action_verbs = ["Analyze", "Calculate", "Differentiate", "Confront and resolve"]
                objectives = [
                    f"{action_verbs[0]} the physical laws governing {concept.title}",
                    f"{action_verbs[1]} dynamic quantities using standard SI notation ({', '.join([s.symbol for s in concept.symbols_and_notation[:3]])})",
                    f"{action_verbs[2]} between empirical reality and common misconceptions (e.g. {concept.misconceptions[0].myth[:40]}...)" if concept.misconceptions else "Examine boundary constraints",
                    f"{action_verbs[3]} intuitive physical traps in the interactive revision game"
                ]

                # Phase scheduling
                phases = [
                    "Phase 1: Hook & Phenomenon Curiosity (Empirical Observation)",
                ]
                if bridge:
                    phases.append(f"Phase 2: Prerequisite Remedial Bridge ({bridge.target_prerequisite_id})")
                else:
                    phases.append("Phase 2: Notation & Foundational Coordinates Setup")
                
                phases.extend([
                    "Phase 3: Core Conceptual Law & Mathematical Derivation",
                    "Phase 4: Multi-Body Dynamics & Spatial Mechanics Visualization",
                    "Phase 5: Cognitive Misconception Confrontation & Socratic Refutation",
                    "Phase 6: Synthesis, Conceptual Check & Revision Game Handoff"
                ])

                unit = LessonUnit(
                    lesson_id=lesson_id,
                    chapter_id=chapter.id,
                    title=f"Lesson {idx + 1}: {concept.title}",
                    target_concept_id=concept.concept_id,
                    duration_seconds=total_duration,
                    prerequisite_bridge=bridge,
                    pedagogical_phases=phases,
                    learning_objectives=objectives
                )
                lessons.append(unit)

        return lessons
