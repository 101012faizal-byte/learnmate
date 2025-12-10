import { RANKS } from '../constants';
import { type Rank, type BadgeName, type QuizResult, Subject } from '../types';

export const getRank = (points: number): Rank => {
  if (points >= RANKS.Diamond.minPoints) return 'Diamond';
  if (points >= RANKS.Emerald.minPoints) return 'Emerald';
  if (points >= RANKS.Gold.minPoints) return 'Gold';
  if (points >= RANKS.Silver.minPoints) return 'Silver';
  return 'Bronze';
};

export const getNewBadges = (
    currentBadges: BadgeName[], 
    latestResult: QuizResult, 
    fullHistory: QuizResult[]
): BadgeName[] => {
    const earnedBadges = new Set<BadgeName>(currentBadges);
    const fullHistoryWithLatest = [...fullHistory, latestResult];

    // "Math Star": Score 90%+ in a Math quiz
    if (latestResult.subject === Subject.Math && (latestResult.score / latestResult.total) >= 0.9) {
        earnedBadges.add('Math Star');
    }

    // "Grammar Pro": Score 90%+ in an English quiz
    if (latestResult.subject === Subject.English && (latestResult.score / latestResult.total) >= 0.9) {
        earnedBadges.add('Grammar Pro');
    }

    // "Quiz Champ": Complete 10 quizzes
    if (fullHistoryWithLatest.length >= 10) {
        earnedBadges.add('Quiz Champ');
    }

    // "Knowledge Seeker": Answer 100 questions correctly
    const totalCorrectAnswers = fullHistoryWithLatest.reduce((sum, result) => sum + result.score, 0);
    if (totalCorrectAnswers >= 100) {
        earnedBadges.add('Knowledge Seeker');
    }

    return Array.from(earnedBadges);
};


export const calculateAccuracy = (quizHistory: QuizResult[]): number => {
    if (quizHistory.length === 0) return 0;
    const totalCorrect = quizHistory.reduce((sum, r) => sum + r.score, 0);
    const totalQuestions = quizHistory.reduce((sum, r) => sum + r.total, 0);
    return totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
};
