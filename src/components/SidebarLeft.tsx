/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  User,
  Activity,
  Phone,
  Globe,
  Settings,
  Brain,
  Calendar,
  Clock,
  CheckCircle2,
  Bookmark
} from 'lucide-react';
import { Patient } from '../types';

interface SidebarLeftProps {
  darkMode: boolean;
  patient: Patient;
  currentLanguage: string;
  onLanguageChange: (lang: string) => void;
  sessionMemory: {
    intent: string;
    doctor: string;
    time: string;
    stage: string;
  };
  onTriggerAction: (actionType: 'book' | 'reschedule' | 'cancel') => void;
}

export default function SidebarLeft({
  darkMode,
  patient,
  currentLanguage,
  onLanguageChange,
  sessionMemory,
  onTriggerAction
}: SidebarLeftProps) {
  const languages = ['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada'];

  const getLanguageLabel = (lang: string) => {
    switch (lang) {
      case 'Hindi': return 'हिन्दी (Hindi)';
      case 'Tamil': return 'தமிழ் (Tamil)';
      case 'Telugu': return 'తెలుగు (Telugu)';
      case 'Kannada': return 'ಕನ್ನಡ (Kannada)';
      default: return 'English (US)';
    }
  };

  return (
    <aside className={`flex flex-col gap-4 overflow-y-auto h-full p-4 select-none ${
      darkMode ? 'border-r border-slate-800 bg-slate-900/60' : 'border-r border-slate-100 bg-white/60'
    } backdrop-blur-xl transition-all duration-300`}>
      
      {/* Platform Title Pin */}
      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-dashed border-sky-500/20">
        <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-500">
          <Activity className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <h1 className="text-sm font-semibold tracking-wider uppercase bg-gradient-to-r from-teal-400 to-emerald-500 bg-clip-text text-transparent">
            Clinical Voice AI
          </h1>
          <p className="text-[10px] font-mono text-slate-400">Orchestration Platform</p>
        </div>
      </div>

      {/* 1. Patient Card */}
      <div id="patient-card" className={`rounded-xl p-4 border transition-all duration-300 hover:shadow-lg ${
        darkMode ? 'bg-slate-800/40 border-slate-700/50 text-white' : 'bg-slate-50/70 border-slate-200/50 text-slate-800'
      }`}>
        <div className="flex items-center gap-3 mb-3">
          <div className="relative">
            <img 
              src={patient.avatar} 
              alt={patient.name} 
              className="w-12 h-12 rounded-full object-cover border-2 border-teal-500/30 shadow-inner"
              referrerPolicy="no-referrer"
            />
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-slate-900 rounded-full flex items-center justify-center">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
            </span>
          </div>
          <div>
            <div className="flex items-center gap-1">
              <h2 className="text-base font-bold tracking-tight">{patient.name}</h2>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 font-bold">VIP</span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
              <Phone className="w-3 h-3" /> {patient.phone}
            </p>
          </div>
        </div>

        <div className="space-y-1.5 pt-2 border-t border-slate-700/20 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-400 flex items-center gap-1"><Globe className="w-3 h-3" /> Lang Pref:</span>
            <span className="font-semibold text-teal-400">{currentLanguage}</span>
          </div>
          <div className="mt-2">
            <span className="text-slate-400 block mb-0.5">Last Appointment:</span>
            <span className="text-xs font-medium block leading-snug px-2 py-1 rounded bg-teal-500/5 text-teal-600 dark:text-teal-300 border border-teal-500/10">
              {patient.lastAppointment}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Quick Actions */}
      <div id="quick-actions" className="flex flex-col gap-2">
        <h3 className="text-xs font-semibold tracking-wider uppercase text-slate-400 flex items-center gap-1.5 px-1">
          <Calendar className="w-3.5 h-3.5 text-teal-500" /> Actions Prompt Shortcuts
        </h3>
        <div className="grid grid-cols-3 gap-1">
          <button
            onClick={() => onTriggerAction('book')}
            className="flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-all bg-teal-500/5 hover:bg-teal-500/15 border-teal-500/20 text-teal-400 group"
          >
            <Clock className="w-4 h-4 mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-medium font-mono text-slate-300">Book</span>
          </button>
          
          <button
            onClick={() => onTriggerAction('reschedule')}
            className="flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-all bg-indigo-500/5 hover:bg-indigo-500/15 border-indigo-500/20 text-indigo-400 group"
          >
            <Settings className="w-4 h-4 mb-1 group-hover:rotate-45 transition-transform" />
            <span className="text-[10px] font-medium font-mono text-slate-300">Resched</span>
          </button>

          <button
            onClick={() => onTriggerAction('cancel')}
            className="flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-all bg-rose-500/5 hover:bg-rose-500/15 border-rose-500/20 text-rose-400 group"
          >
            <User className="w-4 h-4 mb-1 group-hover:scale-90 transition-transform" />
            <span className="text-[10px] font-medium font-mono text-slate-300">Cancel</span>
          </button>
        </div>
      </div>

      {/* 3. Language Switcher */}
      <div id="language-switcher" className="flex flex-col gap-2">
        <h3 className="text-xs font-semibold tracking-wider uppercase text-slate-400 flex items-center gap-1.5 px-1">
          <Globe className="w-3.5 h-3.5 text-blue-500" /> Language Switcher
        </h3>
        <div className={`p-1.5 rounded-xl border flex flex-col gap-1 ${
          darkMode ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-100/50 border-slate-200'
        }`}>
          {languages.map((lang) => {
            const isSelected = currentLanguage === lang;
            return (
              <button
                key={lang}
                onClick={() => onLanguageChange(lang)}
                className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isSelected 
                    ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-md shadow-teal-500/25 scale-[1.01]' 
                    : `${darkMode ? 'text-slate-300 hover:bg-slate-800/60' : 'text-slate-700 hover:bg-white'}`
                }`}
              >
                <span>{lang}</span>
                <span className={`text-[10px] font-mono opacity-80 ${isSelected ? 'text-teal-100' : 'text-slate-400'}`}>
                  {getLanguageLabel(lang)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Session Memory */}
      <div id="session-memory" className={`rounded-xl p-3 border ${
        darkMode ? 'bg-slate-800/20 border-slate-700/30' : 'bg-slate-100/30 border-slate-200/30'
      }`}>
        <div className="flex items-center gap-2 mb-2 pb-1 border-b border-slate-600/10">
          <Brain className="w-4 h-4 text-emerald-400" />
          <h4 className="text-xs font-bold tracking-tight text-teal-400">Session Memory Active</h4>
        </div>
        <div className="space-y-2 text-[11px] font-mono">
          <div className="flex justify-between items-center bg-slate-950/20 px-2 py-1 rounded">
            <span className="text-slate-400">Intent:</span>
            <span className={`font-semibold ${sessionMemory.intent !== 'None' ? 'text-teal-400 font-bold' : 'text-slate-500'}`}>
              {sessionMemory.intent}
            </span>
          </div>
          <div className="flex justify-between items-center bg-slate-950/20 px-2 py-1 rounded">
            <span className="text-slate-400">Doctor:</span>
            <span className={`font-semibold ${sessionMemory.doctor !== 'None' ? 'text-teal-400' : 'text-slate-500'}`}>
              {sessionMemory.doctor}
            </span>
          </div>
          <div className="flex justify-between items-center bg-slate-950/20 px-2 py-1 rounded">
            <span className="text-slate-400">Time:</span>
            <span className={`font-semibold ${sessionMemory.time !== 'None' ? 'text-teal-400' : 'text-slate-500'}`}>
              {sessionMemory.time}
            </span>
          </div>
          <div className="flex justify-between items-center bg-slate-950/20 px-2 py-1 rounded">
            <span className="text-slate-400">Stage:</span>
            <span className="text-amber-500 font-bold">{sessionMemory.stage}</span>
          </div>
        </div>
      </div>

      {/* 5. Long-Term Memory */}
      <div id="long-term-memory" className={`rounded-xl p-3 border mb-2 ${
        darkMode ? 'bg-slate-800/20 border-slate-700/30' : 'bg-slate-100/30 border-slate-200/30'
      }`}>
        <div className="flex items-center gap-2 mb-2 pb-1 border-b border-slate-600/10">
          <Bookmark className="w-4 h-4 text-blue-400" />
          <h4 className="text-xs font-bold tracking-tight text-blue-400">Cross-Session LTM</h4>
        </div>
        <ul className="space-y-1.5 text-[11px] text-slate-400 font-sans">
          {patient.persistedPreferences.map((pref, i) => (
            <li key={i} className="flex gap-1.5 items-start">
              <CheckCircle2 className="w-3 h-3 text-teal-400 mt-0.5 shrink-0" />
              <span>{pref}</span>
            </li>
          ))}
        </ul>
      </div>

    </aside>
  );
}
