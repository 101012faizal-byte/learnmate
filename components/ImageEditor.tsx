import React, { useState } from 'react';
import { editImage } from '../services/geminiService';
import ErrorDisplay from './ErrorDisplay';
import { WandSparklesIcon, UploadIcon, PhotoIcon, XMarkIcon } from './icons/ActionIcons';

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = error => reject(error);
    });
};

const ImageEditor: React.FC = () => {
    const [originalImageFile, setOriginalImageFile] = useState<File | null>(null);
    const [originalImagePreview, setOriginalImagePreview] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [editedImage, setEditedImage] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setOriginalImageFile(file);
            setOriginalImagePreview(URL.createObjectURL(file));
            setEditedImage(null); // Clear previous edit on new image upload
        }
    };
    
    const handleRemoveImage = () => {
        setOriginalImageFile(null);
        setOriginalImagePreview(null);
        setEditedImage(null);
    }

    const handleSubmit = async () => {
        if (!originalImageFile || !prompt.trim()) {
            setError("Please upload an image and provide an editing instruction.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setEditedImage(null);

        try {
            const imageBase64 = await fileToBase64(originalImageFile);
            const editedImageBase64 = await editImage(imageBase64, originalImageFile.type, prompt);
            setEditedImage(editedImageBase64);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 animate-fade-in space-y-8">
            <div className="text-center max-w-2xl mx-auto">
                <div className="w-16 h-16 bg-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-pink-600">
                     <WandSparklesIcon className="w-8 h-8" />
                </div>
                <h2 className="text-3xl font-extrabold text-text-primary">AI Image Editor</h2>
                <p className="text-text-secondary mt-2 text-lg">Modify objects, backgrounds, or styles using simple text commands.</p>
            </div>

            {error && <ErrorDisplay message={error} onClear={() => setError(null)} />}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                
                {/* Control Panel */}
                <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-lg border border-gray-100 space-y-6 lg:sticky lg:top-24">
                     <div>
                        <h3 className="font-bold text-gray-900 mb-2">1. Upload Image</h3>
                        {originalImagePreview ? (
                             <div className="relative rounded-xl overflow-hidden shadow-sm group">
                                <img src={originalImagePreview} alt="Original" className="w-full h-auto object-cover max-h-64" />
                                <button onClick={handleRemoveImage} className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors opacity-0 group-hover:opacity-100">
                                    <XMarkIcon className="w-4 h-4"/>
                                </button>
                            </div>
                        ) : (
                            <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-gray-200 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 hover:border-primary/50 transition-all group">
                                <div className="p-3 bg-white rounded-full shadow-sm mb-2 group-hover:scale-110 transition-transform">
                                    <UploadIcon className="w-6 h-6 text-gray-400 group-hover:text-primary" />
                                </div>
                                <span className="text-sm font-semibold text-gray-500">Upload Image</span>
                                <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                            </label>
                        )}
                     </div>

                     <div>
                        <h3 className="font-bold text-gray-900 mb-2">2. Instructions</h3>
                        <textarea
                            rows={3}
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="w-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-gray-50 resize-none text-sm"
                            placeholder="e.g., 'Make the sky purple' or 'Add a hat to the cat'"
                        />
                     </div>

                    <button
                        onClick={handleSubmit}
                        disabled={isLoading || !originalImageFile || !prompt.trim()}
                        className="w-full py-3.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        <WandSparklesIcon className={`w-5 h-5 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        {isLoading ? 'Processing...' : 'Generate Edit'}
                    </button>
                </div>

                {/* Comparison Stage */}
                <div className="lg:col-span-2 space-y-4">
                     <div className="bg-gray-50 rounded-2xl p-1 shadow-inner border border-gray-200 grid grid-cols-2 gap-1 min-h-[400px]">
                        {/* Before */}
                        <div className="bg-white rounded-xl flex flex-col items-center justify-center p-4 relative overflow-hidden">
                            <span className="absolute top-4 left-4 bg-gray-900/10 backdrop-blur-md text-gray-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Original</span>
                            {originalImagePreview ? (
                                <img src={originalImagePreview} alt="Original" className="max-w-full max-h-[500px] object-contain rounded-lg shadow-sm" />
                            ) : (
                                <div className="text-center text-gray-400">
                                    <PhotoIcon className="w-12 h-12 mx-auto mb-2 opacity-50"/>
                                    <p className="text-sm">Upload an image</p>
                                </div>
                            )}
                        </div>
                        
                        {/* After */}
                        <div className="bg-white rounded-xl flex flex-col items-center justify-center p-4 relative overflow-hidden">
                            <span className="absolute top-4 left-4 bg-primary/10 backdrop-blur-md text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Edited</span>
                             {isLoading ? (
                                <div className="flex flex-col items-center">
                                     <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-3"></div>
                                     <p className="text-sm font-semibold text-gray-500">Working magic...</p>
                                </div>
                            ) : editedImage ? (
                                <img src={`data:image/png;base64,${editedImage}`} alt="Edited" className="max-w-full max-h-[500px] object-contain rounded-lg shadow-sm" />
                            ) : (
                                <div className="text-center text-gray-400">
                                    <WandSparklesIcon className="w-12 h-12 mx-auto mb-2 opacity-50"/>
                                    <p className="text-sm">Result appears here</p>
                                </div>
                            )}
                        </div>
                     </div>
                </div>
            </div>
        </div>
    );
};

export default ImageEditor;