import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import type { AnalysisResult } from '@/types';
import mockData from '@/mock_response.json';

const API_BASE = 'http://localhost:8000';
const USE_MOCK = false; // flip to true to use mock data

interface UploadScreenProps {
  onResult: (result: AnalysisResult, topic: string, examDate: string) => void;
}

export function UploadScreen({ onResult }: UploadScreenProps) {
  const [file, setFile] = useState<File | null>(null);
  const [topic, setTopic] = useState('');
  const [examDate, setExamDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted.length > 0) setFile(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
    },
    multiple: false, // API accepts one file
  });

  const handleSubmit = async () => {
    if (!file || !topic || !examDate) return;
    setLoading(true);
    setError(null);
    try {
      if (USE_MOCK) {
        await new Promise(res => setTimeout(res, 1800));
        onResult(mockData as AnalysisResult, topic, examDate);
        return;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('exam_topic', topic);
      formData.append('exam_date', examDate);

      const { data } = await axios.post<AnalysisResult>(`${API_BASE}/analyze`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onResult(data, topic, examDate);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const detail = err.response?.data?.detail;
        if (detail && typeof detail === 'object' && detail.message) {
          setError(`${detail.message}${detail.reason ? ` ${detail.reason}` : ''}${detail.suggestion ? ` ${detail.suggestion}` : ''}`);
        } else {
          setError(typeof detail === 'string' ? detail : err.message);
        }
      } else {
        setError('Something went wrong.');
      }
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = file !== null && topic.trim() !== '' && examDate !== '';

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      {/* Header */}
      <header className="pt-12 pb-6 text-center px-4">
        <h1 className="text-4xl font-black tracking-tight">
          CHAT<span className="text-orange-400">AmICoOkEd?</span>.AI
        </h1>
        <p className="mt-2 text-zinc-400 text-lg">"Find out before your professor does."</p>
      </header>

      {/* Main card */}
      <main className="flex-1 flex items-start justify-center px-4 pb-16">
        <Card className="w-full max-w-xl bg-zinc-900 border-zinc-800 shadow-2xl">
          <CardContent className="p-8 space-y-6">

            {/* Drop zone */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Upload your notes
              </label>
              <div
                {...getRootProps()}
                className={`
                  border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
                  ${isDragActive
                    ? 'border-orange-400 bg-orange-400/10'
                    : file
                    ? 'border-green-500/50 bg-green-500/5'
                    : 'border-zinc-700 hover:border-zinc-500 bg-zinc-800/50'}
                `}
              >
                <input {...getInputProps()} />
                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-2xl">📄</span>
                    <div className="text-left">
                      <p className="text-zinc-200 font-medium truncate max-w-xs">{file.name}</p>
                      <p className="text-zinc-500 text-xs mt-0.5">{(file.size / 1024).toFixed(0)} KB · click to replace</p>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); setFile(null); }}
                      className="ml-2 text-zinc-500 hover:text-red-400 transition-colors text-lg"
                      aria-label="Remove file"
                    >
                      ✕
                    </button>
                  </div>
                ) : isDragActive ? (
                  <>
                    <div className="text-4xl mb-3">📂</div>
                    <p className="text-orange-400 font-medium">Drop it like it's hot...</p>
                  </>
                ) : (
                  <>
                    <div className="text-4xl mb-3">📂</div>
                    <p className="text-zinc-300 font-medium">Drag & drop your file here</p>
                    <p className="text-zinc-500 text-sm mt-1">or click to browse</p>
                    <p className="text-zinc-600 text-xs mt-3">PDF, DOCX, TXT · one file</p>
                  </>
                )}
              </div>
            </div>

            {/* Exam topic */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Exam topic
              </label>
              <Input
                placeholder='e.g. "Thermodynamics", "Cell Biology", "Macroeconomics"'
                value={topic}
                onChange={e => setTopic(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-orange-400"
              />
            </div>

            {/* Exam date */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Exam date
              </label>
              <Input
                type="date"
                value={examDate}
                onChange={e => setExamDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="bg-zinc-800 border-zinc-700 text-white [color-scheme:dark] focus-visible:ring-orange-400"
              />
            </div>

            {/* Error */}
            {error && (
              <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                ⚠️ {error}
              </p>
            )}

            {/* Submit */}
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit || loading}
              className="w-full h-14 text-lg font-bold bg-orange-500 hover:bg-orange-400 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all rounded-xl"
            >
              {loading ? (
                <span className="flex items-center gap-3">
                  <span className="animate-spin text-xl">🔥</span>
                  Analyzing your situation...
                </span>
              ) : (
                '🔥 Am I Cooked?'
              )}
            </Button>

            {!canSubmit && !loading && (
              <p className="text-center text-zinc-600 text-xs">
                Upload a file, enter a topic, and pick your exam date to proceed
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
