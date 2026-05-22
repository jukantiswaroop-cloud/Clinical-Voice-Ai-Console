/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Patient, Doctor, CampaignCall, ReasoningStep, ActivityLog } from './types';

export const INITIAL_PATIENT: Patient = {
  id: 'pat_001',
  name: 'Swaroop Jukanti',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
  phone: '+91 98765 43210',
  preferredLanguage: 'English',
  lastAppointment: 'May 07, 2026 - Cardiology with Dr. Patel',
  persistedPreferences: [
    'Language: English Preferred, speaks Hindi fluently',
    'Morning slots only (9:00 AM - 12:00 PM)',
    'Prefers Dr. Angela Patel for critical queries',
    'Requires TTS responses'
  ]
};

export const INITIAL_DOCTORS: Doctor[] = [
  {
    id: 'doc_1',
    name: 'Dr. Angela Patel',
    specialty: 'Cardiologist',
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200',
    slots: [
      { time: '09:00 AM', availability: 'available' },
      { time: '10:00 AM', availability: 'booked' },
      { time: '11:00 AM', availability: 'booked' },
      { time: '11:30 AM', availability: 'conflicted', alternativeSlots: ['09:00 AM', '02:00 PM', 'Tomorrow 10:00 AM'] },
      { time: '02:00 PM', availability: 'available' }
    ]
  },
  {
    id: 'doc_2',
    name: 'Dr. Rajesh Kumar',
    specialty: 'Pediatrician',
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200',
    slots: [
      { time: '09:30 AM', availability: 'available' },
      { time: '10:30 AM', availability: 'available' },
      { time: '01:00 PM', availability: 'booked' },
      { time: '03:00 PM', availability: 'available' }
    ]
  },
  {
    id: 'doc_3',
    name: 'Dr. Sarah Jenkins',
    specialty: 'Neurologist',
    avatar: 'https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=200',
    slots: [
      { time: '10:00 AM', availability: 'available' },
      { time: '11:00 AM', availability: 'booked' },
      { time: '12:00 PM', availability: 'conflicted', alternativeSlots: ['10:00 AM', '03:30 PM', 'Tomorrow 11:00 AM'] },
      { time: '03:30 PM', availability: 'available' }
    ]
  },
  {
    id: 'doc_4',
    name: 'Dr. Venkat Rao',
    specialty: 'General Physician',
    avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200',
    slots: [
      { time: '11:00 AM', availability: 'available' },
      { time: '11:30 AM', availability: 'available' },
      { time: '12:00 PM', availability: 'booked' },
      { time: '04:00 PM', availability: 'available' }
    ]
  }
];

export const SUGGESTED_PROMPTS = [
  {
    label: 'Book on Dr. Angela Patel for Tomorrow 9 AM',
    text: 'I want to book an appointment with Dr. Angela Patel for tomorrow morning at 09:00 AM',
    lang: 'en'
  },
  {
    label: 'Reschedule (Trigger Conflict Slot)',
    text: 'Can I reschedule my appointment with Dr. Angela Patel to 11:30 AM instead?',
    lang: 'en'
  },
  {
    label: 'Cancel Existing Neurology Slot',
    text: 'Please cancel my neurology appointment with Dr. Jenkins',
    lang: 'en'
  },
  {
    label: 'Book in Hindi (डॉ. कुमार - सुबह ९:३०)',
    text: 'डॉ राजेश कुमार के साथ कल सुबह ९:३० बजे का अपॉइंटमेंट बुक कर दीजिए',
    lang: 'hi'
  },
  {
    label: 'Book in Tamil (டாக்டர் ராவ்)',
    text: 'நாளை காலை 11:00 மணிக்கு டாக்டர் வெங்கட் ராவிடம் ஒரு அப்பாயிண்ட்மெண்ட் புக் செய்ய வேண்டும்',
    lang: 'ta'
  },
  {
    label: 'Book in Telugu (డా. పటేల్ - సా. 2:00)',
    text: 'రేపు మధ్యాహ్నం 2:00 గంటలకు డాక్టర్ పటేల్ తో అపాయింట్మెంట్ బుక్ చేయండి',
    lang: 'te'
  },
  {
    label: 'Book in Kannada (ಡಾ. ಜೆಂಕಿನ್ಸ್ - ಬೆ. 10:00)',
    text: 'ನಾಳೆ ಬೆಳಿಗ್ಗೆ 10:00 ಗಂಟೆಗೆ ಡಾ. ಜೆಂಕಿನ್ಸ್ ಅವರೊಂದಿಗೆ ಅಪಾಯಿಂಟ್ಮೆಂಟ್ ಬುಕ್ ಮಾಡಿ',
    lang: 'kn'
  },
  {
    label: 'Trigger Outbound Campaign Call',
    text: 'Initiate outbound follow-up reminder',
    lang: 'en'
  }
];

