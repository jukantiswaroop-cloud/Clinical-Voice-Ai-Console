/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Sun, 
  Moon, 
  Settings, 
  Activity, 
  Menu, 
  X, 
  Cpu, 
  Bell, 
  AlertTriangle, 
  Bot, 
  PhoneCall,
  Flame,
  HelpCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { 
  Patient, 
  Doctor, 
  Appointment, 
  Message, 
  OrchestrationState, 
  CampaignCall, 
  ReasoningStep, 
  ActivityLog, 
  LatencyMetrics 
} from './types';

import { 
  INITIAL_PATIENT, 
  INITIAL_DOCTORS, 
  INITIAL_CAMPAIGNS, 
  SUGGESTED_PROMPTS, 
  INITIAL_REASONING_STEPS, 
  INITIAL_ACTIVITY_LOGS 
} from './data';

import SidebarLeft from './components/SidebarLeft';
import SidebarRight from './components/SidebarRight';
import CenterChat from './components/CenterChat';

export default function App() {
  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(true);

  // Layout states (Responsive Drawer toggles)
  const [leftSidebarOpen, setLeftSidebarOpen] = useState<boolean>(false);
  const [rightSidebarOpen, setRightSidebarOpen] = useState<boolean>(false);

  // Platform Core structures
  const [patient, setPatient] = useState<Patient>(INITIAL_PATIENT);
  const [doctors, setDoctors] = useState<Doctor[]>(INITIAL_DOCTORS);
  const [campaigns, setCampaigns] = useState<CampaignCall[]>(INITIAL_CAMPAIGNS);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'greeting_0',
      sender: 'assistant',
      text: "Hello Swaroop! I have fetched your clinical health cards, including your morning scheduling preferences. I can help you book, reschedule, or cancel appointments across our providers in English, Hindi, Tamil, Telugu, and Kannada. Try clicking on any available time slot above, or click the Microphone to begin a voice consultation.",
      timestamp: '18:28:15',
      intentConfidence: 99,
      toolConfidence: 95
    }
  ]);

  // Active Orchestration State Pipeline
  const [orchestrationState, setOrchestrationState] = useState<OrchestrationState>('IDLE');
  
  // Advanced Telemetry loggers
  const [reasoningSteps, setReasoningSteps] = useState<ReasoningStep[]>(INITIAL_REASONING_STEPS());
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(INITIAL_ACTIVITY_LOGS());
  const [latencyMetrics, setLatencyMetrics] = useState<LatencyMetrics>({
    stt: 35,
    llm: 110,
    tts: 60,
    total: 205
  });

  // Linguistic preferences
  const [currentLanguage, setCurrentLanguage] = useState<string>('English');

  // Session RAM
  const [sessionMemory, setSessionMemory] = useState({
    intent: 'None',
    doctor: 'None',
    time: 'None',
    stage: 'Aura Calibration Active'
  });

  // Current appointment summary badge
  const [appointment, setAppointment] = useState<Appointment | null>({
    id: 'app_active',
    patientId: 'pat_001',
    doctorId: 'doc_3',
    doctorName: 'Dr. Sarah Jenkins',
    specialty: 'Neurologist',
    date: 'May 22, 2026',
    time: '11:00 AM',
    status: 'CONFIRMED'
  });

  // Microphone and audio states
  const [isListening, setIsListening] = useState<boolean>(false);
  const recognitionRef = useRef<any>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Push Floating Notification toast message
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'warn' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'warn' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Add real-time log helper
  const addLog = (message: string, category: ActivityLog['category'], type: ActivityLog['type'] = 'info') => {
    const now = new Date();
    const timestamp = now.toTimeString().split(' ')[0];
    const newLog: ActivityLog = {
      id: `log_${Date.now()}_${Math.random()}`,
      timestamp,
      category,
      type,
      message
    };
    setActivityLogs(prev => [newLog, ...prev].slice(0, 50));
  };

  // Update Reasoning Trace live state helper
  const setReasoningActivity = (name: string, output: string, duration: number, isWarn = false) => {
    setReasoningSteps(prev => {
      return prev.map(step => {
        if (step.name === name) {
          return {
            ...step,
            output,
            duration,
            status: isWarn ? 'warn' : 'success'
          } as ReasoningStep;
        }
        return step;
      });
    });
  };

  // Helper to split text into chunks of maximum length safely without cutting words
  const splitIntoChunks = (text: string, maxLen: number = 150): string[] => {
    const words = text.split(/\s+/);
    const chunks: string[] = [];
    let currentChunk = "";
    
    for (const word of words) {
      if ((currentChunk + " " + word).trim().length <= maxLen) {
        currentChunk = currentChunk ? currentChunk + " " + word : word;
      } else {
        if (currentChunk) chunks.push(currentChunk);
        currentChunk = word;
      }
    }
    if (currentChunk) {
      chunks.push(currentChunk);
    }
    return chunks;
  };

  // Web Speech API Synthesis voice builder with fluid multilingual streaming fallback
  const speakText = (text: string, lang: string = 'English') => {
    if (!('speechSynthesis' in window)) {
      addLog('Speech synthesis not supported in this frame layout context.', 'system', 'warning');
      return;
    }

    // Cancel ongoing speech synthesis
    window.speechSynthesis.cancel();

    // Pause and clear any active streaming audio falling back
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    const cleanText = text.replace(/<[^>]*>/g, '').trim(); // strip HTML if any
    if (!cleanText) return;

    // Map language selection to voice locales
    let locale = 'en-US';
    if (lang === 'Hindi') locale = 'hi-IN';
    else if (lang === 'Tamil') locale = 'ta-IN';
    else if (lang === 'Telugu') locale = 'te-IN';
    else if (lang === 'Kannada') locale = 'kn-IN';

    // Build the native speech fallback callback
    const speakNativeFallback = (textToSpeak: string, loc: string) => {
      const fallbackUtterance = new SpeechSynthesisUtterance(textToSpeak);
      fallbackUtterance.lang = loc;
      
      const voices = window.speechSynthesis.getVoices();
      const targetLocale = loc.toLowerCase().replace('_', '-');
      const matchedVoice = voices.find(v => v.lang.toLowerCase().replace('_', '-').startsWith(targetLocale));
      if (matchedVoice) {
        fallbackUtterance.voice = matchedVoice;
        fallbackUtterance.lang = matchedVoice.lang;
      }
      
      utteranceRef.current = fallbackUtterance;
      
      fallbackUtterance.onstart = () => {
        setOrchestrationState('SPEAKING');
        addLog(`Fallback Speech Synthesis started: (${loc}) ${matchedVoice ? 'using ' + matchedVoice.name : ''}`, 'system', 'success');
      };
      fallbackUtterance.onend = () => {
        setOrchestrationState('IDLE');
        if (utteranceRef.current === fallbackUtterance) {
          utteranceRef.current = null;
        }
      };
      fallbackUtterance.onerror = (err) => {
        console.warn("Fallback SpeechSynthesis error:", err);
        setOrchestrationState('IDLE');
        if (utteranceRef.current === fallbackUtterance) {
          utteranceRef.current = null;
        }
      };
      window.speechSynthesis.speak(fallbackUtterance);
    };

    // If a regional language is requested, stream high-quality audio using Google Translate TTS endpoint.
    // This resolves the massive issue of missing Indian voice/oral locale packs in standard client environments.
    if (lang !== 'English') {
      const activeLocaleCode = locale.split('-')[0];
      const speechChunks = splitIntoChunks(cleanText, 150);
      
      addLog(`Activating premium online voice streaming for ${lang} (${activeLocaleCode})`, 'system', 'info');
      
      let currentChunkIndex = 0;
      
      const playNextChunk = () => {
        if (currentChunkIndex >= speechChunks.length) {
          setOrchestrationState('IDLE');
          addLog(`${lang} voice channel closed.`, 'system', 'info');
          audioRef.current = null;
          return;
        }
        
        const chunkText = speechChunks[currentChunkIndex];
        const ttsUrl = `/api/tts?tl=${activeLocaleCode}&q=${encodeURIComponent(chunkText)}`;
        
        const audio = new Audio(ttsUrl);
        audioRef.current = audio;
        
        audio.onplay = () => {
          setOrchestrationState('SPEAKING');
          addLog(`Live vocal streaming: Segment ${currentChunkIndex + 1}/${speechChunks.length}`, 'system', 'success');
        };
        
        audio.onended = () => {
          currentChunkIndex++;
          playNextChunk();
        };
        
        audio.onerror = (e) => {
          console.warn(`Vocal stream failed for segment ${currentChunkIndex + 1}:`, e);
          speakNativeFallback(cleanText, locale);
        };
        
        audio.play().catch(playErr => {
          console.warn("Autoplay blocked or stream interrupted:", playErr);
          // If browser blocks autoplay with a custom error, fall back gracefully to the native Synthesis
          speakNativeFallback(cleanText, locale);
        });
      };
      
      playNextChunk();
      return;
    }

    // Default flow: English synthesis (which is universally pre-installed and exceptionally reliable in all browsers)
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = locale;

    const voices = window.speechSynthesis.getVoices();
    const targetLocale = locale.toLowerCase().replace('_', '-');
    const matchedVoice = voices.find(v => v.lang.toLowerCase().replace('_', '-').startsWith(targetLocale));

    if (matchedVoice) {
      utterance.voice = matchedVoice;
      utterance.lang = matchedVoice.lang;
    }

    utteranceRef.current = utterance;

    utterance.onstart = () => {
      setOrchestrationState('SPEAKING');
      addLog(`English speech output active (${utterance.lang}) using ${matchedVoice ? matchedVoice.name : 'default voice'}`, 'system', 'success');
    };

    utterance.onend = () => {
      setOrchestrationState('IDLE');
      addLog('English speech channel closed.', 'system', 'info');
      if (utteranceRef.current === utterance) {
        utteranceRef.current = null;
      }
    };

    utterance.onerror = (e) => {
      console.warn("English speechSynthesis error:", e);
      setOrchestrationState('IDLE');
      if (utteranceRef.current === utterance) {
        utteranceRef.current = null;
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  // Web Speech Microphone toggle (Speech Recognition API)
  const toggleMic = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      showToast('Natives speech recognition is not supported in this browser viewport.', 'warn');
      addLog('Voice Engine failed: SpeechRecognition placeholder not found', 'system', 'error');
      // Simulated fallback interaction
      handleSimulatedVoiceRecognition();
      return;
    }

    if (isListening) {
      // Turn off microphone
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      addLog('Microphone input muted manually.', 'system', 'info');
    } else {
      // Turn on microphone
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = currentLanguage === 'Hindi' ? 'hi-IN' : 
                           currentLanguage === 'Tamil' ? 'ta-IN' : 
                           currentLanguage === 'Telugu' ? 'te-IN' : 
                           currentLanguage === 'Kannada' ? 'kn-IN' : 'en-US';

        recognition.onstart = () => {
          setIsListening(true);
          setOrchestrationState('LISTENING');
          addLog('Microphone access approved. Streams listening...', 'system', 'success');
          showToast('Audio channel live. Speak clinical instructions...', 'info');
        };

        recognition.onresult = (event: any) => {
          const speechToText = event.results[0][0].transcript;
          addLog(`Audio capturing parsed user voice successfully: "${speechToText}"`, 'language', 'success');
          setIsListening(false);
          // Pipe audio straight to response pipeline
          processClinicalRequest(speechToText);
        };

        recognition.onerror = (event: any) => {
          console.warn('SpeechRecognition error:', event.error);
          addLog(`Voicetime channel clashing or error: ${event.error}`, 'system', 'error');
          setIsListening(false);
          setOrchestrationState('IDLE');
          showToast(`Microphone capturing interrupted: ${event.error}`, 'warn');
        };

        recognition.onend = () => {
          setIsListening(false);
          if (orchestrationState === 'LISTENING') {
            setOrchestrationState('IDLE');
          }
        };

        recognitionRef.current = recognition;
        recognition.start();

      } catch (err: any) {
        addLog(`Failed to claim speech resource: ${err.message}`, 'system', 'error');
        setIsListening(false);
        setOrchestrationState('IDLE');
      }
    }
  };

  // Fallback voice simulator if speech recognition is constrained in the iframe sandbox
  const handleSimulatedVoiceRecognition = () => {
    setOrchestrationState('LISTENING');
    addLog('Simulating audio mic capturing pipeline...', 'system', 'info');
    setTimeout(() => {
      setOrchestrationState('TRANSCRIBING');
      addLog('Transcribing incoming voice frequency vectors...', 'system', 'success');
      setTimeout(() => {
        const simulatedPhrase = "I need to book an appointment with Dr. Angela Patel for tomorrow morning at 09:00 AM";
        processClinicalRequest(simulatedPhrase);
      }, 800);
    }, 1200);
  };

  // Outbound campaign call simulator
  const handleCallCampaign = (campId: string) => {
    // Pick the selected campaign
    const camp = campaigns.find(c => c.id === campId);
    if (!camp) return;

    // Trigger Campaign dialer
    showToast(`Dialing ${camp.patientName}... (${camp.phone})`, 'info');
    addLog(`Initiating VoIP outbound call package for ${camp.patientName}`, 'campaign', 'info');

    // Update campaign status
    setCampaigns(prev => prev.map(c => c.id === campId ? { ...c, status: 'active' } : c));

    // Wait 2s to simulate connecting dial
    setTimeout(() => {
      addLog(`VoIP connection established with ${camp.patientName}`, 'campaign', 'success');
      setOrchestrationState('SPEAKING');

      // Draft the synthesized voice statement
      const outboundSpeech = `Hello Swaroop Jukanti! This is Aura Clinical booking services calling you regarding your cardiology followup checkup with Dr. Angela Patel. I see you have an outpatient status pending. Would you like to schedule an appointment with Dr. Patel for Fridaymorning at 9:00 AM, or do you have another timing in mind?`;

      // Set Campaign Memory
      setSessionMemory({
        intent: 'OUTBOUND_CAMPAIGN',
        doctor: 'Dr. Angela Patel',
        time: 'PENDING_CONFIRMED',
        stage: 'Live Outbound Campaign interaction'
      });

      // Append campaign message to Chat Stream
      const systemMsgId = `sys_${Date.now()}`;
      const campaignMsgId = `camp_${Date.now()}`;
      
      const newMessages: Message[] = [
        {
          id: systemMsgId,
          sender: 'system',
          text: `[Outbound Campaign Dial] Telephony Trunk Connected with Swaroop Jukanti (${camp.phone}).`,
          timestamp: new Date().toTimeString().split(' ')[0]
        },
        {
          id: campaignMsgId,
          sender: 'assistant',
          text: outboundSpeech,
          timestamp: new Date().toTimeString().split(' ')[0],
          intentConfidence: 98,
          toolConfidence: 97
        }
      ];

      setMessages(prev => [...prev, ...newMessages]);
      speakText(outboundSpeech, currentLanguage);

      // Complete call
      setCampaigns(prev => prev.map(c => c.id === campId ? { ...c, status: 'completed' } : c));
    }, 2000);
  };

  // Direct slot reservation trigger
  const handleSelectSlot = (doctorName: string, time: string) => {
    const clinicalString = `I want to book an appointment with ${doctorName} at ${time}`;
    processClinicalRequest(clinicalString);
  };

  // Solve appointment conflict trigger
  const handleSelectAlternative = (originalContextText: string, alternativeTime: string) => {
    addLog('Solving scheduling conflict with alternative timeslot...', 'calendar', 'info');
    setOrchestrationState('RESOLVING_CONFLICTS');
    showToast('Resolving conflict...', 'info');

    setTimeout(() => {
      const now = new Date();
      const timestamp = now.toTimeString().split(' ')[0];
      const selectedDoctor = "Dr. Angela Patel";

      // 1. Confirm alternative slot
      const ttsResponse = `Fantastic Choice Swaroop! I have updated your scheduling ledger. Your appointment with Dr. Angela Patel has been confirmed for ${alternativeTime} on May 22, 2026. Your old reservation has been released, and we sent a secure notification card to your profile. See you then!`;

      // Define trace logs
      setReasoningActivity('conflict.resolve()', `Assigned non-clashing slot: ${alternativeTime}. Canceled conflicted range.`, 45);
      setReasoningActivity('latency.measure()', 'Optimal sub-frame telemetry resolved. Routing CJS state.', 12);

      // Create new confirm record
      const resolvedAppointment: Appointment = {
        id: 'app_active',
        patientId: 'pat_001',
        doctorId: 'doc_1',
        doctorName: selectedDoctor,
        specialty: 'Cardiologist',
        date: 'May 22, 2026',
        time: alternativeTime,
        status: 'RESCHEDULED'
      };

      setAppointment(resolvedAppointment);

      setSessionMemory({
        intent: 'RESCHEDULE',
        doctor: selectedDoctor,
        time: alternativeTime,
        stage: 'Conflict Resolved and Confirmed'
      });

      const responseMsg: Message = {
        id: `assistant_res_${Date.now()}`,
        sender: 'assistant',
        text: ttsResponse,
        timestamp,
        intentConfidence: 98,
        toolConfidence: 99
      };

      setMessages(prev => [...prev, responseMsg]);
      speakText(ttsResponse, currentLanguage);
      addLog(`Appointment re-routed successfully to ${alternativeTime}`, 'calendar', 'success');
      showToast('Appointment Rescheduled Successfully!', 'success');
    }, 1500);
  };

  // Language persistent state switcher
  const handleLanguageChange = (lang: string) => {
    setCurrentLanguage(lang);
    addLog(`Persistent user linguistic state updated: "${lang}"`, 'language', 'success');
    showToast(`Preferences persistent: Switched to ${lang}`, 'success');

    // Trigger synthetic switch phrase
    let ackPhrase = `Switching voice system to English.`;
    if (lang === 'Hindi') ackPhrase = "मल्टीलिंगुअल वॉयस इंजन को हिन्दी भाषा पर स्विच कर दिया गया है।";
    else if (lang === 'Tamil') ackPhrase = "குரல் தளம் இப்போது தமிழ் மொழிக்கு மாற்றப்பட்டுள்ளது.";
    else if (lang === 'Telugu') ackPhrase = "వాయిస్ సిస్టమ్ ఇప్పుడు తెలుగు భాషకు మారినది.";
    else if (lang === 'Kannada') ackPhrase = "ಕನ್ನಡ ಧ್ವನಿ ಸಹಾಯಕ ಸಕ್ರಿಯಗೊಂಡಿದೆ.";

    speakText(ackPhrase, lang);
  };

  // Preset quick-access shorthand templates
  const handleTriggerAction = (actionType: 'book' | 'reschedule' | 'cancel') => {
    let presetPromptText = "";
    if (actionType === 'book') {
      presetPromptText = "I want to schedule an appointment with pediatric doctor Dr. Rajesh Kumar for tomorrow morning at 09:30 AM";
    } else if (actionType === 'reschedule') {
      presetPromptText = "I want to reschedule my appointment with Dr. Angela Patel to tomorrow at 11:30 AM";
    } else if (actionType === 'cancel') {
      presetPromptText = "I want to cancel my clinical appointment with Dr. Sarah Jenkins";
    }
    
    if (presetPromptText) {
      processClinicalRequest(presetPromptText);
    }
  };

  // Main NLP clinical parsing & state router
  const processClinicalRequest = (rawQuery: string) => {
    const textQuery = rawQuery.trim();
    if (!textQuery) return;

    // Reset pipeline latency metrics to randomized highly accurate live telemetry
    const randomStt = Math.floor(Math.random() * 30) + 20; // 20-50ms
    const randomLlm = Math.floor(Math.random() * 80) + 100; // 100-180ms
    const randomTts = Math.floor(Math.random() * 40) + 50; // 50-90ms
    const activeTotal = randomStt + randomLlm + randomTts;

    setLatencyMetrics({
      stt: randomStt,
      llm: randomLlm,
      tts: randomTts,
      total: activeTotal
    });

    const now = new Date();
    const timestamp = now.toTimeString().split(' ')[0];

    // Detect language in query, defaulting to the manually selected active system language
    let detectedLang = currentLanguage;
    let queryTranslation: string | undefined = undefined;

    const lowerQuery = textQuery.toLowerCase();
    
    // Check Hindi
    if (/कल|सुबह|अपॉइंटमेंट|बुक|कुमार|पटेल|राव/.test(textQuery)) {
      detectedLang = 'Hindi';
      queryTranslation = "Book appointment for tomorrow morning with pediatrician Dr. Rajesh Kumar at 09:30 AM.";
    }
    // Check Tamil
    else if (/நாளை|காலை|அப்பாயிண்ட்மெண்ட்|வேண்டும்|டாக்டர்/.test(textQuery)) {
      detectedLang = 'Tamil';
      queryTranslation = "I need to book appointment tomorrow morning at 11:00 AM with Dr. Venkat Rao.";
    }
    // Check Telugu
    else if (/రేపు|మధ్యాహ్నం|అపాయింట్మెంట్|బుక్|పటేల్|డాక్టర్/.test(textQuery)) {
      detectedLang = 'Telugu';
      queryTranslation = "Book appointment for tomorrow 02:00 PM with Dr. Angela Patel.";
    }
    // Check Kannada
    else if (/ನಾಳೆ|ಬೆಳಿಗ್ಗೆ|ಅಪಾಯಿಂಟ್ಮೆಂಟ್|ಬುಕ್|ಜೆಂಕಿನ್ಸ್|ಡಾಕ್ಟರ್/.test(textQuery)) {
      detectedLang = 'Kannada';
      queryTranslation = "Book appointment for tomorrow morning 10:00 AM with neurologist Dr. Sarah Jenkins.";
    }

    addLog(`Processing voice payload. STT latency budget: ${randomStt}ms`, 'system', 'info');

    // 1. Appends user query card
    const userMsgId = `user_${Date.now()}`;
    const userMsg: Message = {
      id: userMsgId,
      sender: 'user',
      text: textQuery,
      timestamp,
      languageDetected: detectedLang !== 'English' ? detectedLang : undefined,
      translation: queryTranslation
    };

    setMessages(prev => [...prev, userMsg]);
    setOrchestrationState('TRANSCRIBING');

    // Start Sequential pipe animations
    setTimeout(() => {
      // 2. Language Detection state
      setOrchestrationState('DETECTING_LANGUAGE');
      setReasoningActivity('memory.retrieve()', `Scanned LTM. Linguistic persistence updated. Current: ${detectedLang}`, 25);
      
      if (detectedLang !== currentLanguage) {
        setCurrentLanguage(detectedLang);
        addLog(`Auto-detected language switched from ${currentLanguage} to ${detectedLang}`, 'language', 'success');
      }

      setTimeout(() => {
        // 3. Querying Calendar schedules
        setOrchestrationState('QUERYING_CALENDAR');
        setReasoningActivity('intent.parse()', `Parsed query keyword intent bounds. Detected intent: BOOK_APPOINTMENT/MANAGE on ${detectedLang}`, 95);
        addLog(`Performing medical calendar scans...`, 'calendar', 'info');

        let responseText = '';
        let intentKey = 'UNKNOWN';
        let matchedDoctor = 'None';

        // Detect doctor name in query
        if (lowerQuery.includes('patel')) {
          matchedDoctor = 'Dr. Angela Patel';
        } else if (lowerQuery.includes('kumar') || lowerQuery.includes('राजेश')) {
          matchedDoctor = 'Dr. Rajesh Kumar';
        } else if (lowerQuery.includes('jenkins') || lowerQuery.includes('ಸಾರಾ') || lowerQuery.includes('ಸಾರಾ ಜೆಂಕಿನ್ಸ್') || lowerQuery.includes('ಸಾಹಿತ್ಯ') || lowerQuery.includes('ಸವಿನಾ') || lowerQuery.includes('ಸಾರ')) {
          matchedDoctor = 'Dr. Sarah Jenkins';
        } else if (lowerQuery.includes('rao') || lowerQuery.includes('வெங்கட்') || lowerQuery.includes('రావ్')) {
          matchedDoctor = 'Dr. Venkat Rao';
        }

        // A) RESCHEDULE CONFLICT TRIGGERS (e.g. reschedule Patel at 11:30 AM)
        if ((lowerQuery.includes('reschedule') || lowerQuery.includes('change')) && lowerQuery.includes('11:30') && lowerQuery.includes('patel')) {
          intentKey = 'RESCHEDULE';
          setOrchestrationState('RESOLVING_CONFLICTS');
          addLog(`Scheduling collision detected for Dr. Patel at 11:30 AM`, 'calendar', 'warning');
          setReasoningActivity('calendar.query()', 'Queried Dr. Patel scheduling grids. Found 1 double-booking.', 48);
          
          responseText = `Swaroop, scheduling conflict detected. Dr. Angela Patel (Cardiologist) has an urgent surgical block or existing appointment booked at 11:30 AM. However, she has alternate slots open tomorrow. I have loaded alternative times on your display card. Would you like to schedule 09:00 AM, 02:00 PM, or tomorrow at 10:00 AM?`;

          // Prepare active elements on message
          const conflictMsg: Message = {
            id: `assistant_conf_${Date.now()}`,
            sender: 'assistant',
            text: responseText,
            timestamp: new Date().toTimeString().split(' ')[0],
            intentConfidence: 97,
            toolConfidence: 98,
            isStreaming: false,
            conflictData: {
              originalSlot: '11:30 AM',
              alternatives: ['09:00 AM - Today', '02:00 PM - Today', '10:00 AM - Tomorrow']
            }
          };

          setSessionMemory({
            intent: 'RESCHEDULE',
            doctor: 'Dr. Angela Patel',
            time: '11:30 AM (CONFLICT)',
            stage: 'Conflict Resolution Prompt Mode'
          });

          setTimeout(() => {
            setMessages(prev => [...prev, conflictMsg]);
            speakText(responseText, detectedLang);
            setReasoningActivity('conflict.resolve()', 'Synthesized 3 low-latency slot alternatives successfully.', 115);
          }, 500);

          return;
        }

        // B) CANCEL INTENT
        else if (lowerQuery.includes('cancel') || lowerQuery.includes('remove') || lowerQuery.includes('delete') || lowerQuery.includes('ರದ್ದು') || lowerQuery.includes('రద్దు') || lowerQuery.includes('ரத்து') || lowerQuery.includes('रद्द')) {
          intentKey = 'CANCEL';
          setOrchestrationState('GENERATING_RESPONSE');
          setReasoningActivity('calendar.query()', 'Locked active clinical session ID pat_001. Matching Neuro range.', 45);

          if (detectedLang === 'Hindi') {
            responseText = `Swaroop Jukanti, आपका डॉ. सविना जेंकिन्स के साथ अपॉइंटमेंट कल सुबह 11:00 बजे का सफलतापूर्वक रद्द कर दिया गया है।`;
            showToast('अपॉइंटमेंट रद्द कर दिया गया', 'success');
          } else if (detectedLang === 'Tamil') {
            responseText = `Swaroop, நாளை காலை 11:00 மணிக்கு டாக்டர் சாரா ஜென்கின்ஸுடனான உங்கள் அப்பாயிண்ட்மெண்ட் வெற்றிகரமாக ரத்து செய்யப்பட்டுள்ளது.`;
            showToast('அப்பாயிண்ட்மெண்ட் வெற்றிகரமாக ரத்து செய்யப்பட்டது', 'success');
          } else if (detectedLang === 'Telugu') {
            responseText = `Swaroop, రేపు ఉదయం 11:00 గంటలకు డాక్టర్ సారా జెంకిన్స్ తో మీ అపాయింట్‌మెంట్ రద్దు చేయబడింది.`;
            showToast('అపాయింట్మెంట్ రద్దు విజయవంతమైంది', 'success');
          } else if (detectedLang === 'Kannada') {
            responseText = `Swaroop, ನಾಳೆ ಬೆಳಿಗ್ಗೆ 11:00 ಗಂಟೆಗೆ ಡಾ. ಸಾರಾ ಜೆಂಕಿನ್ಸ್ ಅವರೊಂದಿಗಿನ ನಿಮ್ಮ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಅನ್ನು ಯಶಸ್ವಿಯಾಗಿ ರದ್ದುಗೊಳಿಸಲಾಗಿದೆ.`;
            showToast('ಅಪಾಯಿಂಟ್ಮೆಂಟ್ ಯಶಸ್ವಿಯಾಗಿ ರದ್ದುಗೊಂಡಿದೆ', 'success');
          } else {
            responseText = `Swaroop, your clinical appointment with Dr. Sarah Jenkins scheduled for tomorrow at 11:00 AM has been successfully cancelled.`;
            showToast('Appointment cancelled successfully', 'success');
          }
          setAppointment(null);
          addLog(`Appointment cancelled for Dr. Sarah Jenkins`, 'calendar', 'success');
        }

        // C) BOOKING (Hindi variant)
        else if (detectedLang === 'Hindi' || lowerQuery.includes('kumar') || lowerQuery.includes('राजेश')) {
          intentKey = 'BOOK';
          detectedLang = 'Hindi'; // Align speaking voice with response language
          setOrchestrationState('GENERATING_RESPONSE');
          setReasoningActivity('calendar.query()', 'Found Dr. Rajesh Kumar (Pediatrics) available tomorrow सुबह ९:३० बजे.', 35);
          
          responseText = `अपॉइंटमेंट की पुष्टि हो गई है, Swaroop Jukanti! मैंने कल सुबह 09:30 बजे बाल रोग विशेषज्ञ डॉ. राजेश कुमार (Dr. Rajesh Kumar) के साथ आपका अपॉइंटमेंट बुक कर दिया है। पुष्टिकरण कार्ड आपके मोबाइल पर भेज दिया गया है।`;

          const newAppHindi: Appointment = {
            id: 'app_kumar',
            patientId: 'pat_001',
            doctorId: 'doc_2',
            doctorName: 'Dr. Rajesh Kumar',
            specialty: 'Pediatrician',
            date: 'May 22, 2026',
            time: '09:30 AM',
            status: 'CONFIRMED'
          };
          setAppointment(newAppHindi);
          addLog(`Hindi slot reservation confirmed for Dr. Rajesh Kumar at 09:30 AM`, 'calendar', 'success');
          showToast('डॉ. राजेश कुमार के साथ अपॉइंटमेंट बुक किया गया', 'success');
        }

        // D) BOOKING (Tamil variant)
        else if (detectedLang === 'Tamil' || lowerQuery.includes('ராவிடம்') || lowerQuery.includes('வெங்கட்') || lowerQuery.includes('ராவ்')) {
          intentKey = 'BOOK';
          detectedLang = 'Tamil'; // Align speaking voice with response language
          setOrchestrationState('GENERATING_RESPONSE');
          setReasoningActivity('calendar.query()', 'Parsed Tamil request. Loading general physician slots.', 42);

          responseText = `அப்பாயிண்ட்மெண்ட் உறுதி செய்யப்பட்டுள்ளது, Swaroop! நாளை காலை 11:00 மணிக்கு பொது மருத்துவர் டாக்டர் வெங்கட் ராவ் (Dr. Venkat Rao) உடன் உங்களது அப்பாயிண்ட்மெண்ட் பதிவு செய்யப்பட்டுள்ளது. எஸ்எம்எஸ் அனுப்பப்பட்டுள்ளது.`;

          const newAppTamil: Appointment = {
            id: 'app_rao',
            patientId: 'pat_001',
            doctorId: 'doc_4',
            doctorName: 'Dr. Venkat Rao',
            specialty: 'General Physician',
            date: 'May 22, 2026',
            time: '11:00 AM',
            status: 'CONFIRMED'
          };
          setAppointment(newAppTamil);
          addLog(`Tamil slot reservation confirmed for Dr. Venkat Rao at 11:00 AM`, 'calendar', 'success');
          showToast('உறுதி செய்யப்பட்டது', 'success');
        }

        // D1) BOOKING (Telugu variant)
        else if (detectedLang === 'Telugu' || lowerQuery.includes('పటేల్') || lowerQuery.includes('అపాయింట్మెంట్')) {
          intentKey = 'BOOK';
          detectedLang = 'Telugu'; // Align speaking voice with response language
          setOrchestrationState('GENERATING_RESPONSE');
          setReasoningActivity('calendar.query()', 'Found Dr. Angela Patel available tomorrow మధ్యాహ్నం 02:00 PM.', 38);
          
          responseText = `అపాయింట్‌మెంట్ విజయవంతంగా బుక్ చేయబడింది, Swaroop Jukanti! రేపు మధ్యాహ్నం 02:00 గంటలకు కార్డియాలజిస్ట్ డాక్టర్ అంజలా పటేల్ (Dr. Angela Patel) తో మీ అపాయింట్‌మెంట్ ఖరారైంది. నిర్ధారణ సమాచారం మీ మొబైల్ నంబర్‌కు పంపబడింది.`;

          const newAppTelugu: Appointment = {
            id: 'app_patel_telugu',
            patientId: 'pat_001',
            doctorId: 'doc_1',
            doctorName: 'Dr. Angela Patel',
            specialty: 'Cardiologist',
            date: 'May 22, 2026',
            time: '02:00 PM',
            status: 'CONFIRMED'
          };
          setAppointment(newAppTelugu);
          addLog(`Telugu slot reservation confirmed with Dr. Angela Patel at 02:00 PM`, 'calendar', 'success');
          showToast('ఆపాయింట్‌మెంట్ విజయవంతంగా బుక్ చేయబడింది', 'success');
        }

        // D2) BOOKING (Kannada variant)
        else if (detectedLang === 'Kannada' || lowerQuery.includes('ಡಾಕ್ಟರ್') || lowerQuery.includes('ಜೆಂಕಿನ್ಸ್') || lowerQuery.includes('ಸಾರಾ')) {
          intentKey = 'BOOK';
          detectedLang = 'Kannada'; // Align speaking voice with response language
          setOrchestrationState('GENERATING_RESPONSE');
          setReasoningActivity('calendar.query()', 'Found Dr. Sarah Jenkins available tomorrow ಬೆಳಿಗ್ಗೆ 10:00 AM.', 41);
          
          responseText = `Swaroop, ನಾಳೆ ಬೆಳಿಗ್ಗೆ 10:00 ಗಂಟೆಗೆ ನ್ಯೂರಾಲಜಿಸ್ಟ್ ಡಾ. ಸಾರಾ ಜೆಂಕಿನ್ಸ್ (Dr. Sarah Jenkins) ಅವರೊಂದಿಗೆ ನಿಮ್ಮ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಕಾಯ್ದಿರಿಸಲಾಗಿದೆ. ಎಸ್‌ಎಮ್‌ಎಸ್ ರಸೀದಿಯನ್ನು ನಿಮ್ಮ ಮೊಬೈಲ್‌ಗೆ ಕಳುಹಿಸಲಾಗಿದೆ.`;

          const newAppKannada: Appointment = {
            id: 'app_jenkins_kannada',
            patientId: 'pat_001',
            doctorId: 'doc_3',
            doctorName: 'Dr. Sarah Jenkins',
            specialty: 'Neurologist',
            date: 'May 22, 2026',
            time: '10:00 AM',
            status: 'CONFIRMED'
          };
          setAppointment(newAppKannada);
          addLog(`Kannada slot reservation confirmed with Dr. Sarah Jenkins at 10:00 AM`, 'calendar', 'success');
          showToast('ಡಾ. ಜೆಂಕಿನ್ಸ್ ಅವರೊಂದಿಗೆ ಅಪಾಯಿಂಟ್ಮೆಂಟ್ ಕಾಯ್ದಿರಿಸಲಾಗಿದೆ', 'success');
        }

        // E) BOOKING STANDARD (Dr. Angela Patel morning 9 AM slot)
        else if (lowerQuery.includes('patel') && (lowerQuery.includes('9') || lowerQuery.includes('morning') || lowerQuery.includes('9:00'))) {
          intentKey = 'BOOK';
          detectedLang = 'English'; // Align speaking voice with response language
          setOrchestrationState('GENERATING_RESPONSE');
          setReasoningActivity('calendar.query()', 'Querying Dr. Patel Morning schedule range. 09:00 AM is available.', 38);

          responseText = `Great news Swaroop! I have scheduled your appointment with cardiologist Dr. Angela Patel for tomorrow morning at 09:00 AM. A secure confirmation card has been pushed to your mobile index (+91 98765 43210). Have a restful day!`;

          const newAppStandard: Appointment = {
            id: 'app_patel_confirm',
            patientId: 'pat_001',
            doctorId: 'doc_1',
            doctorName: 'Dr. Angela Patel',
            specialty: 'Cardiologist',
            date: 'May 22, 2026',
            time: '09:00 AM',
            status: 'CONFIRMED'
          };
          setAppointment(newAppStandard);
          addLog(`Appointment locked for Dr. Angela Patel at 09:00 AM`, 'calendar', 'success');
          showToast('Appointment Scheduled & Pushed to SMS!', 'success');
        }

        // F) GENERAL INTELLIGENT ROUTE fallback
        else {
          detectedLang = 'English'; // Align speaking voice with response language
          setOrchestrationState('GENERATING_RESPONSE');
          responseText = `Hello Swaroop, I've noted that queries regarding your clinical appointments. I can book, reschedule, or cancel slots across our primary clinical roster: Cardiologist (Dr. Patel), Pediatrician (Dr. Kumar), Neurologist (Dr. Jenkins), and General Physician (Dr. Rao). What details or providers do you require?`;
        }

        // Updates session memory
        setSessionMemory({
          intent: intentKey.toUpperCase(),
          doctor: matchedDoctor,
          time: lowerQuery.match(/\d+(:\d+)?\s*(am|pm)/i)?.[0]?.toUpperCase() || 'None',
          stage: 'Analysis Complete'
        });

        // Post synthesized output message
        setTimeout(() => {
          const assistantMsg: Message = {
            id: `assistant_${Date.now()}`,
            sender: 'assistant',
            text: responseText,
            timestamp: new Date().toTimeString().split(' ')[0],
            intentConfidence: 96,
            toolConfidence: 95,
            isStreaming: false
          };

          setMessages(prev => [...prev, assistantMsg]);
          speakText(responseText, detectedLang);
        }, 400);

      }, 1000);
    }, 700);
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-all duration-300 ${
      darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'
    }`}>
      
      {/* Dynamic Toast Notice */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4.5 py-3 rounded-full border shadow-xl bg-slate-900 border-teal-500/30 text-teal-400 font-sans backdrop-blur-md select-none text-xs font-bold leading-none"
          >
            <Bot className="w-4.5 h-4.5 animate-bounce shrink-0" />
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CORE FRAMEWORK BANNER PLATFORM HEADER */}
      <header className={`h-14 px-4 border-b flex items-center justify-between sticky top-0 z-20 backdrop-blur-md ${
        darkMode ? 'bg-slate-950/80 border-slate-900' : 'bg-white/80 border-slate-200'
      }`}>
        <div className="flex items-center gap-3">
          {/* Responsive Collapsible Sidebar Menu Toggles for Tablet/Mobile */}
          <button
            onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
            className="p-1.5 rounded-lg lg:hidden hover:bg-slate-800/40 border border-slate-700/20 text-slate-400"
            title="Menu Roster"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-teal-500/15 text-teal-400">
              <Flame className="w-4 h-4 text-emerald-400 animate-pulse" />
            </span>
            <div className="flex flex-col">
              <span className="text-xs font-black tracking-wider uppercase bg-gradient-to-r from-teal-400 to-sky-300 bg-clip-text text-transparent">
                Aura Clinical AI agent
              </span>
              <span className="text-[9px] font-mono font-bold text-slate-500">Live Telephony Gateway Platform</span>
            </div>
          </div>
        </div>

        {/* Diagnostic pipeline visual flow indicator for central orchestrator */}
        <div className="hidden md:flex items-center gap-1 bg-slate-900/60 border border-slate-850 px-3 py-1.5 rounded-full text-[10px] font-mono text-slate-400 shadow-inner">
          <Cpu className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          <span>STT</span>
          <span className="text-teal-400">&rarr;</span>
          <span className="font-bold text-indigo-400">LLM Reasoning</span>
          <span className="text-teal-400">&rarr;</span>
          <span>TTS Synthetic</span>
          <span className="text-teal-400">|</span>
          <span className="text-teal-400 font-bold">Latency SLA &lt;450ms</span>
        </div>

        {/* DarkMode Toggle and Configuration links */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 rounded-full border hover:scale-105 transition-all ${
              darkMode ? 'bg-slate-900 border-slate-800 text-teal-400' : 'bg-slate-100 border-slate-200 text-amber-500'
            }`}
            title="Toggle theme visualizer"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Trigger Outbound Telephony on Sidebar Right */}
          <button
            onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
            className="p-2 rounded-full border lg:hidden hover:bg-slate-850 border-slate-700/20 text-slate-400"
            title="Campaign Telemetry Summary"
          >
            <Bell className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* THREE COLUMN GRID INTERFACE AREA */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* LEFT COLUMN: Patient Card & Language persistence (18% desk, collapsible drawer mobile) */}
        {/* Mobile slide-out wrapper */}
        <div className={`fixed inset-y-0 left-0 z-30 lg:relative lg:z-0 lg:flex w-72 lg:w-[18%] transform transition-transform duration-300 ${
          leftSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}>
          <div className="w-full h-full relative flex flex-col bg-slate-950">
            <SidebarLeft
              darkMode={darkMode}
              patient={patient}
              currentLanguage={currentLanguage}
              onLanguageChange={handleLanguageChange}
              sessionMemory={sessionMemory}
              onTriggerAction={handleTriggerAction}
            />
            {/* Close button for Mobile drawers */}
            <button
              onClick={() => setLeftSidebarOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded bg-slate-900 border border-slate-800 lg:hidden text-slate-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* CENTER COLUMN: LIVE CONVERSATIONAL AI CORE console layout (57% desk) */}
        <div className="flex-1 h-full flex flex-col lg:w-[57%] border-r border-slate-900 overflow-hidden bg-slate-950">
          <CenterChat
            darkMode={darkMode}
            messages={messages}
            orchestrationState={orchestrationState}
            doctors={doctors}
            suggestedPrompts={SUGGESTED_PROMPTS}
            isListening={isListening}
            onSendMessage={processClinicalRequest}
            onToggleMic={toggleMic}
            onSelectSlot={handleSelectSlot}
            onSelectAlternative={handleSelectAlternative}
          />
        </div>

        {/* RIGHT COLUMN: Performance logger, campaigns list, latencies (25% desk, collapsible drawer mobile) */}
        <div className={`fixed inset-y-0 right-0 z-30 lg:relative lg:z-0 lg:flex w-80 lg:w-[25%] transform transition-transform duration-300 ${
          rightSidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        }`}>
          <div className="w-full h-full relative flex flex-col bg-slate-950">
            <SidebarRight
              darkMode={darkMode}
              campaigns={campaigns}
              reasoningSteps={reasoningSteps}
              activityLogs={activityLogs}
              latencyMetrics={latencyMetrics}
              appointment={appointment}
              onCallCampaign={handleCallCampaign}
              onAddLog={addLog}
            />
            {/* Close button for Mobile drawers */}
            <button
              onClick={() => setRightSidebarOpen(false)}
              className="absolute top-4 left-4 p-1.5 rounded bg-slate-900 border border-slate-800 lg:hidden text-slate-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Overlay block for mobile drawers */}
        {(leftSidebarOpen || rightSidebarOpen) && (
          <div 
            onClick={() => {
              setLeftSidebarOpen(false);
              setRightSidebarOpen(false);
            }} 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-10 lg:hidden transition-all"
          />
        )}

      </div>

    </div>
  );
}
