import React, { useState, useEffect } from 'react';
import { GradeLevel, Language } from '../types';
import { generateLesson } from '../services/geminiService';
import { BookOpen, Loader2, Sparkles, Volume2, Save, Bookmark, Trash2, ArrowLeft, Calendar, FileText, Square } from 'lucide-react';
import Markdown from 'react-markdown';

interface LessonModeProps {
  grade: GradeLevel;
  subject: string;
  language: Language;
}

interface SavedLesson {
  id: string;
  topic: string;
  content: string;
  subject: string;
  date: string;
}

const LessonMode: React.FC<LessonModeProps> = ({ grade, subject, language }) => {
  const [topic, setTopic] = useState('');
  const [lessonContent, setLessonContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [savedLessons, setSavedLessons] = useState<SavedLesson[]>([]);
  const [showSavedList, setShowSavedList] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Load saved lessons and draft topic on mount
  useEffect(() => {
    const saved = localStorage.getItem('nena_pahana_saved_lessons');
    if (saved) {
        try {
            setSavedLessons(JSON.parse(saved));
        } catch (e) {
            console.error("Failed to load saved lessons", e);
        }
    }

    const savedDraft = localStorage.getItem('nena_pahana_lesson_topic_draft');
    if (savedDraft) {
        setTopic(savedDraft);
    }
  }, []);

  // Auto-save topic to localStorage
  useEffect(() => {
    localStorage.setItem('nena_pahana_lesson_topic_draft', topic);
  }, [topic]);

  // Stop speech when component unmounts or content changes
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const saveToLocalStorage = (lessons: SavedLesson[]) => {
      localStorage.setItem('nena_pahana_saved_lessons', JSON.stringify(lessons));
  };

  // Localization
  const t = (key: string) => {
    const dict: any = {
      title: { sinhala: "පාඩම් මාලා (Lesson Mode)", tamil: "பாடங்கள் (Lesson Mode)", english: "Lesson Mode" },
      placeholder: { sinhala: "අද ඉගෙන ගැනීමට කැමති මාතෘකාව...", tamil: "இன்று நீங்கள் கற்க விரும்பும் தலைப்பு...", english: "Topic you want to learn today..." },
      button: { sinhala: "පාඩම අරඹන්න", tamil: "பாடத்தைத் தொடங்கவும்", english: "Start Lesson" },
      generating: { sinhala: "පාඩම සකසමින් පවතී...", tamil: "பாடம் உருவாகிறது...", english: "Writing your lesson..." },
      back: { sinhala: "ආපසු", tamil: "பின்னால்", english: "Back" },
      save: { sinhala: "සුරකින්න", tamil: "சேமி", english: "Save" },
      savedTitle: { sinhala: "සුරැකි පාඩම්", tamil: "சேமித்தவை", english: "Saved Lessons" },
      savedMsg: { sinhala: "පාඩම සුරැකින ලදී!", tamil: "பாடம் சேமிக்கப்பட்டது!", english: "Lesson Saved!" },
      delete: { sinhala: "මකන්න", tamil: "அழி", english: "Delete" },
      noSaved: { sinhala: "සුරැකි පාඩම් නොමැත.", tamil: "சேமித்த பாடங்கள் இல்லை.", english: "No saved lessons yet." },
      viewSaved: { sinhala: "සුරැකි පාඩම්", tamil: "சேமித்தவை", english: "Saved Lessons" },
      readAloud: { sinhala: "කියවන්න", tamil: "வாசிக்க", english: "Read Aloud" },
      stopReading: { sinhala: "නවතන්න", tamil: "நிறுத்து", english: "Stop Reading" }
    };
    return dict[key][language] || dict[key]['english'];
  };

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setLessonContent(null);
    setShowSavedList(false);
    
    // Stop any current speech
    window.speechSynthesis.cancel();
    setIsSpeaking(false);

    const content = await generateLesson(grade, subject, topic, language);
    setLessonContent(content);
    setLoading(false);
  };

  const handleSave = () => {
      if (!lessonContent || !topic) return;
      
      // Prevent duplicates
      if (savedLessons.some(l => l.content === lessonContent)) {
          alert("Lesson already saved.");
          return;
      }

      const newLesson: SavedLesson = {
          id: Date.now().toString(),
          topic: topic,
          content: lessonContent,
          subject: subject,
          date: new Date().toLocaleDateString()
      };
      
      const updated = [newLesson, ...savedLessons];
      setSavedLessons(updated);
      saveToLocalStorage(updated);
      alert(t('savedMsg'));
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (confirm('Are you sure you want to delete this lesson?')) {
          const updated = savedLessons.filter(l => l.id !== id);
          setSavedLessons(updated);
          saveToLocalStorage(updated);
      }
  };

  const openSavedLesson = (lesson: SavedLesson) => {
      // Stop speech if switching lessons
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      
      setTopic(lesson.topic);
      setLessonContent(lesson.content);
      setShowSavedList(false);
  };

  const toggleReadAloud = () => {
     if (isSpeaking) {
         window.speechSynthesis.cancel();
         setIsSpeaking(false);
         return;
     }

     if (!lessonContent) return;
     
     // Remove markdown symbols for cleaner speech
     const textToRead = lessonContent.replace(/[*#_`]/g, '');
     
     const utterance = new SpeechSynthesisUtterance(textToRead);
     
     // Set voice based on language
     if (language === 'sinhala') utterance.lang = 'si-LK';
     else if (language === 'tamil') utterance.lang = 'ta-LK';
     else utterance.lang = 'en-US';

     utterance.onend = () => setIsSpeaking(false);
     utterance.onerror = () => setIsSpeaking(false);

     setIsSpeaking(true);
     window.speechSynthesis.speak(utterance);
  };

  // Custom Markdown Components
  const MarkdownComponents = {
    h1: ({node, ...props}: any) => <h1 className="text-2xl font-bold mb-4 text-blue-800 border-b pb-2" {...props} />,
    h2: ({node, ...props}: any) => <h2 className="text-xl font-bold mb-3 mt-6 text-indigo-700" {...props} />,
    h3: ({node, ...props}: any) => <h3 className="text-lg font-bold mb-2 mt-4 text-slate-800" {...props} />,
    p: ({node, ...props}: any) => <p className="mb-3 leading-relaxed text-slate-700" {...props} />,
    ul: ({node, ...props}: any) => <ul className="list-disc pl-5 mb-4 space-y-2 text-slate-700" {...props} />,
    ol: ({node, ...props}: any) => <ol className="list-decimal pl-5 mb-4 space-y-2 text-slate-700" {...props} />,
    strong: ({node, ...props}: any) => <span className="font-bold text-slate-900 bg-yellow-50 px-1 rounded" {...props} />,
    blockquote: ({node, ...props}: any) => <div className="border-l-4 border-blue-500 pl-4 py-2 my-4 bg-blue-50 italic text-slate-600 rounded-r-lg" {...props} />,
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500">
        <Loader2 className="animate-spin mb-4 text-blue-600" size={48} />
        <p className="animate-pulse">{t('generating')}</p>
      </div>
    );
  }

  // --- View: Saved Lessons List ---
  if (showSavedList) {
      return (
          <div className="h-full flex flex-col bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50">
                  <button onClick={() => setShowSavedList(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-600">
                      <ArrowLeft size={20} />
                  </button>
                  <h2 className="font-bold text-slate-700 text-lg flex items-center gap-2">
                      <Bookmark className="text-blue-600" size={20}/> {t('savedTitle')}
                  </h2>
              </div>
              <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50">
                  {savedLessons.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400">
                          <Bookmark size={48} className="mb-4 opacity-20" />
                          <p>{t('noSaved')}</p>
                      </div>
                  ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {savedLessons.map(lesson => (
                              <div 
                                key={lesson.id} 
                                onClick={() => openSavedLesson(lesson)}
                                className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 cursor-pointer hover:shadow-md hover:border-blue-300 transition-all group"
                              >
                                  <div className="flex justify-between items-start mb-2">
                                      <h3 className="font-bold text-slate-800 line-clamp-1">{lesson.topic}</h3>
                                      <button 
                                        onClick={(e) => handleDelete(lesson.id, e)}
                                        className="text-slate-300 hover:text-red-500 transition-colors p-1"
                                      >
                                          <Trash2 size={16} />
                                      </button>
                                  </div>
                                  <div className="text-xs text-slate-500 flex items-center gap-3 mb-2">
                                      <span className="flex items-center gap-1"><BookOpen size={12}/> {lesson.subject}</span>
                                      <span className="flex items-center gap-1"><Calendar size={12}/> {lesson.date}</span>
                                  </div>
                                  <p className="text-xs text-slate-400 line-clamp-2">
                                      {lesson.content.substring(0, 100).replace(/[#*]/g, '')}...
                                  </p>
                              </div>
                          ))}
                      </div>
                  )}
              </div>
          </div>
      );
  }

  // --- View: Single Lesson Content ---
  if (lessonContent) {
    const isSaved = savedLessons.some(l => l.content === lessonContent);

    return (
      <div className="h-full flex flex-col bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
             <div className="flex items-center gap-2 overflow-hidden">
                <button onClick={() => setLessonContent(null)} className="md:hidden p-1 mr-1 text-slate-500"><ArrowLeft size={20}/></button>
                <h2 className="font-bold text-slate-700 flex items-center gap-2 truncate text-sm md:text-base">
                    <BookOpen size={18} className="text-blue-600 flex-shrink-0"/> <span className="truncate">{topic}</span>
                </h2>
             </div>
             
             <div className="flex items-center gap-1 md:gap-2">
                 <button 
                    onClick={toggleReadAloud} 
                    className={`p-2 rounded-full transition-colors ${isSpeaking ? 'bg-red-100 text-red-600 animate-pulse' : 'hover:bg-slate-200 text-slate-600'}`}
                    title={isSpeaking ? t('stopReading') : t('readAloud')}
                 >
                    {isSpeaking ? <Square size={20} fill="currentColor" /> : <Volume2 size={20} />}
                 </button>
                 
                 <button 
                    onClick={handleSave} 
                    disabled={isSaved}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${isSaved ? 'bg-green-100 text-green-700 cursor-default' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'}`}
                 >
                    {isSaved ? <span className="flex items-center gap-1"><Save size={16}/> Saved</span> : <><Save size={16}/> <span className="hidden md:inline">{t('save')}</span></>}
                 </button>

                 <button onClick={() => setLessonContent(null)} className="ml-2 text-sm text-slate-500 font-semibold hover:text-blue-600 px-2">
                    {t('back')}
                 </button>
             </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-white">
            <div className="max-w-3xl mx-auto">
                <Markdown components={MarkdownComponents}>{lessonContent}</Markdown>
            </div>
        </div>
      </div>
    );
  }

  // --- View: Home / Create Lesson ---
  return (
    <div className="h-full flex flex-col items-center justify-center p-6 bg-white rounded-xl shadow-lg border border-slate-200 relative">
      
      {/* Saved Lessons Button */}
      <button 
        onClick={() => setShowSavedList(true)}
        className="absolute top-4 right-4 flex items-center gap-2 text-slate-500 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 px-4 py-2 rounded-full transition-all text-sm font-bold border border-slate-100"
      >
        <Bookmark size={18} /> <span className="hidden sm:inline">{t('viewSaved')}</span>
      </button>

      <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl transform rotate-3">
          <BookOpen size={40} className="text-white" />
      </div>
      
      <h2 className="text-2xl font-bold mb-2 text-slate-800 text-center">{t('title')}</h2>
      <p className="text-slate-500 mb-8 text-center max-w-md">
         {language === 'sinhala' ? "ඕනෑම විෂයක් හෝ භාෂාවක් පියවරෙන් පියවර ඉගෙන ගන්න." : "Learn any subject or language step-by-step."}
      </p>
      
      <div className="w-full max-w-md relative">
          <Sparkles className="absolute top-3 left-3 text-purple-400" size={18} />
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={t('placeholder')}
            className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none shadow-sm transition-all hover:border-purple-300"
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
          />
      </div>
      
      <button
        onClick={handleGenerate}
        disabled={!topic.trim()}
        className="mt-6 bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:shadow-none transform active:scale-95"
      >
        {t('button')}
      </button>
    </div>
  );
};

export default LessonMode;