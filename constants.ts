
import React from 'react';
// FIX: Import 'Rank' and 'BadgeName' types.
import { Subject, Rank, BadgeName } from './types';
// FIX: Import 'BookOpenIcon' and other icons for use in constants.
import { CalculatorIcon, PhysicsIcon, BeakerIcon, BookOpenIcon, GlobeAltIcon, HistoryIcon, CodeBracketIcon, BrainCircuitIcon, BiologyIcon } from './components/icons/SubjectIcons';
import { AssistantIcon, QuizIcon, DashboardIcon, VideoAnalysisIcon, ImageIcon, ImageEditIcon, VideoCreateIcon, TodoIcon } from './components/icons/FeatureIcons';
import { BadgeCheckIcon, StarIcon, TrophyIcon, PencilIcon } from './components/icons/ActionIcons';


export const TARGET_SCORE = 1000;
export const GAME_DURATION_SECONDS = 90;
export const POINTS_PER_CORRECT_ANSWER = 100;
// FIX: Export missing 'QUIZ_LENGTH' constant.
export const QUIZ_LENGTH = 10;

// FIX: Add 'English' to the SUBJECTS constant.
export const SUBJECTS: { [key in Subject]: { name: Subject; color: string; icon: React.FC<{className?: string}> } } = {
  [Subject.Math]: { name: Subject.Math, color: 'from-blue-500 to-indigo-600', icon: CalculatorIcon },
  [Subject.Physics]: { name: Subject.Physics, color: 'from-purple-500 to-violet-600', icon: PhysicsIcon },
  [Subject.Chemistry]: { name: Subject.Chemistry, color: 'from-teal-500 to-emerald-600', icon: BeakerIcon },
  [Subject.Biology]: { name: Subject.Biology, color: 'from-lime-500 to-green-600', icon: BiologyIcon },
  [Subject.History]: { name: Subject.History, color: 'from-orange-500 to-amber-600', icon: HistoryIcon },
  [Subject.Geography]: { name: Subject.Geography, color: 'from-cyan-500 to-sky-600', icon: GlobeAltIcon },
  [Subject.ComputerScience]: { name: Subject.ComputerScience, color: 'from-slate-600 to-gray-700', icon: CodeBracketIcon },
  [Subject.English]: { name: Subject.English, color: 'from-rose-500 to-pink-600', icon: BookOpenIcon },
  [Subject.Custom]: { name: Subject.Custom, color: 'from-gray-500 to-gray-600', icon: PencilIcon },
};

// FIX: Export missing 'TOPIC_COLORS' constant.
export const TOPIC_COLORS: string[] = [
    'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500',
    'bg-lime-500', 'bg-green-500', 'bg-emerald-500', 'bg-teal-500',
    'bg-cyan-500', 'bg-sky-500', 'bg-blue-500', 'bg-indigo-500',
    'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500',
    'bg-rose-500'
];

// FIX: Export missing 'TOPIC_ICONS' constant.
export const TOPIC_ICONS: { [key: string]: React.FC<{ className?: string }> } = {
    AssistantIcon, QuizIcon, DashboardIcon, VideoAnalysisIcon, ImageIcon,
    ImageEditIcon, VideoCreateIcon, TodoIcon, CalculatorIcon, PhysicsIcon,
    BeakerIcon, BookOpenIcon, GlobeAltIcon, HistoryIcon, CodeBracketIcon,
    BrainCircuitIcon, BiologyIcon
};

export const IMAGE_STYLES = [
    'None',
    'Photorealistic',
    'Cinematic',
    'Anime',
    'Digital Art',
    'Oil Painting',
    'Cyberpunk',
    'Watercolor',
    '3D Render',
    'Sketch',
    'Pixel Art',
    'Vintage',
];

interface RankInfo {
    minPoints: number;
    nextLevelPoints?: number;
    bgColor: string;
    color: string;
    progressColor: string;
    icon: React.FC<{ className?: string }>;
}

// FIX: Export missing 'RANKS' constant.
export const RANKS: { [key in Rank]: RankInfo } = {
    Bronze: { minPoints: 0, nextLevelPoints: 500, bgColor: 'bg-orange-200', color: 'text-orange-800', progressColor: 'bg-orange-500', icon: TrophyIcon },
    Silver: { minPoints: 500, nextLevelPoints: 1500, bgColor: 'bg-gray-200', color: 'text-gray-800', progressColor: 'bg-gray-500', icon: TrophyIcon },
    Gold: { minPoints: 1500, nextLevelPoints: 3000, bgColor: 'bg-yellow-200', color: 'text-yellow-800', progressColor: 'bg-yellow-500', icon: TrophyIcon },
    Emerald: { minPoints: 3000, nextLevelPoints: 5000, bgColor: 'bg-emerald-200', color: 'text-emerald-800', progressColor: 'bg-emerald-500', icon: TrophyIcon },
    Diamond: { minPoints: 5000, bgColor: 'bg-cyan-200', color: 'text-cyan-800', progressColor: 'bg-cyan-500', icon: TrophyIcon },
};

interface BadgeInfo {
    name: BadgeName;
    description: string;
    icon: React.FC<{ className?: string }>;
}

// FIX: Export missing 'BADGES' constant.
export const BADGES: { [key in BadgeName]: BadgeInfo } = {
    'Math Star': { name: 'Math Star', description: "Score 90%+ in a Math quiz.", icon: StarIcon },
    'Grammar Pro': { name: 'Grammar Pro', description: "Score 90%+ in an English quiz.", icon: StarIcon },
    'Quiz Champ': { name: 'Quiz Champ', description: "Complete 10 quizzes.", icon: BadgeCheckIcon },
    'Knowledge Seeker': { name: 'Knowledge Seeker', description: "Answer 100 questions correctly.", icon: BadgeCheckIcon },
};
