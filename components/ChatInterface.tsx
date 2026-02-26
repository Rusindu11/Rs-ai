import React, { useState, useRef, useEffect } from 'react';
import { Send, Image as ImageIcon, Youtube, BrainCircuit, Mic, MicOff } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message, Sender, GradeLevel, Language } from '../types';
import { sendMessageToGemini } from '../services/geminiService';
import CartoonTeacher from './CartoonTeacher';

// Add type definitions for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface ChatInterfaceProps {
  grade: GradeLevel;
  subject: string;
  language: Language;
  onMessageSent: () => void;
}

// Custom Markdown Components for Tailwind Styling
const MarkdownComponents = {
  h1: ({node, ...props}: any) => <h1 className="text-xl md:text-2xl font-bold mb-3 mt-4 text-blue-800" {...props} />,
  h2: ({node, ...props}: any) => <h2 className="text-lg md:text-xl font-bold mb-2 mt-3 text-blue-700" {...props} />,
  h3: ({node, ...props}: any) => <h3 className="text-base md:text-lg font-bold mb-2 mt-2 text-slate-800" {...props} />,
  p: ({node, ...props}: any) => <p className="mb-2 last:mb-0 leading-relaxed" {...props} />,
  ul: ({node, ...props}: any) => <ul className="list-disc pl-5 mb-3 space-y-1 text-slate-700" {...props} />,
  ol: ({node, ...props}: any) => <ol className="list-decimal pl-5 mb-3 space-y-1 text-slate-700" {...props} />,
  li: ({node, ...props}: any) => <li className="pl-1" {...props} />,
  strong: ({node, ...props}: any) => <span className="font-bold text-slate-900" {...props} />,
  em: ({node, ...props}: any) => <span className="italic" {...props} />,
  blockquote: ({node, ...props}: any) => <blockquote className="border-l-4 border-blue-400 pl-4 py-2 my-3 bg-blue-50 italic text-slate-600 rounded-r" {...props} />,
  code: ({node, inline, className, children, ...props}: any) => {
      if (inline) {
          return <code className="bg-slate-100 text-red-600 px-1 py-0.5 rounded text-sm font-mono border border-slate-200" {...props}>{children}</code>;
      }
      return (
          <div className="bg-slate-800 text-slate-100 p-3 rounded-lg overflow-x-auto my-3 text-sm font-mono shadow-sm">
              <code {...props}>{children}</code>
          </div>
      );
  },
  a: ({node, ...props}: any) => <a className="text-blue-600 hover:underline font-medium" target="_blank" rel="noopener noreferrer" {...props} />,
  
  // GFM Table Support
  table: ({node, ...props}: any) => <div className="overflow-x-auto my-4 rounded-lg border border-slate-200 shadow-sm"><table className="min-w-full divide-y divide-slate-200" {...props} /></div>,
  thead: ({node, ...props}: any) => <thead className="bg-slate-50" {...props} />,
  tbody: ({node, ...props}: any) => <tbody className="bg-white divide-y divide-slate-200" {...props} />,
  tr: ({node, ...props}: any) => <tr className="hover:bg-slate-50/50 transition-colors" {...props} />,
  th: ({node, ...props}: any) => <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider" {...props} />,
  td: ({node, ...props}: any) => <td className="px-4 py-3 text-sm text-slate-700 whitespace-normal break-words leading-relaxed" {...props} />,
  del: ({node, ...props}: any) => <del className="text-slate-400 line-through decoration-slate-400 decoration-2" {...props} />,
};

