import React, { useState, useMemo } from 'react';
import { BookOpen, FileText, Video, Check } from 'lucide-react';
import VideoGenerator from './components/VideoGenerator';
import TimestampHelper from './components/TimestampHelper';
import AudioEditor from './components/AudioEditor';
import QuranSearchTool from './components/QuranSearchTool';
import SubtitleEditor from './components/SubtitleEditor';
import usePersistentState from '@/hooks/usePersistentState';

const STEPS = [
  { label: 'Verses', icon: BookOpen },
  { label: 'Subtitles', icon: FileText },
  { label: 'Generate', icon: Video },
];

function StepIndicator({ steps, activeStep, onStepClick, completedSteps }) {
  return (
    <div className="flex items-center justify-center gap-0">
      {steps.map((step, idx) => {
        const isActive = idx === activeStep;
        const isCompleted = completedSteps[idx];
        const Icon = step.icon;

        return (
          <React.Fragment key={step.label}>
            {idx > 0 && (
              <div
                className={`h-px w-8 sm:w-16 transition-colors ${
                  isCompleted || idx <= activeStep ? 'bg-amber-500/50' : 'bg-border'
                }`}
              />
            )}
            <button
              type="button"
              onClick={() => onStepClick(idx)}
              className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
                isActive
                  ? 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/40'
                  : isCompleted
                  ? 'text-amber-400/70 hover:text-amber-300'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  isActive
                    ? 'bg-amber-500 text-black'
                    : isCompleted
                    ? 'bg-amber-500/30 text-amber-300'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {isCompleted && !isActive ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  idx + 1
                )}
              </div>
              <span className={`hidden sm:inline ${isActive ? '' : 'hidden md:inline'}`}>
                {step.label}
              </span>
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
}

function App() {
  const [audioFile, setAudioFile] = useState(null);
  const [activeStep, setActiveStep] = usePersistentState('app:activeStep', 0);
  const [subtitlesData, setSubtitlesData] = usePersistentState(
    'video-generator:subtitlesData',
    '',
  );

  const completedSteps = useMemo(() => {
    const step0 = Boolean(subtitlesData && subtitlesData.trim());
    let step1 = false;
    if (step0) {
      try {
        const data = JSON.parse(subtitlesData);
        step1 =
          data &&
          Array.isArray(data.subtitles) &&
          data.subtitles.length > 0 &&
          data.subtitles.some((s) => s.start_time > 0);
      } catch {}
    }
    return [step0, step1, false];
  }, [subtitlesData]);

  const handleSendToSubtitles = (jsonString) => {
    setSubtitlesData(jsonString);
    setActiveStep(1);
  };

  return (
    <div className="min-h-screen bg-background text-foreground dark">
      <header className="border-b border-border bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 py-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15">
            <BookOpen className="h-5 w-5 text-amber-500" />
          </div>
          <div className="flex-1">
            <h1 className="font-arabic text-lg font-semibold text-foreground">Sacred Studio</h1>
            <p className="text-xs text-muted-foreground">Quran Video Production</p>
          </div>
        </div>
      </header>

      {/* Step Indicator */}
      <div className="border-b border-border bg-card/50 backdrop-blur">
        <div className="mx-auto max-w-5xl px-6 py-3">
          <StepIndicator
            steps={STEPS}
            activeStep={activeStep}
            onStepClick={setActiveStep}
            completedSteps={completedSteps}
          />
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-6 py-8 pb-24">
        {activeStep === 0 && (
          <QuranSearchTool onSendToSubtitles={handleSendToSubtitles} />
        )}

        {activeStep === 1 && (
          <section className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-500" />
                Edit Subtitles
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Review and edit verse text, translations, and timings for each subtitle entry.
              </p>
            </div>
            <SubtitleEditor value={subtitlesData} onChange={setSubtitlesData} />
          </section>
        )}

        {activeStep === 2 && (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
            <VideoGenerator
              audioFile={audioFile}
              onAudioFileChange={setAudioFile}
              subtitlesData={subtitlesData}
              onSubtitlesChange={setSubtitlesData}
              onNavigateToStep={setActiveStep}
            />
            <aside>
              <AudioEditor />
            </aside>
          </div>
        )}
      </main>

      <TimestampHelper audioFile={audioFile} onAudioFileChange={setAudioFile} />
    </div>
  );
}

export default App;
