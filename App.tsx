import React, { useState, useEffect } from 'react';
import { GradeLevel, AppState, UserStats, SubjectStat, Achievement, Language } from './types';
import ChatInterface from './components/ChatInterface';
import QuizMode from './components/QuizMode';
import LessonMode from './components/LessonMode';
import { Settings, Book, GraduationCap, Menu, X, MessageCircle, HelpCircle, Trophy, Star, Target, Activity, Flame, Award, BarChart3, Medal, Globe, PlusCircle, Layout, Lock } from 'lucide-react';

const GRADES: GradeLevel[] = ['Grade 1-5', 'Grade 6-9', 'O/L', 'A/L', 'General', 'Languages'];

// Comprehensive subject suggestions based on Sri Lankan curriculum and global trends
const SUGGESTED_SUBJECTS = {
  'Grade 1-5': [
    'Mathematics (ගණිතය)',
    'Environment (පරිසරය)',
    'Sinhala (සිංහල)',
    'Tamil (தமிழ்)',
    'English',
    'Grammar (ව්‍යාකරණ)',
    'Religion (ආගම)',
    'Art (චිත්‍ර කලාව)',
    'Music (සංගීතය)',
    'Dancing (නැටුම්)',
    'IT Basics (පරිගණක)'
  ],
  'Grade 6-9': [
    'Science (විද්‍යාව)',
    'Mathematics (ගණිතය)',
    'History (ඉතිහාසය)',
    'English',
    'Grammar (ව්‍යාකරණ)',
    'Sinhala (සිංහල)',
    'Tamil (தமிழ்)',
    'Geography (භූගෝල විද්‍යාව)',
    'Civics (පුරවැසි අධ්‍යාපනය)',
    'ICT (තොරතුරු තාක්ෂණය)',
    'Health (සෞඛ්‍යය)',
    'PTS (ප්‍රායෝගික තාක්ෂණ කුසලතා)',
    'Art/Music/Dance (සෞන්දර්යය)'
  ],
  'O/L': [
    'Mathematics (ගණිතය)',
    'Science (විද්‍යාව)',
    'History (ඉතිහාසය)',
    'English',
    'Grammar (ව්‍යාකරණ)',
    'Sinhala Lang & Lit',
    'Buddhism / Religion',
    'Commerce (වාණිජ)',
    'ICT (තොරතුරු තාක්ෂණය)',
    'English Literature',
    'Geography',
    'Health & Physical Edu',
    'Media Studies'
  ],
  'A/L': [
    // Science Stream
    'Physics (භෞතික විද්‍යාව)',
    'Chemistry (රසායන විද්‍යාව)',
    'Biology (ජීව විද්‍යාව)',
    'Agricultural Science',
    // Maths Stream
    'Combined Maths',
    // Commerce Stream
    'Economics (ආර්ථික විද්‍යාව)',
    'Business Studies (ව්‍යාපාර අධ්‍යයනය)',
    'Accounting (ගිණුම්කරණය)',
    'Statistics',
    // Arts Stream
    'Political Science',
    'Logic (තර්ක ශාස්ත්‍රය)',
    'Geography',
    'History',
    'Media',
    // Tech Stream
    'Engineering Technology (ET)',
    'Bio Systems Technology (BST)',
    'ICT',
    'Grammar (ව්‍යාකරණ)'
  ],
  'General': [
    'Artificial Intelligence',
    'Computer Programming (Python/JS)',
    'Web Development',
    'Psychology (මනෝවිද්‍යාව)',
    'Astronomy (තාරකා විද්‍යාව)',
    'Robotics',
    'Photography',
    'Graphic Design',
    'Financial Literacy',
    'Global Politics',
    'Philosophy',
    'Cooking & Nutrition',
    'Grammar (ව්‍යාකරණ)'
  ],
  'Languages': [
    'Japanese (ජපන් භාෂාව)',
    'Korean (කොරියානු භාෂාව)',
    'French (ප්‍රංශ භාෂාව)',
    'German (ජර්මානු භාෂාව)',
    'Chinese (චීන භාෂාව)',
    'Hindi (හින්දි භාෂාව)',
    'Arabic (අරාබි භාෂාව)',
    'Russian (රුසියානු භාෂාව)',
    'Spanish (ස්පාඤ්ඤ භාෂාව)',
    'Italian (ඉතාලි භාෂාව)'
  ]
};

