import React, { useState, useEffect } from 'react';
import { type CustomTopic } from '../types';
import { TOPIC_COLORS, TOPIC_ICONS } from '../constants';
import { XMarkIcon, SparklesIcon, CheckCircleIcon } from './icons/ActionIcons';

interface AddTopicModalProps {
    onAdd: (topic: Omit<CustomTopic, 'id' | 'createdAt'>) => void;
    onClose: () => void;
}

const AddTopicModal: React.FC<AddTopicModalProps> = ({ onAdd, onClose }) => {
    const [name, setName] = useState('');
    const [selectedColor, setSelectedColor] = useState(TOPIC_COLORS[10]);
    const [selectedIcon, setSelectedIcon] = useState('AssistantIcon');
    const [showTutorial, setShowTutorial] = useState(false);

    useEffect(() => {
        const hasSeen = localStorage.getItem('learnMateHasSeenTopicTutorial');
        if (!hasSeen) {
            setShowTutorial(true);
        }
    }, []);

    const handleDismissTutorial = () => {
        localStorage.setItem('learnMateHasSeenTopicTutorial', 'true');
        setShowTutorial(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onAdd({ name: name.trim(), color: selectedColor, icon: selectedIcon });
            onClose();
        }
    };

    if (showTutorial) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4" onClick={onClose}>
                <div className="bg-surface rounded-2xl shadow-2xl max-w-lg w-full p-8 transform animate-slide-in-up text-center" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary animate-pulse-subtle">
                            <SparklesIcon className="w-8 h-8" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-extrabold text-text-primary mb-4">Create Your Learning Path</h2>
                    <p className="text-text-secondary mb-8 text-lg">
                        Custom topics allow you to organize your learning journey effectively.
                    </p>
                    
                    <div className="space-y-6 text-left mb-8 bg-gray-50 p-6 rounded-xl border border-gray-100">
                        <div className="flex items-start">
                            <CheckCircleIcon className="w-6 h-6 text-green-500 mr-4 flex-shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-bold text-text-primary text-base">Personalized Dashboard</h4>
                                <p className="text-sm text-text-secondary mt-1">Create dedicated cards for subjects you want to master.</p>
                            </div>
                        </div>
                        <div className="flex items-start">
                            <CheckCircleIcon className="w-6 h-6 text-green-500 mr-4 flex-shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-bold text-text-primary text-base">Visual Customization</h4>
                                <p className="text-sm text-text-secondary mt-1">Select unique icons and colors to make your topics stand out.</p>
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={handleDismissTutorial}
                        className="w-full py-3.5 px-6 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-all transform hover:scale-105 shadow-lg ring-4 ring-primary/20"
                    >
                        Got it, let's create!
                    </button>
                    <button onClick={onClose} className="mt-4 text-sm text-gray-500 hover:text-gray-700 font-medium">
                        Skip for now
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-surface rounded-2xl shadow-2xl max-w-lg w-full p-8 transform animate-slide-in-up" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-extrabold text-text-primary">Create a New Topic</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 transition-colors">
                        <XMarkIcon className="w-6 h-6 text-gray-600"/>
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="topic-name" className="block text-sm font-bold text-text-secondary mb-2">Topic Name</label>
                        <input
                            id="topic-name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., World War II History"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            required
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-text-secondary mb-2">Color</label>
                        <div className="flex flex-wrap gap-2">
                            {TOPIC_COLORS.map(color => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => setSelectedColor(color)}
                                    className={`w-8 h-8 rounded-full ${color} transition-transform transform hover:scale-110 ${selectedColor === color ? 'ring-2 ring-offset-2 ring-primary' : ''}`}
                                    aria-label={`Select color ${color}`}
                                />
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-text-secondary mb-2">Icon</label>
                        <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-40 overflow-y-auto p-2 bg-gray-100 rounded-lg">
                            {Object.entries(TOPIC_ICONS).map(([iconName, IconComponent]) => (
                                <button
                                    key={iconName}
                                    type="button"
                                    onClick={() => setSelectedIcon(iconName)}
                                    className={`flex items-center justify-center p-2 rounded-lg transition-colors ${selectedIcon === iconName ? 'bg-primary text-white' : 'bg-white hover:bg-gray-200'}`}
                                    aria-label={`Select icon ${iconName}`}
                                >
                                    <IconComponent className="w-6 h-6" />
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex justify-end pt-4 space-x-3">
                        <button type="button" onClick={onClose} className="px-6 py-2 text-sm font-semibold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors">
                            Cancel
                        </button>
                        <button type="submit" className="px-6 py-2 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors shadow-md">
                            Create Topic
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddTopicModal;