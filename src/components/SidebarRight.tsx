/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  PhoneCall,
  Activity,
  History,
  Info,
  Clock,
  ChevronRight,
  TrendingUp,
  Cpu,
  CheckCircle2,
  CalendarDays,
  ShieldCheck,
  AlertTriangle,
  Play
} from 'lucide-react';
import { CampaignCall, ReasoningStep, ActivityLog, LatencyMetrics, Appointment } from '../types';

interface SidebarRightProps {
  darkMode: boolean;
  campaigns: CampaignCall[];
  reasoningSteps: ReasoningStep[];
  activityLogs: ActivityLog[];
  latencyMetrics: LatencyMetrics;
  appointment: Appointment | null;
  onCallCampaign: (campId: string) => void;
  onAddLog: (message: string, category: 'system' | 'campaign') => void;
}

export default function SidebarRight({
  darkMode,
  campaigns,
  reasoningSteps,
  activityLogs,
  latencyMetrics,
  appointment,
  onCallCampaign,
  onAddLog
}: SidebarRightProps) {
  const [expandedTrace, setExpandedTrace] = useState<string | null>(null);

  // Total End-To-End Latency
  const totalLatency = latencyMetrics.stt + latencyMetrics.llm + latencyMetrics.tts;

  return (
    <aside className={`flex flex-col gap-4 overflow-y-auto h-full p-4 select-none ${
      darkMode ? 'border-l border-slate-800 bg-slate-900/60' : 'border-l border-slate-100 bg-white/60'
    } backdrop-blur-xl transition-all duration-300`}>

      {/* 1. Appointment Summary Badge */}
      <div id="appointment-summary" className={`rounded-xl p-3 border transition-all duration-300 ${
        appointment && appointment.status !== 'CANCELLED'
          ? (darkMode ? 'bg-teal-500/10 border-teal-500/30 text-white shadow-teal-500/5' : 'bg-teal-50/70 border-teal-200 text-slate-800')
          : (darkMode ? 'bg-slate-800/20 border-slate-700/50 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-400')
      }`}>
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-xs font-bold tracking-wider uppercase text-slate-400 flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5 text-teal-500 font-bold" /> Active Appointment
          </h4>
          {appointment && (
            <span className={`text-[9px] uppercase font-mono px-1.5 py-0.5 rounded font-black ${
              appointment.status === 'CONFIRMED' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
              appointment.status === 'RESCHEDULED' ? 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20' :
              'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
            }`}>
              {appointment.status}
            </span>
          )}
        </div>

        {appointment && appointment.status !== 'CANCELLED' ? (
          <div className="space-y-1 text-xs">
            <div className="font-semibold text-sm leading-tight text-slate-800 dark:text-slate-100">{appointment.doctorName}</div>
            <div className="text-slate-400 font-medium text-[11px]">{appointment.specialty}</div>
            <div className="flex items-center gap-2 mt-2 pt-1.5 border-t border-slate-600/10 text-[11px] font-mono text-slate-500 dark:text-teal-300">
              <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" /> {appointment.time}</span>
              <span>•</span>
              <span>{appointment.date}</span>
            </div>
          </div>
        ) : (
          <div className="text-xs italic text-center py-3 text-slate-500">
            No confirmed appointments booked.
          </div>
        )}
      </div>

      {/* 2. Real-Time Latency Dashboard */}
      <div id="latency-dashboard" className={`rounded-xl p-3 border ${
        darkMode ? 'bg-slate-800/30 border-slate-700/30' : 'bg-slate-50/80 border-slate-200/50'
      }`}>
        <div className="flex justify-between items-center mb-2 pb-1 border-b border-slate-600/10">
          <h3 className="text-xs font-semibold tracking-wider uppercase text-slate-400 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> Latency Diagnostics
          </h3>
          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full font-bold ${
            totalLatency <= 350 ? 'bg-green-500/10 text-green-400' : 'bg-amber-500/10 text-amber-500'
          }`}>
            {totalLatency} ms
          </span>
        </div>

        <div className="space-y-2.5 text-[11px]">
          {/* STT */}
          <div>
            <div className="flex justify-between text-slate-400 font-mono mb-1">
              <span>Speech-to-Text (STT):</span>
              <span className="text-slate-200 font-bold">{latencyMetrics.stt}ms</span>
            </div>
            <div className="h-1.5 w-full bg-slate-700/40 rounded-full overflow-hidden">
              <div 
                className="h-full bg-teal-500 transition-all duration-300"
                style={{ width: `${Math.min(100, (latencyMetrics.stt / 200) * 100)}%` }}
              />
            </div>
          </div>

          {/* LLM */}
          <div>
            <div className="flex justify-between text-slate-400 font-mono mb-1">
              <span>Agentic Reasoning (LLM):</span>
              <span className="text-slate-200 font-bold">{latencyMetrics.llm}ms</span>
            </div>
            <div className="h-1.5 w-full bg-slate-700/40 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-500 transition-all duration-300"
                style={{ width: `${Math.min(100, (latencyMetrics.llm / 300) * 100)}%` }}
              />
            </div>
          </div>

          {/* TTS */}
          <div>
            <div className="flex justify-between text-slate-400 font-mono mb-1">
              <span>Speech Synthesis (TTS):</span>
              <span className="text-slate-200 font-bold">{latencyMetrics.tts}ms</span>
            </div>
            <div className="h-1.5 w-full bg-slate-700/40 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-400 transition-all duration-300"
                style={{ width: `${Math.min(100, (latencyMetrics.tts / 150) * 100)}%` }}
              />
            </div>
          </div>

          <div className="flex gap-2 items-center bg-green-500/10 p-2 rounded-lg border border-green-500/20 text-xs text-green-600 dark:text-green-400 mt-2 font-sans">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span className="leading-snug">Target is under <b>450ms</b>. Fluid duplex audio connection holds a sub-300ms SLA block.</span>
          </div>
        </div>
      </div>

      {/* 3. Campaign Panel */}
      <div id="campaign-panel" className="flex flex-col gap-2">
        <h3 className="text-xs font-semibold tracking-wider uppercase text-slate-400 flex items-center gap-1.5 px-1">
          <PhoneCall className="w-3.5 h-3.5 text-blue-500 animate-pulse" /> Outbound Follow-up Campaigns
        </h3>
        <div className="flex flex-col gap-2">
          {campaigns.map((camp) => (
            <div key={camp.id} className={`rounded-xl p-2.5 border transition-all ${
              camp.status === 'active' 
                ? 'bg-rose-500/10 border-rose-500/40 shadow-rose-500/5 glow shadow-sm hover:scale-[1.01]'
                : camp.status === 'completed'
                  ? 'bg-slate-800/10 dark:bg-slate-900/40 border-slate-700/20 opacity-70'
                  : 'bg-slate-800/20 dark:bg-slate-800/30 border-slate-700/30'
            }`}>
              <div className="flex justify-between items-start mb-1">
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{camp.patientName}</span>
                  <span className="text-[9px] block uppercase font-black text-slate-400">{camp.type} Call</span>
                </div>
                {camp.status === 'pending' && (
                  <button
                    onClick={() => onCallCampaign(camp.id)}
                    className="flex items-center gap-1 text-[10px] font-bold font-mono text-teal-400 hover:text-teal-300 uppercase select-none px-2 py-1 rounded bg-teal-500/10 border border-teal-500/20 cursor-pointer"
                  >
                    <Play className="w-2.5 h-2.5 fill-current" /> Call
                  </button>
                )}
                {camp.status === 'active' && (
                  <span className="flex items-center gap-1 text-[10px] font-bold font-mono text-rose-400 animate-bounce bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                    Live Call
                  </span>
                )}
                {camp.status === 'completed' && (
                  <span className="flex items-center gap-1 text-[10px] font-bold font-mono text-green-400 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/10">
                    Success
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 leading-snug line-clamp-2">
                {camp.details}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Reasoning Trace Panel */}
      <div id="reasoning-traces" className="flex flex-col gap-2">
        <h3 className="text-xs font-semibold tracking-wider uppercase text-slate-400 flex items-center gap-1.5 px-1">
          <Cpu className="w-3.5 h-3.5 text-indigo-500" /> Advanced Reasoning Trace
        </h3>
        <div className={`rounded-xl border ${
          darkMode ? 'bg-slate-950/40 border-slate-850' : 'bg-slate-100/50 border-slate-200'
        } p-2 space-y-1`}>
          {reasoningSteps.map((step) => {
            const isExpanded = expandedTrace === step.id;
            return (
              <div 
                key={step.id} 
                className={`text-xs rounded-lg transition-all overflow-hidden ${
                  isExpanded ? (darkMode ? 'bg-slate-900' : 'bg-white shadow') : 'hover:bg-slate-800/10 dark:hover:bg-slate-900/30'
                }`}
              >
                <button
                  onClick={() => setExpandedTrace(isExpanded ? null : step.id)}
                  className="flex justify-between items-center w-full p-2 text-left cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      step.status === 'running' ? 'bg-amber-500 animate-pulse' : 'bg-teal-500'
                    }`} />
                    <span className="font-mono text-sky-400 tracking-tight font-bold text-[11px]">{step.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] font-mono text-slate-400">{step.duration}ms</span>
                    <ChevronRight className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                  </div>
                </button>
                {isExpanded && (
                  <div className={`px-3 pb-2.5 pt-1 text-[11px] space-y-1.5 border-t ${
                    darkMode ? 'border-slate-800 text-slate-300' : 'border-slate-200 text-slate-700'
                  }`}>
                    <div>
                      <span className="text-slate-400">Activity:</span> {step.details}
                    </div>
                    <div className="font-mono bg-slate-950 text-emerald-400 p-1.5 rounded text-[10px] overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-32">
                      <span className="text-slate-400">{`<- output: `}</span>
                      {step.output}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. AI Activity Feed */}
      <div id="activity-feed" className="flex flex-col gap-2 mb-2">
        <h3 className="text-xs font-semibold tracking-wider uppercase text-slate-400 flex items-center gap-1.5 px-1">
          <History className="w-3.5 h-3.5 text-amber-500" /> Pipeline Operations Log
        </h3>
        <div className={`p-2.5 rounded-xl border flex flex-col gap-2 max-h-48 overflow-y-auto ${
          darkMode ? 'bg-slate-950/40 border-slate-850' : 'bg-slate-100/50 border-slate-200'
        } font-mono text-[10px] text-slate-400 leading-snug`}>
          {activityLogs.map((log) => (
            <div key={log.id} className="flex gap-2 items-start hover:text-slate-200 transition-colors">
              <span className="text-slate-500 shrink-0">{log.timestamp}</span>
              <span className={`uppercase font-black tracking-tight shrink-0 text-[8px] px-1 py-0.5 rounded leading-none ${
                log.category === 'memory' ? 'bg-purple-500/10 text-purple-400' :
                log.category === 'tool' ? 'bg-cyan-500/10 text-cyan-400' :
                log.category === 'language' ? 'bg-blue-500/10 text-blue-400' :
                log.category === 'calendar' ? 'bg-teal-500/10 text-teal-400' :
                log.category === 'campaign' ? 'bg-rose-500/10 text-rose-400' :
                'bg-slate-500/10 text-slate-400'
              }`}>
                {log.category}
              </span>
              <span className={`${
                log.type === 'error' ? 'text-rose-400' :
                log.type === 'warning' ? 'text-amber-400' :
                log.type === 'success' ? 'text-green-400' :
                'text-slate-300'
              }`}>
                {log.message}
              </span>
            </div>
          ))}
        </div>
      </div>

    </aside>
  );
}
