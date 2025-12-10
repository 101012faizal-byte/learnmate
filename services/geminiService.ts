
import { GoogleGenAI, Type, Modality, GenerateContentResponse, LiveSessionCallbacks, LiveSession, Blob } from "@google/genai";
import { Subject, type QuizQuestion, Task } from '../types';
import { QUIZ_LENGTH } from '../constants';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

class GeminiError extends Error {
    constructor(message: string, public userFacingMessage: string) {
        super(message);
        this.name = 'GeminiError';
    }
}

const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) return error.message;
    return 'An unknown error occurred.';
};

const questionSchema = {
  type: Type.OBJECT,
  properties: {
    question: { type: Type.STRING },
    options: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    correctAnswer: { type: Type.STRING },
    explanation: { type: Type.STRING },
  },
  required: ["question", "options", "correctAnswer", "explanation"],
};

export const generateSingleQuestion = async (subject: Subject): Promise<QuizQuestion> => {
  try {
    const subTopics = {
        [Subject.Math]: "algebra, geometry, or arithmetic",
        [Subject.Physics]: "motion, forces, energy, or gravity",
        [Subject.Chemistry]: "chemical elements, reactions, or the periodic table",
        [Subject.Biology]: "cell biology, genetics, ecology, or human anatomy",
        [Subject.History]: "ancient civilizations, world wars, or major historical events",
        [Subject.Geography]: "physical geography, countries, capitals, or maps",
        [Subject.ComputerScience]: "programming basics, algorithms, hardware, or internet",
        [Subject.English]: "grammar, literature, or vocabulary",
        [Subject.Custom]: "general knowledge",
    }
    const topic = subTopics[subject] || "general knowledge";
    const prompt = `Generate a single multiple-choice question about ${subject} for a high school student (age 14-18). The topic should be about ${topic}. Provide exactly 4 options, ensure the 'correctAnswer' value is one of those options, and include a clear, concise explanation for the correct answer.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: questionSchema,
      },
    });
    
    const jsonText = response?.text?.trim();
    if (!jsonText) {
        throw new Error("Received an empty response from the AI.");
    }

    const questionData = JSON.parse(jsonText);
    if (!questionData.question || !Array.isArray(questionData.options) || questionData.options.length !== 4) {
      throw new Error("AI returned an invalid question format.");
    }

    return questionData as QuizQuestion;

  } catch (error) {
    console.error("Error generating question:", error);
     if (error instanceof SyntaxError) {
        throw new GeminiError(
            `JSON parsing error in generateSingleQuestion: ${error.message}`,
            "The AI returned data in an unexpected format. Please try again."
        );
    }
    throw new GeminiError(
        `Failed to generate question: ${getErrorMessage(error)}`,
        `We couldn't generate a question for ${subject} right now. ${getErrorMessage(error)}`
    );
  }
};

export const generateQuiz = async (subject: Subject): Promise<QuizQuestion[]> => {
  try {
    const subTopics: Record<string, string> = {
        [Subject.Math]: "algebra, geometry, or arithmetic",
        [Subject.Physics]: "motion, forces, energy, or gravity",
        [Subject.Chemistry]: "chemical elements, reactions, or the periodic table",
        [Subject.Biology]: "cell biology, genetics, ecology, or human anatomy",
        [Subject.History]: "ancient civilizations, world wars, or major historical events",
        [Subject.Geography]: "physical geography, countries, capitals, or maps",
        [Subject.ComputerScience]: "programming basics, algorithms, hardware, or internet",
        [Subject.English]: "grammar, literature, or vocabulary",
    };
    const topicDesc = subTopics[subject] || `topics related to ${subject}`;

    const prompt = `Generate a list of ${QUIZ_LENGTH} multiple-choice questions about ${subject} for a high school student (age 14-18). The topic should be about ${topicDesc}. Provide exactly 4 options for each question, ensure the 'correctAnswer' value is one of those options, and include a clear, concise explanation for the correct answer.`;

    const quizSchema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          options: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          correctAnswer: { type: Type.STRING },
          explanation: { type: Type.STRING },
        },
        required: ["question", "options", "correctAnswer", "explanation"],
      },
    };

    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: quizSchema,
      },
    });
    
    const jsonText = response?.text?.trim();
    if (!jsonText) throw new Error("Empty response");
    
    return JSON.parse(jsonText) as QuizQuestion[];

  } catch (error) {
    console.error("Error generating quiz:", error);
    throw new GeminiError(
        `Failed to generate a full quiz: ${getErrorMessage(error)}`,
        `We couldn't generate a full quiz for ${subject} right now. Please try again.`
    );
  }
};

