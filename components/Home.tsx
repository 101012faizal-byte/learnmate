
import React, { useState, useMemo, useEffect } from 'react';
import { type View, type CustomTopic } from '../types';
import { LearnMateLogo } from './icons/BrandIcons';
import { AssistantIcon, QuizIcon, DashboardIcon, VideoAnalysisIcon, ImageIcon, ImageEditIcon, VideoCreateIcon, TodoIcon } from './icons/FeatureIcons';
import { StarIcon, StarIconFilled, PlusIcon, TrashIcon, MagnifyingGlassIcon, SparklesIcon, ArrowRightOnRectangleIcon } from './icons/ActionIcons';
import AddTopicModal from './AddTopicModal';
import { TOPIC_ICONS } from '../constants';
import { generateDailySpark } from '../services/geminiService';


interface HomeProps {
    setView: (view: View) => void;
    customTopics: CustomTopic[];
    favorites: Record<string, boolean>;
    onAddTopic: (topic: Omit<CustomTopic, 'id' | 'createdAt'>) => void;
    onDeleteTopic: (id: string) => void;
    onToggleFavorite: (id: string) => void;
    searchQuery: string;
}

interface TopicCardProps {
    id: string;
    title: string;
    description: string;
    icon: React.ReactElement<{ className?: string }>;
    color: string;
    isFavorite: boolean;
    isCustom: boolean;
    onClick: () => void;
    onToggleFavorite: (id: string) => void;
    onDelete?: (id: string) => void;
}

const TopicCard: React.FC<TopicCardProps & { className?: string }> = ({ id, title, description, icon, color, isFavorite, isCustom, onClick, onToggleFavorite, onDelete, className }) => {
    // Extract the color class for the icon background (e.g., "bg-gradient-to-br from-blue-500 to-blue-600")
    // We'll try to derive a lighter shade for the card border/glow if possible, or just use the card's hover effect.
    
    return (
        <div 
            onClick={onClick}
            className={`group relative bg-white rounded-3xl p-6 cursor-pointer border border-transparent hover:border-gray-100 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1 overflow-hidden ${className}`}
        >
             {/* Subtle colored glow on hover */}
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-500 ${color}`}></div>

            <div className="flex justify-between items-start mb-5 relative z-10">
                <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center text-white shadow-lg shadow-gray-200 group-hover:scale-110 transition-transform duration-300`}>
                    {React.cloneElement(icon, { className: "w-7 h-7" })}
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                     <button
                        onClick={(e) => { e.stopPropagation(); onToggleFavorite(id); }}
                        className={`p-2 rounded-full transition-colors hover:bg-gray-100 ${isFavorite ? 'text-yellow-400 opacity-100' : 'text-gray-300'}`}
                        title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                        {isFavorite ? <StarIconFilled className="w-5 h-5" /> : <StarIcon className="w-5 h-5" />}
                    </button>
                    {isCustom && onDelete && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(id); }}
                            className="p-2 rounded-full text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                            title="Delete topic"
                        >
                            <TrashIcon className="w-5 h-5" />
                        </button>
                    )}
                </div>
                {/* Always show favorite star if it IS a favorite, even not on hover */}
                {isFavorite && (
                    <div className="absolute top-0 right-0 p-2 group-hover:hidden">
                        <StarIconFilled className="w-5 h-5 text-yellow-400" />
                    </div>
                )}
            </div>
            
            <div className="relative z-10">
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">{description}</p>
            </div>
            
            <div className="absolute bottom-6 right-6 transform translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-primary">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </div>
            </div>
        </div>
    );
};


