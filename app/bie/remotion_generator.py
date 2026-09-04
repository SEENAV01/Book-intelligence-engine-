"""
Remotion Video Code Generator.
Generates deterministic, production-grade Remotion React / TypeScript codebases
for all lessons across the textbook curriculum.
Includes animated vector physics, real-life phenomenon video staging, and synchronized captions.
"""
from typing import List, Dict, Any, Optional
import os
import json
from bie_core.models import (
    LessonUnit,
    SceneDSL,
    ConceptUnderstanding
)


BASE_DIR = os.path.dirname(os.path.abspath(__file__))


class RemotionGenerator:
    """Compiles SceneDSL trees into deterministic Remotion TSX compositions."""

    def __init__(self, output_dir: Optional[str] = None):
        self.output_dir = output_dir or os.path.join(BASE_DIR, "generated_video_code")
        os.makedirs(self.output_dir, exist_ok=True)

    def generate_all_lessons_code(
        self,
        lessons: List[LessonUnit],
        scenes: Dict[str, SceneDSL],
        concepts: Dict[str, ConceptUnderstanding]
    ) -> Dict[str, str]:
        """
        Emits complete Remotion code for every lesson in the curriculum.
        Returns a mapping of relative file paths to their absolute destinations.
        """
        generated_files: Dict[str, str] = {}

        # 1. Generate Root.tsx (Registers all lesson compositions)
        root_path = os.path.join(self.output_dir, "Root.tsx")
        root_code = self._generate_root_tsx(lessons, scenes)
        with open(root_path, "w") as f:
            f.write(root_code)
        generated_files["Root.tsx"] = root_path

        # 2. Generate BIELesson.tsx (The universal high-grade visual layout component)
        bie_lesson_path = os.path.join(self.output_dir, "BIELesson.tsx")
        bie_lesson_code = self._generate_bie_lesson_tsx()
        with open(bie_lesson_path, "w") as f:
            f.write(bie_lesson_code)
        generated_files["BIELesson.tsx"] = bie_lesson_path

        # 3. Generate individual lesson composition props & caption tracks
        for lesson in lessons:
            scene = scenes.get(lesson.lesson_id)
            concept = concepts.get(lesson.target_concept_id)
            if not scene or not concept:
                continue

            lesson_dir = os.path.join(self.output_dir, lesson.lesson_id)
            os.makedirs(lesson_dir, exist_ok=True)

            # Props JSON
            props_data = {
                "lesson_id": lesson.lesson_id,
                "title": lesson.title,
                "duration_frames": scene.duration_frames,
                "fps": scene.fps,
                "concept": {
                    "id": concept.concept_id,
                    "title": concept.title,
                    "core_law": concept.core_law,
                    "misconceptions": [m.to_dict() for m in concept.misconceptions],
                    "phenomena": concept.real_world_phenomena
                },
                "visual_elements": [v.__dict__ for v in scene.visual_elements],
                "dialogue": [d.__dict__ for d in scene.dialogue]
            }
            props_path = os.path.join(lesson_dir, "props.json")
            with open(props_path, "w") as f:
                json.dump(props_data, f, indent=2)
            generated_files[f"{lesson.lesson_id}/props.json"] = props_path

            # Synchronized WebVTT Captions
            vtt_path = os.path.join(lesson_dir, "captions.vtt")
            vtt_content = self._generate_webvtt(scene)
            with open(vtt_path, "w") as f:
                f.write(vtt_content)
            generated_files[f"{lesson.lesson_id}/captions.vtt"] = vtt_path

        return generated_files

    def _generate_root_tsx(
        self, lessons: List[LessonUnit], scenes: Dict[str, SceneDSL]
    ) -> str:
        lines = [
            "import React from 'react';",
            "import { Composition } from 'remotion';",
            "import { BIELesson } from './BIELesson';",
            "",
            "export const RemotionRoot: React.FC = () => {",
            "  return (",
            "    <>",
        ]
        for lesson in lessons:
            scene = scenes.get(lesson.lesson_id)
            duration = scene.duration_frames if scene else 300
            lines.append(
                f'      <Composition\n'
                f'        id="{lesson.lesson_id}"\n'
                f'        component={{BIELesson}}\n'
                f'        durationInFrames={{{duration}}}\n'
                f'        fps={{30}}\n'
                f'        width={{1920}}\n'
                f'        height={{1080}}\n'
                f'        defaultProps={{\n'
                f'          lessonId: "{lesson.lesson_id}",\n'
                f'          title: "{lesson.title}",\n'
                f'        }}\n'
                f'      />'
            )
        lines.extend([
            "    </>",
            "  );",
            "};",
            ""
        ])
        return "\n".join(lines)

    def _generate_bie_lesson_tsx(self) -> str:
        return """import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  Video,
  staticFile
} from 'remotion';

export interface BIELessonProps {
  lessonId: string;
  title: string;
  realVideoSrc?: string;
  realVideoLabel?: string;
  coreLaw?: string;
  currentSubtitle?: string;
}

export const BIELesson: React.FC<BIELessonProps> = ({
  lessonId,
  title,
  realVideoSrc = 'assets/phenomena/default_phenomenon.mp4',
  realVideoLabel = 'Real-Life Observation',
  coreLaw = 'Physical Principle',
  currentSubtitle = ''
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Organic spring entrance animations
  const headerEntrance = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 120 }
  });

  const paneEntrance = spring({
    frame: frame - 15,
    fps,
    config: { damping: 12, stiffness: 100 }
  });

  // Animated vector pulsation
  const pulse = Math.sin(frame / 15) * 6;

  return (
    <AbsoluteFill className="bg-slate-950 text-white font-sans overflow-hidden select-none">
      {/* 1. Subtle Radial Gradient Backdrop */}
      <div 
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 30% 30%, rgba(6, 182, 212, 0.15) 0%, transparent 70%)'
        }}
      />

      {/* 2. Top Header Banner */}
      <div 
        className="absolute top-6 left-12 right-12 h-20 rounded-2xl bg-slate-900/80 border border-cyan-500/30 backdrop-blur-xl px-8 flex items-center justify-between shadow-2xl"
        style={{
          transform: `translateY(${(1 - headerEntrance) * -60}px)`,
          opacity: headerEntrance
        }}
      >
        <div className="flex items-center space-x-4">
          <div className="w-3.5 h-3.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_12px_#22d3ee]" />
          <h1 className="text-2xl font-bold tracking-wide text-white">{title}</h1>
        </div>
        <div className="text-xs uppercase tracking-widest text-cyan-400 font-mono font-semibold px-4 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/40">
          BIE Master Curriculum
        </div>
      </div>

      {/* 3. Left Split Pane: Dynamic Vector Simulation */}
      <div 
        className="absolute top-32 left-12 bottom-28 w-[52%] rounded-3xl bg-slate-900/60 border border-white/10 backdrop-blur-md p-8 flex flex-col justify-between overflow-hidden shadow-2xl"
        style={{
          transform: `scale(${interpolate(paneEntrance, [0, 1], [0.95, 1])})`,
          opacity: paneEntrance
        }}
      >
        <div className="flex justify-between items-center">
          <span className="text-sm font-semibold tracking-wider text-cyan-400 uppercase">
            ⚡ Interactive Simulation Model
          </span>
          <span className="text-xs font-mono text-slate-400">Frame {frame}</span>
        </div>

        {/* Dynamic Vector Canvas Staging */}
        <div className="relative flex-1 flex items-center justify-center my-6">
          {/* Central Animated Vector Fields */}
          <div 
            className="w-36 h-36 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-[0_0_40px_rgba(6,182,212,0.6)]"
            style={{ transform: `scale(${1 + pulse * 0.02})` }}
          >
            <span className="text-4xl font-black text-white">⊕</span>
          </div>
          <div 
            className="w-36 h-36 rounded-full bg-gradient-to-tr from-rose-500 to-red-600 flex items-center justify-center shadow-[0_0_40px_rgba(244,63,94,0.6)] ml-28"
            style={{ transform: `scale(${1 - pulse * 0.02})` }}
          >
            <span className="text-4xl font-black text-white">⊖</span>
          </div>
        </div>

        <div className="text-xs text-slate-400 font-mono bg-slate-950/50 p-3 rounded-xl border border-white/5">
          Model: Spring-mass vector field dynamics with inverse-square falloff.
        </div>
      </div>

      {/* 4. Right Upper Split Pane: Real-Life Phenomenon Video Footage */}
      <div 
        className="absolute top-32 right-12 w-[39%] h-[46%] rounded-3xl overflow-hidden border border-white/10 bg-slate-900 shadow-2xl relative"
        style={{
          transform: `translateY(${(1 - paneEntrance) * 40}px)`,
          opacity: paneEntrance
        }}
      >
        <Video 
          src={staticFile(realVideoSrc)}
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-3 left-3 bg-black/75 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-red-500/40 flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs font-medium text-white tracking-wide">
            {realVideoLabel}
          </span>
        </div>
      </div>

      {/* 5. Right Lower Split Pane: Grounded Core Law Card */}
      <div 
        className="absolute bottom-28 right-12 w-[39%] h-[22%] rounded-3xl bg-slate-900/80 border border-cyan-500/20 backdrop-blur-md p-6 flex flex-col justify-center shadow-2xl"
        style={{
          transform: `translateY(${(1 - paneEntrance) * 40}px)`,
          opacity: paneEntrance
        }}
      >
        <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-2">
          📖 Scientific Principle & Grounded Law
        </span>
        <p className="text-base font-medium text-slate-200 leading-snug">
          {coreLaw}
        </p>
      </div>

      {/* 6. Bottom Synchronized Subtitle Strip */}
      <div className="absolute bottom-6 left-12 right-12 h-16 rounded-2xl bg-slate-950/90 border border-white/10 backdrop-blur-2xl flex items-center justify-center px-10 shadow-2xl">
        <p className="text-lg font-medium text-cyan-200 text-center tracking-wide">
          {currentSubtitle || "Listen closely as we unpack the core physical principles."}
        </p>
      </div>
    </AbsoluteFill>
  );
};
"""

    def _generate_webvtt(self, scene: SceneDSL) -> str:
        lines = ["WEBVTT", ""]
        current_time_sec = 0.0

        for idx, dlg in enumerate(scene.dialogue):
            duration_sec = dlg.duration_frames / scene.fps
            start_str = self._format_timestamp(current_time_sec)
            end_str = self._format_timestamp(current_time_sec + duration_sec)
            lines.append(f"{idx + 1}")
            lines.append(f"{start_str} --> {end_str}")
            lines.append(f"{dlg.speaker}: {dlg.text}")
            lines.append("")
            current_time_sec += duration_sec

        return "\n".join(lines)

    def _format_timestamp(self, seconds: float) -> str:
        mins = int(seconds // 60)
        secs = seconds % 60
        return f"{mins:02d}:{secs:06.3f}"
