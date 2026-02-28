import { useState, useEffect } from 'react';
import { UploadScreen } from '@/components/UploadScreen';
import { ResultsDashboard } from '@/components/ResultsDashboard';
import type { AnalysisResult } from '@/types';

interface AppState {
  result: AnalysisResult;
  examTopic: string;
  examDate: string;
}

export default function App() {
  const [state, setState] = useState<AppState | null>(null);

  useEffect(() => {
    const handlePopState = () => {
      setState(null);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleResult = (result: AnalysisResult, examTopic: string, examDate: string) => {
    window.history.pushState({ page: 'results' }, '');
    setState({ result, examTopic, examDate });
  };

  const handleReset = () => {
    window.history.back();
  };

  if (state) {
    return (
      <ResultsDashboard
        result={state.result}
        examTopic={state.examTopic}
        examDate={state.examDate}
        onReset={handleReset}
      />
    );
  }

  return (
    <UploadScreen onResult={handleResult} />
  );
}