const Home: React.FC<HomeProps> = ({ setView, customTopics, favorites, onAddTopic, onDeleteTopic, onToggleFavorite, searchQuery }) => {
    const [isAddTopicModalOpen, setIsAddTopicModalOpen] = useState(false);
    const [dailySpark, setDailySpark] = useState<{text: string, type: string} | null>(null);
    const [loadingSpark, setLoadingSpark] = useState(true);

    useEffect(() => {
        const fetchSpark = async () => {
             try {
                 const spark = await generateDailySpark();
                 setDailySpark(spark);
             } catch (e) {
                 console.error(e);
             } finally {
                 setLoadingSpark(false);
             }
        };
        fetchSpark();
    }, []);

    const greeting = useMemo(() => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 18) return "Good Afternoon";
        return "Good Evening";
    }, []);

    const features: (Omit<TopicCardProps, 'onClick' | 'onToggleFavorite' | 'isFavorite' | 'isCustom' | 'onDelete'> & { view: View })[] = useMemo(() => [
        { id: 'chat', title: 'AI Assistant', description: 'Chat with text, images, or voice for instant help.', icon: <AssistantIcon />, view: 'chat', color: 'bg-gradient-to-br from-blue-500 to-blue-600' },
        { id: 'quiz', title: 'Quiz Challenge', description: 'Test your knowledge with AI-generated quizzes.', icon: <QuizIcon />, view: 'quiz', color: 'bg-gradient-to-br from-emerald-500 to-emerald-600' },
        { id: 'profile', title: 'Profile & Stats', description: 'Track improvement and earn badges.', icon: <DashboardIcon />, view: 'profile', color: 'bg-gradient-to-br from-purple-500 to-purple-600' },
        { id: 'todo', title: 'Study Planner', description: 'Organize your study schedule efficiently.', icon: <TodoIcon />, view: 'todo', color: 'bg-gradient-to-br from-amber-500 to-amber-600' },
        { id: 'videoAnalysis', title: 'Video Analysis', description: 'Get AI summaries from any video file.', icon: <VideoAnalysisIcon />, view: 'videoAnalysis', color: 'bg-gradient-to-br from-orange-500 to-orange-600' },
        { id: 'imageGenerator', title: 'Image Generator', description: 'Create visuals from text descriptions.', icon: <ImageIcon />, view: 'imageGenerator', color: 'bg-gradient-to-br from-teal-500 to-teal-600' },
        { id: 'imageEditor', title: 'AI Image Editor', description: 'Edit photos with simple text commands.', icon: <ImageEditIcon />, view: 'imageEditor', color: 'bg-gradient-to-br from-pink-500 to-pink-600' },
        { id: 'video', title: 'Video Creator', description: 'Generate short videos with Veo.', icon: <VideoCreateIcon />, view: 'video', color: 'bg-gradient-to-br from-rose-500 to-rose-600' },
    ], []);

    const allTopics = useMemo(() => {
        const featureTopics = features.map(f => ({ ...f, isCustom: false, description: f.description || `Explore ${f.title}.`, onClick: () => setView(f.view) }));
        const customMappedTopics = customTopics.map(t => {
            const IconComponent = TOPIC_ICONS[t.icon] || AssistantIcon;
            return {
                id: t.id,
                title: t.name,
                description: `Custom dashboard for ${t.name}.`,
                icon: <IconComponent />,
                color: t.color, // Expecting a full bg class like 'bg-red-500'
                isCustom: true,
                onClick: () => setView('chat'), 
                onDelete: onDeleteTopic,
            };
        });
        return [...featureTopics, ...customMappedTopics];
    }, [features, customTopics, setView, onDeleteTopic]);
    
    const filteredTopics = useMemo(() => {
        if (!searchQuery) return allTopics;
        return allTopics.filter(topic =>
            topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            topic.description.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [allTopics, searchQuery]);

    const isSearching = !!searchQuery;
    
    const favoriteTopics = useMemo(() => isSearching ? [] : allTopics.filter(t => favorites[t.id]), [allTopics, favorites, isSearching]);
    const regularFeatures = useMemo(() => isSearching ? [] : allTopics.filter(t => !t.isCustom && !favorites[t.id]), [allTopics, favorites, isSearching]);
    const userTopics = useMemo(() => isSearching ? [] : allTopics.filter(t => t.isCustom && !favorites[t.id]), [allTopics, favorites, isSearching]);

    return (
        <div className="animate-fade-in space-y-10 max-w-7xl mx-auto pb-12 px-2 md:px-0">
            {isAddTopicModalOpen && <AddTopicModal onAdd={onAddTopic} onClose={() => setIsAddTopicModalOpen(false)} />}
            
            {!isSearching && (
                <div className="relative w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl shadow-xl overflow-hidden text-white p-6 md:p-10 isolate">
                    {/* Abstract Shapes */}
                    <div className="absolute top-0 right-0 -mr-10 -mt-10 w-[300px] h-[300px] bg-white/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-[200px] h-[200px] bg-indigo-900/20 rounded-full blur-3xl"></div>
                    
                    {/* Content */}
                    <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
                        <div className="space-y-4">
                             <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
                                {greeting}, <br/>
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-pink-200">Student</span>
                            </h1>
                            <p className="text-base md:text-lg text-indigo-100 font-medium max-w-md">
                                Ready to expand your knowledge? Ask AI anything or pick a tool to start creating.
                            </p>
                            <div className="flex flex-wrap gap-3 pt-2">
                                <button onClick={() => setView('chat')} className="px-6 py-3 bg-white text-indigo-600 font-bold rounded-full hover:bg-indigo-50 transition-colors shadow-lg shadow-indigo-900/20 text-sm md:text-base">
                                    Start Chatting
                                </button>
                                <button onClick={() => setView('quiz')} className="px-6 py-3 bg-indigo-800/50 text-white font-bold rounded-full hover:bg-indigo-800/70 transition-colors backdrop-blur-sm text-sm md:text-base">
                                    Take a Quiz
                                </button>
                            </div>
                        </div>

                        {/* Daily Spark Glass Card */}
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-xl hover:bg-white/15 transition-all duration-300 transform hover:-translate-y-1">
                             <div className="flex items-center gap-3 mb-3">
                                 <div className="p-1.5 bg-yellow-400/20 rounded-lg">
                                    <SparklesIcon className="w-5 h-5 text-yellow-300" />
                                 </div>
                                 <span className="text-xs font-bold uppercase tracking-wider text-yellow-100">Daily Inspiration</span>
                             </div>
                             
                             {loadingSpark ? (
                                 <div className="animate-pulse space-y-2">
                                     <div className="h-3 bg-white/20 rounded w-3/4"></div>
                                     <div className="h-3 bg-white/20 rounded w-full"></div>
                                 </div>
                             ) : dailySpark ? (
                                 <div>
                                     <p className="text-lg md:text-xl font-medium leading-relaxed font-serif italic text-white/90">
                                         "{dailySpark.text}"
                                     </p>
                                     <p className="mt-2 text-xs font-bold text-white/60 uppercase tracking-widest">{dailySpark.type}</p>
                                 </div>
                             ) : (
                                 <p className="text-white/80 text-sm">Check back tomorrow for more insights!</p>
                             )}
                        </div>
                    </div>
                </div>
            )}
            
            {/* Search Results View */}
            {isSearching && (
                <section>
                     {filteredTopics.length > 0 ? (
                        <>
                            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                                <MagnifyingGlassIcon className="w-6 h-6 mr-2 text-primary"/> Search Results
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {filteredTopics.map(topic => (
                                    <TopicCard key={topic.id} {...topic} isFavorite={!!favorites[topic.id]} onToggleFavorite={onToggleFavorite} />
                                ))}
                            </div>
                        </>
                     ) : (
                        <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                            <MagnifyingGlassIcon className="w-12 h-12 text-gray-300 mx-auto mb-4"/>
                            <h2 className="text-xl font-bold text-gray-700 mb-2">No results found</h2>
                            <p className="text-gray-500">We couldn't find anything for "{searchQuery}".</p>
                        </div>
                     )}
                </section>
            )}

            {/* Browse Mode */}
            {!isSearching && (
                <div className="space-y-16">
                    
                    {/* Favorites */}
                    {favoriteTopics.length > 0 && (
                        <section className="animate-slide-in-up">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-yellow-100 rounded-lg">
                                    <StarIconFilled className="w-5 h-5 text-yellow-600"/>
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900">Your Favorites</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {favoriteTopics.map(topic => (
                                    <TopicCard key={topic.id} {...topic} isFavorite={true} onToggleFavorite={onToggleFavorite} />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* All Features */}
                    <section className="animate-slide-in-up" style={{ animationDelay: '0.1s' }}>
                        <div className="flex items-center gap-3 mb-6">
                             <div className="p-2 bg-blue-100 rounded-lg">
                                <AssistantIcon className="w-5 h-5 text-blue-600"/>
                             </div>
                            <h2 className="text-2xl font-bold text-gray-900">Explore Tools</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {regularFeatures.map(feature => (
                               <TopicCard key={feature.id} {...feature} isFavorite={!!favorites[feature.id]} onToggleFavorite={onToggleFavorite} />
                            ))}
                        </div>
                    </section>
                    
                    {/* Custom Topics */}
                    <section className="animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                    <DashboardIcon className="w-5 h-5 text-purple-600"/>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">My Topics</h2>
                                </div>
                            </div>
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {userTopics.map(topic => (
                               <TopicCard key={topic.id} {...topic} isFavorite={!!favorites[topic.id]} onToggleFavorite={onToggleFavorite} />
                            ))}
                            
                            {/* Add Topic Card */}
                            <button 
                                onClick={() => setIsAddTopicModalOpen(true)}
                                className="group h-full min-h-[200px] border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center p-6 hover:border-primary hover:bg-primary/5 transition-all duration-300"
                            >
                                <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-white group-hover:shadow-md transition-all">
                                    <PlusIcon className="w-6 h-6 text-gray-400 group-hover:text-primary" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-400 group-hover:text-primary transition-colors">Create Topic</h3>
                                <p className="text-sm text-gray-400 mt-2 text-center group-hover:text-primary/70">Organize your chats & resources</p>
                            </button>
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
};

export default Home;
