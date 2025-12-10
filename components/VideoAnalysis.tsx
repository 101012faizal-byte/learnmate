import React, { useState } from 'react';
import { marked } from 'marked';
import { analyzeVideo } from '../services/geminiService';
import ErrorDisplay from './ErrorDisplay';
import { FilmIcon, UploadIcon, SparklesIcon, XMarkIcon } from './icons/ActionIcons';
import { BrainCircuitIcon } from './icons/SubjectIcons';

const VideoAnalysis: React.FC = () => {
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoPreview, setVideoPreview] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [analysisResult, setAnalysisResult] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 50 * 1024 * 1024) { // 50MB limit
                setError("Video file size should not exceed 50MB.");
                return;
            }
            if (!file.type.startsWith('video/')) {
                setError("Please select a valid video file.");
                return;
            }
            setError(null);
            setVideoFile(file);
            setVideoPreview(URL.createObjectURL(file));
            setAnalysisResult(null);
        }
    };
    
    const handleRemoveVideo = () => {
        setVideoFile(null);
        setVideoPreview(null);
        setAnalysisResult(null);
    };

    const handleSubmit = async () => {
        if (!videoFile || !prompt.trim()) {
            setError("Please upload a video and provide a prompt for analysis.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setAnalysisResult(null);

        try {
            const result = await analyzeVideo(videoFile, prompt);
            setAnalysisResult(result);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'An unknown error occurred during analysis.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 animate-fade-in space-y-8">
            <div className="text-center max-w-2xl mx-auto">
                <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-orange-600">
                    <FilmIcon className="w-8 h-8" />
                </div>
                <h2 className="text-3xl font-extrabold text-text-primary">AI Video Analysis</h2>
                <p className="text-text-secondary mt-2 text-lg">Extract summaries, insights, and key points from any video using Gemini Pro.</p>
            </div>

            {error && <ErrorDisplay message={error} onClear={() => setError(null)} />}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Controls */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="mb-6">
                            <h3 className="text-lg font-bold text-text-primary mb-1">1. Upload Video</h3>
                            <p className="text-sm text-text-secondary">Supported formats: MP4, MOV, WEBM (Max 50MB)</p>
                        </div>
                        
                        {videoPreview ? (
                            <div className="relative rounded-xl overflow-hidden bg-black aspect-video group shadow-md">
                                <video src={videoPreview} controls className="w-full h-full object-contain" />
                                <button 
                                    onClick={handleRemoveVideo}
                                    className="absolute top-2 right-2 p-2 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <XMarkIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-200 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 hover:border-primary/50 transition-all group">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <div className="p-4 bg-white rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform">
                                        <UploadIcon className="w-8 h-8 text-primary" />
                                    </div>
                                    <p className="mb-2 text-sm text-gray-500 font-semibold">Click to upload or drag and drop</p>
                                </div>
                                <input type="file" className="hidden" onChange={handleFileChange} accept="video/*" />
                            </label>
                        )}
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="mb-4">
                            <h3 className="text-lg font-bold text-text-primary mb-1">2. Analysis Instructions</h3>
                            <p className="text-sm text-text-secondary">What would you like to know about this video?</p>
                        </div>
                        <textarea
                            rows={4}
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="w-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-gray-50 resize-none"
                            placeholder="e.g., 'Summarize the main points of this lecture' or 'What is the speaker's tone?'"
                        />
                        <button
                            onClick={handleSubmit}
                            disabled={isLoading || !videoFile || !prompt.trim()}
                            className="w-full mt-4 py-3.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {isLoading ? (
                                <>
                                    <SparklesIcon className="w-5 h-5 mr-2 animate-spin" />
                                    Analyzing...
                                </>
                            ) : (
                                <>
                                    <SparklesIcon className="w-5 h-5 mr-2" />
                                    Analyze Video
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Right Column: Results */}
                <div className="lg:col-span-7">
                    <div className="h-full min-h-[500px] bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
                        <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                            <h3 className="font-bold text-text-primary flex items-center">
                                <BrainCircuitIcon className="w-5 h-5 mr-2 text-primary" />
                                Analysis Result
                            </h3>
                            {analysisResult && (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">Completed</span>
                            )}
                        </div>
                        
                        <div className="flex-grow p-6 md:p-8">
                            {isLoading ? (
                                <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse"></div>
                                        <BrainCircuitIcon className="w-20 h-20 text-primary relative z-10 animate-pulse" />
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-bold text-gray-900">Processing Video Content</h4>
                                        <p className="text-gray-500 mt-2 max-w-xs mx-auto">This may take a moment depending on the video length.</p>
                                    </div>
                                </div>
                            ) : analysisResult ? (
                                <div className="markdown-content prose prose-slate max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-600 prose-a:text-primary" dangerouslySetInnerHTML={{ __html: marked.parse(analysisResult) }} />
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center text-gray-400">
                                    <FilmIcon className="w-16 h-16 mb-4 opacity-50" />
                                    <p className="font-medium">Upload a video to see AI insights here.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VideoAnalysis;