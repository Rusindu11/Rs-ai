import React, { useState } from 'react';
import { GradeLevel, QuizQuestion, Language } from '../types';
import { generateQuiz } from '../services/geminiService';
import { BookOpen, CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';

interface QuizModeProps {
  grade: GradeLevel;
  subject: string;
  language: Language;
  onAnswerChecked: (isCorrect: boolean) => void;
}

const QuizMode: React.FC<QuizModeProps> = ({ grade, subject, language, onAnswerChecked }) => {
  const [topic, setTopic] = useState('');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);

  // Localization Helpers
  const t = (key: string) => {
    const dict: any = {
      generating: { sinhala: "ප්‍රශ්න පත්‍රය සකසමින් පවතී...", tamil: "வினாடி வினா உருவாகிறது...", english: "Generating Quiz..." },
      title: { sinhala: "දැනුම මිනුම (Quiz Mode)", tamil: "வினாடி வினா (Quiz Mode)", english: "Quiz Mode" },
      enterTopic: { sinhala: "පාඩමේ නම (උදා: ආලෝකය)", tamil: "தலைப்பு (எ.கா: ஒளி)", english: "Topic name (e.g., Light)" },
      start: { sinhala: "ප්‍රශ්න පත්‍රය අරඹන්න", tamil: "தொடங்கு", english: "Start Quiz" },
      result: { sinhala: "ප්‍රතිඵලය", tamil: "முடிவு", english: "Results" },
      excellent: { sinhala: "ඉතා විශිෂ්ටයි!", tamil: "சிறப்பு!", english: "Excellent!" },
      keepTrying: { sinhala: "තව උත්සාහ කරන්න!", tamil: "முயற்சி செய்!", english: "Keep Trying!" },
      newQuiz: { sinhala: "වෙනත් පාඩමක් තෝරන්න", tamil: "புதிய வினாடி வினா", english: "New Quiz" },
      next: { sinhala: "ඊළඟ ප්‍රශ්නය", tamil: "அடுத்த கேள்வி", english: "Next Question" },
      finish: { sinhala: "ප්‍රතිඵල බලන්න", tamil: "முடிவுகள்", english: "See Results" },
      explanation: { sinhala: "පැහැදිලි කිරීම:", tamil: "விளக்கம்:", english: "Explanation:" }
    };
    return dict[key][language] || dict[key]['english'];
  };

  const startQuiz = async () => {
    setLoading(true);
    setQuestions([]);
    setCurrentQIndex(0);
    setScore(0);
    setShowResult(false);
    
    const qs = await generateQuiz(grade, subject, topic, language);
    setQuestions(qs);
    setLoading(false);
  };

  const checkAnswer = (index: number) => {
    if (isAnswerChecked) return;
    
    const isCorrect = index === questions[currentQIndex].correctAnswer;
    onAnswerChecked(isCorrect);
    
    setSelectedOption(index);
    setIsAnswerChecked(true);
    if (isCorrect) {
      setScore(s => s + 1);
    }
  };

  const nextQuestion = () => {
    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswerChecked(false);
    } else {
      setShowResult(true);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500">
        <Loader2 className="animate-spin mb-4 text-blue-600" size={48} />
        <p>{t('generating')}</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 bg-white rounded-xl shadow-lg border border-slate-200">
        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
            <BookOpen size={32} className="text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold mb-2 text-slate-800">{t('title')}</h2>
        
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder={t('enterTopic')}
          className="w-full max-w-md p-3 border border-slate-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 outline-none"
        />
        
        <button
          onClick={startQuiz}
          disabled={!topic.trim()}
          className="bg-blue-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-blue-700 transition-colors shadow-lg disabled:opacity-50"
        >
          {t('start')}
        </button>
      </div>
    );
  }

  if (showResult) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-white rounded-xl p-8 shadow-lg">
        <h2 className="text-3xl font-bold mb-4 text-slate-800">{t('result')}</h2>
        <div className="text-6xl font-bold text-blue-600 mb-2">{score} / {questions.length}</div>
        <p className="text-slate-500 mb-8">
            {score === questions.length ? t('excellent') : t('keepTrying')}
        </p>
        <button
          onClick={() => setQuestions([])}
          className="text-blue-600 font-semibold hover:underline"
        >
          {t('newQuiz')}
        </button>
      </div>
    );
  }

  const currentQ = questions[currentQIndex];

  return (
    <div className="h-full bg-white rounded-xl shadow-lg p-6 flex flex-col overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Question {currentQIndex + 1}/{questions.length}</span>
        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">{score} Points</span>
      </div>

      <h3 className="text-xl md:text-2xl font-bold text-slate-800 mb-8 leading-snug">{currentQ.question}</h3>

      <div className="space-y-3 flex-1">
        {currentQ.options.map((option, idx) => {
          let optionClass = "border-slate-200 hover:bg-slate-50";
          if (isAnswerChecked) {
             if (idx === currentQ.correctAnswer) {
                 optionClass = "bg-green-100 border-green-500 text-green-800";
             } else if (idx === selectedOption) {
                 optionClass = "bg-red-100 border-red-500 text-red-800";
             } else {
                 optionClass = "opacity-50 border-slate-200";
             }
          } else if (selectedOption === idx) {
             optionClass = "border-blue-500 bg-blue-50";
          }

          return (
            <button
              key={idx}
              onClick={() => checkAnswer(idx)}
              disabled={isAnswerChecked}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all font-medium flex justify-between items-center ${optionClass}`}
            >
              <span>{option}</span>
              {isAnswerChecked && idx === currentQ.correctAnswer && <CheckCircle size={20} className="text-green-600"/>}
              {isAnswerChecked && idx === selectedOption && idx !== currentQ.correctAnswer && <XCircle size={20} className="text-red-600"/>}
            </button>
          );
        })}
      </div>

      {isAnswerChecked && (
        <div className="mt-6 pt-6 border-t border-slate-100 animate-in fade-in slide-in-from-bottom-4">
            <p className="text-slate-600 mb-4 bg-slate-50 p-3 rounded-lg text-sm">
                <strong>{t('explanation')}</strong> {currentQ.explanation}
            </p>
            <button
                onClick={nextQuestion}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 flex items-center justify-center gap-2"
            >
                {currentQIndex < questions.length - 1 ? t('next') : t('finish')} <ArrowRight size={20} />
            </button>
        </div>
      )}
    </div>
  );
};

export default QuizMode;