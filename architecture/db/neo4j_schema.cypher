// ====================================================================
// BOOK-TO-VIDEO INTELLIGENCE ENGINE (BIE) - NEO4J KNOWLEDGE GRAPH SCHEMA
// Prerequisite-Plus Cognitive Ontology & Dynamic Bridge Routing
// ====================================================================

// 1. Constraints & Indices
CREATE CONSTRAINT concept_id_unique IF NOT EXISTS
FOR (c:Concept) REQUIRE c.id IS UNIQUE;

CREATE CONSTRAINT lesson_id_unique IF NOT EXISTS
FOR (l:Lesson) REQUIRE l.id IS UNIQUE;

CREATE CONSTRAINT misconception_id_unique IF NOT EXISTS
FOR (m:Misconception) REQUIRE m.id IS UNIQUE;

CREATE INDEX concept_domain_idx IF NOT EXISTS
FOR (c:Concept) ON (c.domain);

// 2. Sample Ontology Seeding for Modern Physics & Geodynamics
MERGE (c1:Concept {
    id: "concept_newton_third_law",
    name: "Newton's Third Law of Motion",
    domain: "Classical Mechanics",
    bloom_depth: 1,
    si_notations: ["F_AB = -F_BA"]
})
MERGE (c2:Concept {
    id: "concept_charge_conservation",
    name: "Conservation of Electric Charge",
    domain: "Electromagnetism",
    bloom_depth: 1,
    si_notations: ["Q_total = constant", "e = 1.602e-19 C"]
})
MERGE (c3:Concept {
    id: "concept_coulombs_law",
    name: "Coulomb's Inverse-Square Law",
    domain: "Electromagnetism",
    bloom_depth: 2,
    si_notations: ["F = k * |q1*q2| / r^2", "k_e = 8.98755e9 N*m^2/C^2"]
})
MERGE (c4:Concept {
    id: "concept_electric_field",
    name: "Electric Field Vector & Gauss Flux",
    domain: "Electromagnetism",
    bloom_depth: 3,
    si_notations: ["E = F / q", "Phi_E = oint E * dA"]
})

// Prerequisite Directed Relationships
MERGE (c1)-[:PREREQUISITE_TO {
    weight: 0.95,
    type: "MUST_KNOW",
    remediation_required_on_fail: true
}]->(c3);

MERGE (c2)-[:PREREQUISITE_TO {
    weight: 0.88,
    type: "MUST_KNOW",
    remediation_required_on_fail: true
}]->(c3);

MERGE (c3)-[:PREREQUISITE_TO {
    weight: 0.92,
    type: "FOUNDATIONAL",
    remediation_required_on_fail: false
}]->(c4);

// 3. Misconception Traps & Remediation Bridges
MERGE (m1:Misconception {
    id: "misc_coulomb_asymmetry",
    myth: "A large charge exerts more force on a small charge than the small charge exerts on it.",
    reality: "The electrostatic force is mutual and strictly symmetric in magnitude by Newton's Third Law."
})
MERGE (c3)-[:HAS_MISCONCEPTION]->(m1);

MERGE (b1:RemediationBridge {
    id: "bridge_ice_skaters",
    analogy: "Two ice skaters pushing off: regardless of their size or mass difference, the contact push is identical.",
    target_duration_seconds: 60,
    media_asset_type: "REMOTION_CALLOUT"
})
MERGE (m1)-[:RESOLVED_BY]->(b1);

// 4. Core Query: Trace Prerequisite Chain for a Target Lesson
// MATCH path = (p:Concept)-[:PREREQUISITE_TO*1..3]->(target:Concept {id: "concept_coulombs_law"})
// RETURN path;
