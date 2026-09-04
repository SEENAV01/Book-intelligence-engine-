import React, { useState } from 'react';

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