export const INITIAL_CAMPAIGNS: CampaignCall[] = [
  {
    id: 'camp_001',
    patientName: 'Swaroop Jukanti',
    type: 'Reminder',
    phone: '+91 98765 43210',
    status: 'pending',
    details: 'Reminder for Cardiology Follow-up checkup with Dr. Angela Patel.'
  },
  {
    id: 'camp_002',
    patientName: 'Aarav Mehta',
    type: 'Follow-up',
    phone: '+91 99887 76655',
    status: 'completed',
    details: 'Post-op clinical check status follow-up calls.'
  },
  {
    id: 'camp_003',
    patientName: 'Meera Krishnan',
    type: 'Reminder',
    phone: '+91 88776 65544',
    status: 'pending',
    details: 'Dialysis session confirmation for tomorrow.'
  },
  {
    id: 'camp_004',
    patientName: 'Devendra Gowda',
    type: 'Follow-up',
    phone: '+91 77665 54433',
    status: 'completed',
    details: 'Diabetes insulin dosage regulation follow-up.'
  }
];

export const INITIAL_REASONING_STEPS = (): ReasoningStep[] => [
  {
    id: 'ret_01',
    name: 'memory.retrieve()',
    details: 'Scanning active state and cross-session memory ledger',
    duration: 35,
    status: 'success',
    output: 'Loaded patient preferred language: English (Carry-over fallback: Hindi).'
  },
  {
    id: 'par_01',
    name: 'intent.parse()',
    details: 'Parsing audio features and running intent classification models',
    duration: 110,
    status: 'success',
    output: 'Intent categorized: BOOK_APPOINTMENT, Slot: Dr. Patel, Morning.'
  },
  {
    id: 'cal_01',
    name: 'calendar.query()',
    details: 'Fetching Dr. Patel schedule and matching availability ranges',
    duration: 45,
    status: 'success',
    output: 'Queried slots. Detected conflict at 11:30 AM.'
  },
  {
    id: 'con_01',
    name: 'conflict.resolve()',
    details: 'Synthesizing adaptive recommendation slots dynamically',
    duration: 85,
    status: 'success',
    output: 'Offered alternatives: 09:00 AM, 02:00 PM, Tomorrow 10:00 AM.'
  },
  {
    id: 'tts_01',
    name: 'latency.measure()',
    details: 'Monitoring streaming synthesizer packet latency budgets',
    duration: 15,
    status: 'success',
    output: 'System latency budget under threshold: 290ms end-to-end.'
  }
];

export const INITIAL_ACTIVITY_LOGS = (): ActivityLog[] => [
  {
    id: 'log_01',
    timestamp: '18:28:10',
    category: 'system',
    type: 'info',
    message: 'Clinical AI Orchestrator initialized successfully'
  },
  {
    id: 'log_02',
    timestamp: '18:28:12',
    category: 'memory',
    type: 'success',
    message: 'Loaded persistent profile for Swaroop Jukanti.'
  },
  {
    id: 'log_03',
    timestamp: '18:28:14',
    category: 'language',
    type: 'success',
    message: 'Autodetect audio listener calibrated. Fallback: English/Hindi/Tamil/Telugu/Kannada'
  }
];
