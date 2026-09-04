# Book-to-Video Intelligence Engine (BIE)
## Enterprise System Architecture & Production Specification

### 1. Architectural Overview & System Decomposition
The BIE Platform automates the conversion of complex scientific and academic textbooks into interactive 3D WebGL simulations and 1080p/4K Remotion video compositions.

```
                                [ CLIENT / STUDIO UI ]
                                          │
                                          ▼
                             [ REST & SSE API GATEWAY ]
                                          │
     ┌───────────────────┬────────────────┴──────────────────┬───────────────────┐
     ▼                   ▼                                   ▼                   ▼
[ DOCUMENT OCR & ] [ GEMINI COGNITIVE ]            [ NEO4J PREREQ ]    [ DISTRIBUTED REMOTION ]
[ SPATIAL PARSER ] [ DECOMPOSITION    ]            [ KNOWLEDGE    ]    [ RENDER FARM (GPU)    ]
     │                   │                                   │                   │
     ▼                   ▼                                   ▼                   ▼
[ PostgreSQL ]     [ Bloom & Socratic ]            [ Graph Traversal]  [ Chunk Stitch Demuxer ]
[ 16 + pgvector ]  [ Dialogue DSL     ]            [ & Remediation  ]  [ S3 / CDN CloudFront  ]
```

### 2. Microservice Topology
1. **`bie-gateway`**: Ingestion router, OAuth2 authentication, rate limiting, and Server-Sent Events (SSE) telemetry.
2. **`bie-ocr-spatial`**: Multi-column text, LaTeX equation, and figure bounding-box extractor (M001).
3. **`bie-cognitive-gemini`**: Google Gemini 3.6 Multimodal pipeline extracting Bloom objectives, diagnostic MCQs, and Socratic dialogues (M050/M150).
4. **`bie-graph-ontology`**: Neo4j-backed directed acyclic graph mapping 100,000+ prerequisite concepts and misconception-remediation bridges (M100).
5. **`bie-layout-qa`**: Deterministic interval-arithmetic layout collision auditor ensuring zero-overlap between video layers (M200).
6. **`bie-render-farm`**: Scalable cluster of GPU-accelerated Chromium instances rendering Remotion frame slices in parallel (M250).
7. **`bie-sandbox-compiler`**: Three.js WebGL and HTML5 physics simulator packaging engine (M275).

### 3. Service Level Agreements (SLAs)
- **Textbook Ingestion Latency**: < 45 seconds per 50-page chapter.
- **Layout Collision Tolerance**: Strictly 0.0000 (100% certified collision-free guarantee).
- **Video Render Latency**: < 20 seconds for a 60-second 1080p/30fps video on an 8-worker GPU cluster.
- **Prerequisite Trace Depth**: Sub-millisecond Neo4j graph traversal for up to 6 topological levels.
