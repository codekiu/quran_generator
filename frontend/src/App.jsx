import React from 'react';
import { BookOpen } from 'lucide-react';
import VideoGenerator from './components/VideoGenerator';
import AudioEditor from './components/AudioEditor';
import QuranSearchTool from './components/QuranSearchTool';

function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-6 py-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">Studio</p>
            <h1 className="text-xl font-semibold">Quran Production Dashboard</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-8xl px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
          <section className="space-y-6">
            <VideoGenerator showQuranSearchTool={false} />
          </section>
          <aside className="space-y-6">
            <QuranSearchTool />
            <VideoGenerator
              title="Timestamp Helper"
              description=""
              enablePlaybackHelper
              showQuranSearchTool={false}
              showGenerationTools={false}
            />
            <AudioEditor />
          </aside>
        </div>
      </main>
    </div>
  );
}

export default App;
