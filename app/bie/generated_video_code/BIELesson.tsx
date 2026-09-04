import React from 'react';
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
