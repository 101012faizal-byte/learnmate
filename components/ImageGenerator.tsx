
import React, { useState, useEffect } from 'react';
import { generateImages } from '../services/geminiService';
import ErrorDisplay from './ErrorDisplay';
import { SparklesIcon, PhotoIcon, ClockIcon, TrashIcon, ArrowDownTrayIcon, XMarkIcon, ArrowPathIcon, UploadIcon, WandSparklesIcon } from './icons/ActionIcons';
import { type ImageGenerationResult } from '../types';
import { IMAGE_STYLES } from '../constants';

const ImageGenerator: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [negativePrompt, setNegativePrompt] = useState('');
    const [numImages, setNumImages] = useState(1);
    const [aspectRatio, setAspectRatio] = useState('1:1');
    const [selectedStyle, setSelectedStyle] = useState('None');
    const [isHighQuality, setIsHighQuality] = useState(false);
    const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
    
    const [referenceImage, setReferenceImage] = useState<File | null>(null);
    const [referenceImagePreview, setReferenceImagePreview] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [generatedImages, setGeneratedImages] = useState<string[]>([]);
    const [view, setView] = useState<'generator' | 'history'>('generator');
    const [history, setHistory] = useState<ImageGenerationResult[]>([]);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    
    // History filters
    const [historyFilterRatio, setHistoryFilterRatio] = useState<string>('All');
    const [historySortOrder, setHistorySortOrder] = useState<'newest' | 'oldest'>('newest');
    
    const aspectRatios = [
        { label: "1:1", value: "1:1", class: "w-8 h-8" },
        { label: "16:9", value: "16:9", class: "w-10 h-6" },
        { label: "9:16", value: "9:16", class: "w-6 h-10" },
        { label: "4:3", value: "4:3", class: "w-9 h-7" },
        { label: "3:4", value: "3:4", class: "w-7 h-9" }
    ];

    useEffect(() => {
        try {
            const savedHistory = localStorage.getItem('imageGenerationHistory');
            if (savedHistory) {
                setHistory(JSON.parse(savedHistory));
            }
        } catch (error) {
            console.error("Failed to load image generation history:", error);
            // If data is corrupt, clear it
            localStorage.removeItem('imageGenerationHistory');
        }
    }, []);

    useEffect(() => {
        const saveHistoryWithRetry = (data: ImageGenerationResult[]) => {
            try {
                localStorage.setItem('imageGenerationHistory', JSON.stringify(data));
            } catch (error: any) {
                // Check for quota exceeded errors
                if (
                    error instanceof DOMException &&
                    (error.name === 'QuotaExceededError' ||
                     error.name === 'NS_ERROR_DOM_QUOTA_REACHED')
                ) {
                    console.warn("Local storage quota exceeded. Trimming history to fit.");
                    if (data.length > 0) {
                        // Remove the oldest item (last in the array) and try again
                        saveHistoryWithRetry(data.slice(0, -1));
                    }
                } else {
                     console.error("Failed to save image generation history:", error);
                }
            }
        };

        if (history.length > 0) {
             saveHistoryWithRetry(history);
        } else {
             localStorage.removeItem('imageGenerationHistory');
        }
    }, [history]);

    const handleReferenceImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
             if (file.size > 5 * 1024 * 1024) {
                alert("Image size limit is 5MB");
                return;
            }
            setReferenceImage(file);
            setReferenceImagePreview(URL.createObjectURL(file));
        }
    };

    const handleRemoveReferenceImage = () => {
        setReferenceImage(null);
        setReferenceImagePreview(null);
    };

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve((reader.result as string).split(',')[1]);
            reader.onerror = error => reject(error);
        });
    };

    const handleSubmit = async () => {
        if (!prompt.trim()) {
            setError("Please enter a prompt to generate images.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setGeneratedImages([]);

        try {
            let refImageBase64: string | undefined = undefined;
            if (referenceImage) {
                refImageBase64 = await fileToBase64(referenceImage);
            }

            const images = await generateImages(prompt, numImages, aspectRatio, refImageBase64, selectedStyle, negativePrompt, isHighQuality);
            setGeneratedImages(images);

            const newHistoryItem: ImageGenerationResult = {
                id: Date.now().toString(),
                prompt,
                aspectRatio,
                numImages,
                images,
                createdAt: Date.now(),
            };
            
            // Limit history to 20 items in state to be proactive about storage limits
            setHistory(prev => [newHistoryItem, ...prev].slice(0, 20));

        } catch (e) {
            setError(e instanceof Error ? e.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteHistory = (id: string) => {
        setHistory(prev => prev.filter(item => item.id !== id));
    };

    const handleClearHistory = () => {
        if (window.confirm("Are you sure you want to clear your entire image generation history? This cannot be undone.")) {
            setHistory([]);
        }
    };
    
    const handleDownload = (base64Image: string, itemPrompt: string) => {
        const link = document.createElement('a');
        link.href = `data:image/jpeg;base64,${base64Image}`;
        const sanitizedPrompt = itemPrompt.slice(0, 30).replace(/[^a-z0-9]/gi, '_').toLowerCase();
        link.download = `learnmate_${sanitizedPrompt}_${Date.now()}.jpeg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleReusePrompt = (item: ImageGenerationResult) => {
        setPrompt(item.prompt);
        setAspectRatio(item.aspectRatio);
        setNumImages(item.numImages);
        setView('generator');
    };

    const GeneratorView = () => (
        <>
            <div className="space-y-8">
                {/* 1. Prompt & Ref Image */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <label htmlFor="prompt" className="block text-lg font-bold text-text-primary mb-4">Describe your image</label>
                    <div className="flex flex-col md:flex-row gap-6">
                        <textarea
                            id="prompt"
                            rows={4}
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="flex-grow px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-base resize-none bg-gray-50"
                            placeholder="e.g., A majestic lion wearing a crown in a magical forest..."
                        />
                        
                        <div className="flex-shrink-0 w-full md:w-48">
                            {referenceImagePreview ? (
                                <div className="relative rounded-xl overflow-hidden shadow-sm group border border-gray-200 h-full max-h-32 md:max-h-full">
                                    <img src={referenceImagePreview} alt="Reference" className="w-full h-full object-cover" />
                                    <button 
                                        onClick={handleRemoveReferenceImage} 
                                        className="absolute top-1 right-1 p-1.5 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <XMarkIcon className="w-3 h-3"/>
                                    </button>
                                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] py-1 text-center font-bold">Reference Image</div>
                                </div>
                            ) : (
                                <label className="flex flex-col items-center justify-center w-full h-32 md:h-full border-2 border-gray-200 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 hover:border-primary/50 transition-all group">
                                    <UploadIcon className="w-6 h-6 text-gray-400 group-hover:text-primary mb-2" />
                                    <span className="text-xs font-bold text-gray-500 text-center">Add Reference<br/>Image (Optional)</span>
                                    <input type="file" className="hidden" onChange={handleReferenceImageChange} accept="image/*" />
                                </label>
                            )}
                        </div>
                    </div>
                </div>

                {/* 2. Styles */}
                <div>
                     <label className="block text-lg font-bold text-text-primary mb-4">Artistic Style</label>
                     <div className="flex flex-wrap gap-2">
                        {IMAGE_STYLES.map(style => (
                            <button
                                key={style}
                                onClick={() => setSelectedStyle(style)}
                                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all shadow-sm ${
                                    selectedStyle === style 
                                    ? 'bg-primary text-white ring-2 ring-primary ring-offset-2' 
                                    : 'bg-white text-gray-600 border border-gray-200 hover:border-primary hover:text-primary'
                                }`}
                            >
                                {style}
                            </button>
                        ))}
                     </div>
                </div>

                {/* 3. Settings */}
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-3">Aspect Ratio</label>
                            <div className="flex flex-wrap gap-4">
                                {aspectRatios.map(ratio => (
                                    <button
                                        key={ratio.value}
                                        onClick={() => setAspectRatio(ratio.value)}
                                        className={`flex flex-col items-center gap-2 group focus:outline-none`}
                                    >
                                        <div className={`border-2 rounded-sm transition-all duration-200 ${ratio.class} ${aspectRatio === ratio.value ? 'bg-primary border-primary shadow-md' : 'bg-white border-gray-300 group-hover:border-primary'}`}></div>
                                        <span className={`text-xs font-bold ${aspectRatio === ratio.value ? 'text-primary' : 'text-gray-400'}`}>{ratio.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-3">Variations</label>
                            <div className="flex gap-2">
                                {[1, 2, 4].map(num => (
                                    <button
                                        key={num}
                                        onClick={() => setNumImages(num)}
                                        className={`flex-1 px-3 py-3 rounded-xl border-2 text-sm font-bold transition-all ${numImages === num ? 'border-primary bg-white text-primary shadow-sm' : 'border-gray-200 text-gray-500 hover:border-gray-400 bg-white'}`}
                                    >
                                        {num} Image{num > 1 ? 's' : ''}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Advanced Controls Toggle */}
                    <div className="border-t border-gray-200 pt-4 mt-4">
                        <button 
                            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                            className="flex items-center text-sm font-bold text-gray-500 hover:text-primary transition-colors"
                        >
                            <WandSparklesIcon className="w-4 h-4 mr-2" />
                            {isAdvancedOpen ? 'Hide Advanced Settings' : 'Show Advanced Settings'}
                        </button>

                        {isAdvancedOpen && (
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6 animate-slide-in-up">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Negative Prompt</label>
                                    <textarea
                                        rows={3}
                                        value={negativePrompt}
                                        onChange={(e) => setNegativePrompt(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm bg-white"
                                        placeholder="What to exclude? (e.g., blurry, distorted, low quality)"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Quality</label>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => setIsHighQuality(!isHighQuality)}
                                            className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none ${isHighQuality ? 'bg-primary' : 'bg-gray-300'}`}
                                        >
                                            <span
                                                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${isHighQuality ? 'translate-x-8' : 'translate-x-1'}`}
                                            />
                                        </button>
                                        <span className={`text-sm font-medium ${isHighQuality ? 'text-primary' : 'text-gray-500'}`}>
                                            {isHighQuality ? 'High Quality (2K Upscale)' : 'Standard Quality'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-2">
                                        High quality mode uses a more advanced model for sharper details but may take longer.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {error && <ErrorDisplay message={error} onClear={() => setError(null)} />}

            <div className="text-center pt-4">
                <button
                    onClick={handleSubmit}
                    disabled={isLoading || !prompt.trim()}
                    className="inline-flex items-center px-10 py-4 border border-transparent text-lg font-bold rounded-2xl shadow-lg text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-4 focus:ring-primary/30 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                >
                    <SparklesIcon className="-ml-1 mr-3 h-6 w-6" />
                    {isLoading ? 'Creating Masterpiece...' : 'Generate Images'}
                </button>
            </div>
            
            {isLoading && (
                <div className="pt-8 animate-fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {Array.from({ length: numImages }).map((_, index) => (
                            <div key={index} className="w-full aspect-square bg-gray-50 rounded-2xl flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-gray-200 relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }}></div>
                                <PhotoIcon className="w-12 h-12 text-gray-300 mb-4 animate-bounce" />
                                <p className="text-sm font-bold text-gray-400">Rendering Variation {index + 1}...</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {!isLoading && generatedImages.length > 0 && (
                <div className="pt-8 animate-slide-in-up">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-2xl font-bold text-text-primary">Results</h3>
                        <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{generatedImages.length} Images Generated</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {generatedImages.map((imageBase64, index) => (
                             <div key={index} className="group relative bg-gray-100 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow">
                                <img
                                    src={`data:image/jpeg;base64,${imageBase64}`}
                                    alt={`Generated image ${index + 1}`}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                    <button 
                                        onClick={() => setSelectedImage(imageBase64)}
                                        className="bg-white text-gray-900 px-4 py-2 rounded-full font-bold text-sm shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all"
                                    >
                                        View Full Size
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </>
    );

    const HistoryView = () => {
        const filteredHistory = history.filter(item => {
             if (historyFilterRatio === 'All') return true;
             return item.aspectRatio === historyFilterRatio;
        }).sort((a, b) => {
             if (historySortOrder === 'newest') return b.createdAt - a.createdAt;
             return a.createdAt - b.createdAt;
        });

        return (
             <div className="space-y-6 h-full flex flex-col">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <div className="flex items-center space-x-2">
                         <ClockIcon className="w-5 h-5 text-gray-500" />
                         <span className="font-semibold text-text-secondary">Filter & Sort</span>
                    </div>
                    
                    <div className="flex flex-wrap justify-end gap-3 w-full md:w-auto">
                        <div className="relative">
                            <select 
                                value={historySortOrder} 
                                onChange={(e) => setHistorySortOrder(e.target.value as 'newest' | 'oldest')}
                                className="appearance-none pl-3 pr-8 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer"
                            >
                                <option value="newest">Newest First</option>
                                <option value="oldest">Oldest First</option>
                            </select>
                             <ArrowDownTrayIcon className="w-4 h-4 text-gray-400 absolute right-2.5 top-3 pointer-events-none" />
                        </div>

                        <div className="relative">
                            <select 
                                value={historyFilterRatio} 
                                onChange={(e) => setHistoryFilterRatio(e.target.value)}
                                className="appearance-none pl-3 pr-8 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer"
                            >
                                <option value="All">All Ratios</option>
                                {aspectRatios.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                            </select>
                             <ArrowDownTrayIcon className="w-4 h-4 text-gray-400 absolute right-2.5 top-3 pointer-events-none" />
                        </div>
                        
                        <button onClick={handleClearHistory} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Clear All History">
                            <TrashIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pb-4 custom-scrollbar flex-grow">
                    {filteredHistory.length > 0 ? (
                        filteredHistory.map((item) => (
                            <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                                <div className="relative aspect-square bg-gray-100 group">
                                     {item.images[0] && (
                                        <img src={`data:image/jpeg;base64,${item.images[0]}`} alt={item.prompt} className="w-full h-full object-cover" />
                                     )}
                                     <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                         <button onClick={() => setSelectedImage(item.images[0])} className="p-2 bg-white rounded-full text-gray-900 hover:scale-110 transition-transform"><PhotoIcon className="w-5 h-5"/></button>
                                         <button onClick={() => handleDownload(item.images[0], item.prompt)} className="p-2 bg-white rounded-full text-gray-900 hover:scale-110 transition-transform"><ArrowDownTrayIcon className="w-5 h-5"/></button>
                                     </div>
                                </div>
                                <div className="p-4 flex flex-col flex-grow">
                                    <p className="text-sm font-medium text-gray-800 line-clamp-2 mb-2 flex-grow" title={item.prompt}>{item.prompt}</p>
                                    <div className="flex justify-between items-center pt-2 border-t border-gray-50 mt-auto">
                                        <div className="flex items-center gap-2 text-xs text-gray-400">
                                            <span>{item.aspectRatio}</span>
                                            <span>•</span>
                                            <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                             <button onClick={() => handleReusePrompt(item)} className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Reuse Prompt">
                                                <ArrowPathIcon className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDeleteHistory(item.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full flex flex-col items-center justify-center text-center py-12 text-gray-400">
                            <ClockIcon className="w-12 h-12 mb-3 opacity-30" />
                            <p>No history found.</p>
                        </div>
                    )}
                </div>
             </div>
        );
    };

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 animate-fade-in space-y-8 h-[calc(100vh-6rem)] flex flex-col">
            <div className="flex flex-col md:flex-row justify-between items-end gap-4 flex-shrink-0">
                <div>
                     <h2 className="text-3xl font-extrabold text-text-primary">AI Image Studio</h2>
                     <p className="text-text-secondary mt-1">Turn your imagination into reality with Gemini 2.5 Flash.</p>
                </div>
                
                <div className="bg-gray-100 p-1 rounded-xl flex items-center">
                    <button 
                        onClick={() => setView('generator')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'generator' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Generator
                    </button>
                    <button 
                        onClick={() => setView('history')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'history' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        History
                    </button>
                </div>
            </div>

            <div className="flex-grow overflow-y-auto custom-scrollbar">
                {view === 'generator' ? <GeneratorView /> : <HistoryView />}
            </div>

            {/* Lightbox for full image view */}
            {selectedImage && (
                <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setSelectedImage(null)}>
                    <div className="relative max-w-5xl max-h-[90vh]" onClick={e => e.stopPropagation()}>
                        <img src={`data:image/jpeg;base64,${selectedImage}`} alt="Full size" className="max-w-full max-h-[90vh] object-contain rounded-lg" />
                        <button 
                            onClick={() => setSelectedImage(null)}
                            className="absolute -top-4 -right-4 bg-white rounded-full p-2 text-gray-900 shadow-lg hover:scale-110 transition-transform"
                        >
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                         <button 
                            onClick={() => handleDownload(selectedImage!, "generated_image")}
                            className="absolute bottom-4 right-4 bg-white rounded-full p-3 text-gray-900 shadow-lg hover:scale-110 transition-transform flex items-center font-bold text-sm px-5"
                        >
                            <ArrowDownTrayIcon className="w-5 h-5 mr-2" /> Download
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ImageGenerator;
