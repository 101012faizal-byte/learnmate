
import React, { useState, useRef, useMemo } from 'react';
import { type User, type QuizResult, Subject } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, TooltipProps } from 'recharts';
import { PencilIcon, CheckIcon, UserCircleIcon, CameraIcon, BadgeCheckIcon, TrendingUpIcon, StarIcon, ClipboardIcon, CheckCircleIcon, TrophyIcon } from './icons/ActionIcons';
import { RANKS, BADGES } from '../constants';

interface ProfileProps {
  user: User;
  onUpdateProfile: (updatedUser: User) => void;
  quizHistory: QuizResult[];
}

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

const CustomTooltip: React.FC<TooltipProps<number, string>> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-100 rounded-xl shadow-xl">
          <p className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wide">{`${label}`}</p>
          <p className="text-lg font-black text-primary">{`${payload[0].value?.toLocaleString()} pts`}</p>
        </div>
      );
    }
    return null;
};

const Profile: React.FC<ProfileProps> = ({ user, onUpdateProfile, quizHistory }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [className, setClassName] = useState(user.className || '');
  const [newProfilePicture, setNewProfilePicture] = useState<File | null>(null);
  const [picturePreview, setPicturePreview] = useState<string | null>(user.profilePicture || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const quizzesCompleted = quizHistory.length;
  const totalCorrectAnswers = useMemo(() => quizHistory.reduce((sum, r) => sum + r.score, 0), [quizHistory]);
  const totalQuestions = useMemo(() => quizHistory.reduce((sum, r) => sum + r.total, 0), [quizHistory]);
  const accuracy = totalQuestions > 0 ? Math.round((totalCorrectAnswers / totalQuestions) * 100) : 0;
  
  const currentRankInfo = RANKS[user.rank];
  const RankIcon = currentRankInfo.icon;
  
  const pointsForNextLevel = currentRankInfo.nextLevelPoints ? currentRankInfo.nextLevelPoints - currentRankInfo.minPoints : 0;
  const pointsInCurrentLevel = user.totalPoints - currentRankInfo.minPoints;
  const progressPercentage = currentRankInfo.nextLevelPoints ? Math.min((pointsInCurrentLevel / pointsForNextLevel) * 100, 100) : 100;

  // Prepare chart data
  const chartData = useMemo(() => {
    if (user.progress.length === 0) return [{ date: 'Start', Points: 0, timestamp: 0 }];
    
    let data = user.progress.map(p => ({
        date: new Date(p.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        Points: p.points,
        timestamp: p.date
    }));

    // Ensure sorted by date
    data.sort((a, b) => a.timestamp - b.timestamp);

    // Add a starting point if only one point exists to make a line
    if (data.length === 1) {
        data = [{ date: 'Start', Points: 0, timestamp: data[0].timestamp - 1 }, ...data];
    }
    return data;
  }, [user.progress]);

  // Calculate Badge Progress
  const badgeProgress = useMemo(() => {
    const getBestScore = (subj: Subject) => {
        const quizzes = quizHistory.filter(q => q.subject === subj);
        if (quizzes.length === 0) return 0;
        return Math.max(...quizzes.map(q => (q.score / q.total) * 100));
    };

    const totalQuizzes = quizHistory.length;
    const totalCorrect = quizHistory.reduce((sum, r) => sum + r.score, 0);

    return {
        'Math Star': { current: getBestScore(Subject.Math), target: 90, label: 'Best Math Score', unit: '%' },
        'Grammar Pro': { current: getBestScore(Subject.English), target: 90, label: 'Best English Score', unit: '%' },
        'Quiz Champ': { current: totalQuizzes, target: 10, label: 'Quizzes Taken', unit: '' },
        'Knowledge Seeker': { current: totalCorrect, target: 100, label: 'Questions Solved', unit: '' },
    };
  }, [quizHistory]);

  const earnedBadges = Object.values(BADGES).filter(b => user.badges.includes(b.name));
  const lockedBadges = Object.values(BADGES).filter(b => !user.badges.includes(b.name));

  const handleSave = async () => {
    let updatedUser: User = { ...user, name, className };
    if (newProfilePicture) {
        try {
            const base64 = await fileToBase64(newProfilePicture);
            updatedUser.profilePicture = base64;
        } catch (error) {
            console.error("Failed to convert image to base64", error);
            alert("Could not save the new profile picture. Please try again.");
            return;
        }
    }
    onUpdateProfile(updatedUser);
    setIsEditing(false);
    setNewProfilePicture(null);
  };

  const handleCancel = () => {
    setName(user.name);
    setClassName(user.className || '');
    setPicturePreview(user.profilePicture || null);
    setNewProfilePicture(null);
    setIsEditing(false);
  };

  const handlePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            alert("Image size should not exceed 5MB.");
            return;
        }
        setNewProfilePicture(file);
        setPicturePreview(URL.createObjectURL(file));
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto pb-10">
      
      {/* 1. Header Card with Banner */}
      <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden relative group">
          {/* Decorative Banner */}
          <div className={`h-32 w-full bg-gradient-to-r ${currentRankInfo.bgColor.replace('bg-', 'from-').replace('200', '400')} to-primary/80 relative`}>
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
          </div>

          <div className="px-8 pb-8 flex flex-col md:flex-row items-start gap-6">
              {/* Avatar - Overlapping Banner */}
              <div className="relative -mt-12 flex-shrink-0">
                  <div className="w-32 h-32 rounded-full bg-white p-1.5 shadow-xl">
                      <div className="w-full h-full rounded-full bg-gray-100 overflow-hidden relative">
                          {picturePreview ? (
                              <img src={picturePreview} alt="Profile" className="w-full h-full object-cover"/>
                          ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-300">
                                  <UserCircleIcon className="w-20 h-20"/>
                              </div>
                          )}
                          
                          {isEditing && (
                              <div 
                                  onClick={() => fileInputRef.current?.click()} 
                                  className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer hover:bg-black/50 transition-colors"
                              >
                                  <CameraIcon className="w-8 h-8 text-white" />
                              </div>
                          )}
                          <input type="file" ref={fileInputRef} onChange={handlePictureChange} accept="image/png, image/jpeg" className="hidden" />
                      </div>
                  </div>
                  {/* Rank Badge */}
                  <div className={`absolute bottom-1 right-1 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center shadow-sm ${currentRankInfo.bgColor} ${currentRankInfo.color}`}>
                        <RankIcon className="w-4 h-4" />
                  </div>
              </div>

              {/* User Info & Edit Form */}
              <div className="flex-grow pt-4 w-full">
                   <div className="flex justify-between items-start">
                       <div className="w-full max-w-lg">
                           {isEditing ? (
                               <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-200 animate-fade-in">
                                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                       <div>
                                           <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Display Name</label>
                                           <input 
                                               type="text" 
                                               value={name} 
                                               onChange={(e) => setName(e.target.value)} 
                                               className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                                           />
                                       </div>
                                       <div>
                                           <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Class / Grade</label>
                                           <input 
                                               type="text" 
                                               value={className} 
                                               onChange={(e) => setClassName(e.target.value)} 
                                               className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                                               placeholder="e.g. 10th Grade"
                                           />
                                       </div>
                                   </div>
                                   <div className="flex justify-end gap-2 pt-1">
                                       <button onClick={handleCancel} className="px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
                                       <button onClick={handleSave} className="px-3 py-1.5 text-xs font-bold text-white bg-primary hover:bg-primary-dark rounded-lg shadow-sm transition-colors flex items-center">
                                           <CheckIcon className="w-3 h-3 mr-1"/> Save
                                       </button>
                                   </div>
                               </div>
                           ) : (
                               <div>
                                   <h1 className="text-3xl font-black text-gray-900">{user.name}</h1>
                                   <p className="text-gray-500 font-medium">{user.email}</p>
                                   {user.className && (
                                       <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-gray-100 text-gray-600">
                                           {user.className}
                                       </div>
                                   )}
                               </div>
                           )}
                       </div>

                       {!isEditing && (
                           <button 
                                onClick={() => setIsEditing(true)} 
                                className="flex items-center px-4 py-2 text-sm font-bold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
                           >
                               <PencilIcon className="w-4 h-4 mr-2" /> Edit
                           </button>
                       )}
                   </div>

                   {/* Rank Progress Bar */}
                   <div className="mt-6">
                       <div className="flex justify-between text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                           <span>{user.rank} Rank</span>
                           <span>{Math.round(progressPercentage)}% to {currentRankInfo.nextLevelPoints ? 'Next Level' : 'Max'}</span>
                       </div>
                       <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                           <div 
                                className={`h-full ${currentRankInfo.progressColor} transition-all duration-1000 ease-out relative`} 
                                style={{ width: `${progressPercentage}%` }}
                           >
                               <div className="absolute inset-0 bg-white/20 animate-shimmer" style={{ backgroundSize: '20px 20px', backgroundImage: 'linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent)' }}></div>
                           </div>
                       </div>
                       <p className="text-xs text-right mt-1 text-gray-400 font-medium">
                           {currentRankInfo.nextLevelPoints 
                                ? `${(currentRankInfo.nextLevelPoints - user.totalPoints).toLocaleString()} more points needed` 
                                : 'Maximum rank achieved!'}
                       </p>
                   </div>
              </div>
          </div>
      </div>

      {/* 2. Stats Grid - Enhanced Layout */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="relative bg-white p-5 rounded-2xl shadow-sm border border-amber-100 hover:border-amber-200 hover:shadow-md transition-all overflow-hidden group">
              <div className="absolute -right-4 -top-4 text-amber-50 opacity-20 transform rotate-12 group-hover:scale-110 transition-transform">
                  <StarIcon className="w-24 h-24" />
              </div>
              <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                          <StarIcon className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-amber-600/70 uppercase tracking-wider">Total Points</span>
                  </div>
                  <p className="text-2xl font-black text-gray-900">{user.totalPoints.toLocaleString()}</p>
              </div>
          </div>

          <div className="relative bg-white p-5 rounded-2xl shadow-sm border border-emerald-100 hover:border-emerald-200 hover:shadow-md transition-all overflow-hidden group">
              <div className="absolute -right-4 -top-4 text-emerald-50 opacity-20 transform rotate-12 group-hover:scale-110 transition-transform">
                  <CheckCircleIcon className="w-24 h-24" />
              </div>
              <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                          <CheckCircleIcon className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-emerald-600/70 uppercase tracking-wider">Accuracy</span>
                  </div>
                  <p className="text-2xl font-black text-gray-900">{accuracy}%</p>
              </div>
          </div>

          <div className="relative bg-white p-5 rounded-2xl shadow-sm border border-blue-100 hover:border-blue-200 hover:shadow-md transition-all overflow-hidden group">
              <div className="absolute -right-4 -top-4 text-blue-50 opacity-20 transform rotate-12 group-hover:scale-110 transition-transform">
                  <ClipboardIcon className="w-24 h-24" />
              </div>
              <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                          <ClipboardIcon className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-blue-600/70 uppercase tracking-wider">Quizzes</span>
                  </div>
                  <p className="text-2xl font-black text-gray-900">{quizzesCompleted}</p>
              </div>
          </div>

          <div className="relative bg-white p-5 rounded-2xl shadow-sm border border-purple-100 hover:border-purple-200 hover:shadow-md transition-all overflow-hidden group">
              <div className="absolute -right-4 -top-4 text-purple-50 opacity-20 transform rotate-12 group-hover:scale-110 transition-transform">
                  <TrophyIcon className="w-24 h-24" />
              </div>
              <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                          <BadgeCheckIcon className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-purple-600/70 uppercase tracking-wider">Badges</span>
                  </div>
                  <p className="text-2xl font-black text-gray-900">{user.badges.length} <span className="text-base font-medium text-gray-400">/ {Object.keys(BADGES).length}</span></p>
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 3. Achievements / Badges - Improved Layout */}
          <div className="lg:col-span-1 bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex flex-col h-[500px]">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <BadgeCheckIcon className="w-6 h-6 mr-2 text-yellow-500" />
                  Achievements
              </h3>
              
              <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar space-y-6">
                  {/* Earned Section */}
                  {earnedBadges.length > 0 && (
                      <div>
                          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Unlocked ({earnedBadges.length})</h4>
                          <div className="space-y-3">
                              {earnedBadges.map(badge => {
                                  const Icon = badge.icon;
                                  return (
                                      <div key={badge.name} className="flex items-center p-3 rounded-xl bg-gradient-to-r from-yellow-50 to-white border border-yellow-100 shadow-sm">
                                          <div className="w-10 h-10 rounded-full bg-yellow-400 text-white flex items-center justify-center shadow-sm mr-3">
                                              <Icon className="w-5 h-5" />
                                          </div>
                                          <div>
                                              <p className="font-bold text-sm text-gray-900">{badge.name}</p>
                                              <p className="text-xs text-gray-500">Completed</p>
                                          </div>
                                          <CheckCircleIcon className="w-5 h-5 text-green-500 ml-auto" />
                                      </div>
                                  )
                              })}
                          </div>
                      </div>
                  )}

                  {/* In Progress Section */}
                  {lockedBadges.length > 0 && (
                      <div>
                          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3 mt-2">Next Targets ({lockedBadges.length})</h4>
                          <div className="space-y-3">
                              {lockedBadges.map(badge => {
                                  const Icon = badge.icon;
                                  const progressInfo = badgeProgress[badge.name];
                                  const progressPercent = Math.min((progressInfo.current / progressInfo.target) * 100, 100);

                                  return (
                                      <div key={badge.name} className="p-3 rounded-xl border border-gray-100 bg-gray-50/50">
                                          <div className="flex items-center mb-3">
                                              <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center mr-3 grayscale">
                                                  <Icon className="w-5 h-5" />
                                              </div>
                                              <div>
                                                  <p className="font-bold text-sm text-gray-600">{badge.name}</p>
                                                  <p className="text-[10px] text-gray-400">{badge.description}</p>
                                              </div>
                                          </div>
                                          
                                          {/* Visual Progress Bar */}
                                          <div className="relative pt-1">
                                              <div className="flex justify-between text-[10px] font-bold text-gray-500 mb-1">
                                                  <span>Progress</span>
                                                  <span>{Math.round(progressInfo.current)} / {progressInfo.target} {progressInfo.unit}</span>
                                              </div>
                                              <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                                                  <div 
                                                      className="h-full bg-indigo-500 rounded-full transition-all duration-500" 
                                                      style={{ width: `${progressPercent}%` }}
                                                  ></div>
                                              </div>
                                          </div>
                                      </div>
                                  )
                              })}
                          </div>
                      </div>
                  )}
              </div>
          </div>

          {/* 4. Growth Chart */}
          <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex flex-col h-[500px]">
               <div className="mb-6">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center">
                        <TrendingUpIcon className="w-6 h-6 mr-2 text-primary" />
                        Learning Journey
                    </h3>
                    <p className="text-sm text-gray-500 ml-8">Your points growth over time</p>
               </div>

               <div className="flex-grow w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#4F46E5" />
                                    <stop offset="100%" stopColor="#9333ea" />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                            <XAxis 
                                dataKey="date" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fill: '#9CA3AF', fontSize: 12, fontWeight: 500}} 
                                dy={10}
                            />
                            <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fill: '#9CA3AF', fontSize: 12, fontWeight: 500}} 
                                tickFormatter={(value) => value >= 1000 ? `${(value/1000).toFixed(1)}k` : value}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#E5E7EB', strokeWidth: 2 }} />
                            <Line 
                                type="monotone" 
                                dataKey="Points" 
                                stroke="url(#lineGradient)" 
                                strokeWidth={4} 
                                dot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: '#4F46E5' }} 
                                activeDot={{ r: 7, strokeWidth: 0, fill: '#4F46E5' }}
                                animationDuration={1500}
                            />
                        </LineChart>
                    </ResponsiveContainer>
               </div>
          </div>
      </div>

    </div>
  );
};

export default Profile;
