
import React, { useState, useEffect } from 'react';
import { marked } from 'marked';
import { type Task, type TaskPriority } from '../types';
import { generateStudyTips } from '../services/geminiService';
import { PlusIcon, TrashIcon, ClockIcon, XMarkIcon, SparklesIcon, CheckCircleIcon, CheckIcon, ArrowPathIcon } from './icons/ActionIcons';
import { BrainCircuitIcon } from './icons/SubjectIcons';
import ErrorDisplay from './ErrorDisplay';

const ReminderModal: React.FC<{ task: Task; onSetReminder: (id: string, timestamp: number) => void; onClose: () => void; }> = ({ task, onSetReminder, onClose }) => {
    const now = new Date();
    const minDateTime = now.toISOString().slice(0, 16);
    const [reminderDateTime, setReminderDateTime] = useState(minDateTime);

    const handleSet = () => {
        const selectedDate = new Date(reminderDateTime);
        if (selectedDate > now) {
            onSetReminder(task.id, selectedDate.getTime());
            onClose();
        } else {
            alert("Please select a future date and time for the reminder.");
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm transform animate-slide-in-up" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-900">Set Reminder</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-gray-500">
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl mb-6">
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-bold mb-1">Task</p>
                    <p className="text-sm font-medium text-gray-800 line-clamp-2">{task.text}</p>
                </div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Date & Time</label>
                <input
                    type="datetime-local"
                    value={reminderDateTime}
                    onChange={(e) => setReminderDateTime(e.target.value)}
                    min={minDateTime}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-gray-50"
                />
                <div className="flex justify-end mt-8 space-x-3">
                    <button onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
                        Cancel
                    </button>
                    <button onClick={handleSet} className="px-5 py-2.5 text-sm font-semibold text-white bg-primary rounded-xl hover:bg-primary-dark shadow-md transition-colors">
                        Save Reminder
                    </button>
                </div>
            </div>
        </div>
    );
};

const Todo: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [newTaskText, setNewTaskText] = useState('');
    const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('Medium');
    const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
    const [showReminderModalFor, setShowReminderModalFor] = useState<Task | null>(null);
    const [studyTips, setStudyTips] = useState<string | null>(null);
    const [isGeneratingTips, setIsGeneratingTips] = useState(false);
    const [tipsError, setTipsError] = useState<string | null>(null);
    
    useEffect(() => {
        try {
            const savedTasks = localStorage.getItem('todoTasks');
            if (savedTasks) {
                setTasks(JSON.parse(savedTasks));
            }
        } catch (error) {
            console.error("Failed to load tasks from localStorage", error);
        }
    }, []);
    
    useEffect(() => {
        try {
            localStorage.setItem('todoTasks', JSON.stringify(tasks));
        } catch (error) {
            console.error("Failed to save tasks to localStorage", error);
        }
    }, [tasks]);

    const handleAddTask = (e: React.FormEvent) => {
        e.preventDefault();
        if (newTaskText.trim() === '') return;
        const newTask: Task = {
            id: Date.now().toString(),
            text: newTaskText.trim(),
            completed: false,
            createdAt: Date.now(),
            priority: newTaskPriority,
        };
        setTasks([newTask, ...tasks]);
        setNewTaskText('');
        setNewTaskPriority('Medium');
    };
    
    const handleToggleTask = (id: string) => {
        setTasks(tasks.map(task => 
            task.id === id ? { ...task, completed: !task.completed } : task
        ));
    };
    
    const handleDeleteTask = (id: string) => {
        setTasks(tasks.filter(task => task.id !== id));
    };

    const handleSetReminder = (id: string, timestamp: number) => {
        if (Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    localStorage.setItem('notificationsEnabled', 'true');
                    setTasks(tasks.map(task => task.id === id ? { ...task, reminder: timestamp } : task));
                } else {
                    alert('Notification permission was denied. You can enable it in your browser settings.');
                }
            });
        } else if (Notification.permission === 'denied') {
             alert('Notification permission has been denied. You can enable it in your browser settings.');
        } else {
             setTasks(tasks.map(task => task.id === id ? { ...task, reminder: timestamp } : task));
        }
    };

    const handleGenerateTips = async () => {
        setIsGeneratingTips(true);
        setTipsError(null);
        setStudyTips(null);
        try {
            const activeTasks = tasks.filter(t => !t.completed);
            if (activeTasks.length === 0) {
                setTipsError("Add some active tasks to get study tips.");
                return;
            }
            const tips = await generateStudyTips(activeTasks);
            setStudyTips(tips);
        } catch (err) {
            setTipsError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsGeneratingTips(false);
        }
    };
    
    const handleSmartSort = () => {
         const priorityMap = { 'High': 3, 'Medium': 2, 'Low': 1 };
         const sorted = [...tasks].sort((a, b) => {
             // First by status (incomplete first)
             if (a.completed !== b.completed) return a.completed ? 1 : -1;
             // Then by priority
             const pDiff = priorityMap[b.priority] - priorityMap[a.priority];
             if (pDiff !== 0) return pDiff;
             // Then by creation
             return b.createdAt - a.createdAt;
         });
         setTasks(sorted);
    };

    const priorityStyles: { [key in TaskPriority]: { indicator: string, badge: string, iconColor: string } } = {
        High: { indicator: 'bg-red-500', badge: 'bg-red-100 text-red-700', iconColor: 'text-red-500' },
        Medium: { indicator: 'bg-amber-500', badge: 'bg-amber-100 text-amber-700', iconColor: 'text-amber-500' },
        Low: { indicator: 'bg-green-500', badge: 'bg-green-100 text-green-700', iconColor: 'text-green-500' },
    };
    
    const activeTasksCount = tasks.filter(task => !task.completed).length;
    const completedTasksCount = tasks.filter(task => task.completed).length;
    const totalTasksCount = tasks.length;
    const completionPercentage = totalTasksCount === 0 ? 0 : Math.round((completedTasksCount / totalTasksCount) * 100);

    const filteredTasks = tasks.filter(task => {
        if (filter === 'completed') return task.completed;
        if (filter === 'active') return !task.completed;
        return true;
    }); // Sorting happens in handleSmartSort or by default addition order usually
    
    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8 animate-fade-in space-y-8">
            {showReminderModalFor && (
                <ReminderModal 
                    task={showReminderModalFor} 
                    onSetReminder={handleSetReminder} 
                    onClose={() => setShowReminderModalFor(null)} 
                />
            )}

            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                    <h2 className="text-3xl font-extrabold text-text-primary">Study Planner</h2>
                    <p className="text-text-secondary mt-1">Manage your tasks efficiently.</p>
                </div>
                
                {/* Progress Card */}
                 <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 w-full md:w-auto">
                    <div className="flex-1">
                        <div className="flex justify-between text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">
                            <span>Progress</span>
                            <span>{completionPercentage}%</span>
                        </div>
                        <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-primary to-indigo-500 transition-all duration-1000 ease-out" style={{ width: `${completionPercentage}%` }}></div>
                        </div>
                    </div>
                    <div className="h-10 w-px bg-gray-200"></div>
                     <div className="text-center">
                         <span className="block text-lg font-bold text-text-primary">{activeTasksCount}</span>
                         <span className="text-xs text-gray-500">Pending</span>
                     </div>
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Task Column */}
                <div className="lg:col-span-2 space-y-6">
                     {/* Add Task Form */}
                    <form onSubmit={handleAddTask} className="bg-white p-2 md:p-3 rounded-2xl shadow-lg border border-gray-100 flex flex-col sm:flex-row gap-2 transition-shadow focus-within:shadow-xl focus-within:ring-2 focus-within:ring-primary/20">
                        <input
                            type="text"
                            value={newTaskText}
                            onChange={(e) => setNewTaskText(e.target.value)}
                            placeholder="Add a new task..."
                            className="flex-grow p-3 bg-transparent border-none focus:ring-0 placeholder-gray-400 text-text-primary"
                        />
                        <div className="flex items-center gap-2 px-2">
                            <select
                                value={newTaskPriority}
                                onChange={(e) => setNewTaskPriority(e.target.value as TaskPriority)}
                                className="p-2.5 bg-gray-50 border-none rounded-xl text-sm font-medium text-gray-600 focus:ring-0 cursor-pointer hover:bg-gray-100"
                            >
                                <option>High</option>
                                <option>Medium</option>
                                <option>Low</option>
                            </select>
                            <button type="submit" className="p-3 bg-primary text-white rounded-xl hover:bg-primary-dark transition-all transform hover:scale-105 shadow-md flex-shrink-0">
                                <PlusIcon className="w-5 h-5"/>
                            </button>
                        </div>
                    </form>

                    {/* Toolbar */}
                    <div className="flex justify-between items-center bg-gray-50 p-2 rounded-xl border border-gray-200">
                        <div className="flex space-x-1">
                            {['all', 'active', 'completed'].map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f as any)}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-lg capitalize transition-all ${filter === f ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                        <button onClick={handleSmartSort} className="flex items-center text-xs font-bold text-gray-500 hover:text-primary px-3 py-1.5 rounded-lg hover:bg-white transition-all" title="Sort by Priority & Status">
                            <ArrowPathIcon className="w-3.5 h-3.5 mr-1.5" />
                            Smart Sort
                        </button>
                    </div>

                    {/* Task List */}
                    <div className="space-y-3">
                        {filteredTasks.length > 0 ? filteredTasks.map(task => (
                            <div 
                                key={task.id} 
                                className={`group relative bg-white rounded-xl p-4 shadow-sm border border-gray-100 transition-all duration-200 hover:shadow-md hover:bg-gray-50 hover:scale-[1.005] active:scale-[0.995] flex items-start gap-4 ${task.completed ? 'opacity-60 bg-gray-50' : 'animate-slide-in-up'}`}
                            >
                                {/* Priority Indicator Stripe */}
                                <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl ${priorityStyles[task.priority].indicator}`}></div>
                                
                                {/* Checkbox */}
                                <div className="pt-0.5">
                                    <button 
                                        onClick={() => handleToggleTask(task.id)}
                                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${task.completed ? 'bg-green-500 border-green-500 scale-110' : 'border-gray-300 hover:border-primary'}`}
                                    >
                                        {task.completed && <CheckIcon className="w-4 h-4 text-white" />}
                                    </button>
                                </div>

                                <div className="flex-grow min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${priorityStyles[task.priority].badge}`}>
                                            {task.priority}
                                        </span>
                                        {task.reminder && !task.completed && (
                                            <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full flex items-center font-bold uppercase tracking-wider">
                                                <ClockIcon className="w-3 h-3 mr-1" />
                                                {new Date(task.reminder).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </span>
                                        )}
                                    </div>
                                    <p className={`text-base font-medium transition-all ${task.completed ? 'text-gray-500 line-through decoration-gray-400' : 'text-gray-800'}`}>{task.text}</p>
                                </div>

                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {!task.completed && (
                                        <button onClick={() => setShowReminderModalFor(task)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Set reminder">
                                            <ClockIcon className="w-5 h-5"/>
                                        </button>
                                    )}
                                    <button onClick={() => handleDeleteTask(task.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete task">
                                        <TrashIcon className="w-5 h-5"/>
                                    </button>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-gray-100">
                                <SparklesIcon className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                                <p className="text-gray-400 font-medium">No tasks found. Time to relax or plan ahead!</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar / AI Tips */}
                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden group">
                        {/* Animated BG */}
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
                        <div className="absolute -right-10 -top-10 bg-white/10 w-40 h-40 rounded-full blur-3xl group-hover:bg-white/20 transition-colors"></div>
                        
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                    <BrainCircuitIcon className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-xl font-bold">AI Study Coach</h3>
                            </div>
                            
                            <p className="text-sm text-indigo-100 mb-6 leading-relaxed">
                                Get personalized strategies based on your current workload and priorities.
                            </p>
                            
                            <button 
                                onClick={handleGenerateTips} 
                                disabled={isGeneratingTips || activeTasksCount === 0}
                                className="w-full py-3.5 bg-white text-indigo-600 rounded-xl font-bold hover:bg-indigo-50 transition-all shadow-lg flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
                            >
                                {isGeneratingTips ? (
                                    <SparklesIcon className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <SparklesIcon className="w-5 h-5 mr-2" />
                                        Generate Tips
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {tipsError && <ErrorDisplay message={tipsError} onClear={() => setTipsError(null)} />}

                    {studyTips && (
                        <div className="bg-white/60 backdrop-blur-xl p-6 rounded-2xl border border-white/50 shadow-lg animate-scale-in">
                            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-100">
                                <div className="bg-gradient-to-br from-indigo-100 to-purple-100 p-2 rounded-lg text-indigo-600">
                                    <BrainCircuitIcon className="w-5 h-5"/>
                                </div>
                                <span className="font-bold text-gray-800 text-lg">Your Study Plan</span>
                            </div>
                            <div className="markdown-content prose-sm text-gray-600 prose-p:my-2 prose-headings:text-gray-800 prose-headings:font-bold prose-headings:mt-4 prose-li:marker:text-indigo-400 max-h-[500px] overflow-y-auto custom-scrollbar pr-2" dangerouslySetInnerHTML={{ __html: marked.parse(studyTips) }} />
                            
                            <div className="mt-4 pt-4 border-t border-gray-100 text-center">
                                <button onClick={() => setStudyTips(null)} className="text-sm text-gray-400 hover:text-gray-600 font-medium">Dismiss</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Todo;