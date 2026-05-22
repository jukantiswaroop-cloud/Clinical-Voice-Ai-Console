/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState } from 'react';
import {
  Mic,
  MicOff,
  Send,
  Sparkles,
  Bot,
  Activity,
  AlertCircle,
  HelpCircle,
  Grid,
  TrendingUp,
  Cpu,
  BookmarkCheck,
  CheckCircle,
  Clock,
  MessageSquare
} from 'lucide-react';
import { Message, Doctor, OrchestrationState } from '../types';

interface CenterChatProps {
  darkMode: boolean;
  messages: Message[];
  orchestrationState: OrchestrationState;
  doctors: Doctor[];
  suggestedPrompts: { label: string; text: string; lang: string }[];
  isListening: boolean;
  onSendMessage: (text: string) => void;
  onToggleMic: () => void;
  onSelectSlot: (doctorName: string, time: string) => void;
  onSelectAlternative: (doctorName: string, alternativeTime: string) => void;
}

export default function CenterChat({
  darkMode,
  messages,
  orchestrationState,
  doctors,
  suggestedPrompts,
  isListening,
  onSendMessage,
  onToggleMic,
  onSelectSlot,
  onSelectAlternative
}: CenterChatProps) {
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, orchestrationState]);

  // Audio wave visualizer animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let phase = 0;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const isSpeaking = orchestrationState === 'SPEAKING';
      const isListeningState = orchestrationState === 'LISTENING';
      const isProcessing = ['TRANSCRIBING', 'DETECTING_LANGUAGE', 'QUERYING_CALENDAR', 'RESOLVING_CONFLICTS', 'GENERATING_RESPONSE'].includes(orchestrationState);

      const numWaves = 4;
      const width = canvas.width;
      const height = canvas.height;
      phase += 0.08;

      for (let i = 0; i < numWaves; i++) {
        ctx.beginPath();
        ctx.lineWidth = i === 0 ? 3 : 1.5;
        
        // Colors base on active stage: Listening = Teal/Cyan, Speaking = Violet/Blue, Processing = Indigo, Idle = Neutral
        let color = 'rgba(20, 184, 166, '; // default teal
        let amplitude = 8;
        let frequency = 0.02;

        if (isListeningState) {
          color = 'rgba(20, 184, 166, '; // teal
          amplitude = 25 - i * 5;
          frequency = 0.035 + i * 0.005;
        } else if (isSpeaking) {
          color = 'rgba(99, 102, 241, '; // indigo/indigo
          amplitude = 30 - i * 6;
          frequency = 0.045 - i * 0.005;
        } else if (isProcessing) {
          color = 'rgba(168, 85, 247, '; // purple thinking state
          amplitude = 12 + Math.sin(phase * 2) * 4;
          frequency = 0.06;
        } else {
          amplitude = 4 - i * 0.8;
          frequency = 0.015;
          color = 'rgba(148, 163, 184, '; // slate idle
        }

        ctx.strokeStyle = color + (1 - i / numWaves).toFixed(2) + ')';

        for (let x = 0; x < width; x++) {
          const y = height / 2 + Math.sin(x * frequency + phase + i * 1.5) * amplitude;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animationId);
  }, [orchestrationState]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText('');
  };

  const getStatusMessageColors = () => {
    switch (orchestrationState) {
      case 'LISTENING':
        return 'text-teal-400 bg-teal-500/10 border-teal-500/20';
      case 'TRANSCRIBING':
        return 'text-sky-400 bg-sky-500/10 border-sky-500/20';
      case 'DETECTING_LANGUAGE':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'QUERYING_CALENDAR':
        return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
      case 'RESOLVING_CONFLICTS':
        return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      case 'GENERATING_RESPONSE':
        return 'text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20';
      case 'SPEAKING':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 border-emerald-400/35 shadow-emerald-500/10 shadow-lg';
      default:
        return 'text-slate-400 bg-slate-500/5 border-slate-700/20';
    }
  };

  return (
    <section className="flex flex-col h-full bg-slate-950 text-white rounded-none relative">
      
      {/* 1. Header with Floating Avatar & Core State Visualizer */}
      <div className={`p-4 border-b flex items-center justify-between transition-colors ${
        darkMode ? 'border-slate-800 bg-slate-900/40' : 'border-slate-200 bg-white/60 text-slate-800'
      } backdrop-blur-xl`}>
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-teal-400 via-indigo-500 to-emerald-500 p-[2.5px] shadow-lg animate-spin-slow">
              <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center">
                <Bot className="w-5 h-5 text-teal-400" />
              </div>
            </div>
            <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-950 ${
              orchestrationState !== 'IDLE' ? 'bg-green-500' : 'bg-slate-400'
            }`} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-black tracking-tight dark:text-white text-slate-900">Dr. Aura Clinical Agent</h2>
              <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-400 font-bold border border-teal-500/20 flex items-center gap-0.5">
                <Sparkles className="w-2.5 h-2.5" /> Core v4.1
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
              Status: <span className="text-teal-400 uppercase font-black">{orchestrationState}</span>
            </p>
          </div>
        </div>

        {/* Live status badge */}
        <div className={`text-xs font-mono px-3 py-1 rounded-full border transition-all duration-300 flex items-center gap-1.5 ${getStatusMessageColors()}`}>
          <div className={`w-2 h-2 rounded-full ${orchestrationState !== 'IDLE' ? 'bg-current animate-ping' : 'bg-slate-400'}`} />
          <span className="capitalize font-bold">{orchestrationState.replace('_', ' ').toLowerCase()}</span>
        </div>
      </div>

      {/* 2. Doctor Availability Panel (Inline helper so user can book quickly) */}
      <div id="doctor-availability" className={`px-4 py-3 border-b flex flex-col gap-2 ${
        darkMode ? 'bg-slate-900/20 border-slate-800' : 'bg-slate-50 border-slate-200'
      }`}>
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold tracking-tight text-slate-400 dark:text-slate-300 flex items-center gap-1">
            <Grid className="w-3.5 h-3.5 text-teal-500" /> Clinical Calendars & Slots
          </span>
          <span className="text-[10px] font-mono text-slate-500">Click time slots below to query/book</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {doctors.map((doc) => (
            <div key={doc.id} className="rounded-xl p-2 bg-slate-900/60 border border-slate-800 flex flex-col justify-between hover:border-slate-700/50 transition-all">
              <div className="flex items-center gap-1.5 mb-2">
                <img src={doc.avatar} alt={doc.name} className="w-6 h-6 rounded-full object-cover shrink-0" referrerPolicy="no-referrer" />
                <div className="overflow-hidden">
                  <div className="text-[10px] font-black truncate text-slate-200">{doc.name}</div>
                  <div className="text-[8px] text-slate-400 truncate">{doc.specialty}</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {doc.slots.map((slot, sIdx) => {
                  let badgeColor = 'bg-teal-500/10 text-teal-400 border-teal-500/20 cursor-pointer';
                  if (slot.availability === 'booked') {
                    badgeColor = 'bg-slate-800 text-slate-500 border-transparent cursor-not-allowed';
                  } else if (slot.availability === 'conflicted') {
                    badgeColor = 'bg-red-500/10 text-red-400 border-red-500/20 cursor-crosshair';
                  }
                  return (
                    <button
                      key={sIdx}
                      disabled={slot.availability === 'booked'}
                      onClick={() => onSelectSlot(doc.name, slot.time)}
                      className={`text-[9px] font-mono px-1 py-0.5 rounded border font-semibold ${badgeColor}`}
                      title={slot.availability === 'conflicted' ? 'Conflict Trigger slot' : 'Query Slot booking'}
                    >
                      {slot.time.split(' ')[0]}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Conversations Feed (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500 gap-3 max-w-md mx-auto">
            <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center text-slate-400 border border-slate-800">
              <HelpCircle className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <p className="text-sm font-bold dark:text-slate-300 text-slate-700">Initiate Voice Telephony Or Text Demo</p>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Click one of the suggested prompts below, type a request, or click the <b>Mic button</b> to speak clinical instructions naturally.
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isAI = msg.sender === 'assistant';
            const isSystem = msg.sender === 'system';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[85%] ${
                  isSystem 
                    ? 'mx-auto w-full max-w-[90%] justify-center' 
                    : isAI ? 'mr-auto items-start' : 'ml-auto flex-row-reverse items-start'
                }`}
              >
                {!isSystem && (
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border select-none ${
                    isAI 
                      ? 'bg-slate-900 border-teal-500/30 text-teal-400' 
                      : 'bg-teal-600 border-transparent text-white'
                  }`}>
                    {isAI ? <Bot className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </div>
                )}

                {isSystem ? (
                  <div className="w-full text-center bg-slate-900/50 border border-slate-900/70 p-2.5 rounded-xl text-xs text-slate-400 flex items-center gap-2 justify-center leading-normal">
                    <Activity className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                    <span>{msg.text}</span>
                  </div>
                ) : (
                  <div className="space-y-1.5 flex-1">
                    {/* Header line for confidence & languages */}
                    <div className={`flex items-center gap-2 text-[10px] ${isAI ? 'justify-start' : 'justify-end'}`}>
                      <span className="font-bold text-slate-400">
                        {isAI ? 'Aura Clinical AI' : 'Patient (Swaroop Jukanti)'}
                      </span>
                      <span>•</span>
                      <span className="text-slate-500 font-mono">{msg.timestamp}</span>

                      {/* Multilingual detection state */}
                      {msg.languageDetected && (
                        <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-bold font-mono">
                          {msg.languageDetected}
                        </span>
                      )}

                      {/* AI Confidences */}
                      {isAI && msg.intentConfidence && (
                        <span className="px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-400 font-bold font-mono">
                          Intent: {msg.intentConfidence}%
                        </span>
                      )}
                      {isAI && msg.toolConfidence && (
                        <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-bold font-mono-sub bg-opacity-40">
                          Tool: {msg.toolConfidence}%
                        </span>
                      )}
                    </div>

                    {/* Chat Bubble container */}
                    <div className={`p-3.5 rounded-2xl relative border shadow-sm leading-relaxed ${
                      isAI 
                        ? 'bg-slate-900/80 border-slate-800 text-slate-100' 
                        : 'bg-teal-950/40 border-teal-500/30 text-slate-200'
                    }`}>
                      <p className="text-sm">{msg.text}</p>
                      
                      {/* Translation display under multilingual inputs */}
                      {msg.translation && (
                        <div className="mt-2 pt-2 border-t border-slate-800/60 text-xs italic text-slate-400 flex items-center gap-1.5">
                          <HelpCircle className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          <span>Translation: "{msg.translation}"</span>
                        </div>
                      )}

                      {/* STREAMING SIMULATOR PULSER dots */}
                      {msg.isStreaming && (
                        <div className="flex gap-1.5 items-center mt-2.5">
                          <span className="w-2 h-2 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-2 h-2 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-2 h-2 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                          <span className="text-[10px] text-slate-400 font-mono italic select-none">Synthesizing audio duplex...</span>
                        </div>
                      )}

                      {/* CONFLICT RESOLUTION CARD embedded directly if conflict detected */}
                      {msg.conflictData && (
                        <div className="mt-3.5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs">
                          <div className="flex items-center gap-1.5 text-red-400 font-black mb-1.5 font-bold uppercase tracking-wider text-[10px]">
                            <AlertCircle className="w-3.5 h-3.5" /> Conflict Detected: Slot is Booked/Unavailable
                          </div>
                          <p className="text-slate-400 mb-2">
                            Slot <b>{msg.conflictData.originalSlot}</b> is currently locked by another clinical provider. suggested alternative schedules:
                          </p>
                          <div className="flex flex-col gap-1.5">
                            {msg.conflictData.alternatives.map((alt, aIdx) => (
                              <button
                                key={aIdx}
                                onClick={() => onSelectAlternative(msg.text, alt)}
                                className="flex items-center justify-between p-2 rounded bg-slate-950 border border-red-500/20 text-slate-200 hover:border-red-500/50 hover:bg-red-500/5 text-left text-[11px] font-mono tracking-tight font-bold group cursor-pointer"
                              >
                                <span>{alt}</span>
                                <span className="text-[9px] uppercase font-bold text-teal-400 group-hover:underline">Auto-Resolve Book &rarr;</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>

      {/* 4. Suggested Prompts (Scrollable grid/badges) */}
      <div id="suggested-prompts" className={`p-3 border-t flex flex-col gap-1.5 ${
        darkMode ? 'bg-slate-900/30 border-slate-800' : 'bg-slate-100 border-slate-200'
      }`}>
        <span className="text-[10px] uppercase font-black font-mono tracking-wider text-slate-500">Suggested Interactive Prompts</span>
        <div className="flex gap-2 overflow-x-auto pb-1 max-w-full select-none" style={{ scrollbarWidth: 'thin' }}>
          {suggestedPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => onSendMessage(p.text)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-850 hover:border-slate-700 hover:bg-slate-850 text-[10px] font-medium tracking-tight text-slate-300 flex items-center gap-1 shrink-0 transition-all shadow-sm cursor-pointer"
            >
              <span className={`uppercase font-black text-[8px] px-1 py-0.2 rounded font-mono ${
                p.lang === 'hi' ? 'bg-blue-500/20 text-blue-400' :
                p.lang === 'ta' ? 'bg-indigo-500/20 text-indigo-400' :
                p.lang === 'te' ? 'bg-purple-500/20 text-purple-400' :
                p.lang === 'kn' ? 'bg-pink-500/20 text-pink-400' :
                'bg-teal-500/10 text-teal-400'
              }`}>
                {p.lang}
              </span>
              <span>{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 5. Fluid Audio visualizer & Glow Panel (Drives visual excitement) */}
      <div className="p-3 bg-slate-950/80 border-t border-slate-900/80 flex flex-col items-center justify-center gap-2">
        <div className="w-full h-12 flex items-center justify-center relative">
          <canvas 
            ref={canvasRef} 
            width={450} 
            height={48} 
            className="w-full max-w-lg rounded h-12 opacity-80" 
          />
          {orchestrationState !== 'IDLE' && (
            <span className="absolute bottom-1 right-2 text-[8px] font-mono tracking-tight text-slate-500">
              Wave Rate: 60fps • Amplified Realtime
            </span>
          )}
        </div>
      </div>

      {/* 6. Sticky Floating Audio/Text input bar */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-slate-900 bg-slate-950 flex gap-2.5 items-center justify-between sticky bottom-0 z-10">
        
        {/* Toggle Real Microphone or simulated speech synthesis */}
        <button
          type="button"
          onClick={onToggleMic}
          className={`p-3 h-11 w-11 rounded-full flex items-center justify-center border transition-all duration-300 shrink-0 relative ${
            isListening 
              ? 'bg-rose-500/20 text-rose-500 border-rose-500 shadow-lg shadow-rose-500/20 scale-105' 
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
          }`}
          title={isListening ? "Stop listening (mute mic)" : "Trigger interactive voice speech recognition"}
        >
          {isListening ? (
            <>
              <MicOff className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full animate-ping" />
            </>
          ) : (
            <Mic className="w-5 h-5" />
          )}
        </button>

        <div className="relative flex-1">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={isListening ? "Listening Swaroop... Speak naturally now." : "Type custom patient queries... (e.g. 'Can I book tomorrow with Dr. Patel?')"}
            disabled={isListening}
            className={`w-full h-11 px-4 rounded-full border bg-slate-900 text-slate-100 text-xs focus:outline-none focus:border-teal-500 transition-all font-sans leading-none pb-0.5 ${
              isListening ? 'opacity-40 italic cursor-not-allowed' : ''
            }`}
          />
        </div>

        <button
          type="submit"
          disabled={!inputText.trim() || isListening}
          className="p-3 h-11 w-11 rounded-full bg-teal-500 hover:bg-teal-600 disabled:opacity-40 disabled:hover:bg-teal-500 text-white flex items-center justify-center shrink-0 transition-all cursor-pointer shadow shadow-teal-500/10"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

    </section>
  );
}
