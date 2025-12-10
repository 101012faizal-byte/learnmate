import React, { useState, useEffect, useMemo } from 'react';
import { generateVideo } from '../services/geminiService';
import ErrorDisplay from './ErrorDisplay';
import { UploadIcon, SparklesIcon, VideoCameraIcon, KeyIcon, FilmIcon, XMarkIcon } from './icons/ActionIcons';

const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result.split(',')[1]);
        } else {
          reject('Failed to convert blob to base64');
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
};

const Video: React.FC = () => {
    const [apiKeySelected, setApiKeySelected] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
    const [loadingMessage, setLoadingMessage] = useState('');

    useEffect(() => {
        checkApiKey();
    }, []);
    
    const loadingMessages = useMemo(() => [
        "Warming up the AI director...",
        "Rendering the first scenes...",
        "Adding special effects...",
        "Finalizing the soundtrack...",
        "Polishing the final cut...",
    ], []);

    useEffect(() => {
        let interval: number;
        if (isLoading) {
            setLoadingMessage(loadingMessages[0]);
            let i = 0;
            interval = window.setInterval(() => {
                i = (i + 1) % loadingMessages.length;
                setLoadingMessage(loadingMessages[i]);
            }, 3000); 
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isLoading, loadingMessages]);

    const checkApiKey = async () => {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setApiKeySelected(hasKey);
    };

    const handleSelectKey = async () => {
        await window.aistudio.openSelectKey();
        // Assume key selection is successful to avoid race conditions
        setApiKeySelected(true);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
            setGeneratedVideo(null);
        }
    };
    
    const handleRemoveImage = () => {
        setImageFile(null);
        setImagePreview(null);
        setGeneratedVideo(null);
    }
    
    const handleSubmit = async () => {
        if (!imageFile || !prompt || !apiKeySelected) {
            setError("Please upload an image, enter a prompt, and select an API key.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setGeneratedVideo(null);

        try {
            const imageBlob = new Blob([imageFile], { type: imageFile.type });
            const imageBase64 = await blobToBase64(imageBlob);
            const videoUrl = await generateVideo(prompt, imageBase64, imageFile.type, aspectRatio);
            setGeneratedVideo(videoUrl);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'An unknown error occurred.');
            if (e instanceof Error && e.message.includes("API key not found")) {
                setApiKeySelected(false); // Reset key state if it's invalid
            }
        } finally {
            setIsLoading(false);
        }
    }
    
    if (!apiKeySelected) {
        return (
            <div className="flex items-center justify-center min-h-[60vh] animate-fade-in">
                <div className="text-center p-12 bg-white rounded-3xl shadow-xl max-w-lg mx-auto border border-gray-100">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <KeyIcon className="w-10 h-10 text-primary"/>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">API Key Required</h2>
                    <p className="text-gray-600 mb-8 leading-relaxed">
                        The Veo video generation model requires you to select your own API key with billing enabled.
                        <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-primary font-medium hover:underline block mt-2">Learn more about billing &rarr;</a>
                    </p>
                    <button onClick={handleSelectKey} className="inline-flex items-center px-8 py-4 bg-primary text-white font-bold rounded-xl shadow-lg hover:bg-primary-dark transition-all transform hover:scale-105">
                        Select API Key
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 animate-fade-in space-y-8">
            <div className="text-center max-w-2xl mx-auto">
                 <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-red-600">
                     <VideoCameraIcon className="w-8 h-8" />
                </div>
                <h2 className="text-3xl font-extrabold text-text-primary">AI Video Creator</h2>
                <p className="text-text-secondary mt-2 text-lg">Turn static images into captivating videos using Veo.</p>
            </div>

            {error && <ErrorDisplay message={error} onClear={() => setError(null)} />}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left: Input */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                         <h3 className="text-lg font-bold text-text-primary mb-4">1. Source Image</h3>
                         {imagePreview ? (
                            <div className="relative rounded-xl overflow-hidden shadow-sm group border border-gray-100">
                                <img src={imagePreview} alt="Preview" className="w-full h-auto object-cover max-h-64" />
                                <button onClick={handleRemoveImage} className="absolute top-2 right-2 p-2 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors opacity-0 group-hover:opacity-100">
                                    <XMarkIcon className="w-4 h-4"/>
                                </button>
                            </div>
                         ) : (
                             <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-200 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 hover:border-primary/50 transition-all group">
                                <div className="p-3 bg-white rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform">
                                    <UploadIcon className="w-8 h-8 text-primary" />
                                </div>
                                <span className="text-sm font-semibold text-gray-500">Upload Source Image</span>
                                <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                            </label>
                         )}
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                        <div>
                             <h3 className="text-lg font-bold text-text-primary mb-2">2. Prompt</h3>
                             <textarea
                                rows={3}
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                className="w-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-gray-50 resize-none"
                                placeholder="Describe the motion: e.g., 'The cat blinks and looks around'"
                            />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-text-primary mb-2">3. Aspect Ratio</h3>
                            <div className="flex gap-3">
                                <button onClick={() => setAspectRatio('16:9')} className={`flex-1 py-3 px-4 rounded-xl font-semibold border-2 transition-all ${aspectRatio === '16:9' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                                    Landscape (16:9)
                                </button>
                                <button onClick={() => setAspectRatio('9:16')} className={`flex-1 py-3 px-4 rounded-xl font-semibold border-2 transition-all ${aspectRatio === '9:16' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                                    Portrait (9:16)
                                </button>
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={handleSubmit} 
                        disabled={isLoading || !imageFile || !prompt}
                        className="w-full py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transform hover:scale-[1.02]"
                    >
                        <SparklesIcon className={`w-5 h-5 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        {isLoading ? 'Generating Video...' : 'Create Video'}
                    </button>
                </div>

                {/* Right: Output */}
                <div className="lg:col-span-7">
                    <div className="h-full min-h-[500px] bg-black rounded-2xl overflow-hidden flex flex-col items-center justify-center relative shadow-2xl">
                        {isLoading ? (
                            <div className="text-center p-8 space-y-6">
                                <FilmIcon className="mx-auto h-20 w-20 text-white/20 animate-pulse" />
                                <div>
                                    <h3 className="text-2xl font-bold text-white mb-2">Generating Scene</h3>
                                    <p className="text-white/60 text-lg animate-pulse">{loadingMessage}</p>
                                </div>
                            </div>
                        ) : generatedVideo ? (
                            <div className="w-full h-full bg-black flex items-center justify-center">
                                <video controls src={generatedVideo} className="max-w-full max-h-full rounded-lg" autoPlay loop />
                            </div>
                        ) : (
                            <div className="text-center p-8 text-white/30">
                                <VideoCameraIcon className="mx-auto h-20 w-20 mb-4" />
                                <p className="text-lg font-medium">Your generated video will play here</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Video;