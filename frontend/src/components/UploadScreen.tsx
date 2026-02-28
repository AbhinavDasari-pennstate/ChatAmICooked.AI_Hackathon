import React, { useState, useCallback } from 'react';
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
      <header className="pt-12 pb-6 text-center px-4 relative overflow-hidden">
        {/* Heat haze overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(0deg, rgba(249,115,22,0.07) 0%, transparent 60%)',
            animation: 'heat-haze 4s ease-in-out infinite',
            pointerEvents: 'none',
          }}
        />
        {/* Ember particles */}
        {[
          { left: '8%',  delay: '0s',   dur: '2.2s', drift: '12px'  },
          { left: '18%', delay: '0.7s', dur: '1.8s', drift: '-8px'  },
          { left: '30%', delay: '1.4s', dur: '2.5s', drift: '20px'  },
          { left: '50%', delay: '0.3s', dur: '1.6s', drift: '-15px' },
          { left: '65%', delay: '1.1s', dur: '2.0s', drift: '10px'  },
          { left: '80%', delay: '0.5s', dur: '2.3s', drift: '-18px' },
          { left: '90%', delay: '1.8s', dur: '1.9s', drift: '14px'  },
        ].map((e, i) => (
          <div
            key={i}
            className="ember"
            style={{ left: e.left, bottom: 0, '--delay': e.delay, '--dur': e.dur, '--drift': e.drift } as React.CSSProperties}
          />
        ))}
        <h1 className="text-4xl font-black tracking-tight relative">
          <span className="gradient-title">ChatAmICooked.AI</span>
          <span className="flame-flicker ml-2">🔥</span>
        </h1>
        <p className="mt-2 text-zinc-400 text-lg relative">"Find out before your professor does."</p>
      </header>

      {/* Main card */}
      <main className="flex-1 flex items-start justify-center px-4 pb-16">
        <Card className="w-full max-w-xl bg-zinc-900 border-zinc-800 shadow-2xl slide-up">
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
              className={`w-full h-14 text-lg font-bold bg-orange-500 hover:bg-orange-400 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all rounded-xl${canSubmit && !loading ? ' glow-btn' : ''}`}
            >
              {loading ? (
                <span className="flex items-center gap-3">
                  <span className="animate-spin text-xl">🔥</span>
                  Analyzing your situation...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <span className="flame-flicker">🔥</span>
                  Am I Cooked?
                </span>
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
