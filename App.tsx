import React, { useState, useEffect, useCallback } from 'react';
import { type View, type User, type QuizResult, type ChatSession, type CustomTopic } from './types';
import { getRank, getNewBadges } from './utils/profileUtils';

import Header from './components/Header';
import Home from './components/Home';
import Chat from './components/Chat';
import Quiz from './components/Quiz';
import Profile from './components/Profile';
import Onboarding from './components/Onboarding';
import VideoAnalysis from './components/VideoAnalysis';
import ImageGenerator from './components/ImageGenerator';
import ImageEditor from './components/ImageEditor';
import Video from './components/Video';
import Todo from './components/Todo';

const App: React.FC = () => {
    const [view, setView] = useState<View>('home');
    const [searchQuery, setSearchQuery] = useState('');

    // --- State Management ---
    const [user, setUser] = useState<User | null>(null);
    const [quizHistory, setQuizHistory] = useState<QuizResult[]>([]);
    const [customTopics, setCustomTopics] = useState<CustomTopic[]>([]);
    const [favorites, setFavorites] = useState<Record<string, boolean>>({});
    const [showOnboarding, setShowOnboarding] = useState(false);
    
    // Load all data from localStorage on initial mount
    useEffect(() => {
        try {
            const savedUser = localStorage.getItem('learnMateUser');
            if (savedUser) {
                setUser(JSON.parse(savedUser));
            } else {
                // Create a default user if none exists
                const defaultUser: User = {
                    id: 'default-user',
                    name: 'Alex Johnson',
                    email: 'alex.j@example.com',
                    rank: 'Bronze',
                    totalPoints: 125,
                    badges: [],
                    progress: [{ date: Date.now() - 86400000, points: 50 }, { date: Date.now(), points: 125 }],
                };
                setUser(defaultUser);
            }
            
            const savedHistory = localStorage.getItem('learnMateQuizHistory');
            setQuizHistory(savedHistory ? JSON.parse(savedHistory) : []);
            
            const savedTopics = localStorage.getItem('learnMateCustomTopics');
            setCustomTopics(savedTopics ? JSON.parse(savedTopics) : []);
            
            const savedFavorites = localStorage.getItem('learnMateFavorites');
            setFavorites(savedFavorites ? JSON.parse(savedFavorites) : {});

            const hasOnboarded = localStorage.getItem('learnMateOnboarded');
            if (!hasOnboarded) {
                setShowOnboarding(true);
            }

        } catch (error) {
            console.error("Failed to load data from localStorage", error);
        }
    }, []);

    // Save functions to persist state changes
    const saveState = (key: string, data: any) => {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            console.error(`Failed to save ${key} to localStorage`, error);
        }
    };
    
    useEffect(() => { if(user) saveState('learnMateUser', user); }, [user]);
    useEffect(() => { saveState('learnMateQuizHistory', quizHistory); }, [quizHistory]);
    useEffect(() => { saveState('learnMateCustomTopics', customTopics); }, [customTopics]);
    useEffect(() => { saveState('learnMateFavorites', favorites); }, [favorites]);
    
    const handleUpdateProfile = useCallback((updatedUser: User) => {
        setUser(updatedUser);
    }, []);

    const addQuizResult = useCallback((result: QuizResult) => {
        setUser(prevUser => {
            if (!prevUser) return null;
            
            const pointsEarned = result.score * 25;
            const newTotalPoints = prevUser.totalPoints + pointsEarned;
            const newRank = getRank(newTotalPoints);
            const fullHistory = [...quizHistory, result];
            const newBadges = getNewBadges(prevUser.badges, result, fullHistory);

            return {
                ...prevUser,
                totalPoints: newTotalPoints,
                rank: newRank,
                badges: newBadges,
                progress: [...prevUser.progress, { date: Date.now(), points: newTotalPoints }],
            };
        });

        setQuizHistory(prev => [...prev, result]);
    }, [quizHistory]);

    const handleAddTopic = useCallback((topic: Omit<CustomTopic, 'id' | 'createdAt'>) => {
        const newTopic: CustomTopic = {
            ...topic,
            id: `custom-${Date.now()}`,
            createdAt: Date.now(),
        };
        setCustomTopics(prev => [newTopic, ...prev]);
    }, []);

    const handleDeleteTopic = useCallback((id: string) => {
        if (window.confirm("Are you sure you want to delete this topic?")) {
            setCustomTopics(prev => prev.filter(t => t.id !== id));
            setFavorites(prev => {
                const newFavs = {...prev};
                delete newFavs[id];
                return newFavs;
            });
        }
    }, []);

    const handleToggleFavorite = useCallback((id: string) => {
        setFavorites(prev => ({ ...prev, [id]: !prev[id] }));
    }, []);

    const handleFinishOnboarding = () => {
        setShowOnboarding(false);
        localStorage.setItem('learnMateOnboarded', 'true');
    };

    const renderView = () => {
        if (!user) {
            return (
                <div className="flex items-center justify-center h-full">
                    <p>Loading user profile...</p>
                </div>
            );
        }

        switch (view) {
            case 'chat': return <Chat />;
            case 'quiz': return <Quiz addQuizResult={addQuizResult} />;
            case 'profile': return <Profile user={user} onUpdateProfile={handleUpdateProfile} quizHistory={quizHistory} />;
            case 'videoAnalysis': return <VideoAnalysis />;
            case 'imageGenerator': return <ImageGenerator />;
            case 'imageEditor': return <ImageEditor />;
            case 'video': return <Video />;
            case 'todo': return <Todo />;
            case 'home':
            default:
                return <Home 
                            setView={setView} 
                            customTopics={customTopics}
                            favorites={favorites}
                            onAddTopic={handleAddTopic}
                            onDeleteTopic={handleDeleteTopic}
                            onToggleFavorite={handleToggleFavorite}
                            searchQuery={searchQuery}
                         />;
        }
    };
    
    if (!user) return null; // Or a loading spinner

    return (
        <div className="min-h-screen bg-background text-text-primary font-sans flex flex-col">
            {showOnboarding && <Onboarding onFinish={handleFinishOnboarding} />}
            <Header user={user} currentView={view} setView={setView} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
            <main className="flex-1 p-4 sm:p-6 lg:p-8">
                {renderView()}
            </main>
        </div>
    );
};

export default App;
