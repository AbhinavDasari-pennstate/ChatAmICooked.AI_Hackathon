import { useState } from 'react';
import axios from 'axios';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { AnalysisResult, ChatMessage } from '@/types';

const API_BASE = 'http://localhost:8000';

interface ResultsDashboardProps {
  result: AnalysisResult;
  examTopic: string;
  examDate: string;
  onReset: () => void;
}

function getVerdict(score: number) {
  if (score <= 25) return { label: '🔴 Fully Cooked',        color: '#ef4444', bg: 'bg-red-500/10',    border: 'border-red-500/30'    };
  if (score <= 50) return { label: '🟠 Getting Cooked',       color: '#f97316', bg: 'bg-orange-500/10', border: 'border-orange-500/30' };
  if (score <= 75) return { label: '🟡 Medium Rare',          color: '#eab308', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' };
  return            { label: '🟢 Cooked to Perfection', color: '#22c55e', bg: 'bg-green-500/10',  border: 'border-green-500/30'  };
}

const PRIORITY_CONFIG = {
  urgent: { label: 'Urgent', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
  soon:   { label: 'Soon',   className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  ok:     { label: 'OK',     className: 'bg-green-500/20 text-green-400 border-green-500/30' },
};

const DIFFICULTY_CONFIG = {
  easy:   { label: 'Easy',   className: 'bg-green-500/20 text-green-400 border-green-500/30' },
  medium: { label: 'Medium', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  hard:   { label: 'Hard',   className: 'bg-red-500/20 text-red-400 border-red-500/30' },
};

export function ResultsDashboard({ result, examTopic, examDate, onReset }: ResultsDashboardProps) {
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      message: `Based on your notes, you're covering about ${result.overall_score}% of the expected material. Your weakest areas are: ${
        result.topics
          .filter(t => t.priority === 'urgent')
          .map(t => t.name)
          .join(', ') || 'none flagged'
      }. Ask me anything!`,
    },
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);

  const verdict = getVerdict(result.overall_score);

  // Build a short context string for the /chat endpoint
  const chatContext = `Exam topic: ${examTopic}. Score: ${result.overall_score}%. Topics: ${result.topics
    .map(t => `${t.name} (${t.score}% - ${t.gap})`)
    .join('; ')}`;

  const handleChatSend = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg: ChatMessage = { role: 'user', message: chatInput };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);
    try {
      const { data } = await axios.post<{ reply: string }>(`${API_BASE}/chat`, {
        message: chatInput,
        context: chatContext,
      });
      setChatMessages(prev => [...prev, { role: 'assistant', message: data.reply }]);
    } catch {
      setChatMessages(prev => [
        ...prev,
        { role: 'assistant', message: "Sorry, I couldn't reach the server right now." },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const daysUntilExam = examDate
    ? Math.max(Math.ceil((new Date(examDate).getTime() - Date.now()) / 86_400_000), 0)
    : null;

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-zinc-800">
        <div>
          <h1 className="text-2xl font-black">
            Chat<span className="text-orange-400">AmICooked</span>.AI
          </h1>
          <p className="text-zinc-500 text-sm">
            {examTopic}
            {daysUntilExam !== null && ` · Exam in ${daysUntilExam} day${daysUntilExam !== 1 ? 's' : ''}`}
            {examDate && ` (${examDate})`}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={onReset}
          className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
        >
          ← New Analysis
        </Button>
      </header>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Left / Main panel */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Mismatch warning */}
          {result.mismatch_warning && (
            <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-300">
              <span className="font-semibold">⚠ Heads up: </span>
              {result.mismatch_warning.message}
              {result.mismatch_warning.reason && (
                <span className="text-yellow-400/70"> — {result.mismatch_warning.reason}</span>
              )}
            </div>
          )}

          {/* Score + verdict */}
          <div className={`rounded-2xl border p-6 flex flex-col sm:flex-row items-center gap-6 ${verdict.bg} ${verdict.border}`}>
            <div className="w-36 h-36 shrink-0">
              <CircularProgressbar
                value={result.overall_score}
                text={`${result.overall_score}%`}
                styles={buildStyles({
                  textSize: '22px',
                  pathColor: verdict.color,
                  textColor: '#ffffff',
                  trailColor: 'rgba(255,255,255,0.1)',
                })}
              />
            </div>
            <div>
              <div className="text-3xl font-black">{verdict.label}</div>
              <p className="text-zinc-400 mt-1 text-sm max-w-sm">
                You've covered <strong className="text-white">{result.overall_score}%</strong> of the
                expected material for your <strong className="text-white">{examTopic}</strong> exam.{' '}
                {result.overall_score <= 25
                  ? 'Time to hit the books — hard.'
                  : result.overall_score <= 50
                  ? "You're getting there, but don't slow down."
                  : result.overall_score <= 75
                  ? "Not bad — focus on the urgent topics."
                  : "Looking solid! Keep it up."}
              </p>
            </div>
          </div>

          {/* Topic breakdown */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg">Topic Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {result.topics.map((t) => {
                const p = PRIORITY_CONFIG[t.priority];
                return (
                  <div key={t.name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-zinc-300 font-medium">{t.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-500">{t.score}%</span>
                        <Badge variant="outline" className={`text-xs ${p.className}`}>
                          {p.label}
                        </Badge>
                      </div>
                    </div>
                    <Progress value={t.score} className="h-2 bg-zinc-800" />
                    {t.gap && (
                      <p className="text-xs text-zinc-500 mt-1">⚠ {t.gap}</p>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Study plan timeline */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg">📅 Day-by-Day Study Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative pl-6 space-y-0">
                {result.plan.map((day, i) => (
                  <div key={i} className="relative pb-5 last:pb-0">
                    {i < result.plan.length - 1 && (
                      <div className="absolute left-[-13px] top-5 w-0.5 h-full bg-zinc-700" />
                    )}
                    <div className="absolute left-[-17px] top-1.5 w-3 h-3 rounded-full bg-orange-400 border-2 border-zinc-900" />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-orange-400">Day {day.day} — {day.date}</p>
                        <span className="text-xs text-zinc-600">{day.hours}h · {day.focus}</span>
                      </div>
                      <ul className="mt-1 space-y-0.5">
                        {day.tasks.map((task, j) => (
                          <li key={j} className="text-sm text-zinc-400 flex items-start gap-1.5">
                            <span className="text-zinc-600 mt-0.5">·</span>
                            {task}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Sample exam questions */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg">🎯 Likely Exam Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {result.questions.map((q, i) => {
                const d = DIFFICULTY_CONFIG[q.difficulty];
                return (
                  <div
                    key={i}
                    className="rounded-xl border border-zinc-700 bg-zinc-800/50 overflow-hidden"
                  >
                    <button
                      className="w-full text-left p-4 flex items-start justify-between gap-3"
                      onClick={() => setExpandedQuestion(expandedQuestion === i ? null : i)}
                    >
                      <div>
                        <div className="flex gap-2 mb-2">
                          <Badge variant="outline" className="text-xs text-orange-400 border-orange-400/30 bg-orange-400/10">
                            {q.topic}
                          </Badge>
                          <Badge variant="outline" className={`text-xs ${d.className}`}>
                            {d.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-zinc-200">{q.question}</p>
                      </div>
                      <span className="text-zinc-500 shrink-0 mt-1">
                        {expandedQuestion === i ? '▲' : '▼'}
                      </span>
                    </button>
                    {expandedQuestion === i && (
                      <div className="px-4 pb-4 pt-0 border-t border-zinc-700">
                        <p className="text-sm text-zinc-400">
                          <span className="text-yellow-400 font-medium">💡 Tip: </span>
                          Ask the AI assistant on the right for help with this question.
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Right / Chat panel */}
        <div className="w-80 shrink-0 border-l border-zinc-800 flex flex-col bg-zinc-900">
          <div className="px-4 py-3 border-b border-zinc-800">
            <h2 className="font-semibold text-sm text-white">💬 Ask the AI</h2>
            <p className="text-xs text-zinc-500 mt-0.5">e.g. "Why am I weak on thermodynamics?"</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[90%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-orange-500 text-white rounded-br-sm'
                      : 'bg-zinc-800 text-zinc-200 rounded-bl-sm'
                  }`}
                >
                  {msg.message}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-zinc-800 rounded-2xl rounded-bl-sm px-4 py-2 text-zinc-400 text-sm">
                  <span className="animate-pulse">Thinking...</span>
                </div>
              </div>
            )}
          </div>

          <div className="p-3 border-t border-zinc-800 flex gap-2">
            <Input
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleChatSend()}
              placeholder="Ask anything..."
              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 text-sm focus-visible:ring-orange-400"
            />
            <Button
              onClick={handleChatSend}
              disabled={!chatInput.trim() || chatLoading}
              className="bg-orange-500 hover:bg-orange-400 text-white px-3 shrink-0"
            >
              →
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
