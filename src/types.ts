/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Patient {
  id: string;
  name: string;
  avatar: string;
  phone: string;
  preferredLanguage: string;
  lastAppointment: string;
  persistedPreferences: string[];
}

export interface Slot {
  time: string;
  availability: 'available' | 'booked' | 'conflicted';
  alternativeSlots?: string[];
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  avatar: string;
  slots: Slot[];
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  date: string;
  time: string;
  status: 'PENDING' | 'CONFIRMED' | 'RESCHEDULED' | 'CANCELLED' | 'CONFLICT';
}

export interface Message {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  translation?: string;
  languageDetected?: string;
  intentConfidence?: number;
  toolConfidence?: number;
  timestamp: string;
  isStreaming?: boolean;
  conflictData?: {
    originalSlot: string;
    alternatives: string[];
  };
}

export type OrchestrationState =
  | 'IDLE'
  | 'LISTENING'
  | 'TRANSCRIBING'
  | 'DETECTING_LANGUAGE'
  | 'QUERYING_CALENDAR'
  | 'RESOLVING_CONFLICTS'
  | 'GENERATING_RESPONSE'
  | 'SPEAKING';

export interface CampaignCall {
  id: string;
  patientName: string;
  type: 'Reminder' | 'Follow-up';
  phone: string;
  status: 'pending' | 'completed' | 'active';
  details: string;
}

export interface ReasoningStep {
  id: string;
  name: string; // e.g. memory.retrieve(), intent.parse()
  details: string;
  duration: number; // in ms
  status: 'idle' | 'running' | 'success' | 'warn';
  output: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  category: 'system' | 'memory' | 'tool' | 'language' | 'calendar' | 'campaign';
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

export interface LatencyMetrics {
  stt: number;
  llm: number;
  tts: number;
  total: number;
}