export const generateImages = async (
    prompt: string, 
    numberOfImages: number, 
    aspectRatio: string,
    referenceImageBase64?: string,
    style?: string,
    negativePrompt?: string,
    isHighQuality: boolean = false
): Promise<string[]> => {
    try {
        let finalPrompt = prompt;
        if (style && style !== 'None') {
            finalPrompt = `Artistic Style: ${style}. ${prompt}`;
        }
        if (negativePrompt && negativePrompt.trim()) {
            finalPrompt += `\n\nNegative prompt: ${negativePrompt.trim()}`;
        }

        const parts: any[] = [{ text: finalPrompt }];
        
        if (referenceImageBase64) {
             parts.unshift({
                inlineData: {
                    mimeType: 'image/jpeg', // Standardizing on jpeg for simplicity in this context
                    data: referenceImageBase64
                }
            });
        }

        // Use Pro model for High Quality (Upscaling) requests, otherwise Flash
        const model = isHighQuality ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
        
        const config: any = {
            imageConfig: {
                aspectRatio: aspectRatio,
            }
        };

        // gemini-3-pro-image-preview supports imageSize configuration
        if (isHighQuality) {
            config.imageConfig.imageSize = '2K';
        }

        const promises = Array.from({ length: numberOfImages }).map(() => 
             ai.models.generateContent({
                model: model,
                contents: { parts: parts },
                config: config
            })
        );

        const responses = await Promise.all(promises);
        const images: string[] = [];

        for (const response of responses) {
             const parts = response.candidates?.[0]?.content?.parts;
             if (parts) {
                 for (const part of parts) {
                     if (part.inlineData && part.inlineData.data) {
                         images.push(part.inlineData.data);
                     }
                 }
             }
        }

        if (images.length === 0) {
            throw new Error("AI did not return any images.");
        }
        return images;
    } catch (error) {
        console.error("Error generating images:", error);
        const errorMessage = getErrorMessage(error);
        
        if (errorMessage.includes("429") || errorMessage.includes("quota")) {
             throw new GeminiError(
                `Quota exceeded: ${errorMessage}`,
                "We've hit a usage limit. Please try generating fewer images or wait a moment before trying again."
            );
        }

        throw new GeminiError(
            `Failed to generate images: ${errorMessage}`,
            "We couldn't generate images right now. Please try again."
        );
    }
};

export const editImage = async (base64ImageData: string, mimeType: string, prompt: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [
              {
                inlineData: {
                  data: base64ImageData,
                  mimeType: mimeType,
                },
              },
              { text: prompt },
            ],
          },
          config: {
              responseModalities: [Modality.IMAGE],
          },
        });
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            return part.inlineData.data;
          }
        }
        throw new Error("No image was returned from the edit request.");
    } catch (error) {
        console.error("Error editing image:", error);
        throw new GeminiError(
            `Failed to edit image: ${getErrorMessage(error)}`,
            "We couldn't edit the image right now. Please try again."
        );
    }
};

export const generateVideo = async (prompt: string, imageBase64: string, mimeType: string, aspectRatio: '16:9' | '9:16'): Promise<string> => {
    try {
        const localAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
        let operation = await localAI.models.generateVideos({
          model: 'veo-3.1-fast-generate-preview',
          prompt,
          image: {
            imageBytes: imageBase64,
            mimeType,
          },
          config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: aspectRatio,
          }
        });

        while (!operation.done) {
          await new Promise(resolve => setTimeout(resolve, 10000));
          operation = await localAI.operations.getVideosOperation({operation: operation});
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) {
            throw new Error("Video generation did not produce a valid link.");
        }
        
        const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        if (!response.ok) {
            throw new Error(`Failed to download video: ${response.statusText}`);
        }
        const videoBlob = await response.blob();
        return URL.createObjectURL(videoBlob);
    } catch (error) {
        console.error("Error generating video:", error);
        const errorMessage = getErrorMessage(error);
        if (errorMessage.includes("Requested entity was not found.") || errorMessage.includes("API key not found")) {
            throw new GeminiError(
                `Failed to generate video: ${errorMessage}`,
                "API key not found or invalid. Please select a valid API key and try again."
            );
        }
        throw new GeminiError(
            `Failed to generate video: ${errorMessage}`,
            "We couldn't generate the video right now. Please try again."
        );
    }
};

const fileToGenerativePart = async (file: File) => {
    const base64EncodedData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
    return {
        inlineData: {
            mimeType: file.type,
            data: base64EncodedData
        }
    };
};

export const analyzeVideo = async (videoFile: File, prompt: string): Promise<string> => {
    try {
        const videoPart = await fileToGenerativePart(videoFile);
        const response = await ai.models.generateContent({
            model: 'gemini-flash-lite-latest',
            contents: [{
                parts: [
                    videoPart,
                    { text: prompt }
                ]
            }]
        });
        return response.text;
    } catch (error) {
         console.error("Error analyzing video:", error);
         throw new GeminiError(
             `Failed to analyze video: ${getErrorMessage(error)}`,
             "We couldn't analyze the video right now. The model may be unable to process this file format or size. Please try again with a different video."
         );
    }
};

