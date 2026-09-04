/**
 * Book-to-Video Intelligence Engine (BIE)
 * Enterprise-Grade Production Web Studio
 * Part 1: Universal Multi-Domain 3D Interactive Simulation & Cinematic Video Engine
 * - Multi-Disciplinary 3D Procedural Models (Genetics, Chemistry, Astrophysics, Electrodynamics, Neuroscience, Geophysics)
 * - Real Gemini AI Multimodal Textbook Decomposition
 * - Cinematic Zero-Collision Remotion Video Staging
 * - Enterprise Microservices Architecture & Schemas
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { decomposeTextbookChapter, resolveScientificDomainKey, GEMINI_MODEL } = require('./gemini_service.js');
const { DOMAIN_REGISTRY } = require('./app/bie/domain_simulation_registry.js');
const { PrerequisiteGraphEngine } = require('./app/bie/engine/graph_traversal_engine.js');
const { CANONICAL_FORMULA_REGISTRY, validateDimensionalHomogeneity } = require('./app/bie/engine/latex_ast_parser.js');
const { LayoutQAEngine } = require('./app/bie/engine/layout_qa_engine.js');
const { InteractiveGameEngine, GAME_CHALLENGES } = require('./app/bie/engine/interactive_game_engine.js');
const { RenderClusterManager } = require('./app/bie/engine/render_cluster_manager.js');

const graphEngine = new PrerequisiteGraphEngine();
const layoutQA = new LayoutQAEngine();
const gameEngine = new InteractiveGameEngine();
const renderManager = new RenderClusterManager();

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = '0.0.0.0';

const BIE_ROOT = path.join(__dirname, 'app', 'bie');
const GAME_DIR = path.join(BIE_ROOT, 'generated_game_code');
const VIDEO_DIR = path.join(BIE_ROOT, 'generated_video_code');
const MANIFEST_PATH = path.join(BIE_ROOT, 'EXECUTION_MANIFEST.json');
const ARCH_DIR = path.join(__dirname, 'architecture');

function readJsonSafe(filePath, fallback = {}) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch (err) {
    console.error(`Failed to read JSON at ${filePath}:`, err);
  }
  return fallback;
}

function readTextSafe(filePath, fallback = '') {
  try {
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf8');
    }
  } catch (err) {
    console.error(`Failed to read file at ${filePath}:`, err);
  }
  return fallback;
}

function getLessonsData() {
  const manifest = readJsonSafe(MANIFEST_PATH, {});
  const gameData = readJsonSafe(path.join(GAME_DIR, 'book_game_data.json'), { levels: [] });
  const lessons = [];

  try {
    if (fs.existsSync(VIDEO_DIR)) {
      const items = fs.readdirSync(VIDEO_DIR);
      for (const item of items) {
        const itemPath = path.join(VIDEO_DIR, item);
        if (fs.statSync(itemPath).isDirectory()) {
          const propsPath = path.join(itemPath, 'props.json');
          const captionsPath = path.join(itemPath, 'captions.vtt');
          const props = readJsonSafe(propsPath, null);
          let captions = '';
          if (fs.existsSync(captionsPath)) {
            captions = fs.readFileSync(captionsPath, 'utf8');
          }
          if (props) {
            lessons.push({
              lessonId: item,
              props,
              captions
            });
          }
        }
      }
    }
  } catch (e) {
    console.error('Error reading lessons:', e);
  }

  let rootTsx = '';
  let bieLessonTsx = '';
  try {
    const rootPath = path.join(VIDEO_DIR, 'Root.tsx');
    if (fs.existsSync(rootPath)) rootTsx = fs.readFileSync(rootPath, 'utf8');
    const biePath = path.join(VIDEO_DIR, 'BIELesson.tsx');
    if (fs.existsSync(biePath)) bieLessonTsx = fs.readFileSync(biePath, 'utf8');
  } catch (e) {
    console.error('Error reading tsx templates:', e);
  }

  const architecture = {
    postgresSchema: readTextSafe(path.join(ARCH_DIR, 'db', 'postgres_schema.sql')),
    neo4jSchema: readTextSafe(path.join(ARCH_DIR, 'db', 'neo4j_schema.cypher')),
    openApiSpec: readTextSafe(path.join(ARCH_DIR, 'api', 'openapi_spec.json')),
    renderWorker: readTextSafe(path.join(ARCH_DIR, 'workers', 'render_worker.py')),
    dockerCompose: readTextSafe(path.join(ARCH_DIR, 'docker-compose.yml')),
    systemSpec: readTextSafe(path.join(ARCH_DIR, 'enterprise_system_spec.md'))
  };

  return {
    manifest,
    gameData,
    lessons,
    rootTsx,
    bieLessonTsx,
    architecture,
    domains: DOMAIN_REGISTRY
  };
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // 1. API: Studio Data
  if (pathname === '/api/studio-data') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(getLessonsData(), null, 2));
    return;
  }

  // 2. API: Scientific Domains Registry
  if (pathname === '/api/domains') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(DOMAIN_REGISTRY, null, 2));
    return;
  }

  // 3. API: Architecture Artifacts
  if (pathname.startsWith('/api/architecture/')) {
    const key = pathname.replace('/api/architecture/', '');
    const data = getLessonsData().architecture;
    const map = {
      'postgres': data.postgresSchema,
      'neo4j': data.neo4jSchema,
      'openapi': data.openApiSpec,
      'worker': data.renderWorker,
      'docker': data.dockerCompose,
      'spec': data.systemSpec
    };
    if (map[key] !== undefined) {
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(map[key]);
      return;
    }
  }

  // 4. API: Real Gemini AI Ingestion & Multi-Domain Decomposition
  if (pathname === '/api/ai/ingest-chapter' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const title = payload.title || 'Advanced Physical Phenomenon';
        const text = payload.text || 'In this lesson, we analyze the spatial mechanics and conservation principles.';
        const subject = payload.subject || 'Physics';

        const aiResult = await decomposeTextbookChapter(title, text, subject);

        const lessonDir = path.join(VIDEO_DIR, aiResult.lessonId);
        if (!fs.existsSync(lessonDir)) {
          fs.mkdirSync(lessonDir, { recursive: true });
        }

        const props = {
          lessonId: aiResult.lessonId,
          sceneId: `scene_${aiResult.lessonId}`,
          title: aiResult.title,
          domainKey: aiResult.domainKey || 'electromagnetism_cyclotron',
          durationFrames: 720,
          dialogue: aiResult.dialogue,
          visualElements: [
            {
              id: 'elem_header',
              type: 'header_banner',
              boundingBox: [0.05, 0.05, 0.95, 0.15],
              properties: {
                title: aiResult.title,
                concept_id: aiResult.lessonId,
                verified_by: 'BIE-AI-Multimodal'
              }
            },
            {
              id: 'elem_simulation',
              type: 'simulation_pane',
              boundingBox: [0.05, 0.18, 0.48, 0.82],
              properties: {
                simulation_id: `sim_${aiResult.lessonId}`,
                mode: aiResult.simulation3D.mode
              }
            },
            {
              id: 'elem_clip',
              type: 'real_video_clip',
              boundingBox: [0.51, 0.18, 0.95, 0.55],
              properties: {
                clip_id: `clip_${aiResult.lessonId}`,
                overlay_label: aiResult.simulation3D.realWorldClip.label,
                attribution: aiResult.simulation3D.realWorldClip.attribution
              }
            },
            {
              id: 'elem_formula',
              type: 'formula_card',
              boundingBox: [0.51, 0.58, 0.95, 0.82],
              properties: {
                core_law: aiResult.simulation3D.scientificFormula,
                source_page: 'AI Extracted'
              }
            }
          ]
        };

        fs.writeFileSync(path.join(lessonDir, 'props.json'), JSON.stringify(props, null, 2));

        let vtt = 'WEBVTT - BIE Real-time Generated Subtitles\n\n';
        let acc = 0;
        aiResult.dialogue.forEach((d, i) => {
          const start = (acc / 30).toFixed(3).padStart(9, '0');
          const end = ((acc + d.duration_frames) / 30).toFixed(3).padStart(9, '0');
          vtt += `${i + 1}\n00:${start} --> 00:${end}\n<v ${d.speaker}>${d.text}\n\n`;
          acc += d.duration_frames;
        });
        fs.writeFileSync(path.join(lessonDir, 'captions.vtt'), vtt);

        const updatedData = getLessonsData();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          aiResult,
          updatedData
        }));
      } catch (err) {
        console.error('AI Ingestion error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // 5. API: Neural Knowledge Graph
  if (pathname === '/api/knowledge-graph') {
    const graphData = {
      nodes: [
        { id: 'watson_crick', label: 'DNA Double Helix Base Pairing', group: 'prerequisite', depth: 0, status: 'mastered' },
        { id: 'crispr_cleave', label: 'CRISPR-Cas9 Gene Editing', group: 'core_lesson', depth: 1, status: 'active' },
        { id: 'dipole_hydrogen', label: 'Water Dipole & H-Bonds', group: 'core_lesson', depth: 1, status: 'active' },
        { id: 'lorentz_force', label: 'Lorentz Magnetic Force & Cyclotron', group: 'core_lesson', depth: 1, status: 'active' },
        { id: 'black_hole_kerr', label: 'Kerr Black Hole & Lensing', group: 'core_lesson', depth: 1, status: 'active' },
        { id: 'synaptic_exocytosis', label: 'Synaptic Vesicle Exocytosis', group: 'core_lesson', depth: 2, status: 'active' },
        { id: 'subduction_melting', label: 'Subduction & Mantle Flux Melting', group: 'core_lesson', depth: 2, status: 'active' },
        { id: 'quantum_chromodynamics', label: 'QCD & Quark Gluon Plasma', group: 'advanced', depth: 3, status: 'unlocked' }
      ],
      edges: [
        { from: 'watson_crick', to: 'crispr_cleave', label: 'gRNA Complementarity' },
        { from: 'dipole_hydrogen', to: 'synaptic_exocytosis', label: 'Aqueous Solvation' },
        { from: 'lorentz_force', to: 'black_hole_kerr', label: 'Plasma Accretion Jet' },
        { from: 'black_hole_kerr', to: 'quantum_chromodynamics', label: 'High Energy Limit' }
      ]
    };
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(graphData, null, 2));
    return;
  }

  // 6. API: Prerequisite Graph Ontology
  if (pathname === '/api/engine/graph/ontology') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(graphEngine.toJSON(), null, 2));
    return;
  }

  if (pathname === '/api/engine/graph/toposort') {
    try {
      const sorted = graphEngine.getTopologicalSort();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, count: sorted.length, sequence: sorted }, null, 2));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
    return;
  }

  if (pathname === '/api/engine/graph/evaluate' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const evaluation = graphEngine.evaluateStudentReadiness(payload.studentMastery || {}, payload.targetConceptId || 'crispr_cas9_cleavage');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, evaluation }, null, 2));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
    return;
  }

  // 7. API: LaTeX & Dimensional Homogeneity
  if (pathname === '/api/engine/latex/formulas') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(CANONICAL_FORMULA_REGISTRY, null, 2));
    return;
  }

  if (pathname === '/api/engine/latex/validate' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const formulaId = payload.formulaId || 'crispr_free_energy';
        const homogeneity = validateDimensionalHomogeneity(formulaId);
        const formula = CANONICAL_FORMULA_REGISTRY[formulaId];
        const calcOutput = formula && formula.calculator ? formula.calculator(payload.parameters || {}) : null;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, homogeneity, calculated: calcOutput }, null, 2));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
    return;
  }

  // 8. API: Layout QA & Zero-Collision Solver
  if (pathname === '/api/engine/layout/audit' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const audit = layoutQA.auditSceneLayout(payload.elements || []);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, audit }, null, 2));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
    return;
  }

  if (pathname === '/api/engine/layout/repair' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const repairResult = layoutQA.autoRepairLayout(payload.elements || []);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, repairResult }, null, 2));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
    return;
  }

  // 9. API: Interactive Socratic Mini-Game Challenges
  if (pathname === '/api/engine/game/challenges') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, challenges: gameEngine.listChallenges() }, null, 2));
    return;
  }

  if (pathname === '/api/engine/game/submit' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const result = gameEngine.evaluateAttempt(payload.challengeId, payload.params || {});
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result, null, 2));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
    return;
  }

  // 10. API: Distributed Render Farm Cluster
  if (pathname === '/api/engine/render/cluster') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, telemetry: renderManager.getClusterTelemetry() }, null, 2));
    return;
  }

  if (pathname === '/api/engine/render/dispatch' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const job = renderManager.submitRenderJob(payload.lessonId || 'lesson_ch01_electrostatics_1', payload.totalFrames || 720);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, job }, null, 2));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
    return;
  }

  // 11. API: Manifest
  if (pathname === '/api/manifest') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(readJsonSafe(MANIFEST_PATH, {}), null, 2));
    return;
  }

  // 7. Main Enterprise Studio Suite
  if (pathname === '/' || pathname === '/index.html' || pathname === '/studio') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderEnterpriseStudio());
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

function renderEnterpriseStudio() {
  const data = getLessonsData();
  const lessons = data.lessons;
  const domains = data.domains;

  return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BIE - Universal Multi-Domain 3D Intelligence Suite</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- Three.js & OrbitControls for Procedural 3D Simulations -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            brand: {
              400: '#22d3ee',
              500: '#06b6d4',
              600: '#0891b2',
              900: '#164e63',
              950: '#083344'
            }
          }
        }
      }
    }
  </script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
    body { font-family: 'Plus Jakarta Sans', sans-serif; }
    code, pre, .font-mono { font-family: 'JetBrains Mono', monospace; }
    .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: #030712; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 3px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #06b6d4; }
  </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex flex-col antialiased selection:bg-cyan-500 selection:text-black">

  <!-- Enterprise Header Bar -->
  <header class="border-b border-slate-800/80 bg-slate-900/95 backdrop-blur sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      <div class="flex items-center space-x-3.5">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        </div>
        <div>
          <div class="flex items-center space-x-2">
            <span class="font-extrabold text-white text-base tracking-tight">Book-to-Video Engine (BIE)</span>
            <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-bold uppercase">Universal 3D Engine</span>
          </div>
          <p class="text-xs text-slate-400 font-medium">Part 1: Multi-Domain 3D Procedural Models & Cinematic Video Stager</p>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <nav class="flex items-center space-x-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 overflow-x-auto max-w-2xl">
        <button onclick="switchTab('sandbox3d')" id="tab-sandbox3d" class="nav-tab px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shrink-0">
          <span>🧊</span>
          <span>3D Sandbox</span>
        </button>
        <button onclick="switchTab('games')" id="tab-games" class="nav-tab px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition text-slate-400 hover:text-white border border-transparent shrink-0">
          <span>🎮</span>
          <span>Socratic Games</span>
        </button>
        <button onclick="switchTab('latex')" id="tab-latex" class="nav-tab px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition text-slate-400 hover:text-white border border-transparent shrink-0">
          <span>📐</span>
          <span>LaTeX & AST</span>
        </button>
        <button onclick="switchTab('video-player')" id="tab-video-player" class="nav-tab px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition text-slate-400 hover:text-white border border-transparent shrink-0">
          <span>🎬</span>
          <span>Video Studio</span>
        </button>
        <button onclick="switchTab('knowledge-graph')" id="tab-knowledge-graph" class="nav-tab px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition text-slate-400 hover:text-white border border-transparent shrink-0">
          <span>🕸️</span>
          <span>Prerequisite Graph</span>
        </button>
        <button onclick="switchTab('cluster')" id="tab-cluster" class="nav-tab px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition text-slate-400 hover:text-white border border-transparent shrink-0">
          <span>🚀</span>
          <span>Render Farm</span>
        </button>
        <button onclick="switchTab('ai-ingest')" id="tab-ai-ingest" class="nav-tab px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition text-slate-400 hover:text-white border border-transparent shrink-0">
          <span>✨</span>
          <span>Gemini AI</span>
        </button>
        <button onclick="switchTab('architecture')" id="tab-architecture" class="nav-tab px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition text-slate-400 hover:text-white border border-transparent shrink-0">
          <span>🏛️</span>
          <span>Infra</span>
        </button>
      </nav>

      <div class="hidden sm:flex items-center space-x-2">
        <div class="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></div>
        <span class="text-xs font-mono text-cyan-300 bg-cyan-950/80 px-2.5 py-1 rounded-full border border-cyan-500/30">6 Scientific Domains Active</span>
      </div>
    </div>
  </header>

  <!-- Main Container -->
  <main class="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">

    <!-- ================================================================= -->
    <!-- TAB 1: UNIVERSAL MULTI-DOMAIN 3D PROCEDURAL SANDBOX                -->
    <!-- ================================================================= -->
    <div id="view-sandbox3d" class="tab-view space-y-4">
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xl">
        <div>
          <div class="flex items-center space-x-2">
            <h2 class="text-base font-bold text-white flex items-center gap-2">
              <span>🧊</span> Multi-Disciplinary 3D Procedural Simulation Suite
            </h2>
            <span class="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/30 text-cyan-300 font-bold">No Static Slides</span>
          </div>
          <p class="text-xs text-slate-400 mt-0.5">Procedural 3D WebGL geometries, live vector fields, quantum probability envelopes, and molecular physics.</p>
        </div>

        <div class="flex items-center space-x-2">
          <select id="domain-selector" onchange="changeDomain(this.value)" class="bg-slate-950 border border-cyan-500/40 rounded-xl px-3.5 py-2 text-xs text-cyan-300 font-bold focus:outline-none shadow-lg">
            <option value="biology_crispr_dna">🧬 Molecular Genetics: CRISPR-Cas9 & DNA Cleaving</option>
            <option value="chemistry_molecular_orbitals">💧 Physical Chemistry: Water Dipole & H-Bonds</option>
            <option value="astrophysics_black_hole">🌌 Astrophysics: Kerr Black Hole & Accretion Disk</option>
            <option value="electromagnetism_cyclotron">⚡ Electrodynamics: Lorentz Force & Cyclotron</option>
            <option value="neuroscience_synapse">🧠 Neuroscience: Synaptic Cleft & Vesicle Exocytosis</option>
            <option value="geophysics_plate_tectonics">🌋 Geophysics: Subduction Zone & Flux Melting</option>
          </select>
          <button onclick="reset3DCamera()" class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-300 border border-slate-700 transition">
            Reset Camera
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- Left: 3D WebGL Canvas & Physical Sliders -->
        <div class="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-2xl flex flex-col space-y-3 relative">
          <div class="relative w-full h-[520px] bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-inner flex items-center justify-center">
            <div id="threejs-container" class="w-full h-full block cursor-grab active:cursor-grabbing"></div>

            <!-- 3D Spatial HUD -->
            <div class="absolute top-4 left-4 pointer-events-none bg-slate-900/85 backdrop-blur border border-slate-800 px-3.5 py-2.5 rounded-xl text-[11px] font-mono space-y-1 shadow-lg max-w-sm">
              <div class="text-cyan-400 font-bold" id="hud3d-domain-title">Molecular Genetics: CRISPR-Cas9</div>
              <div class="text-slate-300" id="hud3d-formula">Formula: ΔG = ΔH° - TΔS°</div>
              <div class="text-emerald-400" id="hud3d-telemetry">Active Cleavage Rate: 45%</div>
            </div>

            <!-- Camera Guide Notice -->
            <div class="absolute bottom-4 right-4 pointer-events-none bg-slate-900/80 backdrop-blur px-3 py-1 rounded-lg border border-slate-800 text-[10px] font-mono text-slate-400">
              Left Click: Orbit • Right Click: Pan • Scroll: Zoom
            </div>
          </div>

          <!-- Dynamic Scientific Parameters Controls (Configured per domain) -->
          <div id="domain-parameters-container" class="bg-slate-950 border border-slate-800 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
            <!-- Dynamic Sliders will be injected here by changeDomain() -->
          </div>
        </div>

        <!-- Right: Misconception Busters & Socratic Audio Synthesis -->
        <div class="lg:col-span-4 space-y-4">
          <!-- Active Empirical Concept -->
          <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-mono uppercase font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">Scientific Principle</span>
              <span id="domain-badge-category" class="text-[10px] font-mono text-slate-400">Biochemistry</span>
            </div>
            <h3 id="domain-title-card" class="text-sm font-bold text-white">Watson-Crick Base Pairing</h3>
            <p id="domain-law-desc" class="text-xs text-slate-300 leading-relaxed">Adjust parameters to see how physical properties adapt in real-time 3D space.</p>
          </div>

          <!-- Debunked Misconception Buster -->
          <div class="bg-slate-900 border border-rose-500/20 rounded-2xl p-4 shadow-xl space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-mono uppercase font-bold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-500/30">Common Misconception</span>
              <span class="text-[10px] font-mono text-emerald-400 font-bold">Debunked</span>
            </div>
            <div>
              <span class="text-[10px] font-mono text-slate-400 uppercase block font-semibold">Student False Intuition:</span>
              <p id="card-misconception-myth" class="text-xs text-rose-200 mt-0.5 italic font-medium">"CRISPR acts like physical scissors cutting completely random DNA locations."</p>
            </div>
            <div class="pt-2 border-t border-slate-800">
              <span class="text-[10px] font-mono text-emerald-400 uppercase block font-semibold">Scientific Grounded Reality:</span>
              <p id="card-misconception-reality" class="text-xs text-emerald-300 mt-0.5 font-medium leading-relaxed">Cas9 requires exact 20-nucleotide complementary base pairing directed by guide RNA and a PAM sequence before catalytic cleavage.</p>
            </div>
            <div class="pt-2 border-t border-slate-800 text-[11px] font-mono text-cyan-400" id="card-misconception-action">
              Remediation: Alter the PAM affinity slider to observe cleavage inhibition.
            </div>
          </div>

          <!-- Web Audio Harmonic Frequency Resonator -->
          <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between text-xs">
            <div class="flex items-center space-x-3">
              <span class="text-xl">🔊</span>
              <div>
                <span class="font-bold text-white block">Harmonic Audio Resonator</span>
                <span class="text-slate-400 text-[11px]" id="audio-freq-label">Base Resonance: 432 Hz</span>
              </div>
            </div>
            <button onclick="toggleAudio()" id="btn-audio-toggle" class="px-3 py-1.5 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-mono text-xs font-bold">Sound ON</button>
          </div>
        </div>
      </div>
    </div>

    <!-- ================================================================= -->
    <!-- TAB 2: CINEMATIC ZERO-COLLISION VIDEO STUDIO                      -->
    <!-- ================================================================= -->
    <div id="view-video-player" class="tab-view hidden space-y-6">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- Left: Lesson Hierarchy -->
        <div class="lg:col-span-4 space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-mono uppercase tracking-wider text-slate-400">Curriculum Video Lessons</h3>
            <span class="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded-full border border-cyan-800/40">${lessons.length} Multi-Domain Lessons</span>
          </div>
          <div class="space-y-2 max-h-[520px] overflow-y-auto custom-scrollbar pr-1" id="video-lesson-sidebar">
            ${lessons.map((l, idx) => `
              <div onclick="selectLesson('${l.lessonId}')" id="card-${l.lessonId}" class="lesson-card cursor-pointer p-3.5 rounded-xl border ${idx === 0 ? 'bg-cyan-950/40 border-cyan-500/50 shadow-md shadow-cyan-950/40' : 'bg-slate-900 border-slate-800 hover:border-slate-700'} transition">
                <div class="flex items-center justify-between mb-1.5">
                  <span class="text-[10px] font-mono font-bold text-cyan-400">LESSON ${idx + 1}</span>
                  <span class="text-[10px] text-slate-500 font-mono">${Math.round((l.props.durationFrames || 720) / 30)}s</span>
                </div>
                <h4 class="text-sm font-bold text-white">${l.props.title || l.lessonId}</h4>
                <div class="mt-2 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>${(l.props.visualElements || []).length} Cinematic Layers</span>
                  <span class="text-emerald-400 font-semibold">Zero Collision</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Right: Staged Remotion Canvas with 3D Orbital Layer & Socratic Subtitles -->
        <div class="lg:col-span-8 space-y-4">
          <div class="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <span class="text-[10px] font-mono uppercase text-cyan-400 font-bold">Remotion Staged Composition</span>
                <h3 id="player-lesson-title" class="text-base font-bold text-white">Lesson Preview</h3>
              </div>
              <div class="flex items-center space-x-2">
                <span class="text-xs font-mono px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-slate-300">
                  Frame <span id="cur-frame" class="text-cyan-400 font-bold">0</span> / <span id="tot-frames">720</span>
                </span>
                <span class="text-xs font-mono px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/30">1080p @ 30fps</span>
              </div>
            </div>

            <!-- The Staged Remotion 1080p Viewport -->
            <div class="relative w-full aspect-video bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl flex flex-col justify-between">
              <canvas id="remotionVideoCanvas" class="absolute inset-0 w-full h-full block z-0"></canvas>
              
              <!-- Bottom Socratic Dialogue HUD -->
              <div class="relative z-10 p-4 mt-auto">
                <div class="bg-slate-900/95 backdrop-blur border border-slate-800 rounded-xl px-4 py-2.5 shadow-2xl flex items-center space-x-3">
                  <div class="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></div>
                  <div class="flex-1 overflow-hidden">
                    <span id="hud-speaker" class="text-[11px] font-mono text-cyan-400 font-bold block">Dr. Maya (Lead Instructor):</span>
                    <p id="hud-subtitle" class="text-xs text-slate-100 font-medium truncate">Notice how the scientific field fills the surrounding 3D coordinate space.</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Player Controls & Scrubber -->
            <div class="bg-slate-950 border border-slate-800 rounded-2xl p-3 flex items-center space-x-3">
              <button onclick="togglePlay()" id="btn-play" class="w-9 h-9 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold flex items-center justify-center transition shadow-lg shadow-cyan-500/20">
                <svg id="icon-play" class="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                <svg id="icon-pause" class="w-5 h-5 hidden" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
              </button>
              <input type="range" id="video-scrubber" min="0" max="720" value="0" class="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400">
              <span id="time-cur" class="text-xs font-mono text-slate-400 w-12 text-right">0:00</span>
            </div>

            <!-- Socratic Script List -->
            <div class="bg-slate-950 border border-slate-800 rounded-2xl p-4">
              <h4 class="text-xs font-mono uppercase text-slate-400 tracking-wider mb-2">Director Socratic Script & Visual Cues</h4>
              <div id="dialogue-cue-list" class="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-1"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ================================================================= -->
    <!-- TAB 3: REAL GEMINI MULTIMODAL INGESTION STUDIO                    -->
    <!-- ================================================================= -->
    <div id="view-ai-ingest" class="tab-view hidden space-y-6">
      <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-lg font-bold text-white flex items-center gap-2">
              <span>✨</span> Multimodal Gemini AI Cognitive Decomposition
            </h2>
            <p class="text-xs text-slate-400">Ingest raw chapters across any scientific domain into Bloom's goals, prerequisite chains, and dedicated 3D simulations.</p>
          </div>
          <span class="text-xs font-mono px-3 py-1 rounded-full bg-indigo-950 border border-indigo-500/40 text-indigo-300 font-bold">gemini-3.6-flash Active</span>
        </div>

        <!-- Multi-Domain Presets -->
        <div class="flex items-center space-x-2 overflow-x-auto pb-1">
          <span class="text-xs font-mono text-slate-400">Quick Presets:</span>
          <button onclick="loadSample('crispr')" class="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-xs font-mono text-cyan-400 border border-slate-800 transition">🧬 CRISPR-Cas9</button>
          <button onclick="loadSample('water')" class="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-xs font-mono text-emerald-400 border border-slate-800 transition">💧 Water H-Bonds</button>
          <button onclick="loadSample('blackhole')" class="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-xs font-mono text-purple-400 border border-slate-800 transition">🌌 Kerr Black Hole</button>
          <button onclick="loadSample('cyclotron')" class="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-xs font-mono text-amber-400 border border-slate-800 transition">⚡ Lorentz Cyclotron</button>
          <button onclick="loadSample('synapse')" class="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-xs font-mono text-rose-400 border border-slate-800 transition">🧠 Synaptic Cleft</button>
          <button onclick="loadSample('subduction')" class="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-xs font-mono text-teal-400 border border-slate-800 transition">🌋 Slab Subduction</button>
        </div>

        <!-- Ingestion Form -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div class="lg:col-span-7 space-y-4">
            <div>
              <label class="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-1.5">Chapter Title</label>
              <input type="text" id="ai-input-title" value="CRISPR-Cas9 Base Editing and Double-Strand Cleavage" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500">
            </div>

            <div>
              <label class="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-1.5">Raw Textbook Content / Paper Abstract</label>
              <textarea id="ai-input-text" rows="8" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500 leading-relaxed custom-scrollbar">The type II CRISPR-Cas9 adaptive immune system from Streptococcus pyogenes uses a single guide RNA (sgRNA) to direct site-specific DNA double-strand breaks (DSBs). Cas9 scans genomic DNA for a 5'-NGG protospacer adjacent motif (PAM). Upon PAM identification, the enzyme unwinds the adjacent double helix, allowing the 20-nucleotide guide sequence to form an R-loop via Watson-Crick base pairing. When target complementarity is satisfied, conformational activation of the HNH and RuvC endonuclease domains catalyzes phosphodiester bond hydrolysis precisely 3 base pairs upstream of the PAM. A common misconception among students is that Cas9 cuts DNA indiscriminately without requiring nucleotide complementation.</textarea>
            </div>

            <div class="flex items-center justify-between pt-2">
              <div class="flex items-center space-x-3">
                <select id="ai-input-subject" class="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-cyan-300 font-mono">
                  <option value="Molecular Biology">Subject: Molecular Biology</option>
                  <option value="Physical Chemistry">Subject: Physical Chemistry</option>
                  <option value="Astrophysics">Subject: Astrophysics</option>
                  <option value="Electrodynamics">Subject: Electrodynamics</option>
                  <option value="Neurobiology">Subject: Neurobiology</option>
                  <option value="Geophysics">Subject: Geophysics</option>
                </select>
              </div>

              <button onclick="triggerAiDecomposition()" id="btn-ai-run" class="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white shadow-lg shadow-cyan-500/25 flex items-center space-x-2 transition">
                <svg class="w-4 h-4 animate-spin hidden" id="spinner-ai" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>
                <span id="label-ai">Decompose Chapter with Gemini</span>
              </button>
            </div>
          </div>

          <!-- Right: Decomposition Telemetry -->
          <div class="lg:col-span-5 bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-4">
            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-mono uppercase text-cyan-400 font-bold">AI Pipeline Output</span>
                <span id="ai-badge-model" class="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded">Ready</span>
              </div>
              <div id="ai-output-container" class="space-y-3 text-xs">
                <div class="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span class="text-slate-400 block font-mono text-[10px] uppercase">Bloom's Taxonomy Objective</span>
                  <p id="ai-res-bloom" class="text-slate-200 mt-1 font-medium">Waiting for ingestion trigger...</p>
                </div>
                <div class="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span class="text-slate-400 block font-mono text-[10px] uppercase">Must-Know Prerequisite Check</span>
                  <p id="ai-res-prereq" class="text-slate-200 mt-1 font-medium">-</p>
                </div>
                <div class="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span class="text-slate-400 block font-mono text-[10px] uppercase">Debunked Misconception</span>
                  <p id="ai-res-myth" class="text-rose-300 mt-1 italic">-</p>
                </div>
              </div>
            </div>

            <div class="pt-2 border-t border-slate-800 flex items-center justify-between">
              <span class="text-[11px] text-slate-400 font-mono">Status: Ready to compile</span>
              <button onclick="switchTab('video-player')" class="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1">
                <span>View in Video Studio</span>
                <span>→</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ================================================================= -->
    <!-- TAB 4: ENTERPRISE ARCHITECTURE VIEWER                             -->
    <!-- ================================================================= -->
    <div id="view-architecture" class="tab-view hidden space-y-6">
      <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 class="text-lg font-bold text-white flex items-center gap-2">
              <span>🏛️</span> Enterprise Architecture & Production Schemas
            </h2>
            <p class="text-xs text-slate-400">PostgreSQL 16+ pgvector DDL, Neo4j Graph Cypher ontology, OpenAPI 3.1 Gateway contract, distributed Python worker, and Docker Compose orchestration.</p>
          </div>
          <span class="text-xs font-mono px-3 py-1 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-bold">Production Ready</span>
        </div>

        <div class="flex items-center space-x-1.5 overflow-x-auto pb-2 border-b border-slate-800">
          <button onclick="switchArchTab('spec')" id="archtab-spec" class="arch-btn px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 transition">System Spec & SLA</button>
          <button onclick="switchArchTab('postgres')" id="archtab-postgres" class="arch-btn px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-slate-950 text-slate-400 border border-slate-800 hover:text-white transition">PostgreSQL DDL</button>
          <button onclick="switchArchTab('neo4j')" id="archtab-neo4j" class="arch-btn px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-slate-950 text-slate-400 border border-slate-800 hover:text-white transition">Neo4j Cypher Graph</button>
          <button onclick="switchArchTab('openapi')" id="archtab-openapi" class="arch-btn px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-slate-950 text-slate-400 border border-slate-800 hover:text-white transition">OpenAPI 3.1 Contract</button>
          <button onclick="switchArchTab('worker')" id="archtab-worker" class="arch-btn px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-slate-950 text-slate-400 border border-slate-800 hover:text-white transition">Distributed Worker (Python)</button>
          <button onclick="switchArchTab('docker')" id="archtab-docker" class="arch-btn px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-slate-950 text-slate-400 border border-slate-800 hover:text-white transition">Docker Compose</button>
        </div>

        <div class="relative bg-slate-950 border border-slate-800 rounded-2xl p-5 overflow-hidden">
          <div class="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
            <span id="arch-viewer-title" class="text-xs font-mono text-cyan-400 font-bold uppercase">Enterprise Specification (enterprise_system_spec.md)</span>
            <button onclick="copyArchCode()" id="btn-copy-arch" class="px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-slate-300 transition">Copy Code</button>
          </div>
          <pre id="arch-code-display" class="font-mono text-xs text-slate-300 max-h-[550px] overflow-y-auto overflow-x-auto custom-scrollbar whitespace-pre leading-relaxed">${escapeHtml(data.architecture.systemSpec)}</pre>
        </div>
      </div>
    </div>

    <!-- ================================================================= -->
    <!-- TAB 5: NEURAL KNOWLEDGE GRAPH                                     -->
    <!-- ================================================================= -->
    <div id="view-knowledge-graph" class="tab-view hidden space-y-6">
      <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>🕸️</span> Interactive Neural Knowledge Graph & Prerequisite Ontology
            </h2>
            <p class="text-xs text-slate-400">Click any concept node to highlight upstream prerequisites and downstream unlocked lessons.</p>
          </div>
          <div class="flex items-center space-x-3 text-xs font-mono">
            <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-cyan-400"></span> Core Lessons</span>
            <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-emerald-400"></span> Prerequisites</span>
            <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-purple-400"></span> Advanced Topics</span>
          </div>
        </div>

        <div class="relative w-full h-[520px] bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
          <canvas id="knowledgeGraphCanvas" class="w-full h-full block cursor-pointer"></canvas>
          
          <div id="graph-node-popover" class="hidden absolute bottom-4 left-4 p-4 rounded-xl bg-slate-900/90 backdrop-blur border border-cyan-500/40 text-xs space-y-1.5 shadow-2xl max-w-sm">
            <div class="flex items-center justify-between">
              <span id="popover-node-title" class="font-bold text-white text-sm">Concept Name</span>
              <span id="popover-node-status" class="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300">Active</span>
            </div>
            <p id="popover-node-desc" class="text-slate-300">Description of concept and its prerequisite weight.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- ================================================================= -->
    <!-- TAB 6: SOCRATIC INTERACTIVE 3D CHALLENGES & MISCONCEPTION BUSTER   -->
    <!-- ================================================================= -->
    <div id="view-games" class="tab-view hidden space-y-6">
      <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div class="flex items-center space-x-2">
              <h2 class="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>🎮</span> Socratic 3D Interactive Challenges & Misconception Buster
              </h2>
              <span class="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-bold">Empirical Learning</span>
            </div>
            <p class="text-xs text-slate-400 mt-1">Calibrate physical parameters to hit scientific target states. Debunks false intuitive assumptions through simulation feedback.</p>
          </div>
          <div class="flex items-center space-x-3">
            <div class="px-3.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300">
              Score: <span id="game-score-display" class="font-bold text-cyan-400 text-sm">0</span> pts
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <!-- Challenge Selector & Controls -->
          <div class="lg:col-span-4 space-y-4">
            <label class="block text-xs font-mono text-slate-400 uppercase">Select Scientific Challenge</label>
            <select id="game-challenge-select" onchange="loadGameChallenge(this.value)" class="w-full bg-slate-950 border border-cyan-500/40 rounded-xl px-3.5 py-2.5 text-xs text-cyan-300 font-bold focus:outline-none shadow-lg">
              <option value="crispr_precision_cleave">🧬 CRISPR Target Cleavage Calibration</option>
              <option value="water_ice_transition">💧 Ice Crystal Density Anomaly</option>
              <option value="black_hole_isco_orbit">🌌 Innermost Stable Circular Orbit (ISCO)</option>
              <option value="lorentz_cyclotron_resonance">⚡ Cyclotron Resonance Steering</option>
              <option value="synaptic_vesicle_release">🧠 Quantal Synaptic Transmission</option>
              <option value="subduction_magma_arc">🌋 Mantle Wedge Flux Melting</option>
            </select>

            <div class="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <span class="text-xs font-mono text-cyan-400 font-bold uppercase block">Objective</span>
              <p id="game-objective-text" class="text-xs text-slate-300 leading-relaxed">Adjust PAM affinity and endonuclease cleavage rate to cleanly excise a mutant viral sequence without causing off-target damage.</p>
            </div>

            <!-- Dynamic Challenge Sliders -->
            <div id="game-sliders-container" class="space-y-4 p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <!-- Rendered via JS -->
            </div>

            <button onclick="submitGameAttempt()" id="btn-submit-attempt" class="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-emerald-500/20 active:scale-[0.98]">
              Verify Physical Target Calibration
            </button>
          </div>

          <!-- Live Challenge Feedback & Misconception Trap HUD -->
          <div class="lg:col-span-8 space-y-4">
            <div id="game-feedback-card" class="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 min-h-[160px] flex flex-col justify-center">
              <div class="flex items-center justify-between">
                <span id="game-feedback-status" class="text-xs font-mono font-bold text-slate-400 uppercase tracking-wide">Status: Awaiting Calibration Attempt</span>
                <span id="game-feedback-badge" class="hidden text-[10px] font-mono px-2 py-0.5 rounded-full font-bold"></span>
              </div>
              <p id="game-feedback-message" class="text-sm text-slate-300 leading-relaxed">Adjust the sliders on the left and click "Verify Physical Target Calibration" to run the simulation test.</p>
            </div>

            <div class="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <span class="text-xs font-mono text-slate-400 uppercase font-bold block">Scientific Ground Truth & Diagnostic Principle</span>
              <p id="game-scientific-law" class="text-xs text-slate-300 font-mono leading-relaxed">Watson-Crick Base Pairing & Ribonucleoprotein Endonuclease Catalysis</p>
              <div class="p-3 rounded-xl bg-slate-900 border border-slate-800/80">
                <span class="text-[10px] font-mono text-cyan-400 block uppercase">Formula Anchor</span>
                <p id="game-formula-anchor" class="text-xs text-cyan-300 font-mono mt-1">ΔG_hybridization = ΔH° - TΔS° (gRNA:PAM Target Specificity)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ================================================================= -->
    <!-- TAB 7: LATEX AST & PHYSICAL DIMENSION VALIDATOR                    -->
    <!-- ================================================================= -->
    <div id="view-latex" class="tab-view hidden space-y-6">
      <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div class="flex items-center space-x-2">
              <h2 class="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>📐</span> LaTeX Mathematical AST & Physical Dimension Homogeneity Engine
              </h2>
              <span class="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-bold">SI Base Dimension Verified</span>
            </div>
            <p class="text-xs text-slate-400 mt-1">Extracts variables, confirms dimensional homogeneity [M, L, T, I, Θ], and generates step-by-step derivations.</p>
          </div>
          <select id="latex-formula-select" onchange="loadLatexFormula(this.value)" class="bg-slate-950 border border-cyan-500/40 rounded-xl px-3.5 py-2 text-xs text-cyan-300 font-bold focus:outline-none shadow-lg">
            <option value="crispr_free_energy">🧬 CRISPR Gibbs Free Energy (ΔG = ΔH° - TΔS°)</option>
            <option value="water_dipole">💧 Water Molecular Dipole Vector (μ = Σ q_i r_i)</option>
            <option value="schwarzschild_radius">🌌 Schwarzschild Horizon Radius (r_s = 2GM/c²)</option>
            <option value="lorentz_force">⚡ Lorentz Magnetic Force & Cyclotron (F = q(E + v × B))</option>
            <option value="synapse_nernst">🧠 Calcium Reversal Potential (Nernst-Goldman)</option>
            <option value="slab_pull_force">🌋 Subducting Slab Pull Buoyancy Force</option>
          </select>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <!-- Formula Display & Dimensional Analysis -->
          <div class="lg:col-span-7 space-y-4">
            <div class="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-4">
              <span class="text-xs font-mono text-slate-400 uppercase tracking-wider block" id="latex-formula-name">Gibbs Free Energy of gRNA:Target Hybridization</span>
              <div id="latex-math-display" class="py-4 text-xl sm:text-2xl font-mono text-cyan-300 bg-slate-900/60 rounded-xl border border-cyan-500/20 px-4 overflow-x-auto">
                \Delta G = \Delta H^\circ - T \Delta S^\circ
              </div>
              <div class="flex items-center justify-center space-x-2 text-xs font-mono">
                <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span class="text-emerald-400 font-bold">Dimensionally Homogeneous</span>
                <span class="text-slate-500">•</span>
                <span id="latex-si-unit" class="text-slate-400">SI Dimension: [M L² T⁻²] (Joule)</span>
              </div>
            </div>

            <!-- Step-by-Step Derivation Cards -->
            <div class="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <span class="text-xs font-mono text-cyan-400 uppercase font-bold block">Rigorous Mathematical Derivation Steps</span>
              <div id="latex-derivation-steps" class="space-y-3">
                <!-- Rendered via JS -->
              </div>
            </div>
          </div>

          <!-- Variable Dictionary & Dynamic Calculator -->
          <div class="lg:col-span-5 space-y-4">
            <div class="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <span class="text-xs font-mono text-slate-400 uppercase font-bold block">Variable Dimensional Dictionary</span>
              <div id="latex-variable-list" class="space-y-2 text-xs font-mono">
                <!-- Rendered via JS -->
              </div>
            </div>

            <div class="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <span class="text-xs font-mono text-cyan-400 uppercase font-bold block">Interactive Formula Evaluator</span>
              <div id="latex-calc-inputs" class="space-y-3">
                <!-- Inputs rendered via JS -->
              </div>
              <button onclick="calculateLatexFormula()" class="w-full py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-mono font-bold transition">
                Compute Physical Value
              </button>
              <div id="latex-calc-result" class="p-3 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-slate-300">
                Awaiting calculation...
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ================================================================= -->
    <!-- TAB 8: DISTRIBUTED RENDER FARM CLUSTER ORCHESTRATOR               -->
    <!-- ================================================================= -->
    <div id="view-cluster" class="tab-view hidden space-y-6">
      <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div class="flex items-center space-x-2">
              <h2 class="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>🚀</span> Distributed Render Farm Cluster & Node Orchestrator
              </h2>
              <span class="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-bold">4 Nodes Online</span>
            </div>
            <p class="text-xs text-slate-400 mt-1">Parallel frame slicing (180 frames/slice), GPU VRAM scheduling, and multi-threaded FFmpeg stitching.</p>
          </div>
          <button onclick="dispatchRenderJob()" id="btn-dispatch-render" class="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono uppercase transition shadow-lg shadow-cyan-500/20">
            Dispatch 720-Frame Render Job
          </button>
        </div>

        <!-- Node Telemetry Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="cluster-nodes-grid">
          <!-- Rendered via JS -->
        </div>

        <!-- Recent Render Slices & Stitching Status -->
        <div class="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
          <div class="flex items-center justify-between pb-2 border-b border-slate-800">
            <span class="text-xs font-mono text-cyan-400 uppercase font-bold">Active & Dispatched Render Tasks</span>
            <span class="text-[11px] font-mono text-slate-400">Total VRAM: 208 GB Dedicated</span>
          </div>
          <div id="cluster-jobs-list" class="space-y-2">
            <!-- Jobs rendered via JS -->
          </div>
        </div>
      </div>
    </div>

  <script>
    const studioData = ${JSON.stringify(data)};
    const DOMAIN_REGISTRY = studioData.domains;
    let activeLessonId = studioData.lessons.length > 0 ? studioData.lessons[0].lessonId : null;
    let isPlaying = false;
    let currentFrame = 0;
    let audioContext = null;
    let isAudioOn = true;

    // Three.js State
    let scene3D, camera3D, renderer3D, controls3D;
    let currentDomainKey = 'biology_crispr_dna';
    let meshGroup3D = null;
    let currentDomainParams = {};

    window.addEventListener('DOMContentLoaded', () => {
      init3DScene();
      setupVideoCanvas();
      initKnowledgeGraph();

      if (studioData.lessons.length > 0) {
        selectLesson(studioData.lessons[0].lessonId);
      }

      const scrubber = document.getElementById('video-scrubber');
      if (scrubber) {
        scrubber.addEventListener('input', (e) => {
          currentFrame = parseInt(e.target.value);
          renderVideoFrame(currentFrame);
        });
      }
    });

    function switchTab(tab) {
      document.querySelectorAll('.tab-view').forEach(el => el.classList.add('hidden'));
      document.querySelectorAll('.nav-tab').forEach(el => {
        el.classList.remove('bg-cyan-500/20', 'text-cyan-300', 'border-cyan-500/40');
        el.classList.add('text-slate-400', 'border-transparent');
      });

      const targetView = document.getElementById('view-' + tab);
      const targetBtn = document.getElementById('tab-' + tab);
      if (targetView) targetView.classList.remove('hidden');
      if (targetBtn) {
        targetBtn.classList.add('bg-cyan-500/20', 'text-cyan-300', 'border-cyan-500/40');
        targetBtn.classList.remove('text-slate-400', 'border-transparent');
      }

      if (tab === 'sandbox3d' && renderer3D) {
        onResize3D();
      }
      if (tab === 'knowledge-graph') {
        drawKnowledgeGraph();
      }
      if (tab === 'games') {
        initGamesTab();
      }
      if (tab === 'latex') {
        initLatexTab();
      }
      if (tab === 'cluster') {
        fetchClusterTelemetry();
      }
    }

    // Architecture Code Switcher
    function switchArchTab(key) {
      document.querySelectorAll('.arch-btn').forEach(b => {
        b.classList.remove('bg-cyan-500/20', 'text-cyan-300', 'border-cyan-500/40');
        b.classList.add('bg-slate-950', 'text-slate-400', 'border-slate-800');
      });
      const activeBtn = document.getElementById('archtab-' + key);
      if (activeBtn) {
        activeBtn.classList.add('bg-cyan-500/20', 'text-cyan-300', 'border-cyan-500/40');
        activeBtn.classList.remove('bg-slate-950', 'text-slate-400', 'border-slate-800');
      }

      const map = {
        'spec': { title: 'Enterprise Specification (enterprise_system_spec.md)', content: studioData.architecture.systemSpec },
        'postgres': { title: 'PostgreSQL 16 Schema (postgres_schema.sql)', content: studioData.architecture.postgresSchema },
        'neo4j': { title: 'Neo4j Cypher Ontology (neo4j_schema.cypher)', content: studioData.architecture.neo4jSchema },
        'openapi': { title: 'OpenAPI 3.1 Contract (openapi_spec.json)', content: studioData.architecture.openApiSpec },
        'worker': { title: 'Distributed Celery/Redis Worker (render_worker.py)', content: studioData.architecture.renderWorker },
        'docker': { title: 'Docker Compose Cluster (docker-compose.yml)', content: studioData.architecture.dockerCompose }
      };

      if (map[key]) {
        document.getElementById('arch-viewer-title').innerText = map[key].title;
        document.getElementById('arch-code-display').textContent = map[key].content;
      }
    }

    function copyArchCode() {
      const code = document.getElementById('arch-code-display').textContent;
      navigator.clipboard.writeText(code).then(() => {
        const btn = document.getElementById('btn-copy-arch');
        btn.innerText = 'Copied!';
        setTimeout(() => { btn.innerText = 'Copy Code'; }, 2000);
      });
    }

    // =================================================================
    // UNIVERSAL THREE.JS 3D PROCEDURAL SIMULATION ENGINE
    // =================================================================
    function init3DScene() {
      const container = document.getElementById('threejs-container');
      if (!container) return;

      scene3D = new THREE.Scene();
      scene3D.background = new THREE.Color(0x030712);

      const width = container.clientWidth || 700;
      const height = container.clientHeight || 520;

      camera3D = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
      camera3D.position.set(0, 3, 12);

      renderer3D = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer3D.setSize(width, height);
      renderer3D.setPixelRatio(window.devicePixelRatio);
      container.appendChild(renderer3D.domElement);

      if (window.THREE && THREE.OrbitControls) {
        controls3D = new THREE.OrbitControls(camera3D, renderer3D.domElement);
        controls3D.enableDamping = true;
        controls3D.dampingFactor = 0.05;
      }

      const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
      scene3D.add(ambientLight);

      const dirLight1 = new THREE.DirectionalLight(0x38bdf8, 1.4);
      dirLight1.position.set(6, 12, 8);
      scene3D.add(dirLight1);

      const dirLight2 = new THREE.DirectionalLight(0xa855f7, 0.8);
      dirLight2.position.set(-6, -6, -4);
      scene3D.add(dirLight2);

      meshGroup3D = new THREE.Group();
      scene3D.add(meshGroup3D);

      changeDomain('biology_crispr_dna');
      window.addEventListener('resize', onResize3D);
      animate3D();
    }

    function onResize3D() {
      const container = document.getElementById('threejs-container');
      if (!container || !renderer3D || !camera3D) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera3D.aspect = width / height;
      camera3D.updateProjectionMatrix();
      renderer3D.setSize(width, height);
    }

    function reset3DCamera() {
      const dom = DOMAIN_REGISTRY[currentDomainKey];
      if (camera3D && dom && dom.defaultCamera) {
        camera3D.position.set(dom.defaultCamera.x, dom.defaultCamera.y, dom.defaultCamera.z);
        camera3D.lookAt(0, 0, 0);
      }
    }

    function changeDomain(domainKey) {
      currentDomainKey = domainKey;
      const domain = DOMAIN_REGISTRY[domainKey];
      if (!domain) return;

      document.getElementById('domain-selector').value = domainKey;
      document.getElementById('hud3d-domain-title').innerText = domain.title;
      document.getElementById('hud3d-formula').innerText = 'Formula: ' + domain.coreFormula;
      document.getElementById('domain-title-card').innerText = domain.scientificLaw;
      document.getElementById('domain-badge-category').innerText = domain.category;
      document.getElementById('domain-law-desc').innerText = domain.scientificLaw + ' — Real-time 3D spatial manipulative.';
      document.getElementById('card-misconception-myth').innerText = '"' + domain.misconception.myth + '"';
      document.getElementById('card-misconception-reality').innerText = domain.misconception.reality;
      document.getElementById('card-misconception-action').innerText = 'Action: ' + domain.misconception.remediationAction;
      document.getElementById('audio-freq-label').innerText = 'Base Resonance: ' + domain.audioTone.baseFreq + ' Hz';

      // Initialize default parameters
      domain.parameters.forEach(p => {
        if (currentDomainParams[p.id] === undefined) {
          currentDomainParams[p.id] = p.default;
        }
      });

      // Render Dynamic Sliders
      const paramContainer = document.getElementById('domain-parameters-container');
      paramContainer.innerHTML = domain.parameters.map(p => \`
        <div>
          <div class="flex justify-between text-slate-400 mb-1">
            <span>\${p.label}:</span>
            <span id="label-\${p.id}" class="text-cyan-400 font-bold">\${currentDomainParams[p.id]} \${p.unit}</span>
          </div>
          <input type="range" min="\${p.min}" max="\${p.max}" step="\${p.step}" value="\${currentDomainParams[p.id]}"
                 oninput="updateDomainParam('\${p.id}', this.value, '\${p.unit}')"
                 class="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400">
        </div>
      \`).join('');

      reset3DCamera();
      buildDomain3DScene(domainKey);
    }

    function updateDomainParam(paramId, val, unit) {
      currentDomainParams[paramId] = parseFloat(val);
      const label = document.getElementById('label-' + paramId);
      if (label) label.innerText = val + ' ' + unit;

      document.getElementById('hud3d-telemetry').innerText = 'Current Parameter: ' + val + ' ' + unit;
      buildDomain3DScene(currentDomainKey);
      playDomainChime();
    }

    function buildDomain3DScene(domainKey) {
      while (meshGroup3D.children.length > 0) {
        meshGroup3D.remove(meshGroup3D.children[0]);
      }

      if (domainKey === 'biology_crispr_dna') {
        buildDnaCrisprScene();
      } else if (domainKey === 'chemistry_molecular_orbitals') {
        buildWaterDipoleScene();
      } else if (domainKey === 'astrophysics_black_hole') {
        buildBlackHoleScene();
      } else if (domainKey === 'electromagnetism_cyclotron') {
        buildCyclotronScene();
      } else if (domainKey === 'neuroscience_synapse') {
        buildSynapseScene();
      } else if (domainKey === 'geophysics_plate_tectonics') {
        buildSubductionScene();
      }
    }

    // --- 1. DNA & CRISPR-Cas9 Molecular 3D Model ---
    function buildDnaCrisprScene() {
      const cleavage = currentDomainParams['cleavage_rate'] || 45;
      const twist = currentDomainParams['helix_twist'] || 10.5;

      const numBps = 32;
      const strandGroup = new THREE.Group();
      strandGroup.name = 'dna_strand';

      for (let i = 0; i < numBps; i++) {
        const t = (i / numBps) * Math.PI * 4 * (twist / 10);
        const y = (i - numBps / 2) * 0.45;
        const radius = 1.4;

        const x1 = Math.cos(t) * radius;
        const z1 = Math.sin(t) * radius;
        const x2 = -x1;
        const z2 = -z1;

        // Sugar phosphate backbone nodes
        const nodeGeo = new THREE.SphereGeometry(0.14, 16, 16);
        const nodeMat1 = new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.3 });
        const nodeMat2 = new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.3 });

        const s1 = new THREE.Mesh(nodeGeo, nodeMat1);
        s1.position.set(x1, y, z1);
        strandGroup.add(s1);

        const s2 = new THREE.Mesh(nodeGeo, nodeMat2);
        s2.position.set(x2, y, z2);
        strandGroup.add(s2);

        // Base pair rungs (Adenine-Thymine or Cytosine-Guanine)
        const isAT = i % 2 === 0;
        const rungGeo = new THREE.CylinderGeometry(0.05, 0.05, radius * 2, 8);
        const rungMat = new THREE.MeshStandardMaterial({
          color: isAT ? 0x10b981 : 0xf59e0b,
          roughness: 0.4
        });
        const rung = new THREE.Mesh(rungGeo, rungMat);
        rung.position.set(0, y, 0);
        rung.rotation.z = Math.PI / 2;
        rung.rotation.y = -t;
        strandGroup.add(rung);
      }
      meshGroup3D.add(strandGroup);

      // Cas9 Endonuclease Protein Complex Clamp
      const cas9Group = new THREE.Group();
      cas9Group.name = 'cas9_protein';
      cas9Group.position.set(0, 0, 0);

      const lobeGeo = new THREE.TorusGeometry(1.9, 0.35, 16, 32, Math.PI * 1.5);
      const lobeMat = new THREE.MeshStandardMaterial({
        color: 0xec4899,
        roughness: 0.2,
        transparent: true,
        opacity: 0.85
      });
      const lobe = new THREE.Mesh(lobeGeo, lobeMat);
      lobe.rotation.x = Math.PI / 2;
      cas9Group.add(lobe);

      // Cleaving catalytic scissors indicator
      const shearOffset = (cleavage / 100) * 0.4;
      const bladeGeo = new THREE.ConeGeometry(0.2, 0.8, 8);
      const bladeMat = new THREE.MeshStandardMaterial({ color: 0xf43f5e, emissive: 0x9f1239, emissiveIntensity: 0.5 });
      const b1 = new THREE.Mesh(bladeGeo, bladeMat);
      b1.position.set(-0.8 - shearOffset, 0, 1.2);
      b1.rotation.z = Math.PI / 4;
      cas9Group.add(b1);

      const b2 = new THREE.Mesh(bladeGeo, bladeMat);
      b2.position.set(0.8 + shearOffset, 0, 1.2);
      b2.rotation.z = -Math.PI / 4;
      cas9Group.add(b2);

      meshGroup3D.add(cas9Group);
    }

    // --- 2. Water Dipole & Hydrogen Bonding 3D Model ---
    function buildWaterDipoleScene() {
      const temp = currentDomainParams['temperature_kelvin'] || 298;
      const numMolecules = Math.min(18, currentDomainParams['molecular_density'] || 12);

      const waterGroup = new THREE.Group();
      waterGroup.name = 'water_network';

      const positions = [
        [0, 0, 0], [2.2, 0.8, -0.5], [-2.1, 0.9, 0.4],
        [0.4, 2.3, 0.2], [-0.5, -2.2, -0.3], [1.8, -1.5, 0.8],
        [-1.9, -1.4, -0.6], [2.8, -0.2, -1.8], [-2.6, 0.2, -1.7]
      ];

      for (let m = 0; m < Math.min(numMolecules, positions.length); m++) {
        const mol = new THREE.Group();
        const [mx, my, mz] = positions[m];
        mol.position.set(mx, my, mz);

        // Oxygen (Red)
        const oxyGeo = new THREE.SphereGeometry(0.55, 24, 24);
        const oxyMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.2 });
        const oxy = new THREE.Mesh(oxyGeo, oxyMat);
        mol.add(oxy);

        // Hydrogens (White at 104.5 degrees)
        const hydGeo = new THREE.SphereGeometry(0.28, 16, 16);
        const hydMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });

        const h1 = new THREE.Mesh(hydGeo, hydMat);
        h1.position.set(0.65, 0.45, 0);
        mol.add(h1);

        const h2 = new THREE.Mesh(hydGeo, hydMat);
        h2.position.set(-0.65, 0.45, 0);
        mol.add(h2);

        // Dipole vector arrow
        const dir = new THREE.Vector3(0, -1, 0);
        const arrow = new THREE.ArrowHelper(dir, new THREE.Vector3(0, 0, 0), 0.9, 0x38bdf8, 0.2, 0.1);
        mol.add(arrow);

        waterGroup.add(mol);
      }

      // Dashed Hydrogen Bonds between adjacent molecules
      const lineMat = new THREE.LineDashedMaterial({ color: 0x22d3ee, dashSize: 0.2, gapSize: 0.1 });
      for (let i = 0; i < Math.min(numMolecules, positions.length) - 1; i++) {
        const p1 = new THREE.Vector3(...positions[i]);
        const p2 = new THREE.Vector3(...positions[i + 1]);
        const geo = new THREE.BufferGeometry().setFromPoints([p1, p2]);
        const line = new THREE.Line(geo, lineMat);
        line.computeLineDistances();
        waterGroup.add(line);
      }

      meshGroup3D.add(waterGroup);
    }

    // --- 3. Kerr Black Hole & Lensed Accretion Disk ---
    function buildBlackHoleScene() {
      const spin = currentDomainParams['accretion_spin'] || 0.85;

      // Event Horizon (Absolute Black Sphere)
      const bhGeo = new THREE.SphereGeometry(1.6, 48, 48);
      const bhMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
      const bh = new THREE.Mesh(bhGeo, bhMat);
      meshGroup3D.add(bh);

      // Glowing Photon Sphere Ring (1.5 Rs)
      const photonRingGeo = new THREE.RingGeometry(2.35, 2.45, 64);
      const photonRingMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide });
      const photonRing = new THREE.Mesh(photonRingGeo, photonRingMat);
      photonRing.rotation.x = Math.PI / 2;
      meshGroup3D.add(photonRing);

      // Relativistic Accretion Disk (with Doppler Beaming asymmetry)
      const diskGeo = new THREE.RingGeometry(2.5, 6.5, 64, 8);
      const diskMat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        emissive: 0xd97706,
        emissiveIntensity: 0.8,
        side: THREE.DoubleSide,
        wireframe: false
      });
      const disk = new THREE.Mesh(diskGeo, diskMat);
      disk.name = 'accretion_disk';
      disk.rotation.x = Math.PI / 2.3;
      meshGroup3D.add(disk);

      // Curved Spacetime Lensing Light Arcs
      const arcGeo = new THREE.TorusGeometry(3.2, 0.08, 16, 64, Math.PI);
      const arcMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
      const arcTop = new THREE.Mesh(arcGeo, arcMat);
      arcTop.rotation.x = 0.2;
      meshGroup3D.add(arcTop);
    }

    // --- 4. Lorentz Magnetic Force & Cyclotron 3D Model ---
    function buildCyclotronScene() {
      const bField = currentDomainParams['magnetic_field_b'] || 2.0;
      const v = currentDomainParams['particle_velocity'] || 5.0;

      // Magnetic field grid (B vectors pointing up in +Y)
      for (let x = -4; x <= 4; x += 2) {
        for (let z = -4; z <= 4; z += 2) {
          const arrow = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(x, -2, z), 4, 0x0ea5e9, 0.4, 0.2);
          meshGroup3D.add(arrow);
        }
      }

      // Helical particle trajectory trail
      const points = [];
      const radius = Math.max(0.5, (v / Math.max(0.5, Math.abs(bField))) * 0.8);
      for (let t = 0; t < 25; t += 0.2) {
        const px = Math.cos(t) * radius;
        const py = (t / 25) * 4 - 2;
        const pz = Math.sin(t) * radius;
        points.push(new THREE.Vector3(px, py, pz));
      }
      const curveGeo = new THREE.BufferGeometry().setFromPoints(points);
      const curveMat = new THREE.LineBasicMaterial({ color: 0xec4899, linewidth: 3 });
      const helix = new THREE.Line(curveGeo, curveMat);
      meshGroup3D.add(helix);

      // Charged ion particle
      const ionGeo = new THREE.SphereGeometry(0.35, 24, 24);
      const ionMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xb91c1c, emissiveIntensity: 0.5 });
      const ion = new THREE.Mesh(ionGeo, ionMat);
      ion.name = 'cyclotron_ion';
      meshGroup3D.add(ion);
    }

    // --- 5. Neuroscience Chemical Synapse 3D Model ---
    function buildSynapseScene() {
      const caInflux = currentDomainParams['calcium_influx'] || 60;

      // Presynaptic Terminal Bulb (Top)
      const preGeo = new THREE.SphereGeometry(3.5, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.45);
      const preMat = new THREE.MeshStandardMaterial({ color: 0x4f46e5, roughness: 0.3, side: THREE.DoubleSide });
      const pre = new THREE.Mesh(preGeo, preMat);
      pre.rotation.x = Math.PI;
      pre.position.set(0, 2.2, 0);
      meshGroup3D.add(pre);

      // Postsynaptic Receptor Membrane (Bottom)
      const postGeo = new THREE.CylinderGeometry(4.0, 4.0, 0.4, 32);
      const postMat = new THREE.MeshStandardMaterial({ color: 0x059669, roughness: 0.3 });
      const post = new THREE.Mesh(postGeo, postMat);
      post.position.set(0, -1.8, 0);
      meshGroup3D.add(post);

      // Synaptic Vesicles (Neurotransmitter packets)
      const vesGroup = new THREE.Group();
      vesGroup.name = 'synaptic_vesicles';
      for (let i = 0; i < 16; i++) {
        const vGeo = new THREE.SphereGeometry(0.22, 16, 16);
        const vMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.4 });
        const vMesh = new THREE.Mesh(vGeo, vMat);
        const vx = (Math.random() - 0.5) * 3.2;
        const vy = Math.random() * 1.5 + 0.2;
        const vz = (Math.random() - 0.5) * 3.2;
        vMesh.position.set(vx, vy, vz);
        vesGroup.add(vMesh);
      }
      meshGroup3D.add(vesGroup);

      // Inflowing Calcium Ca2+ ions (Green glowing dots)
      const caCount = Math.floor(caInflux / 5);
      for (let j = 0; j < caCount; j++) {
        const caGeo = new THREE.SphereGeometry(0.1, 8, 8);
        const caMat = new THREE.MeshBasicMaterial({ color: 0x34d399 });
        const ca = new THREE.Mesh(caGeo, caMat);
        ca.position.set((Math.random() - 0.5) * 3, Math.random() * 2, (Math.random() - 0.5) * 3);
        meshGroup3D.add(ca);
      }
    }

    // --- 6. Geophysics Subduction Zone & Magma Arc ---
    function buildSubductionScene() {
      // Oceanic Crust Slab (Diving at angle)
      const slabGeo = new THREE.BoxGeometry(4.8, 0.5, 3.5);
      const slabMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4 });
      const slab = new THREE.Mesh(slabGeo, slabMat);
      slab.position.set(-1.2, -0.4, 0);
      slab.rotation.z = -0.45;
      meshGroup3D.add(slab);

      // Overriding Continental Crust
      const contGeo = new THREE.BoxGeometry(4.0, 1.0, 3.5);
      const contMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.5 });
      const cont = new THREE.Mesh(contGeo, contMat);
      cont.position.set(2.4, 0.4, 0);
      meshGroup3D.add(cont);

      // Stratovolcano Cone on Continental Edge
      const coneGeo = new THREE.ConeGeometry(1.2, 1.4, 16);
      const coneMat = new THREE.MeshStandardMaterial({ color: 0x44403c, roughness: 0.7 });
      const cone = new THREE.Mesh(coneGeo, coneMat);
      cone.position.set(1.8, 1.4, 0);
      meshGroup3D.add(cone);

      // Rising Magma Chamber Plume (Glowing Orange/Red)
      const magmaGeo = new THREE.CylinderGeometry(0.2, 0.6, 2.2, 16);
      const magmaMat = new THREE.MeshStandardMaterial({ color: 0xf97316, emissive: 0xe11d48, emissiveIntensity: 0.7 });
      const magma = new THREE.Mesh(magmaGeo, magmaMat);
      magma.position.set(1.5, -0.4, 0);
      meshGroup3D.add(magma);
    }

    // Animation Loop
    function animate3D() {
      requestAnimationFrame(animate3D);
      if (controls3D) controls3D.update();

      const time = Date.now() * 0.001;

      // Rotate DNA strand gently
      const dna = meshGroup3D ? meshGroup3D.getObjectByName('dna_strand') : null;
      if (dna) dna.rotation.y += 0.008;

      // Rotate Accretion disk
      const disk = meshGroup3D ? meshGroup3D.getObjectByName('accretion_disk') : null;
      if (disk) disk.rotation.z += 0.015;

      // Animate Cyclotron Ion along Helical trajectory
      const ion = meshGroup3D ? meshGroup3D.getObjectByName('cyclotron_ion') : null;
      if (ion) {
        const t = (time * 3) % 25;
        const bField = currentDomainParams['magnetic_field_b'] || 2.0;
        const v = currentDomainParams['particle_velocity'] || 5.0;
        const radius = Math.max(0.5, (v / Math.max(0.5, Math.abs(bField))) * 0.8);
        ion.position.set(Math.cos(t) * radius, (t / 25) * 4 - 2, Math.sin(t) * radius);
      }

      if (renderer3D && scene3D && camera3D) {
        renderer3D.render(scene3D, camera3D);
      }
    }

    // Harmonic Web Audio Chime
    function playDomainChime() {
      if (!isAudioOn) return;
      try {
        if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
        if (audioContext.state === 'suspended') audioContext.resume();

        const domain = DOMAIN_REGISTRY[currentDomainKey];
        const base = domain ? domain.audioTone.baseFreq : 432;
        const type = domain ? domain.audioTone.type : 'sine';

        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.type = type;
        osc.connect(gain);
        gain.connect(audioContext.destination);

        osc.frequency.setValueAtTime(base, audioContext.currentTime);
        gain.gain.setValueAtTime(0.07, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.35);

        osc.start();
        osc.stop(audioContext.currentTime + 0.35);
      } catch (e) {}
    }

    function toggleAudio() {
      isAudioOn = !isAudioOn;
      document.getElementById('btn-audio-toggle').innerText = isAudioOn ? 'Sound ON' : 'Sound OFF';
    }

    // =================================================================
    // CINEMATIC ZERO-COLLISION VIDEO ENGINE RENDERER
    // =================================================================
    let vCanvas, vCtx;
    function setupVideoCanvas() {
      vCanvas = document.getElementById('remotionVideoCanvas');
      if (!vCanvas) return;
      vCtx = vCanvas.getContext('2d');
      vCanvas.width = 1920;
      vCanvas.height = 1080;
      renderVideoFrame(0);
    }

    function renderVideoFrame(frame) {
      if (!vCtx) return;
      const lesson = studioData.lessons.find(l => l.lessonId === activeLessonId) || studioData.lessons[0];
      if (!lesson) return;

      const w = 1920, h = 1080;
      vCtx.fillStyle = '#030712';
      vCtx.fillRect(0, 0, w, h);

      // 1. Staged Cinematic 3D Viewport Bounding Box
      vCtx.fillStyle = 'rgba(15, 23, 42, 0.75)';
      vCtx.fillRect(w * 0.05, h * 0.18, w * 0.43, h * 0.64);
      vCtx.strokeStyle = 'rgba(6, 182, 212, 0.5)';
      vCtx.lineWidth = 2;
      vCtx.strokeRect(w * 0.05, h * 0.18, w * 0.43, h * 0.64);

      vCtx.fillStyle = '#38bdf8';
      vCtx.font = 'bold 20px JetBrains Mono';
      vCtx.fillText('🧊 STAGED 3D PROCEDURAL SIMULATION', w * 0.07, h * 0.23);

      // Draw dynamic mathematical orbital rings inside 3D viewport representation
      const time = frame * 0.03;
      vCtx.beginPath();
      vCtx.arc(w * 0.265, h * 0.50, 120 + Math.sin(time) * 10, 0, Math.PI * 2);
      vCtx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      vCtx.stroke();

      vCtx.beginPath();
      vCtx.arc(w * 0.265 + Math.cos(time) * 120, h * 0.50 + Math.sin(time) * 60, 16, 0, Math.PI * 2);
      vCtx.fillStyle = '#22d3ee';
      vCtx.fill();

      // 2. Real-life observation footage container
      vCtx.fillStyle = 'rgba(15, 23, 42, 0.75)';
      vCtx.fillRect(w * 0.51, h * 0.18, w * 0.44, h * 0.38);
      vCtx.strokeStyle = 'rgba(244, 63, 94, 0.4)';
      vCtx.strokeRect(w * 0.51, h * 0.18, w * 0.44, h * 0.38);
      vCtx.fillStyle = '#f43f5e';
      vCtx.font = 'bold 22px Plus Jakarta Sans';
      vCtx.fillText('🔴 EMPIRICAL SCIENTIFIC OBSERVATION FOOTAGE', w * 0.53, h * 0.25);
      vCtx.fillStyle = '#94a3b8';
      vCtx.font = '16px Plus Jakarta Sans';
      vCtx.fillText('Source: BIE Multi-Disciplinary Laboratory Archive', w * 0.53, h * 0.30);

      // 3. Mathematical Formula Card
      vCtx.fillStyle = 'rgba(15, 23, 42, 0.75)';
      vCtx.fillRect(w * 0.51, h * 0.58, w * 0.44, h * 0.24);
      vCtx.strokeStyle = 'rgba(52, 211, 153, 0.4)';
      vCtx.strokeRect(w * 0.51, h * 0.58, w * 0.44, h * 0.24);
      vCtx.fillStyle = '#34d399';
      vCtx.font = 'bold 34px JetBrains Mono';
      
      const activeFormula = (lesson.props.visualElements && lesson.props.visualElements[3]) 
        ? lesson.props.visualElements[3].properties.core_law 
        : 'ΔG = ΔH° - TΔS°';
      vCtx.fillText(activeFormula, w * 0.53, h * 0.70);

      // Frame Numbers
      document.getElementById('cur-frame').innerText = frame;
      document.getElementById('time-cur').innerText = Math.floor(frame / 30) + 's';

      // Socratic Dialogue Synchronization
      const dialogues = lesson.props.dialogue || [];
      if (dialogues.length > 0) {
        const dIdx = Math.floor((frame / 720) * dialogues.length);
        const line = dialogues[Math.min(dialogues.length - 1, dIdx)];
        document.getElementById('hud-speaker').innerText = line.speaker + ':';
        document.getElementById('hud-subtitle').innerText = line.text;
      }
    }

    function selectLesson(id) {
      activeLessonId = id;
      document.querySelectorAll('.lesson-card').forEach(el => {
        el.classList.remove('bg-cyan-950/40', 'border-cyan-500/50', 'shadow-md');
        el.classList.add('bg-slate-900', 'border-slate-800');
      });
      const card = document.getElementById('card-' + id);
      if (card) {
        card.classList.add('bg-cyan-950/40', 'border-cyan-500/50', 'shadow-md');
        card.classList.remove('bg-slate-900', 'border-slate-800');
      }

      const lesson = studioData.lessons.find(l => l.lessonId === id);
      if (!lesson) return;

      document.getElementById('player-lesson-title').innerText = lesson.props.title || id;

      const list = document.getElementById('dialogue-cue-list');
      if (list) {
        list.innerHTML = (lesson.props.dialogue || []).map(d => \`
          <div class="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <div class="flex justify-between font-mono text-[10px] text-cyan-400 mb-0.5">
              <span>\${d.speaker}</span>
              <span>\${d.duration_frames || 200} frames</span>
            </div>
            <p class="text-slate-200">\${d.text}</p>
          </div>
        \`).join('');
      }

      if (lesson.props.domainKey && DOMAIN_REGISTRY[lesson.props.domainKey]) {
        changeDomain(lesson.props.domainKey);
      }
      renderVideoFrame(0);
    }

    function togglePlay() {
      isPlaying = !isPlaying;
      document.getElementById('icon-play').classList.toggle('hidden', isPlaying);
      document.getElementById('icon-pause').classList.toggle('hidden', !isPlaying);
      if (isPlaying) runPlayback();
    }

    function runPlayback() {
      if (!isPlaying) return;
      currentFrame = (currentFrame + 2) % 720;
      document.getElementById('video-scrubber').value = currentFrame;
      renderVideoFrame(currentFrame);
      requestAnimationFrame(runPlayback);
    }

    // =================================================================
    // REAL GEMINI AI MULTIMODAL INGESTION
    // =================================================================
    async function triggerAiDecomposition() {
      const title = document.getElementById('ai-input-title').value;
      const text = document.getElementById('ai-input-text').value;
      const subject = document.getElementById('ai-input-subject').value;

      document.getElementById('spinner-ai').classList.remove('hidden');
      document.getElementById('btn-ai-run').disabled = true;
      document.getElementById('label-ai').innerText = 'Decomposing with Gemini 3.6...';

      try {
        const res = await fetch('/api/ai/ingest-chapter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, text, subject })
        });

        const json = await res.json();
        if (json.success && json.aiResult) {
          const r = json.aiResult;
          document.getElementById('ai-badge-model').innerText = r._model || 'Gemini 3.6';
          document.getElementById('ai-badge-model').className = 'text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/30';
          document.getElementById('ai-res-bloom').innerText = r.bloomTaxonomy.level + ': ' + r.bloomTaxonomy.objective;
          document.getElementById('ai-res-prereq').innerText = (r.prerequisites && r.prerequisites[0]) ? r.prerequisites[0].concept : 'Fundamental Principles';
          document.getElementById('ai-res-myth').innerText = (r.misconceptions && r.misconceptions[0]) ? '"' + r.misconceptions[0].myth + '"' : 'None detected';

          if (json.updatedData && json.updatedData.lessons) {
            studioData.lessons = json.updatedData.lessons;
            refreshVideoSidebar();
            selectLesson(r.lessonId);
          }

          if (r.domainKey) {
            changeDomain(r.domainKey);
          }

          alert('Part 1 Complete: Successfully decomposed textbook chapter into 3D procedural simulation and cinematic video composition!');
        } else {
          alert('AI Ingestion returned error: ' + (json.error || 'Check server logs'));
        }
      } catch (err) {
        alert('Network error during AI Ingestion: ' + err.message);
      } finally {
        document.getElementById('spinner-ai').classList.add('hidden');
        document.getElementById('btn-ai-run').disabled = false;
        document.getElementById('label-ai').innerText = 'Decompose Chapter with Gemini';
      }
    }

    function loadSample(type) {
      if (type === 'crispr') {
        document.getElementById('ai-input-title').value = 'CRISPR-Cas9 Base Editing and Double-Strand Cleavage';
        document.getElementById('ai-input-subject').value = 'Molecular Biology';
        document.getElementById('ai-input-text').value = 'The Cas9 endonuclease uses a single guide RNA to direct double-strand DNA cleavage upstream of a PAM sequence. Unwinding of the helix allows Watson-Crick base pairing to form an R-loop, activating the HNH and RuvC catalytic domains.';
      } else if (type === 'water') {
        document.getElementById('ai-input-title').value = 'Water Dipole and Hydrogen Bonding Networks';
        document.getElementById('ai-input-subject').value = 'Physical Chemistry';
        document.getElementById('ai-input-text').value = 'The high electronegativity of oxygen creates a permanent molecular dipole in H2O. Transient hydrogen bonds form a dynamic network that breaks and reforms on picosecond timescales, dictating liquid cohesion and ice crystal anomalies.';
      } else if (type === 'blackhole') {
        document.getElementById('ai-input-title').value = 'Kerr Black Holes, Frame Dragging and Lensed Accretion';
        document.getElementById('ai-input-subject').value = 'Astrophysics';
        document.getElementById('ai-input-text').value = 'Rotating Kerr black holes drag the surrounding spacetime fabric. Light rays from the accretion disk are bent across the photon sphere by extreme gravitational lensing, exhibiting intense relativistic Doppler blueshifts on the approaching edge.';
      } else if (type === 'cyclotron') {
        document.getElementById('ai-input-title').value = 'Lorentz Force and Cyclotron Resonance in Magnetic Fields';
        document.getElementById('ai-input-subject').value = 'Electrodynamics';
        document.getElementById('ai-input-text').value = 'The magnetic Lorentz force F = q(v x B) is always orthogonal to particle velocity. It does zero mechanical work, confining charged particles into circular or helical gyromotion with cyclotron frequency omega = qB/m.';
      } else if (type === 'synapse') {
        document.getElementById('ai-input-title').value = 'Synaptic Transmission and Vesicular Exocytosis';
        document.getElementById('ai-input-subject').value = 'Neurobiology';
        document.getElementById('ai-input-text').value = 'Arrival of an action potential opens voltage-gated Ca2+ channels at the axon terminal. Inflowing calcium binds to synaptotagmin, triggering SNARE-mediated fusion of neurotransmitter vesicles across the 20nm synaptic cleft.';
      } else if (type === 'subduction') {
        document.getElementById('ai-input-title').value = 'Oceanic Slab Subduction and Mantle Wedge Flux Melting';
        document.getElementById('ai-input-subject').value = 'Geophysics';
        document.getElementById('ai-input-text').value = 'Dense oceanic lithosphere dives into the asthenosphere along subduction zones. Mineral-bound water released from the slab acts as a flux that lowers the melting point of mantle peridotite, generating buoyant magma that fuels explosive volcanic arcs.';
      }
    }

    function refreshVideoSidebar() {
      const container = document.getElementById('video-lesson-sidebar');
      if (!container) return;
      container.innerHTML = studioData.lessons.map((l, idx) => \`
        <div onclick="selectLesson('\${l.lessonId}')" id="card-\${l.lessonId}" class="lesson-card cursor-pointer p-3.5 rounded-xl border bg-slate-900 border-slate-800 hover:border-slate-700 transition">
          <div class="flex items-center justify-between mb-1.5">
            <span class="text-[10px] font-mono font-bold text-cyan-400">LESSON \${idx + 1}</span>
            <span class="text-[10px] text-slate-500 font-mono">\${Math.round((l.props.durationFrames || 720) / 30)}s</span>
          </div>
          <h4 class="text-sm font-bold text-white">\${l.props.title || l.lessonId}</h4>
          <div class="mt-2 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>\${(l.props.visualElements || []).length} Cinematic Layers</span>
            <span class="text-emerald-400 font-semibold">Zero Collision</span>
          </div>
        </div>
      \`).join('');
    }

    // =================================================================
    // INTERACTIVE NEURAL KNOWLEDGE GRAPH
    // =================================================================
    let kgCanvas, kgCtx;
    let kgNodes = [];
    let kgEdges = [];

    async function initKnowledgeGraph() {
      kgCanvas = document.getElementById('knowledgeGraphCanvas');
      if (!kgCanvas) return;
      kgCtx = kgCanvas.getContext('2d');

      try {
        const res = await fetch('/api/knowledge-graph');
        const data = await res.json();
        kgNodes = data.nodes || [];
        kgEdges = data.edges || [];
      } catch (e) {
        console.error('Failed to fetch knowledge graph:', e);
      }

      drawKnowledgeGraph();

      kgCanvas.addEventListener('click', (e) => {
        const rect = kgCanvas.getBoundingClientRect();
        const clickX = (e.clientX - rect.left) * (kgCanvas.width / rect.width);
        const clickY = (e.clientY - rect.top) * (kgCanvas.height / rect.height);

        for (const n of kgNodes) {
          const dx = clickX - n.x;
          const dy = clickY - n.y;
          if (Math.sqrt(dx * dx + dy * dy) < 28) {
            showNodePopover(n);
            break;
          }
        }
      });
    }

    function drawKnowledgeGraph() {
      if (!kgCtx || !kgCanvas) return;
      const w = kgCanvas.parentElement.clientWidth || 800;
      const h = kgCanvas.parentElement.clientHeight || 520;
      kgCanvas.width = w;
      kgCanvas.height = h;

      kgCtx.fillStyle = '#030712';
      kgCtx.fillRect(0, 0, w, h);

      kgNodes.forEach((node, i) => {
        const col = node.depth;
        const row = i % 4;
        node.x = 100 + col * (w - 200) / 3;
        node.y = 80 + row * (h - 160) / 3;
      });

      kgEdges.forEach(edge => {
        const fromNode = kgNodes.find(n => n.id === edge.from);
        const toNode = kgNodes.find(n => n.id === edge.to);
        if (fromNode && toNode) {
          kgCtx.strokeStyle = 'rgba(100, 116, 139, 0.4)';
          kgCtx.lineWidth = 2;
          kgCtx.beginPath();
          kgCtx.moveTo(fromNode.x, fromNode.y);
          kgCtx.lineTo(toNode.x, toNode.y);
          kgCtx.stroke();
        }
      });

      kgNodes.forEach(node => {
        kgCtx.beginPath();
        kgCtx.arc(node.x, node.y, 22, 0, Math.PI * 2);
        kgCtx.fillStyle = node.group === 'core_lesson' ? '#06b6d4' : (node.group === 'prerequisite' ? '#10b981' : '#a855f7');
        kgCtx.fill();

        kgCtx.strokeStyle = '#ffffff';
        kgCtx.lineWidth = 2;
        kgCtx.stroke();

        kgCtx.fillStyle = '#f8fafc';
        kgCtx.font = 'bold 11px Plus Jakarta Sans';
        kgCtx.textAlign = 'center';
        kgCtx.fillText(node.label, node.x, node.y + 36);
      });
    }

    function showNodePopover(node) {
      const pop = document.getElementById('graph-node-popover');
      if (!pop) return;
      document.getElementById('popover-node-title').innerText = node.label;
      document.getElementById('popover-node-status').innerText = 'Tier ' + node.depth + ' • ' + node.status.toUpperCase();
      document.getElementById('popover-node-desc').innerText = 'Category: ' + node.group + '. Certified zero-collision prerequisite in BIE curriculum ontology.';
      pop.classList.remove('hidden');
    }

    // =================================================================
    // CLIENT CONTROLLER: SOCRATIC 3D CHALLENGES & MISCONCEPTION BUSTER
    // =================================================================
    let gameChallenges = [];
    let currentActiveChallenge = null;
    let currentGameParams = {};

    async function initGamesTab() {
      try {
        const res = await fetch('/api/engine/game/challenges');
        const data = await res.json();
        if (data.success) {
          gameChallenges = data.challenges;
          const selector = document.getElementById('game-challenge-select');
          if (selector && selector.value) {
            loadGameChallenge(selector.value);
          }
        }
      } catch (err) {
        console.error('Failed to init games:', err);
      }
    }

    function loadGameChallenge(challengeId) {
      const challenge = gameChallenges.find(c => c.id === challengeId) || {
        id: challengeId,
        objective: 'Calibrate parameters to achieve physical target state.',
        defaultParams: { param_a: 50, param_b: 1.0 }
      };
      currentActiveChallenge = challenge;
      currentGameParams = Object.assign({}, challenge.defaultParams);

      const objEl = document.getElementById('game-objective-text');
      if (objEl) objEl.innerText = challenge.objective;

      // Render sliders
      const container = document.getElementById('game-sliders-container');
      if (container) {
        container.innerHTML = '';
        for (const [key, val] of Object.entries(currentGameParams)) {
          const row = document.createElement('div');
          row.className = 'space-y-1';
          const label = key.replace(/_/g, ' ').toUpperCase();
          const maxVal = val > 50 ? 100 : (val > 10 ? 50 : 5);
          const stepVal = val < 5 ? '0.1' : '1';
          row.innerHTML = 
            '<div class="flex items-center justify-between text-xs font-mono">' +
              '<span class="text-slate-300 font-bold">' + label + '</span>' +
              '<span id="val-' + key + '" class="text-cyan-400 font-bold">' + val + '</span>' +
            '</div>' +
            '<input type="range" min="0" max="' + maxVal + '" step="' + stepVal + '" value="' + val + '" ' +
              'oninput="updateGameParam(\'' + key + '\', this.value)" ' +
              'class="w-full accent-cyan-400 bg-slate-900 h-2 rounded-lg cursor-pointer">';
          container.appendChild(row);
        }
      }

      // Reset feedback card
      const fbCard = document.getElementById('game-feedback-card');
      const fbStatus = document.getElementById('game-feedback-status');
      const fbMsg = document.getElementById('game-feedback-message');
      const fbBadge = document.getElementById('game-feedback-badge');
      if (fbCard) fbCard.className = 'p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 min-h-[160px] flex flex-col justify-center';
      if (fbStatus) {
        fbStatus.innerText = 'Status: Awaiting Calibration Attempt';
        fbStatus.className = 'text-xs font-mono font-bold text-slate-400 uppercase tracking-wide';
      }
      if (fbMsg) fbMsg.innerText = 'Adjust the sliders on the left and click "Verify Physical Target Calibration" to run the simulation test.';
      if (fbBadge) fbBadge.className = 'hidden';
    }

    function updateGameParam(key, value) {
      const numVal = parseFloat(value);
      currentGameParams[key] = numVal;
      const display = document.getElementById('val-' + key);
      if (display) display.innerText = numVal;
    }

    async function submitGameAttempt() {
      if (!currentActiveChallenge) return;
      const btn = document.getElementById('btn-submit-attempt');
      if (btn) {
        btn.innerText = 'Evaluating In Engine...';
        btn.disabled = true;
      }

      try {
        const res = await fetch('/api/engine/game/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            challengeId: currentActiveChallenge.id,
            params: currentGameParams
          })
        });
        const result = await res.json();

        const fbCard = document.getElementById('game-feedback-card');
        const fbStatus = document.getElementById('game-feedback-status');
        const fbMsg = document.getElementById('game-feedback-message');
        const fbBadge = document.getElementById('game-feedback-badge');
        const scoreDisp = document.getElementById('game-score-display');

        if (result.status === 'PASSED') {
          fbCard.className = 'p-5 rounded-2xl bg-emerald-950/40 border border-emerald-500/50 space-y-3 min-h-[160px] flex flex-col justify-center';
          fbStatus.className = 'text-xs font-mono font-bold text-emerald-300 uppercase tracking-wide';
          fbStatus.innerText = 'Status: Physical Equilibrium Confirmed (Passed)';
          fbBadge.className = 'text-[10px] font-mono px-2 py-0.5 rounded-full font-bold bg-emerald-900 text-emerald-200';
          fbBadge.innerText = '+100 PTS';
          fbMsg.innerText = result.feedback;
          if (scoreDisp && result.totalScore !== undefined) scoreDisp.innerText = result.totalScore;
        } else if (result.status === 'MISCONCEPTION_TRIGGERED') {
          fbCard.className = 'p-5 rounded-2xl bg-rose-950/40 border border-rose-500/50 space-y-3 min-h-[160px] flex flex-col justify-center';
          fbStatus.className = 'text-xs font-mono font-bold text-rose-300 uppercase tracking-wide';
          fbStatus.innerText = 'Warning: Common Misconception Triggered!';
          fbBadge.className = 'text-[10px] font-mono px-2 py-0.5 rounded-full font-bold bg-rose-900 text-rose-200';
          fbBadge.innerText = 'INTUITION TRAP';
          fbMsg.innerText = result.feedback;
        } else {
          fbCard.className = 'p-5 rounded-2xl bg-amber-950/40 border border-amber-500/50 space-y-3 min-h-[160px] flex flex-col justify-center';
          fbStatus.className = 'text-xs font-mono font-bold text-amber-300 uppercase tracking-wide';
          fbStatus.innerText = 'Status: Outside Equilibrium Tolerance';
          fbBadge.className = 'text-[10px] font-mono px-2 py-0.5 rounded-full font-bold bg-amber-900 text-amber-200';
          fbBadge.innerText = 'RECALIBRATE';
          fbMsg.innerText = result.feedback || 'Adjust sliders to align with theoretical boundary conditions.';
        }
      } catch (err) {
        console.error('Submit attempt failed:', err);
      } finally {
        if (btn) {
          btn.innerText = 'Verify Physical Target Calibration';
          btn.disabled = false;
        }
      }
    }

    // =================================================================
    // CLIENT CONTROLLER: LATEX & DIMENSIONAL HOMOGENEITY AST
    // =================================================================
    let formulasRegistry = {};
    let activeFormulaId = 'crispr_free_energy';

    async function initLatexTab() {
      try {
        const res = await fetch('/api/engine/latex/formulas');
        formulasRegistry = await res.json();
        const sel = document.getElementById('latex-formula-select');
        if (sel) {
          loadLatexFormula(sel.value || 'crispr_free_energy');
        }
      } catch (err) {
        console.error('Failed to load formulas:', err);
      }
    }

    function loadLatexFormula(formulaId) {
      activeFormulaId = formulaId;
      const formula = formulasRegistry[formulaId];
      if (!formula) return;

      const nameEl = document.getElementById('latex-formula-name');
      const mathEl = document.getElementById('latex-math-display');
      if (nameEl) nameEl.innerText = formula.name + ' (' + formula.domain + ')';
      if (mathEl) mathEl.innerText = formula.latex;

      // Derivation Steps
      const stepsContainer = document.getElementById('latex-derivation-steps');
      if (stepsContainer) {
        stepsContainer.innerHTML = '';
        formula.derivationSteps.forEach(s => {
          const card = document.createElement('div');
          card.className = 'p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1';
          card.innerHTML = 
            '<div class="flex items-center space-x-2">' +
              '<span class="w-5 h-5 rounded-full bg-cyan-950 text-cyan-400 font-mono text-[10px] font-bold flex items-center justify-center border border-cyan-500/30">' + s.step + '</span>' +
              '<span class="text-xs font-bold text-slate-200">' + s.title + '</span>' +
            '</div>' +
            '<div class="pl-7 font-mono text-xs text-cyan-300">' + s.latex + '</div>';
          stepsContainer.appendChild(card);
        });
      }

      // Variable Dictionary
      const varContainer = document.getElementById('latex-variable-list');
      if (varContainer) {
        varContainer.innerHTML = '';
        formula.variables.forEach(v => {
          const vRow = document.createElement('div');
          vRow.className = 'flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800/80';
          vRow.innerHTML = 
            '<span class="font-bold text-cyan-300">' + v.symbol + '</span>' +
            '<span class="text-slate-400">' + v.name + '</span>' +
            '<span class="text-slate-500 font-mono text-[10px]">' + (v.dimension.unit || 'unit') + '</span>';
          varContainer.appendChild(vRow);
        });
      }

      // Inputs for calculator
      const calcContainer = document.getElementById('latex-calc-inputs');
      if (calcContainer) {
        calcContainer.innerHTML = '';
        const inputMap = {
          crispr_free_energy: [{ key: 'temperature', label: 'Temperature (K)', default: 310.15 }],
          water_dipole: [{ key: 'partial_charge', label: 'Partial Charge (q)', default: 0.66 }],
          schwarzschild_radius: [{ key: 'solar_masses', label: 'Mass (Solar Masses)', default: 10 }],
          lorentz_force: [{ key: 'B', label: 'Magnetic Flux B (Tesla)', default: 2.0 }],
          synapse_nernst: [{ key: 'ca_out', label: 'Ca2+ Extracellular (mM)', default: 2.0 }, { key: 'ca_in', label: 'Ca2+ Intracellular (mM)', default: 0.0001 }],
          slab_pull_force: [{ key: 'delta_rho', label: 'Density Contrast Δρ (kg/m³)', default: 80 }]
        };
        const inputs = inputMap[formulaId] || [];
        inputs.forEach(inp => {
          const div = document.createElement('div');
          div.className = 'space-y-1';
          div.innerHTML = 
            '<label class="text-[11px] font-mono text-slate-400 block uppercase">' + inp.label + '</label>' +
            '<input type="number" id="calc-input-' + inp.key + '" value="' + inp.default + '" step="any" ' +
              'class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-cyan-300 font-mono focus:outline-none">';
          calcContainer.appendChild(div);
        });
      }

      // Run initial calculation
      calculateLatexFormula();
    }

    async function calculateLatexFormula() {
      const formula = formulasRegistry[activeFormulaId];
      if (!formula) return;

      const params = {};
      const inputs = document.querySelectorAll('[id^="calc-input-"]');
      inputs.forEach(inp => {
        const key = inp.id.replace('calc-input-', '');
        params[key] = parseFloat(inp.value);
      });

      try {
        const res = await fetch('/api/engine/latex/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ formulaId: activeFormulaId, parameters: params })
        });
        const data = await res.json();
        const resBox = document.getElementById('latex-calc-result');
        if (resBox && data.calculated) {
          resBox.innerHTML = 
            '<div class="space-y-1">' +
              '<span class="text-slate-400 text-[10px] uppercase font-bold block">Physical Theoretical Output:</span>' +
              '<pre class="text-cyan-300 font-mono text-xs">' + JSON.stringify(data.calculated, null, 2) + '</pre>' +
            '</div>';
        }
      } catch (err) {
        console.error('Formula calc error:', err);
      }
    }

    // =================================================================
    // CLIENT CONTROLLER: DISTRIBUTED RENDER FARM CLUSTER
    // =================================================================
    async function fetchClusterTelemetry() {
      try {
        const res = await fetch('/api/engine/render/cluster');
        const data = await res.json();
        if (data.success && data.telemetry) {
          renderClusterNodes(data.telemetry.nodes);
        }
      } catch (err) {
        console.error('Cluster fetch error:', err);
      }
    }

    function renderClusterNodes(nodes) {
      const grid = document.getElementById('cluster-nodes-grid');
      if (!grid) return;
      grid.innerHTML = '';

      nodes.forEach(node => {
        const card = document.createElement('div');
        card.className = 'p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2';
        const vramGb = (node.vramFreeMb / 1024).toFixed(1);
        card.innerHTML = 
          '<div class="flex items-center justify-between">' +
            '<span class="font-bold text-white text-xs font-mono">' + node.id + '</span>' +
            '<span class="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-bold">' + node.status + '</span>' +
          '</div>' +
          '<div class="text-[11px] text-slate-400 font-mono">' + node.gpu + '</div>' +
          '<div class="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">' +
            '<span class="text-slate-500">Free VRAM</span>' +
            '<span class="text-cyan-400 font-bold">' + vramGb + ' GB</span>' +
          '</div>';
        grid.appendChild(card);
      });
    }

    async function dispatchRenderJob() {
      const btn = document.getElementById('btn-dispatch-render');
      if (btn) {
        btn.innerText = 'Dispatching & Slicing...';
        btn.disabled = true;
      }

      try {
        const res = await fetch('/api/engine/render/dispatch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lessonId: activeLessonId || 'lesson_ch01_electrostatics_1', totalFrames: 720 })
        });
        const data = await res.json();

        if (data.success && data.job) {
          const list = document.getElementById('cluster-jobs-list');
          if (list) {
            const item = document.createElement('div');
            item.className = 'p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2';
            item.innerHTML = 
              '<div class="space-y-0.5">' +
                '<div class="flex items-center space-x-2">' +
                  '<span class="font-mono text-xs font-bold text-cyan-300">' + data.job.jobId + '</span>' +
                  '<span class="text-[9px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-bold">READY (4 SLICES)</span>' +
                '</div>' +
                '<div class="text-[11px] text-slate-400 font-mono">' +
                  'Resolution: ' + data.job.resolution + ' • ' + data.job.fps + ' FPS • Duration: ' + data.job.durationSeconds + 's • ' + data.job.outputArtifact.codec +
                '</div>' +
              '</div>' +
              '<div class="flex items-center space-x-3 text-xs font-mono">' +
                '<span class="text-emerald-400 font-bold">' + data.job.timingSeconds.total + 's Latency</span>' +
                '<a href="' + data.job.outputArtifact.s3Url + '" target="_blank" class="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 transition">' +
                  'Download MP4' +
                '</a>' +
              '</div>';
            list.prepend(item);
          }
        }
      } catch (err) {
        console.error('Dispatch render failed:', err);
      } finally {
        if (btn) {
          btn.innerText = 'Dispatch 720-Frame Render Job';
          btn.disabled = false;
        }
      }
    }
  </script>
</body>
</html>`;
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

server.listen(PORT, HOST, () => {
  console.log(`[BIE] Universal Multi-Domain 3D Intelligence Suite running at http://${HOST}:${PORT}`);
});
