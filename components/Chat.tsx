
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { marked } from 'marked';
import { askTutor, textToSpeech, startLiveSession, decodeAudio, decodeAudioData, createAudioBlob, generateChatTitle } from '../services/geminiService';
import { type ChatMessage, type ChatSession } from '../types';
import ErrorDisplay from './ErrorDisplay';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import { BotIcon, UserIcon, MicrophoneIcon, SpeakerWaveIcon, PaperAirplaneIcon, SparklesIcon, PaperClipIcon, XMarkIcon, TrashIcon, ClipboardIcon, CheckIcon, PhoneWaveIcon, StopIcon, Bars3Icon, HandThumbUpIcon, HandThumbDownIcon, ChatBubbleLeftIcon, LinkIcon, PlusIcon } from './icons/ActionIcons';
import { BrainCircuitIcon } from './icons/SubjectIcons';
import { type LiveServerMessage, type LiveSession } from '@google/genai';
import ChatHistorySidebar from './ChatHistorySidebar';
import { LearnMateLogo } from './icons/BrandIcons';

type ChatMode = 'text' | 'voice';
type LiveStatus = 'idle' | 'connecting' | 'connected' | 'error' | 'disconnected';

declare global {
    interface Window {
        webkitAudioContext: typeof AudioContext;
    }
}

// =================================================================================
// Live Session Custom Hook
// =================================================================================

const useLiveSession = (onTurnComplete: (input: string, output: string) => void) => {
    const [liveStatus, setLiveStatus] = useState<LiveStatus>('idle');
    const [error, setError] = useState<string | null>(null);

    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const nextStartTimeRef = useRef(0);
    const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const currentInputTranscription = useRef('');
    const currentOutputTranscription = useRef('');

    const clearError = useCallback(() => setError(null), []);

    const cleanupLiveSession = useCallback(() => {
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }
        if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') inputAudioContextRef.current.close();
        if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') outputAudioContextRef.current.close();
        
        audioSourcesRef.current.forEach(source => source.stop());
        audioSourcesRef.current.clear();
        nextStartTimeRef.current = 0;
    }, []);

    const stopSession = useCallback(async () => {
        setLiveStatus('disconnected');
        if (sessionPromiseRef.current) {
            try {
                const session = await sessionPromiseRef.current;
                session.close();
            } catch (e) {
                console.error("Error closing session:", e);
            }
            sessionPromiseRef.current = null;
        }
        cleanupLiveSession();
    }, [cleanupLiveSession]);

    const startSession = useCallback(async () => {
        setLiveStatus('connecting');
        setError(null);
        currentInputTranscription.current = '';
        currentOutputTranscription.current = '';

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;

            inputAudioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });

            sessionPromiseRef.current = startLiveSession({
                onopen: () => {
                    setLiveStatus('connected');
                    if (!mediaStreamRef.current || !inputAudioContextRef.current) return;
                    
                    const source = inputAudioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
                    scriptProcessorRef.current = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
                    
                    scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                        const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                        const pcmBlob = createAudioBlob(inputData, inputAudioContextRef.current?.sampleRate || 16000);
                        sessionPromiseRef.current?.then((session) => {
                          session.sendRealtimeInput({ media: pcmBlob });
                        });
                    };
                    source.connect(scriptProcessorRef.current);
                    scriptProcessorRef.current.connect(inputAudioContextRef.current.destination);
                },
                onmessage: async (message: LiveServerMessage) => {
                    if (message.serverContent?.outputTranscription) currentOutputTranscription.current += message.serverContent.outputTranscription.text;
                    if (message.serverContent?.inputTranscription) currentInputTranscription.current += message.serverContent.inputTranscription.text;

                    if (message.serverContent?.turnComplete) {
                        const finalInput = currentInputTranscription.current;
                        const finalOutput = currentOutputTranscription.current;
                        if(finalInput.trim() && finalOutput.trim()) {
                            onTurnComplete(finalInput, finalOutput);
                        }
                        currentInputTranscription.current = '';
                        currentOutputTranscription.current = '';
                    }

                    const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                    if (base64Audio && outputAudioContextRef.current) {
                        const outputCtx = outputAudioContextRef.current;
                        nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
                        const audioBuffer = await decodeAudioData(decodeAudio(base64Audio), outputCtx, 24000, 1);
                        const source = outputCtx.createBufferSource();
                        source.buffer = audioBuffer;
                        source.connect(outputCtx.destination);
                        source.addEventListener('ended', () => audioSourcesRef.current.delete(source));
                        source.start(nextStartTimeRef.current);
                        nextStartTimeRef.current += audioBuffer.duration;
                        audioSourcesRef.current.add(source);
                    }
                },
                onerror: (e: Error) => {
                    console.error('Session error:', e);
                    let errorMessage = "An error occurred with the live session. Please try again.";
                    if (e.message?.toLowerCase().includes('network')) {
                         errorMessage = "A network error occurred during the session. Please check your connection and try again.";
                    }
                    setError(errorMessage);
                    stopSession();
                },
                onclose: () => stopSession(),
            });
            
            await sessionPromiseRef.current;

        } catch (e) {
            console.error("Failed to start session:", e);
            let errorMessage = "Could not start live session. Please try again.";
             if (e instanceof Error) {
                if (e.name === 'NotAllowedError' || e.message.includes('Permission denied')) {
                    errorMessage = 'Microphone permission was denied. Please enable it in your browser settings to use voice chat.';
                } else if (e.message.toLowerCase().includes('network')) {
                    errorMessage = "A network error occurred while connecting. Please check your connection and try again.";
                } else {
                    errorMessage = `Could not start live session: ${e.message}`;
                }
            }
            setError(errorMessage);
            setLiveStatus('error');
            cleanupLiveSession();
        }
    }, [onTurnComplete, stopSession, cleanupLiveSession]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopSession();
        };
    }, [stopSession]);

    return {
        liveStatus,
        error,
        clearError,
        startSession,
        stopSession,
        isLiveSessionActive: liveStatus === 'connected' || liveStatus === 'connecting'
    };
};