export const generateStudyTips = async (tasks: Task[]): Promise<string> => {
    const taskList = tasks.map(t => `- ${t.text} (Priority: ${t.priority})`).join('\n');
    const prompt = `I am a student with the following to-do list for my studies:\n${taskList}\n\nPlease act as an expert study coach and provide me with 3-5 actionable, personalized study tips based on these tasks. Focus on strategies for time management, effective learning for these topics, and how to tackle them based on priority.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-flash-lite-latest',
            contents: prompt,
            config: {
                systemInstruction: "You are an expert study coach providing helpful, actionable advice to students."
            }
        });
        return response.text;
    } catch (error) {
        console.error("Error generating study tips:", error);
        throw new GeminiError(
            `Failed to generate study tips: ${getErrorMessage(error)}`,
            "Could not generate study tips at this time. Please try again."
        );
    }
};

export const generateDailySpark = async (): Promise<{text: string; type: 'Fact' | 'Motivation' | 'Tip'}> => {
    const prompt = "Generate a single, short, and engaging daily spark for a student. It should be either a 'Fun Fact', a 'Motivational Quote', or a quick 'Study Tip'. Return it in JSON format with 'text' and 'type' keys.";
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-flash-lite-latest',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
            }
        });
        const json = JSON.parse(response.text);
        return json;
    } catch (error) {
        return { text: "Learning is a treasure that will follow its owner everywhere.", type: "Motivation" };
    }
};

export const askTutor = async (
    prompt: string,
    imageFile: File | null,
    isThinkingMode: boolean,
    onChunk: (chunk: string) => void
): Promise<{ sources?: { title: string; uri: string }[] }> => {
    const contents: any = { parts: [{ text: prompt }] };
    if (imageFile) {
        const imagePart = await fileToGenerativePart(imageFile);
        contents.parts.unshift(imagePart);
    }

    // SPEED OPTIMIZATION:
    // 1. Default text tasks to 'gemini-flash-lite-latest' (Fastest).
    // 2. Multimodal image tasks use 'gemini-2.5-flash' (Fast & Multimodal) instead of Pro.
    // 3. Only use 'gemini-3-pro-preview' if Thinking Mode is explicitly enabled.
    
    let model = 'gemini-flash-lite-latest';
    
    if (isThinkingMode) {
        model = 'gemini-3-pro-preview';
    } else if (imageFile) {
        model = 'gemini-2.5-flash';
    }

    try {
        const responseStream = await ai.models.generateContentStream({
            model,
            contents,
            config: {
                systemInstruction: "You are LearnMate, a helpful, friendly, and concise AI tutor.",
            }
        });

        let finalResponse: GenerateContentResponse | undefined;
        for await (const chunk of responseStream) {
            onChunk(chunk.text || '');
            finalResponse = chunk;
        }
        
        const sources = finalResponse?.candidates?.[0]?.groundingMetadata?.groundingChunks
            ?.map(c => c.web)
            .filter(Boolean) as { title: string; uri: string }[] | undefined;

        return { sources };

    } catch (error) {
        console.error("Error asking tutor:", error);
        throw new GeminiError(
            `Failed to get response from tutor: ${getErrorMessage(error)}`,
            "Sorry, I couldn't get a response. Please try again."
        );
    }
};

export const textToSpeech = async (text: string): Promise<string | null> => {
    try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash-preview-tts",
          contents: [{ parts: [{ text: text }] }],
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: 'Kore' },
                },
            },
          },
        });
        return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data ?? null;
    } catch (error) {
         console.error("Error in text-to-speech:", error);
         throw new GeminiError(
             `Failed to generate speech: ${getErrorMessage(error)}`,
             "Could not generate audio for this message."
         );
    }
};

function encode(bytes: Uint8Array): string {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

export function decodeAudio(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export function createAudioBlob(data: Float32Array, sampleRate: number = 16000): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: `audio/pcm;rate=${sampleRate}`,
  };
}

export const startLiveSession = (callbacks: LiveSessionCallbacks): Promise<LiveSession> => {
    try {
        const sessionPromise = ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-09-2025',
            callbacks,
            config: {
                responseModalities: [Modality.AUDIO],
                outputAudioTranscription: {},
                inputAudioTranscription: {},
                speechConfig: {
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
                },
                systemInstruction: 'You are LearnMate, a friendly and helpful AI assistant for students. Keep your responses concise and conversational.',
            },
        });
        return sessionPromise;
    } catch (error) {
        console.error("Error starting live session:", error);
        throw new GeminiError(
            `Failed to start live session: ${getErrorMessage(error)}`,
            "Could not initiate live voice chat. Please check your connection and microphone permissions."
        );
    }
};

export const generateChatTitle = async (firstMessage: string): Promise<string> => {
    const prompt = `Based on the following user message, generate a short, concise title (4 words maximum) for our chat session. Just return the title, nothing else.\n\nMessage: "${firstMessage}"`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-flash-lite-latest',
            contents: prompt,
        });
        let title = response.text.trim().replace(/["']/g, "");
        if (title.length > 50) {
          title = title.substring(0, 47) + '...';
        }
        return title || "New Chat";
    } catch (error) {
        console.error("Error generating chat title:", error);
        return "New Chat"; // Fallback title
    }
};
