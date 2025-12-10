import React, { useState } from 'react';
import { SparklesIcon, TrendingUpIcon, PhotoIcon } from './icons/ActionIcons';
import { BeakerIcon } from './icons/SubjectIcons';
import { LearnMateLogo } from './icons/BrandIcons';

interface OnboardingProps {
    onFinish: () => void;
}

const onboardingSteps = [
    {
        icon: <LearnMateLogo className="w-16 h-16" />,
        title: "Welcome to LearnMate!",
        content: "Let's take a quick tour to see how you can unlock your learning potential. This app is packed with tools to help you study, create, and explore."
    },
    {
        icon: <SparklesIcon className="w-16 h-16 text-primary" />,
        title: "AI Assistant: Your All-in-One Helper",
        content: "Head to the AI Assistant to chat with text and images. Need hands-free help? Just switch to a live voice conversation, all in one place."
    },
    {
        icon: <BeakerIcon className="w-16 h-16 text-secondary" />,
        title: "Test Your Knowledge with Quizzes",
        content: "Challenge yourself with AI-generated quizzes. Select a subject and see how you score. It's a great way to prepare for exams!"
    },
    {
        icon: <TrendingUpIcon className="w-16 h-16 text-purple-500" />,
        title: "Track Your Progress",
        content: "The Dashboard visualizes your quiz history, shows your average scores, and lets you earn achievement badges for mastering subjects."
    },
    {
        icon: <PhotoIcon className="w-16 h-16 text-teal-500" />,
        title: "Unleash Your Creativity",
        content: "Use the Image Generator, Editor, and Video Creator to bring your ideas to life. Create stunning visuals from simple text prompts."
    }
];

const Onboarding: React.FC<OnboardingProps> = ({ onFinish }) => {
    const [step, setStep] = useState(0);
    const totalSteps = onboardingSteps.length;
    const isLastStep = step === totalSteps - 1;

    const handleNext = () => {
        if (!isLastStep) {
            setStep(s => s + 1);
        } else {
            onFinish();
        }
    };

    const handlePrev = () => {
        if (step > 0) {
            setStep(s => s - 1);
        }
    };

    const currentStepData = onboardingSteps[step];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-surface rounded-2xl shadow-2xl max-w-lg w-full p-8 text-center transform animate-slide-in-up flex flex-col items-center">
                <div className="mb-6">
                    {currentStepData.icon}
                </div>
                <h2 className="text-2xl font-extrabold text-text-primary mb-4">{currentStepData.title}</h2>
                <p className="text-text-secondary mb-8 text-base">{currentStepData.content}</p>

                <div className="flex items-center justify-center space-x-2 mb-8">
                    {onboardingSteps.map((_, index) => (
                        <div
                            key={index}
                            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${step === index ? 'bg-primary scale-125' : 'bg-gray-300'}`}
                        />
                    ))}
                </div>

                <div className="w-full space-y-3">
                    <button
                        onClick={handleNext}
                        className="w-full bg-primary text-white font-bold py-3 px-6 rounded-lg hover:bg-primary-dark transition-all duration-300 transform hover:scale-105 shadow-md"
                    >
                        {isLastStep ? "Let's Get Started!" : 'Next'}
                    </button>
                    <div className="flex justify-between items-center w-full">
                        <button
                            onClick={onFinish}
                            className="text-sm text-text-secondary hover:text-primary transition-colors"
                        >
                            Skip Tour
                        </button>
                        <button
                            onClick={handlePrev}
                            disabled={step === 0}
                            className="text-sm text-text-secondary hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Onboarding;