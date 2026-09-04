/**
 * Gemini AI Multimodal Textbook Decomposition Service
 * Integrates directly with Google Generative AI (gemini-3.6-flash)
 * Backed by Multi-Domain 3D Procedural Simulation Architectures
 */

const { DOMAIN_REGISTRY } = require('./app/bie/domain_simulation_registry.js');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = 'gemini-3.6-flash';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

/**
 * Detects the best matching scientific domain key based on text analysis
 */
function resolveScientificDomainKey(subject = '', text = '') {
  const combined = `${subject} ${text}`.toLowerCase();
  if (combined.includes('bio') || combined.includes('dna') || combined.includes('crispr') || combined.includes('gene') || combined.includes('rna') || combined.includes('cell')) {
    return 'biology_crispr_dna';
  }
  if (combined.includes('chem') || combined.includes('dipole') || combined.includes('water') || combined.includes('hydrogen bond') || combined.includes('molecule') || combined.includes('orbital')) {
    return 'chemistry_molecular_orbitals';
  }
  if (combined.includes('astro') || combined.includes('black hole') || combined.includes('relativity') || combined.includes('gravity') || combined.includes('spacetime') || combined.includes('cosmo')) {
    return 'astrophysics_black_hole';
  }
  if (combined.includes('neuro') || combined.includes('synap') || combined.includes('brain') || combined.includes('neuron') || combined.includes('axon') || combined.includes('vesicle')) {
    return 'neuroscience_synapse';
  }
  if (combined.includes('geo') || combined.includes('tectonic') || combined.includes('mantle') || combined.includes('earth') || combined.includes('subduction') || combined.includes('crust')) {
    return 'geophysics_plate_tectonics';
  }
  return 'electromagnetism_cyclotron';
}

/**
 * Decomposes a raw textbook chapter into BIE pedagogical units:
 * - Bloom's taxonomy objectives
 * - Prerequisite-plus dependency graph
 * - Cognitive misconceptions and empirical refutations
 * - Socratic director dialogue (Dr. Maya & Alex)
 * - 3D Procedural Simulation parameters & camera staging
 * - Grounded mathematical formulas and real-world observation clips
 */
async function decomposeTextbookChapter(title, chapterText, subject = 'Physics') {
  const domainKey = resolveScientificDomainKey(subject, `${title} ${chapterText}`);
  const registeredDomain = DOMAIN_REGISTRY[domainKey] || DOMAIN_REGISTRY.electromagnetism_cyclotron;

  if (!GEMINI_API_KEY) {
    console.warn('[GeminiService] No GEMINI_API_KEY provided. Using domain registry fallback for:', domainKey);
    return getFallbackDecomposition(title, chapterText, subject, registeredDomain);
  }

  const prompt = `You are the core cognitive engine of the Book-to-Video Intelligence Engine (BIE).
Analyze the following textbook excerpt and compile it into an advanced, non-slide, cinematic pedagogical specification for automated Remotion video generation and an interactive 3D WebGL scientific simulation.

TEXTBOOK TITLE: "${title}"
SUBJECT DOMAIN: "${subject}"
TARGET SIMULATION DOMAIN: "${domainKey}" (${registeredDomain.title})
TEXTBOOK EXCERPT:
"""
${chapterText.slice(0, 4000)}
"""

You MUST respond with valid JSON matching this exact schema:
{
  "lessonId": "slugified_lesson_id",
  "title": "Clean Lesson Title",
  "subject": "${subject}",
  "domainKey": "${domainKey}",
  "bloomTaxonomy": {
    "level": "Analyze | Apply | Understand | Evaluate | Synthesize",
    "objective": "Primary measurable learning objective"
  },
  "prerequisites": [
    {
      "concept": "Name of prerequisite concept",
      "type": "must_know | helpful_background",
      "summary": "Brief explanation",
      "diagnosticQuestion": {
        "question": "Diagnostic multiple choice question testing this prerequisite",
        "options": ["Trap choice (intuitive error)", "Correct choice (grounded scientific reality)"],
        "correctIndex": 1,
        "remediationBridge": "Clear Socratic analogy bridging the conceptual gap if failed"
      }
    }
  ],
  "misconceptions": [
    {
      "myth": "Common intuitive student misunderstanding",
      "reality": "Empirically grounded scientific fact",
      "challengeAction": "Specific physical action in simulation to debunk this"
    }
  ],
  "dialogue": [
    {
      "speaker": "Dr. Maya (Lead Instructor)",
      "text": "Introductory conceptual explanation grounded in deep science",
      "duration_frames": 180,
      "visual_cue": "HIGHLIGHT_SPATIAL_VECTOR"
    },
    {
      "speaker": "Alex (Student)",
      "text": "Socratic question probing the edge case or misconception",
      "duration_frames": 150,
      "visual_cue": "CAMERA_ORBIT_3D"
    },
    {
      "speaker": "Dr. Maya (Lead Instructor)",
      "text": "Rigorous resolution explaining the underlying law and mathematical mechanics",
      "duration_frames": 240,
      "visual_cue": "SHOW_MATHEMATICAL_DERIVATION"
    }
  ],
  "simulation3D": {
    "mode": "${domainKey}",
    "title": "${registeredDomain.title}",
    "scientificFormula": "${registeredDomain.coreFormula}",
    "initialParameters": {
      "param1": ${registeredDomain.parameters[0].default},
      "param2": ${registeredDomain.parameters[1].default},
      "param3": ${registeredDomain.parameters[2].default}
    },
    "realWorldClip": {
      "label": "Empirical scientific laboratory observation",
      "attribution": "BIE Science Archive"
    }
  }
}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 9000);

    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2
        }
      })
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[GeminiService] API error (${response.status}):`, errText);
      return getFallbackDecomposition(title, chapterText, subject, registeredDomain);
    }

    const data = await response.json();
    const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidate) {
      throw new Error('No candidate content received from Gemini API');
    }

    const parsed = JSON.parse(candidate);
    parsed._aiGenerated = true;
    parsed._model = GEMINI_MODEL;
    if (!parsed.domainKey) parsed.domainKey = domainKey;
    return parsed;
  } catch (err) {
    console.error('[GeminiService] Execution failed, falling back to registered domain model:', err);
    return getFallbackDecomposition(title, chapterText, subject, registeredDomain);
  }
}

function getFallbackDecomposition(title, chapterText, subject, registeredDomain) {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 30);
  return {
    lessonId: slug || registeredDomain.domainId,
    title: title || registeredDomain.title,
    subject: subject || registeredDomain.subject,
    domainKey: registeredDomain.domainId,
    _aiGenerated: false,
    _model: 'domain_registry_procedural',
    bloomTaxonomy: {
      level: 'Analyze',
      objective: `Investigate and predict dynamic equilibrium behaviors in ${registeredDomain.title}.`
    },
    prerequisites: [
      {
        concept: `${registeredDomain.category} Foundations`,
        type: 'must_know',
        summary: `Grounded understanding of ${registeredDomain.scientificLaw}.`,
        diagnosticQuestion: {
          question: `In ${registeredDomain.title}, what primary factor dictates system transition?`,
          options: [
            'Superficial mechanical friction or external bias',
            'Fundamental conservation laws and thermodynamic equilibrium'
          ],
          correctIndex: 1,
          remediationBridge: registeredDomain.misconception.reality
        }
      }
    ],
    misconceptions: [
      {
        myth: registeredDomain.misconception.myth,
        reality: registeredDomain.misconception.reality,
        challengeAction: registeredDomain.misconception.remediationAction
      }
    ],
    dialogue: registeredDomain.socraticDialogue.map(d => ({
      speaker: d.speaker,
      text: d.text,
      duration_frames: 200,
      visual_cue: d.visualCue
    })),
    simulation3D: {
      mode: registeredDomain.domainId,
      title: registeredDomain.title,
      scientificFormula: registeredDomain.coreFormula,
      initialParameters: {
        param1: registeredDomain.parameters[0].default,
        param2: registeredDomain.parameters[1].default,
        param3: registeredDomain.parameters[2].default
      },
      realWorldClip: {
        label: `Empirical laboratory evidence: ${registeredDomain.title}`,
        attribution: 'BIE Scientific Archive'
      }
    }
  };
}

module.exports = {
  decomposeTextbookChapter,
  resolveScientificDomainKey,
  GEMINI_MODEL
};
