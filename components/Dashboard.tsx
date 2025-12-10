import React, { useMemo } from 'react';
import { type QuizResult, Subject } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, TooltipProps } from 'recharts';
import { SUBJECTS } from '../constants';
import { TrophyIcon, StarIcon, TrendingUpIcon } from './icons/ActionIcons';
import { BookOpenIcon } from './icons/SubjectIcons';

interface DashboardProps {
  quizHistory: QuizResult[];
}

const Badge: React.FC<{ subject: Subject; achieved: boolean }> = ({ subject, achieved }) => {
    const subjectInfo = SUBJECTS[subject];
    return (
        <div className={`p-4 rounded-lg flex flex-col items-center justify-center text-center transition-all duration-300 ${achieved ? `${subjectInfo.color} text-white shadow-lg` : 'bg-gray-200 text-gray-500'}`}>
            <TrophyIcon className="w-10 h-10 mb-2"/>
            <h4 className="font-bold">{subjectInfo.name} Master</h4>
            <p className="text-xs">{achieved ? 'Achieved!' : 'Keep Practicing!'}</p>
        </div>
    );
};

const CustomTooltip: React.FC<TooltipProps<number, string>> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-surface p-3 border border-gray-300 rounded-lg shadow-lg">
          <p className="font-bold text-text-primary mb-1">{`${label}`}</p>
          <p className="text-sm text-primary">{`Average Score: ${data['Average Score']}%`}</p>
          <p className="text-sm text-text-secondary">{`Quizzes Taken: ${data.quizzesTaken}`}</p>
          {data.quizzesTaken > 0 && (
            <p className="text-sm text-text-secondary">{`Highest Score: ${data.highestScore}%`}</p>
          )}
        </div>
      );
    }
  
    return null;
  };

const Dashboard: React.FC<DashboardProps> = ({ quizHistory }) => {
  const stats = useMemo(() => {
    if (quizHistory.length === 0) {
      return { totalQuizzes: 0, averageScore: 0, subjectData: [], badges: {} };
    }
    const totalQuizzes = quizHistory.length;
    const totalScore = quizHistory.reduce((sum, result) => sum + (result.score / result.total) * 100, 0);
    const averageScore = totalScore / totalQuizzes;

    const subjectData = Object.values(Subject).map(subject => {
      const subjectQuizzes = quizHistory.filter(q => q.subject === subject);
      if (subjectQuizzes.length === 0) {
        return { 
            name: subject, 
            "Average Score": 0,
            quizzesTaken: 0,
            highestScore: 0,
        };
      }
      const scores = subjectQuizzes.map(q => Math.round((q.score / q.total) * 100));
      const subjectTotalScore = scores.reduce((sum, score) => sum + score, 0);
      return {
        name: subject,
        "Average Score": Math.round(subjectTotalScore / subjectQuizzes.length),
        quizzesTaken: subjectQuizzes.length,
        highestScore: Math.max(...scores),
      };
    });
    
    const badges = Object.values(Subject).reduce((acc, subject) => {
        const subjectQuizzes = quizHistory.filter(q => q.subject === subject);
        const hasMastered = subjectQuizzes.some(q => (q.score / q.total) >= 0.8);
        return {...acc, [subject]: hasMastered};
    }, {} as {[key in Subject]: boolean});

    return { totalQuizzes, averageScore: Math.round(averageScore), subjectData, badges };
  }, [quizHistory]);

  if (quizHistory.length === 0) {
    return (
      <div className="text-center p-10 bg-surface rounded-xl shadow-md">
        <h2 className="text-2xl font-bold text-text-primary mb-4">Your Learning Dashboard</h2>
        <BookOpenIcon className="w-24 h-24 mx-auto text-gray-300 mb-4"/>
        <p className="text-text-secondary">You haven't taken any quizzes yet. Complete a quiz to see your progress here!</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <h2 className="text-3xl font-bold text-text-primary">Your Learning Dashboard</h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface p-6 rounded-xl shadow-md flex items-center space-x-4">
          <div className="bg-blue-100 p-3 rounded-full"><StarIcon className="w-6 h-6 text-blue-500"/></div>
          <div>
            <p className="text-sm text-text-secondary">Total Quizzes</p>
            <p className="text-2xl font-bold text-text-primary">{stats.totalQuizzes}</p>
          </div>
        </div>
        <div className="bg-surface p-6 rounded-xl shadow-md flex items-center space-x-4">
          <div className="bg-green-100 p-3 rounded-full"><TrophyIcon className="w-6 h-6 text-green-500"/></div>
          <div>
            <p className="text-sm text-text-secondary">Average Score</p>
            <p className="text-2xl font-bold text-text-primary">{stats.averageScore}%</p>
          </div>
        </div>
        <div className="bg-surface p-6 rounded-xl shadow-md flex items-center space-x-4">
          <div className="bg-purple-100 p-3 rounded-full"><TrendingUpIcon className="w-6 h-6 text-purple-500"/></div>
          <div>
            <p className="text-sm text-text-secondary">Badges Earned</p>
            <p className="text-2xl font-bold text-text-primary">{Object.values(stats.badges).filter(Boolean).length} / {Object.keys(stats.badges).length}</p>
          </div>
        </div>
      </div>
      
      {/* Badges and Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-surface p-6 rounded-xl shadow-md">
            <h3 className="text-xl font-semibold mb-4 text-text-primary">Achievement Badges</h3>
            <div className="grid grid-cols-2 gap-4">
                {Object.values(Subject).map(subj => (
                    <Badge key={subj} subject={subj} achieved={stats.badges[subj]} />
                ))}
            </div>
        </div>
        <div className="lg:col-span-2 bg-surface p-6 rounded-xl shadow-md">
          <h3 className="text-xl font-semibold mb-4 text-text-primary">Performance by Subject</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.subjectData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis unit="%" />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(79, 70, 229, 0.1)' }} />
              <Legend />
              <Bar dataKey="Average Score" fill="#4F46E5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Quizzes */}
      <div className="bg-surface p-6 rounded-xl shadow-md">
        <h3 className="text-xl font-semibold mb-4 text-text-primary">Recent Quizzes</h3>
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {[...quizHistory].reverse().map((result, index) => {
            const subjectInfo = SUBJECTS[result.subject];
            const percentage = Math.round((result.score / result.total) * 100);
            return (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${subjectInfo.color}`}><subjectInfo.icon className="w-5 h-5 text-white"/></div>
                  <div>
                    <p className="font-semibold text-text-primary">{result.subject}</p>
                    <p className="text-xs text-text-secondary">{new Date(result.date).toLocaleString()}</p>
                  </div>
                </div>
                <p className="font-bold text-lg text-primary">{percentage}%</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