const ChatInterface: React.FC<ChatInterfaceProps> = ({ grade, subject, language, onMessageSent }) => {
  
  // --- Dynamic Welcome Message ---
  const getWelcomeMessage = (lang: Language, sub: string) => {
     if (lang === 'sinhala') return `ආයුබෝවන් දුවේ/පුතේ! මම ගුරු තුමා. අද අපි **${sub}** පාඩම ගැන කතා කරමු.`;
     if (lang === 'tamil') return `வணக்கம்! நான் உங்கள் ஆசிரியர். இன்று நாம் **${sub}** பாடம் பற்றி பேசுவோம்.`;
     return `Hello! I am your Tutor. Let's discuss **${sub}** today.`;
  };

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      text: getWelcomeMessage(language, subject),
      sender: Sender.BOT,
      timestamp: Date.now()
    }
  ]);
  
  // Reset welcome message when subject/language changes
  useEffect(() => {
    setMessages([{
      id: 'welcome-' + Date.now(),
      text: getWelcomeMessage(language, subject),
      sender: Sender.BOT,
      timestamp: Date.now()
    }]);
  }, [language, subject]);

  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTalking, setIsTalking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, isTalking]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleVoiceInput = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Browser does not support voice input");
      return;
    }

    const recognition = new SpeechRecognition();
    
    // Set language based on app state
    if (language === 'sinhala') recognition.lang = 'si-LK';
    else if (language === 'tamil') recognition.lang = 'ta-LK';
    else recognition.lang = 'en-US';

    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event: any) => {
      console.error("Speech error", event.error);
      setIsListening(false);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputText((prev) => (prev ? prev + " " + transcript : transcript));
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleSend = async () => {
    if ((!inputText.trim() && !selectedImage) || isLoading) return;

    if (isListening && recognitionRef.current) {
        recognitionRef.current.stop();
        setIsListening(false);
    }

    onMessageSent();

    const userMsg: Message = {
      id: Date.now().toString(),
      text: inputText,
      image: selectedImage ? selectedImage.split(',')[1] : undefined,
      sender: Sender.USER,
      timestamp: Date.now()
    };

    const displayMsg = { ...userMsg, image: selectedImage || undefined };

    setMessages(prev => [...prev, displayMsg]);
    setInputText('');
    setSelectedImage(null);
    setIsLoading(true);
    setIsTalking(false);

    try {
      const history = messages.slice(-6).map(m => ({
        role: m.sender === Sender.USER ? 'user' : 'model',
        parts: [{ text: m.text }] 
      }));

      const response = await sendMessageToGemini(
        userMsg.text || (userMsg.image ? "Explain this image" : ""),
        userMsg.image, 
        grade,
        subject,
        language,
        history
      );

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: response.text,
        sender: Sender.BOT,
        timestamp: Date.now(),
        relatedVideos: response.videos
      };

      setMessages(prev => [...prev, botMsg]);
      setIsLoading(false);
      setIsTalking(true);
      const talkDuration = Math.min(Math.max(response.text.length * 50, 2000), 6000);
      setTimeout(() => setIsTalking(false), talkDuration);

    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        text: "Error occurred. Please try again.",
        sender: Sender.BOT,
        timestamp: Date.now(),
        isError: true
      }]);
      setIsLoading(false);
      setIsTalking(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200">
      
      {/* Teacher Area */}
      <div className="bg-gradient-to-b from-blue-50 to-white p-4 border-b border-slate-100 flex-shrink-0">
        <CartoonTeacher 
            isTalking={isTalking} 
            emotion={isLoading ? 'thinking' : 'happy'} 
        />
        <div className="text-center text-sm text-slate-500 font-medium">
            {grade} • <span className="text-blue-600 font-bold">{subject}</span>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === Sender.USER ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${
                msg.sender === Sender.USER
                  ? 'bg-blue-600 text-white rounded-tr-none'
                  : 'bg-white text-slate-800 rounded-tl-none border border-slate-200'
              }`}
            >
              {msg.image && (
                <img 
                  src={msg.image} 
                  alt="User upload" 
                  className="max-w-full h-auto rounded-lg mb-2 max-h-48 object-cover" 
                />
              )}
              
              <div className="text-sm md:text-base">
                {msg.sender === Sender.BOT ? (
                  <Markdown components={MarkdownComponents} remarkPlugins={[remarkGfm]}>
                    {msg.text}
                  </Markdown>
                ) : (
                  <div className="whitespace-pre-line">{msg.text}</div>
                )}
              </div>

              {/* Related Videos */}
              {msg.relatedVideos && msg.relatedVideos.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
                    <Youtube size={14} className="text-red-500"/> Recommended Videos
                  </p>
                  <div className="space-y-2">
                    {msg.relatedVideos.map((video, idx) => (
                      <a 
                        key={idx}
                        href={`https://www.youtube.com/results?search_query=${encodeURIComponent(video.searchQuery)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="block bg-slate-50 hover:bg-slate-100 p-2 rounded-lg transition-colors border border-slate-200"
                      >
                        <div className="text-blue-600 font-semibold text-sm">{video.title}</div>
                        <div className="text-slate-500 text-xs">{video.description}</div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
            <div className="flex justify-start">
                <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm border border-slate-200 flex items-center gap-2 animate-pulse">
                    <BrainCircuit className="animate-spin text-purple-500" size={16} />
                    <span className="text-xs text-slate-500 font-medium">Thinking...</span>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-200">
        
        {selectedImage && (
            <div className="mb-2 relative inline-block">
                <img src={selectedImage} alt="Preview" className="h-16 w-16 object-cover rounded-lg border border-slate-300" />
                <button 
                    onClick={() => setSelectedImage(null)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                >
                    &times;
                </button>
            </div>
        )}

        <div className="flex items-center gap-2">
            <label className="cursor-pointer p-2 text-slate-400 hover:text-blue-600 transition-colors">
                <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden"
                    onChange={handleImageUpload}
                />
                <ImageIcon size={24} />
            </label>

            <button
                onClick={toggleVoiceInput}
                className={`p-2 rounded-full transition-all duration-300 ${
                  isListening 
                    ? 'bg-red-100 text-red-600 animate-pulse ring-2 ring-red-400' 
                    : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'
                }`}
            >
              {isListening ? <MicOff size={24} /> : <Mic size={24} />}
            </button>

            <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={isListening ? "Listening..." : "Type here..."}
                className={`flex-1 p-3 rounded-full bg-slate-100 border-transparent focus:border-blue-500 focus:bg-white focus:ring-0 transition-all text-sm md:text-base outline-none ${isListening ? 'placeholder-red-400' : ''}`}
            />
            <button
                onClick={handleSend}
                disabled={(!inputText.trim() && !selectedImage) || isLoading}
                className={`p-3 rounded-full transition-colors ${
                    (!inputText.trim() && !selectedImage) || isLoading 
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
                }`}
            >
                <Send size={20} />
            </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;