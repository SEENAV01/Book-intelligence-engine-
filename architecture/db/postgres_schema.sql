-- ====================================================================
-- BOOK-TO-VIDEO INTELLIGENCE ENGINE (BIE) - ENTERPRISE RELATIONAL SCHEMA
-- Database: PostgreSQL 16+ with TimescaleDB & pgvector for embeddings
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- 1. Organizations & Tenants
CREATE TABLE IF NOT EXISTS tenants (
    tenant_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    plan_tier VARCHAR(50) DEFAULT 'enterprise', -- 'academic', 'enterprise', 'gov'
    max_concurrent_renders INT DEFAULT 32,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Textbook & Document Catalog
CREATE TABLE IF NOT EXISTS textbooks (
    textbook_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    authors TEXT[],
    isbn VARCHAR(30),
    edition VARCHAR(50),
    subject_domain VARCHAR(100) NOT NULL,
    content_hash_sha256 CHAR(64) NOT NULL UNIQUE,
    source_format VARCHAR(20) NOT NULL, -- 'pdf', 'epub', 'markdown', 'xml'
    raw_storage_uri TEXT NOT NULL,
    total_pages INT DEFAULT 0,
    ingestion_status VARCHAR(50) DEFAULT 'PENDING', -- 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Ingested Spatial Blocks (from M001 Spatial Intelligence)
CREATE TABLE IF NOT EXISTS spatial_blocks (
    block_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    textbook_id UUID REFERENCES textbooks(textbook_id) ON DELETE CASCADE,
    page_number INT NOT NULL,
    block_index INT NOT NULL,
    block_type VARCHAR(50) NOT NULL, -- 'paragraph', 'formula', 'diagram', 'callout', 'table'
    bounding_box_normalized JSONB NOT NULL, -- {x0, y0, x1, y1}
    text_content TEXT,
    latex_formula TEXT,
    embedding vector(1536), -- Vector embedding for semantic search
    provenance_hash CHAR(64) NOT NULL
);

-- 4. Pedagogical Objectives & Bloom's Taxonomy (from M050 / M100)
CREATE TABLE IF NOT EXISTS pedagogical_objectives (
    objective_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    textbook_id UUID REFERENCES textbooks(textbook_id) ON DELETE CASCADE,
    chapter_index INT NOT NULL,
    lesson_slug VARCHAR(150) NOT NULL,
    title VARCHAR(300) NOT NULL,
    bloom_level VARCHAR(50) NOT NULL, -- 'REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'
    measurable_outcome TEXT NOT NULL,
    target_duration_seconds INT DEFAULT 60,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Socratic Dialogue Scripts (from M150)
CREATE TABLE IF NOT EXISTS dialogue_scripts (
    dialogue_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    objective_id UUID REFERENCES pedagogical_objectives(objective_id) ON DELETE CASCADE,
    turn_index INT NOT NULL,
    speaker VARCHAR(100) NOT NULL, -- 'Dr. Maya (Lead Instructor)', 'Alex (Student)'
    speech_text TEXT NOT NULL,
    target_wpm INT DEFAULT 135,
    calculated_duration_frames INT NOT NULL,
    voice_audio_uri TEXT, -- Synthesized audio MP3/WAV URI
    visual_cue_trigger VARCHAR(100),
    emotion_tone VARCHAR(50) DEFAULT 'scholarly_warmth'
);

-- 6. Scene Layouts & Collision Audits (from M200)
CREATE TABLE IF NOT EXISTS scene_layouts (
    scene_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    objective_id UUID REFERENCES pedagogical_objectives(objective_id) ON DELETE CASCADE,
    canvas_resolution VARCHAR(30) DEFAULT '1920x1080',
    framerate INT DEFAULT 30,
    layout_partitioning_dsl JSONB NOT NULL,
    collision_score NUMERIC(5, 4) DEFAULT 0.0000, -- Must be 0.0000 to pass QA
    qa_passed BOOLEAN DEFAULT TRUE,
    auto_repair_iterations INT DEFAULT 0
);

-- 7. Distributed Video Render Jobs (from M250 / Cluster)
CREATE TABLE IF NOT EXISTS render_jobs (
    job_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    objective_id UUID REFERENCES pedagogical_objectives(objective_id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'QUEUED', -- 'QUEUED', 'SPLITTING', 'RENDERING', 'STITCHING', 'COMPLETED', 'FAILED'
    output_codec VARCHAR(30) DEFAULT 'H264_AAC', -- 'H264_AAC', 'PRORES_422', 'AV1'
    total_frames INT NOT NULL,
    rendered_frames INT DEFAULT 0,
    cluster_workers_assigned INT DEFAULT 8,
    final_video_uri TEXT,
    captions_vtt_uri TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_log TEXT
);

-- 8. Render Frame Chunks (Distributed Slice Tracking)
CREATE TABLE IF NOT EXISTS render_chunks (
    chunk_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES render_jobs(job_id) ON DELETE CASCADE,
    chunk_index INT NOT NULL,
    start_frame INT NOT NULL,
    end_frame INT NOT NULL,
    assigned_worker_node VARCHAR(100),
    status VARCHAR(50) DEFAULT 'PENDING',
    chunk_video_uri TEXT,
    render_time_ms INT
);

-- 9. Interactive Revision Sandbox Game Data (from M275)
CREATE TABLE IF NOT EXISTS sandbox_games (
    game_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    textbook_id UUID REFERENCES textbooks(textbook_id) ON DELETE CASCADE,
    levels_spec JSONB NOT NULL,
    html5_bundle_uri TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Student Cognitive Telemetry & Misconception Audit
CREATE TABLE IF NOT EXISTS learning_telemetry (
    telemetry_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    objective_id UUID REFERENCES pedagogical_objectives(objective_id),
    diagnostic_passed BOOLEAN NOT NULL,
    remediation_bridge_triggered BOOLEAN DEFAULT FALSE,
    misconception_trap_selected VARCHAR(255),
    time_spent_in_sandbox_seconds INT,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for high-throughput enterprise scale
CREATE INDEX IF NOT EXISTS idx_spatial_blocks_textbook ON spatial_blocks(textbook_id);
CREATE INDEX IF NOT EXISTS idx_pedagogical_obj_textbook ON pedagogical_objectives(textbook_id);
CREATE INDEX IF NOT EXISTS idx_render_jobs_status ON render_jobs(status);
CREATE INDEX IF NOT EXISTS idx_render_chunks_job ON render_chunks(job_id, status);