// =================================================================================
// Chat Message Component
// =================================================================================
interface ChatMessageBubbleProps {
  msg: ChatMessage;
  index: number;
  onPlayAudio: (text: string, index: number) => void;
  onCopyText: (text: string, index: number) => void;
  onFeedback: (index: number, feedback: 'good' | 'bad') => void;
  currentlyPlayingIndex: number | null;
  copiedStates: { [key: string]: boolean };
}

const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = React.memo(({ msg, index, onPlayAudio, onCopyText, onFeedback, currentlyPlayingIndex, copiedStates }) => {
    const isUser = msg.role === 'user';
    const isBot = msg.role === 'model';
    const showTypingIndicator = isBot && msg.isStreaming && msg.content.length === 0;

    return (
        <div className={`flex gap-4 w-full animate-slide-in-up mb-6 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
            {isBot ? (
                <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 mt-1 transition-transform hover:scale-110 relative z-10">
                    <LearnMateLogo className="w-6 h-6 md:w-7 md:h-7" />
                </div>
            ) : (
                <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-indigo-500 to-primary flex items-center justify-center text-white shadow-lg mt-1 transition-transform hover:scale-110 relative z-10">
                    <UserIcon className="w-5 h-5" />
                </div>
            )}
            
            <div className={`group relative max-w-[90%] sm:max-w-[85%] md:max-w-2xl min-w-0 flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                {msg.thinkingMode && (
                    <div className={`flex items-center text-[10px] font-bold uppercase tracking-wider mb-1 px-2 py-0.5 rounded-full w-fit ${isUser ? 'mr-1 text-gray-500' : 'ml-1 text-purple-600 bg-purple-50 border border-purple-100'}`}>
                        <BrainCircuitIcon className="w-3 h-3 mr-1.5"/> Pro Model
                    </div>
                )}

                <div className={`px-5 py-3.5 text-[15px] leading-relaxed shadow-sm transition-all duration-200 relative
                    ${isUser 
                        ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-2xl rounded-tr-sm shadow-md' 
                        : 'bg-white border border-gray-100 text-gray-800 rounded-2xl rounded-tl-sm shadow-sm'
                    }`}
                >
                    
                    {showTypingIndicator ? (
                        <div className="flex items-center gap-1.5 h-6 px-1">
                            <span className="w-2 h-2 bg-gray-400/70 rounded-full animate-[bounce_1.4s_infinite_ease-in-out_-0.32s]"></span>
                            <span className="w-2 h-2 bg-gray-400/70 rounded-full animate-[bounce_1.4s_infinite_ease-in-out_-0.16s]"></span>
                            <span className="w-2 h-2 bg-gray-400/70 rounded-full animate-[bounce_1.4s_infinite_ease-in-out]"></span>
                        </div>
                    ) : (
                        isBot ? (
                            <div className={`markdown-content ${msg.isStreaming ? 'is-streaming' : ''}`} dangerouslySetInnerHTML={{ __html: marked.parse(msg.content) as string }}/>
                        ) : (
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                        )
                    )}

                    {msg.imageUrl && (
                        <div className="mt-3">
                             <img src={msg.imageUrl} alt="User upload" className="rounded-xl max-w-full sm:max-w-xs shadow-sm border border-gray-200" />
                        </div>
                    )}
                    
                    {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                            <p className="text-xs font-bold text-gray-500 mb-2 flex items-center"><LinkIcon className="w-3 h-3 mr-1"/> Sources</p>
                            <ul className="space-y-1">
                                {msg.sources.map((source, i) => (
                                    <li key={i}>
                                        <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline truncate block">
                                            {source.title || source.uri}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Bot Actions */}
                {!showTypingIndicator && isBot && (
                    <div className="flex items-center mt-1 space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 px-1">
                         <button 
                            onClick={() => onPlayAudio(msg.content, index)}
                            className={`p-1.5 rounded-full hover:bg-gray-100 transition-colors ${currentlyPlayingIndex === index ? 'text-primary' : 'text-gray-400'}`}
                            title="Read Aloud"
                        >
                            <SpeakerWaveIcon className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => onCopyText(msg.content, index)}
                            className={`p-1.5 rounded-full hover:bg-gray-100 transition-colors ${copiedStates[index] ? 'text-green-500' : 'text-gray-400'}`}
                            title="Copy"
                        >
                            {copiedStates[index] ? <CheckIcon className="w-4 h-4" /> : <ClipboardIcon className="w-4 h-4" />}
                        </button>
                        <div className="h-3 w-px bg-gray-200 mx-1"></div>
                        <button 
                            onClick={() => onFeedback(index, 'good')}
                            className={`p-1.5 rounded-full hover:bg-green-50 transition-colors ${msg.feedback === 'good' ? 'text-green-500' : 'text-gray-400 hover:text-green-500'}`}
                        >
                            <HandThumbUpIcon className="w-4 h-4" />
                        </button>
                         <button 
                            onClick={() => onFeedback(index, 'bad')}
                            className={`p-1.5 rounded-full hover:bg-red-50 transition-colors ${msg.feedback === 'bad' ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
                        >
                            <HandThumbDownIcon className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
});

// =================================================================================
// Chat Main Component
// =================================================================================

const Chat: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isThinkingMode, setIsThinkingMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentlyPlayingIndex, setCurrentlyPlayingIndex] = useState<number | null>(null);
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>({});
  
  // Sidebar states
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { isListening, transcript, startListening, stopListening, isSupported } = useSpeechRecognition();

  // Load Sessions
  useEffect(() => {
    try {
        const savedSessions = localStorage.getItem('learnMateChatSessions');
        if (savedSessions) {
            const parsed = JSON.parse(savedSessions);
            setSessions(parsed);
        }
    } catch (e) {
        console.error("Failed to load sessions", e);
    }
  }, []);

  // Save Sessions
  useEffect(() => {
      if (sessions.length > 0) {
          localStorage.setItem('learnMateChatSessions', JSON.stringify(sessions));
      }
  }, [sessions]);

  // Sync Transcript
  useEffect(() => {
    if (transcript) setInput(transcript);
  }, [transcript]);

  // Auto-resize textarea
  useEffect(() => {
      if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
          textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
      }
  }, [input]);

  const activeSession = useMemo(() => sessions.find(s => s.id === activeSessionId), [sessions, activeSessionId]);
  const messages = activeSession?.messages || [];

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
      // Use 'auto' behavior during streaming to prevent visual jitter
      // Use 'smooth' when loading starts or finishes to provide visual context
      if (isLoading && messages.length > 0 && messages[messages.length - 1].role === 'model') {
           scrollToBottom('auto');
      } else {
           scrollToBottom('smooth');
      }
  }, [messages, isLoading]);

  const handleNewChat = () => {
      const newSession: ChatSession = {
          id: Date.now().toString(),
          name: 'New Conversation',
          messages: [],
          createdAt: Date.now(),
      };
      setSessions([newSession, ...sessions]);
      setActiveSessionId(newSession.id);
      setMobileSidebarOpen(false); // Close sidebar on mobile on new chat
      setTimeout(() => {
        if(textareaRef.current) textareaRef.current.focus();
      }, 100);
  };

  const updateSession = (sessionId: string, updater: (session: ChatSession) => ChatSession) => {
      setSessions(prev => prev.map(s => s.id === sessionId ? updater(s) : s));
  };

  const handleSendMessage = async () => {
      if ((!input.trim() && !imageFile) || isLoading || !activeSessionId) return;
      if (!activeSessionId && sessions.length === 0) {
          handleNewChat();
          return;
      }
      
      const currentSessionId = activeSessionId;
      const userMessageText = input.trim();
      const userImage = imageFile;
      
      // Reset Input State
      setInput('');
      setImageFile(null);
      setImagePreview(null);
      setIsLoading(true);
      setError(null);
      if (textareaRef.current) textareaRef.current.style.height = 'auto';

      // 1. Add User Message
      const newMessage: ChatMessage = {
          role: 'user',
          content: userMessageText,
          imageUrl: userImage ? URL.createObjectURL(userImage) : undefined,
          thinkingMode: isThinkingMode,
      };

      updateSession(currentSessionId, session => ({
          ...session,
          messages: [...session.messages, newMessage]
      }));

      // 2. Add Placeholder Bot Message
      updateSession(currentSessionId, session => ({
          ...session,
          messages: [...session.messages, { role: 'model', content: '', isStreaming: true }]
      }));

      // Generate Title if first message
      const currentSession = sessions.find(s => s.id === currentSessionId);
      if (currentSession && currentSession.messages.length === 0) {
           generateChatTitle(userMessageText).then(title => {
               updateSession(currentSessionId, s => ({ ...s, name: title }));
           });
      }

      // 3. Setup Streaming Buffers
      let streamText = '';
      let displayedText = '';
      let isComplete = false;
      let streamAnimation: number;

      const animateStream = () => {
          // If we have more text in the stream buffer than displayed
          if (displayedText.length < streamText.length) {
              const delta = streamText.length - displayedText.length;
              // Smooth typing: add chunks based on how far behind we are
              // Optimization: Increase chunk size slightly to speed up perception without losing smoothness
              const chunk = Math.max(1, Math.round(delta / 1.5)); 
              const nextContent = streamText.slice(0, displayedText.length + chunk);
              displayedText = nextContent;

              updateSession(currentSessionId, session => {
                   const msgs = session.messages;
                   if (msgs.length === 0) return session;
                   const lastMsgIndex = msgs.length - 1;
                   const lastMsg = msgs[lastMsgIndex];
                   
                   // Ensure we are updating the correct bot message (the one currently streaming)
                   if (lastMsg.role === 'model' && lastMsg.isStreaming) {
                       const newMsgs = [...msgs];
                       newMsgs[lastMsgIndex] = { ...lastMsg, content: nextContent };
                       return { ...session, messages: newMsgs };
                   }
                   return session;
               });
          }
          
          // Continue loop if not complete or if display hasn't caught up
          if (!isComplete || displayedText.length < streamText.length) {
              streamAnimation = requestAnimationFrame(animateStream);
          } else {
               // Finalize message state
               updateSession(currentSessionId, session => {
                 const msgs = session.messages;
                 const lastMsgIndex = msgs.length - 1;
                 const lastMsg = msgs[lastMsgIndex];
                 return {
                     ...session,
                     messages: [
                         ...msgs.slice(0, -1),
                         { ...lastMsg, isStreaming: false, sources: finalSources } 
                     ]
                 };
             });
             setIsLoading(false);
          }
      };

      // Start animation loop
      streamAnimation = requestAnimationFrame(animateStream);

      let finalSources: any = undefined;

      try {
          const { sources } = await askTutor(
              userMessageText,
              userImage,
              isThinkingMode,
              (chunk) => {
                   // Just append to the stream buffer
                   if (chunk) streamText += chunk;
              }
          );
          finalSources = sources;
      } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to send message.');
          setIsLoading(false);
          cancelAnimationFrame(streamAnimation);
           updateSession(currentSessionId, session => {
               return {
                   ...session,
                   messages: session.messages.filter(m => !m.isStreaming)
               };
           });
      } finally {
          isComplete = true;
      }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          if (file.size > 5 * 1024 * 1024) {
              alert("Image size limit is 5MB");
              return;
          }
          setImageFile(file);
          setImagePreview(URL.createObjectURL(file));
      }
  };

  const handleCopy = (text: string, index: number) => {
      navigator.clipboard.writeText(text);
      setCopiedStates(prev => ({ ...prev, [index]: true }));
      setTimeout(() => setCopiedStates(prev => ({ ...prev, [index]: false })), 2000);
  };

  const handlePlayAudio = async (text: string, index: number) => {
        if (currentlyPlayingIndex === index) {
            audioRef.current?.pause();
            audioRef.current = null;
            setCurrentlyPlayingIndex(null);
            return;
        }

        try {
            const audioData = await textToSpeech(text);
            if (audioData) {
                const audio = new Audio(`data:audio/mp3;base64,${audioData}`);
                audioRef.current = audio;
                setCurrentlyPlayingIndex(index);
                audio.play();
                audio.onended = () => setCurrentlyPlayingIndex(null);
            }
        } catch (e) {
            console.error("Audio playback error", e);
            setError("Failed to play audio.");
        }
  };

  const handleFeedback = (index: number, type: 'good' | 'bad') => {
      if (!activeSessionId) return;
      updateSession(activeSessionId, session => {
          const newMessages = [...session.messages];
          if (newMessages[index]) {
              newMessages[index] = { ...newMessages[index], feedback: type };
          }
          return { ...session, messages: newMessages };
      });
  };

  // Live Session Handler
  const { isLiveSessionActive, startSession, stopSession, error: liveError } = useLiveSession((input, output) => {
      // Called when a live turn completes
      if (!activeSessionId) {
           const newId = Date.now().toString();
           const newSession: ChatSession = {
              id: newId,
              name: 'Live Conversation',
              messages: [],
              createdAt: Date.now()
           };
           setSessions(prev => [newSession, ...prev]);
           setActiveSessionId(newId);
           
           // Add messages to new session
           setTimeout(() => {
               updateSession(newId, s => ({
                   ...s,
                   messages: [
                       { role: 'user', content: input, modality: 'voice' },
                       { role: 'model', content: output, modality: 'voice' }
                   ]
               }));
           }, 0);
      } else {
           updateSession(activeSessionId, s => ({
               ...s,
               messages: [
                   ...s.messages,
                   { role: 'user', content: input, modality: 'voice' },
                   { role: 'model', content: output, modality: 'voice' }
               ]
           }));
      }
  });

  const toggleSidebar = () => {
      if (window.innerWidth >= 768) {
          setDesktopSidebarOpen(!desktopSidebarOpen);
      } else {
          setMobileSidebarOpen(!mobileSidebarOpen);
      }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)] bg-white overflow-hidden relative">
        {/* Sidebar - Desktop */}
        <div className={`hidden md:block transition-all duration-300 ease-in-out border-r border-gray-100 flex-shrink-0 ${desktopSidebarOpen ? 'w-80 translate-x-0' : 'w-0 -translate-x-full opacity-0 overflow-hidden'}`}>
             <ChatHistorySidebar 
                sessions={sessions}
                activeSessionId={activeSessionId}
                onNewChat={handleNewChat}
                onSelectSession={setActiveSessionId}
                onDeleteSession={(id) => {
                    setSessions(prev => prev.filter(s => s.id !== id));
                    if(activeSessionId === id) setActiveSessionId(null);
                }}
                onRenameSession={(id, name) => updateSession(id, s => ({ ...s, name }))}
             />
        </div>

        {/* Sidebar - Mobile Overlay */}
        {mobileSidebarOpen && (
            <div className="absolute inset-0 z-30 flex md:hidden">
                <div className="w-80 h-full bg-white shadow-2xl animate-slide-in-up">
                    <ChatHistorySidebar 
                        sessions={sessions}
                        activeSessionId={activeSessionId}
                        onNewChat={handleNewChat}
                        onSelectSession={(id) => { setActiveSessionId(id); setMobileSidebarOpen(false); }}
                        onDeleteSession={(id) => {
                            setSessions(prev => prev.filter(s => s.id !== id));
                            if(activeSessionId === id) setActiveSessionId(null);
                        }}
                        onRenameSession={(id, name) => updateSession(id, s => ({ ...s, name }))}
                    />
                </div>
                <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={() => setMobileSidebarOpen(false)}></div>
            </div>
        )}

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col h-full relative w-full">
            {/* Live Mode Overlay */}
            {isLiveSessionActive && (
                <div className="absolute inset-0 z-20 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center animate-fade-in">
                    <div className="relative mb-6">
                        <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping"></div>
                        <div className="w-32 h-32 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center shadow-2xl relative z-10 animate-pulse">
                            <PhoneWaveIcon className="w-16 h-16 text-white" />
                        </div>
                    </div>
                    
                    {/* Audio Visualizer Waves */}
                    <div className="flex items-center justify-center gap-1.5 h-12 mb-8">
                        {[...Array(5)].map((_, i) => (
                            <div 
                                key={i} 
                                className="w-1.5 bg-red-500 rounded-full animate-music-bar" 
                                style={{ animationDelay: `${i * 0.15}s`, height: '30%' }}
                            ></div>
                        ))}
                    </div>

                    <h3 className="text-2xl font-bold text-gray-900">Live Voice Chat Active</h3>
                    <p className="text-gray-500 mt-2 mb-8">Listening...</p>
                    <button onClick={stopSession} className="px-8 py-3 bg-gray-200 text-gray-800 font-bold rounded-full hover:bg-gray-300 transition-colors flex items-center">
                        <StopIcon className="w-5 h-5 mr-2" /> End Session
                    </button>
                </div>
            )}

            {/* Chat Header / Top Bar - Visible on all screens to house toggle */}
            <div className="flex items-center justify-between p-3 border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
                <button onClick={toggleSidebar} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                    <Bars3Icon className="w-6 h-6" />
                </button>
                <span className="font-bold text-gray-800 truncate flex-1 text-center md:text-left md:ml-4">
                    {activeSession ? activeSession.name : 'LearnMate AI'}
                </span>
                <button onClick={handleNewChat} className="p-2 -mr-2 text-primary hover:bg-primary/10 rounded-lg transition-colors">
                    <PlusIcon className="w-6 h-6" />
                </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-2 scroll-smooth">
                {!activeSessionId ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-0 animate-fade-in" style={{ animationFillMode: 'forwards' }}>
                        <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-indigo-50">
                            <LearnMateLogo className="w-12 h-12" />
                        </div>
                        <h2 className="text-3xl font-extrabold text-gray-900 mb-3">Hello, Student!</h2>
                        <p className="text-gray-500 max-w-md mb-8 leading-relaxed">
                            I'm your AI tutor. I can help with homework, explain complex topics, or just chat. 
                            Start a new conversation to begin.
                        </p>
                        <button onClick={handleNewChat} className="px-8 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-all shadow-lg hover:shadow-primary/30 transform hover:-translate-y-1">
                            Start Learning
                        </button>
                        
                        <div className="mt-12 grid grid-cols-2 gap-4 max-w-lg w-full">
                            <button onClick={() => { handleNewChat(); setTimeout(() => setInput("Help me solve a quadratic equation"), 100); }} className="p-4 bg-gray-50 hover:bg-white border border-transparent hover:border-gray-200 rounded-xl text-left transition-all shadow-sm hover:shadow-md">
                                <span className="block text-sm font-bold text-gray-800 mb-1">Math Help</span>
                                <span className="text-xs text-gray-500">Solve quadratic equations</span>
                            </button>
                            <button onClick={() => { handleNewChat(); setTimeout(() => setInput("Explain quantum entanglement simply"), 100); }} className="p-4 bg-gray-50 hover:bg-white border border-transparent hover:border-gray-200 rounded-xl text-left transition-all shadow-sm hover:shadow-md">
                                <span className="block text-sm font-bold text-gray-800 mb-1">Physics Concept</span>
                                <span className="text-xs text-gray-500">Explain quantum physics</span>
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        {messages.length === 0 && (
                            <div className="text-center py-10 text-gray-400">
                                <p>Start typing to chat...</p>
                            </div>
                        )}
                        {messages.map((msg, index) => (
                            <ChatMessageBubble 
                                key={index} 
                                msg={msg} 
                                index={index}
                                onPlayAudio={handlePlayAudio}
                                onCopyText={handleCopy}
                                onFeedback={handleFeedback}
                                currentlyPlayingIndex={currentlyPlayingIndex}
                                copiedStates={copiedStates}
                            />
                        ))}
                        <div ref={messagesEndRef} className="h-4" />
                    </>
                )}
            </div>

            {/* Error Toast */}
            {(error || liveError) && (
                <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 z-20 w-[90%] max-w-md">
                    <ErrorDisplay message={error || liveError} onClear={() => { setError(null); /* clear live error via hook if exposed */ }} />
                </div>
            )}

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-100 sticky bottom-0 z-10">
                <div className="max-w-4xl mx-auto relative">
                    {imagePreview && (
                        <div className="absolute bottom-full left-0 mb-4 ml-2 animate-slide-in-up">
                            <div className="relative group">
                                <img src={imagePreview} alt="Preview" className="h-20 w-20 object-cover rounded-xl border-2 border-white shadow-lg" />
                                <button 
                                    onClick={() => { setImageFile(null); setImagePreview(null); }}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-sm hover:bg-red-600 transition-colors"
                                >
                                    <XMarkIcon className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col gap-3">
                         {/* Controls Bar */}
                         <div className="flex items-center justify-between px-1">
                             <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => setIsThinkingMode(!isThinkingMode)}
                                    className={`flex items-center px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                                        isThinkingMode 
                                        ? 'bg-purple-100 text-purple-700 border-purple-200' 
                                        : 'bg-gray-100 text-gray-500 border-transparent hover:bg-gray-200'
                                    }`}
                                >
                                    <BrainCircuitIcon className="w-3.5 h-3.5 mr-1.5" />
                                    Thinking Mode
                                </button>
                             </div>
                             
                             <div className="flex items-center gap-2">
                                 <button 
                                     onClick={isLiveSessionActive ? stopSession : startSession}
                                     className={`p-2 rounded-full transition-all ${isLiveSessionActive ? 'bg-red-100 text-red-600 animate-pulse' : 'hover:bg-gray-100 text-gray-500'}`}
                                     title="Live Voice Chat"
                                 >
                                     <PhoneWaveIcon className="w-5 h-5" />
                                 </button>
                             </div>
                         </div>

                         {/* Input Box */}
                         <div className={`flex items-end gap-2 bg-gray-50 border border-gray-200 p-2 rounded-[1.5rem] transition-all duration-200 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 focus-within:bg-white shadow-sm ${isLoading ? 'opacity-70 pointer-events-none' : ''}`}>
                            <label className="p-3 text-gray-400 hover:text-primary cursor-pointer transition-colors rounded-full hover:bg-gray-100">
                                <PaperClipIcon className="w-5 h-5" />
                                <input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
                            </label>
                            
                            <textarea
                                ref={textareaRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage();
                                    }
                                }}
                                placeholder={isListening ? "Listening..." : "Ask anything..."}
                                className="flex-1 bg-transparent border-none focus:ring-0 max-h-32 py-3 px-1 text-gray-800 placeholder-gray-400 resize-none leading-relaxed"
                                rows={1}
                            />
                            
                            <div className="flex items-center gap-1 pb-1">
                                {isLoading ? (
                                     <button 
                                        disabled
                                        className="p-2.5 bg-gray-50 text-primary rounded-full cursor-wait shadow-sm border border-gray-100"
                                    >
                                        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                    </button>
                                ) : (input.trim() || imageFile) ? (
                                    <button 
                                        onClick={handleSendMessage}
                                        disabled={isLoading}
                                        className="p-2.5 bg-gradient-to-r from-primary to-indigo-600 text-white rounded-full hover:shadow-lg hover:shadow-primary/30 transform active:scale-95 transition-all duration-200 group"
                                    >
                                        <PaperAirplaneIcon className="w-5 h-5 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
                                    </button>
                                ) : (
                                    <button 
                                        onClick={isListening ? stopListening : startListening}
                                        className={`p-2.5 rounded-full transition-all ${isListening ? 'bg-red-500 text-white animate-pulse shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                    >
                                        {isListening ? <StopIcon className="w-5 h-5" /> : <MicrophoneIcon className="w-5 h-5" />}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default Chat;