const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_step', title: 'First Step', description: 'Start your learning journey', icon: <Star className="text-yellow-500" size={24} /> },
  { id: 'quiz_novice', title: 'Quiz Novice', description: 'Complete 5 quizzes', icon: <HelpCircle className="text-blue-500" size={24} /> },
  { id: 'streak_3', title: 'On Fire', description: 'Maintain a 3-day streak', icon: <Flame className="text-orange-500" size={24} /> },
  { id: 'scholar', title: 'Scholar', description: 'Earn 500 XP', icon: <GraduationCap className="text-purple-500" size={24} /> },
  { id: 'master', title: 'Quiz Master', description: 'High accuracy in 10+ quizzes', icon: <Medal className="text-yellow-600" size={24} /> },
];

const INITIAL_STATS: UserStats = {
  quizTotal: 0,
  quizCorrect: 0,
  questionsAsked: 0,
  xp: 0,
  level: 1,
  streak: 0,
  lastActiveDate: new Date().toISOString().split('T')[0],
  subjectStats: {},
  achievements: []
};

export default function App() {
  const [appState, setAppState] = useState<AppState>({
    grade: 'Grade 6-9',
    subject: 'Science (විද්‍යාව)',
    language: 'sinhala',
    mode: 'chat'
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [customSubjectInput, setCustomSubjectInput] = useState('');

  // --- Stats / Progress Management ---
  const [stats, setStats] = useState<UserStats>(() => {
      try {
          const saved = localStorage.getItem('nena_pahana_stats');
          if (saved) {
             const parsed = JSON.parse(saved);
             return { ...INITIAL_STATS, ...parsed, subjectStats: parsed.subjectStats || {} };
          }
          return INITIAL_STATS;
      } catch (e) {
          return INITIAL_STATS;
      }
  });

  useEffect(() => {
      localStorage.setItem('nena_pahana_stats', JSON.stringify(stats));
  }, [stats]);

  // Handle Streak Logic on Mount
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const lastActive = stats.lastActiveDate;
    
    if (lastActive !== today) {
        // Logic to update streak handled in generic update function
    }
  }, []);

  const updateSubjectStat = (prev: UserStats, subject: string, updates: Partial<SubjectStat>) => {
     const currentSub = prev.subjectStats[subject] || { xp: 0, questionsAnswered: 0, quizAttempts: 0, quizCorrect: 0 };
     return {
         ...prev.subjectStats,
         [subject]: { ...currentSub, ...updates }
     };
  };

  const checkAchievements = (newStats: UserStats): string[] => {
      const unlocked = [...newStats.achievements];
      if (newStats.questionsAsked >= 1 && !unlocked.includes('first_step')) unlocked.push('first_step');
      if (newStats.quizTotal >= 5 && !unlocked.includes('quiz_novice')) unlocked.push('quiz_novice');
      if (newStats.streak >= 3 && !unlocked.includes('streak_3')) unlocked.push('streak_3');
      if (newStats.xp >= 500 && !unlocked.includes('scholar')) unlocked.push('scholar');
      if (newStats.quizTotal > 10 && (newStats.quizCorrect / newStats.quizTotal) > 0.8 && !unlocked.includes('master')) unlocked.push('master');
      return unlocked;
  };

  const updateStatsGeneric = (updater: (prev: UserStats) => UserStats) => {
     setStats(prev => {
         const today = new Date().toISOString().split('T')[0];
         let newStreak = prev.streak;
         
         if (prev.lastActiveDate !== today) {
             const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
             if (prev.lastActiveDate === yesterday) newStreak += 1;
             else newStreak = 1;
         } else if (newStreak === 0) {
             newStreak = 1;
         }

         const updatedStats = updater({ ...prev, streak: newStreak, lastActiveDate: today });
         updatedStats.level = Math.floor(updatedStats.xp / 100) + 1;
         updatedStats.achievements = checkAchievements(updatedStats);
         return updatedStats;
     });
  };

  const updateChatStats = () => {
      updateStatsGeneric(prev => {
          const subStats = updateSubjectStat(prev, appState.subject, { 
              questionsAnswered: (prev.subjectStats[appState.subject]?.questionsAnswered || 0) + 1,
              xp: (prev.subjectStats[appState.subject]?.xp || 0) + 5
          });
          return { ...prev, questionsAsked: prev.questionsAsked + 1, xp: prev.xp + 5, subjectStats: subStats };
      });
  };

  const updateQuizStats = (isCorrect: boolean) => {
      updateStatsGeneric(prev => {
          const xpGain = isCorrect ? 20 : 5;
          const subStats = updateSubjectStat(prev, appState.subject, { 
              quizAttempts: (prev.subjectStats[appState.subject]?.quizAttempts || 0) + 1,
              quizCorrect: (prev.subjectStats[appState.subject]?.quizCorrect || 0) + (isCorrect ? 1 : 0),
              xp: (prev.subjectStats[appState.subject]?.xp || 0) + xpGain
          });
          return { ...prev, quizTotal: prev.quizTotal + 1, quizCorrect: isCorrect ? prev.quizCorrect + 1 : prev.quizCorrect, xp: prev.xp + xpGain, subjectStats: subStats };
      });
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const progressToNextLevel = stats.xp % 100;
  const quizAccuracy = stats.quizTotal > 0 ? Math.round((stats.quizCorrect / stats.quizTotal) * 100) : 0;

  const handleCustomSubjectSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (customSubjectInput.trim()) {
          setAppState(prev => ({ ...prev, subject: customSubjectInput.trim() }));
          setCustomSubjectInput('');
      }
  };

  return (
    <div className="flex h-screen bg-slate-100 text-slate-900 font-sans overflow-hidden">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar Navigation */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-30 w-72 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out flex flex-col
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-600">
             <GraduationCap size={32} />
             <h1 className="text-xl font-bold tracking-tight">Nena Pahana AI</h1>
          </div>
          <button onClick={toggleSidebar} className="md:hidden text-slate-500">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
            
            {/* Progress Card */}
            <div onClick={() => setIsProfileOpen(true)} className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl p-4 text-white shadow-lg relative overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform group">
                <div className="absolute top-0 right-0 p-2 opacity-10"><Trophy size={64} /></div>
                <div className="flex items-center gap-2 mb-2">
                    <div className="bg-white/20 p-1.5 rounded-lg"><Trophy size={16} className="text-yellow-300" /></div>
                    <span className="font-bold text-sm">Progress</span>
                    <span className="ml-auto text-xs bg-white/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Flame size={10} className={stats.streak > 0 ? "text-orange-400 fill-orange-400" : "text-slate-300"} />
                        {stats.streak} Days
                    </span>
                </div>
                <div className="flex justify-between items-end mb-2">
                    <h3 className="text-2xl font-bold">Level {stats.level}</h3>
                    <span className="text-xs text-blue-100">{stats.xp} XP</span>
                </div>
                <div className="w-full bg-black/20 h-2 rounded-full mb-4">
                    <div className="bg-yellow-400 h-2 rounded-full transition-all duration-500" style={{ width: `${progressToNextLevel}%` }} />
                </div>
                <div className="mt-2 text-center text-xs text-blue-200 group-hover:text-white transition-colors flex items-center justify-center gap-1">
                    Click to view details <BarChart3 size={12} />
                </div>
            </div>

            {/* Language Selector */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Globe size={12} /> Language / භාෂාව / மொழி
                </label>
                <div className="grid grid-cols-3 gap-1">
                    {['sinhala', 'tamil', 'english'].map((lang) => (
                        <button
                            key={lang}
                            onClick={() => setAppState(prev => ({ ...prev, language: lang as Language }))}
                            className={`p-2 rounded-lg text-xs font-semibold capitalize transition-all ${appState.language === lang ? 'bg-white text-blue-600 shadow-sm ring-1 ring-blue-100' : 'text-slate-500 hover:bg-slate-200'}`}
                        >
                            {lang}
                        </button>
                    ))}
                </div>
            </div>

            {/* Mode Selection */}
            <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl">
                <button 
                    onClick={() => setAppState(prev => ({ ...prev, mode: 'chat' }))}
                    className={`p-2 rounded-lg text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all ${appState.mode === 'chat' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <MessageCircle size={16} /> Chat
                </button>
                <button 
                    onClick={() => setAppState(prev => ({ ...prev, mode: 'lesson' }))}
                    className={`p-2 rounded-lg text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all ${appState.mode === 'lesson' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Layout size={16} /> Lesson
                </button>
                <button 
                    onClick={() => setAppState(prev => ({ ...prev, mode: 'quiz' }))}
                    className={`p-2 rounded-lg text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all ${appState.mode === 'quiz' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <HelpCircle size={16} /> Quiz
                </button>
            </div>

            {/* Grade Level */}
            <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Grade Level</label>
                <div className="space-y-1">
                    {GRADES.map(g => (
                        <button
                            key={g}
                            onClick={() => setAppState(prev => ({ ...prev, grade: g, subject: SUGGESTED_SUBJECTS[g][0] }))}
                            className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-colors ${appState.grade === g ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            {g}
                        </button>
                    ))}
                </div>
            </div>

            {/* Subject Selection (Universal) */}
            <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Subject</label>
                
                {/* Custom Subject Input */}
                <form onSubmit={handleCustomSubjectSubmit} className="mb-3 relative">
                    <input 
                        type="text"
                        value={customSubjectInput}
                        onChange={(e) => setCustomSubjectInput(e.target.value)}
                        placeholder="Type any subject..."
                        className="w-full pl-3 pr-8 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600">
                        <PlusCircle size={16} />
                    </button>
                </form>

                <div className="space-y-1">
                    {SUGGESTED_SUBJECTS[appState.grade].map(s => (
                        <button
                            key={s}
                            onClick={() => setAppState(prev => ({ ...prev, subject: s }))}
                            className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${appState.subject === s ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            <Book size={16} className="opacity-50"/> {s}
                        </button>
                    ))}
                </div>
            </div>
        </div>

        <div className="p-4 border-t border-slate-100">
            <button onClick={() => setIsSettingsOpen(true)} className="flex items-center gap-3 w-full p-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                <Settings size={20} /> <span className="font-medium">Settings</span>
            </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full relative">
        <div className="md:hidden h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4">
            <span className="font-bold text-slate-800">
                {appState.mode === 'chat' ? 'AI Tutor' : appState.mode === 'quiz' ? 'Quiz Mode' : 'Lesson Mode'}
            </span>
            <button onClick={toggleSidebar} className="text-slate-600"><Menu size={24} /></button>
        </div>

        <div className="flex-1 p-4 md:p-6 overflow-hidden">
            <div className="max-w-4xl mx-auto h-full">
                {appState.mode === 'chat' && (
                    <ChatInterface 
                        grade={appState.grade} 
                        subject={appState.subject}
                        language={appState.language}
                        onMessageSent={updateChatStats}
                    />
                )}
                {appState.mode === 'quiz' && (
                    <QuizMode 
                        grade={appState.grade} 
                        subject={appState.subject}
                        language={appState.language}
                        onAnswerChecked={updateQuizStats}
                    />
                )}
                {appState.mode === 'lesson' && (
                    <LessonMode 
                        grade={appState.grade}
                        subject={appState.subject}
                        language={appState.language}
                    />
                )}
            </div>
        </div>
      </main>

      {/* Profile Modal */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-2xl w-full max-w-2xl p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-slate-800">Student Profile</h2>
                    <button onClick={() => setIsProfileOpen(false)}><X size={24} className="text-slate-400" /></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl p-4 text-white shadow-md">
                        <div className="flex justify-between"><h3 className="text-3xl font-bold">{stats.xp}</h3><Star className="opacity-50" /></div>
                        <p className="text-purple-100 text-sm">Total XP</p>
                    </div>
                    <div className="bg-gradient-to-br from-orange-400 to-red-500 rounded-xl p-4 text-white shadow-md">
                        <div className="flex justify-between"><h3 className="text-3xl font-bold">{stats.streak}</h3><Flame className="opacity-50" /></div>
                        <p className="text-orange-100 text-sm">Day Streak</p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl p-4 text-white shadow-md">
                        <div className="flex justify-between"><h3 className="text-3xl font-bold">{quizAccuracy}%</h3><Target className="opacity-50" /></div>
                        <p className="text-blue-100 text-sm">Quiz Average</p>
                    </div>
                </div>

                {/* Achievements Section */}
                <div className="mb-8">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Award className="text-yellow-500" /> Achievements
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {ACHIEVEMENTS.map(ach => {
                            const isUnlocked = stats.achievements.includes(ach.id);
                            return (
                                <div key={ach.id} className={`p-4 rounded-xl border flex flex-col items-center text-center transition-all ${isUnlocked ? 'bg-yellow-50 border-yellow-200 shadow-sm' : 'bg-slate-50 border-slate-100 opacity-50'}`}>
                                    <div className={`p-3 rounded-full mb-2 relative ${isUnlocked ? 'bg-white shadow-sm' : 'bg-slate-200'}`}>
                                        {ach.icon}
                                        {!isUnlocked && <div className="absolute inset-0 flex items-center justify-center bg-slate-200/50 rounded-full"><Lock size={16} className="text-slate-500"/></div>}
                                    </div>
                                    <h4 className={`font-bold text-sm ${isUnlocked ? 'text-slate-800' : 'text-slate-400'}`}>{ach.title}</h4>
                                    <p className="text-xs text-slate-500 mt-1">{ach.description}</p>
                                    {!isUnlocked && <span className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-wide border border-slate-200 px-2 py-0.5 rounded-full">Locked</span>}
                                    {isUnlocked && <span className="text-[10px] font-bold text-green-600 mt-2 uppercase tracking-wide bg-green-50 px-2 py-0.5 rounded-full border border-green-200">Unlocked</span>}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Subject Mastery List */}
                <div className="mb-8">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Subject Mastery</h3>
                    <div className="space-y-4">
                        {(Object.entries(stats.subjectStats) as [string, SubjectStat][]).sort((a,b) => b[1].xp - a[1].xp).slice(0, 5).map(([subj, data]) => (
                            <div key={subj}>
                                <div className="flex justify-between text-sm mb-1"><span className="font-semibold">{subj}</span><span>{data.xp} XP</span></div>
                                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden"><div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${Math.min((data.xp / 1000) * 100, 100)}%` }}></div></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
                <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold">Settings</h2><button onClick={() => setIsSettingsOpen(false)}><X size={24} className="text-slate-400" /></button></div>
                <button onClick={() => { if(confirm("Reset progress?")) { setStats(INITIAL_STATS); setIsSettingsOpen(false); } }} className="w-full py-2 text-red-500 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors">Reset Progress</button>
            </div>
        </div>
      )}
    </div>
  );
}