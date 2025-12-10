
import React, { useState, useMemo, useEffect } from 'react';
import { generateQuiz } from '../services/geminiService';
import { Subject, type QuizQuestion, type QuizResult, type CustomQuiz } from '../types';
import { SUBJECTS } from '../constants';
import ErrorDisplay from './ErrorDisplay';
import { CheckCircleIcon, XCircleIcon, ArrowPathIcon, TrophyIcon, StarIcon, PlusIcon, TrashIcon, PencilIcon, XMarkIcon } from './icons/ActionIcons';
import { BrainCircuitIcon } from './icons/SubjectIcons';

interface QuizProps {
  addQuizResult: (result: QuizResult) => void;
}

// Helper function to shuffle an array using the Fisher-Yates algorithm
const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

interface SavedQuizState {
  subject: Subject;
  questions: QuizQuestion[];
  currentQuestionIndex: number;
  userAnswers: string[];
}

const Quiz: React.FC<QuizProps> = ({ addQuizResult }) => {
  const [subject, setSubject] = useState<Subject | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [savedQuiz, setSavedQuiz] = useState<SavedQuizState | null>(null);

  // Custom Quiz State
  const [customQuizzes, setCustomQuizzes] = useState<CustomQuiz[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newQuizTitle, setNewQuizTitle] = useState('');
  const [newQuestions, setNewQuestions] = useState<{
      question: string;
      options: string[];
      correctAnswerIndex: number;
      explanation: string;
  }[]>([{ question: '', options: ['', '', '', ''], correctAnswerIndex: 0, explanation: '' }]);


  // Load data from localStorage
  useEffect(() => {
    try {
        const savedStateJSON = localStorage.getItem('activeQuizState');
        if (savedStateJSON) {
            const savedState: SavedQuizState = JSON.parse(savedStateJSON);
            setSavedQuiz(savedState);
        }

        const savedCustomQuizzes = localStorage.getItem('learnMateCustomQuizzes');
        if (savedCustomQuizzes) {
            setCustomQuizzes(JSON.parse(savedCustomQuizzes));
        }
    } catch (err) {
        console.error("Failed to load saved quiz data", err);
        localStorage.removeItem('activeQuizState');
    }
  }, []);

  // Save active quiz progress
  useEffect(() => {
    if (subject && questions.length > 0 && !showResults) {
        const stateToSave: SavedQuizState = {
            subject,
            questions,
            currentQuestionIndex,
            userAnswers,
        };
        try {
            localStorage.setItem('activeQuizState', JSON.stringify(stateToSave));
        } catch (err) {
            console.error("Failed to save quiz state", err);
        }
    }
  }, [subject, questions, currentQuestionIndex, userAnswers, showResults]);

  const clearActiveQuiz = () => {
    localStorage.removeItem('activeQuizState');
  };

  const startQuiz = async (selectedSubject: Subject) => {
    clearActiveQuiz();
    setSubject(selectedSubject);
    setIsLoading(true);
    setLoadingMessage(`Preparing your ${selectedSubject} challenge...`);
    setError(null);
    try {
      const originalQuestions = await generateQuiz(selectedSubject);
      // Shuffle the questions order AND the options within each question
      const shuffledQuestions = shuffleArray(originalQuestions).map(question => ({
        ...question,
        options: shuffleArray(question.options),
      }));

      setQuestions(shuffledQuestions);
      setCurrentQuestionIndex(0);
      setUserAnswers([]);
      setShowResults(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const startCustomQuiz = (quiz: CustomQuiz) => {
      clearActiveQuiz();
      setSubject(Subject.Custom);
      setQuestions(quiz.questions); // Use questions directly, no shuffle for custom to preserve user order? Or shuffle? Let's keep user order for custom.
      setCurrentQuestionIndex(0);
      setUserAnswers([]);
      setShowResults(false);
      setError(null);
  };

  const deleteCustomQuiz = (id: string) => {
      if(window.confirm("Are you sure you want to delete this quiz?")) {
          const updated = customQuizzes.filter(q => q.id !== id);
          setCustomQuizzes(updated);
          localStorage.setItem('learnMateCustomQuizzes', JSON.stringify(updated));
      }
  };

  const handleCreateQuiz = (e: React.FormEvent) => {
      e.preventDefault();
      if(!newQuizTitle.trim()) { alert("Please enter a quiz title"); return; }
      if(newQuestions.some(q => !q.question.trim() || q.options.some(o => !o.trim()) || !q.explanation.trim())) {
          alert("Please fill in all fields for all questions.");
          return;
      }

      const formattedQuestions: QuizQuestion[] = newQuestions.map(q => ({
          question: q.question,
          options: q.options,
          correctAnswer: q.options[q.correctAnswerIndex],
          explanation: q.explanation
      }));

      const newQuiz: CustomQuiz = {
          id: Date.now().toString(),
          title: newQuizTitle,
          questions: formattedQuestions,
          createdAt: Date.now()
      };

      const updatedQuizzes = [...customQuizzes, newQuiz];
      setCustomQuizzes(updatedQuizzes);
      localStorage.setItem('learnMateCustomQuizzes', JSON.stringify(updatedQuizzes));
      
      setIsCreating(false);
      setNewQuizTitle('');
      setNewQuestions([{ question: '', options: ['', '', '', ''], correctAnswerIndex: 0, explanation: '' }]);
  };
  
  const addQuestionField = () => {
      setNewQuestions([...newQuestions, { question: '', options: ['', '', '', ''], correctAnswerIndex: 0, explanation: '' }]);
  };
  
  const removeQuestionField = (index: number) => {
      if(newQuestions.length > 1) {
        setNewQuestions(newQuestions.filter((_, i) => i !== index));
      }
  };

  const updateQuestionField = (index: number, field: string, value: any) => {
      const updated = [...newQuestions];
      if (field === 'question') updated[index].question = value;
      else if (field === 'explanation') updated[index].explanation = value;
      else if (field === 'correctAnswerIndex') updated[index].correctAnswerIndex = value;
      setNewQuestions(updated);
  };

  const updateOption = (qIndex: number, oIndex: number, value: string) => {
      const updated = [...newQuestions];
      updated[qIndex].options[oIndex] = value;
      setNewQuestions(updated);
  };

  const handleAnswer = (answer: string) => {
    if (selectedOption) return;
    setSelectedOption(answer);

    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = answer;
    setUserAnswers(newAnswers);

    setTimeout(() => {
      setSelectedOption(null);
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        finishQuiz(newAnswers);
      }
    }, 1500);
  };

  const finishQuiz = (finalAnswers: string[]) => {
    if (!subject) return;
    clearActiveQuiz();
    const score = finalAnswers.reduce((acc, answer, index) => {
      return answer === questions[index].correctAnswer ? acc + 1 : acc;
    }, 0);

    const result: QuizResult = {
      subject,
      score,
      total: questions.length,
      date: Date.now(),
    };

    addQuizResult(result);
    setShowResults(true);
  };

  const resetQuiz = () => {
    clearActiveQuiz();
    setSubject(null);
    setQuestions([]);
    setError(null);
    setShowResults(false);
    setCurrentQuestionIndex(0);
    setUserAnswers([]);
  };

  const currentQuestion = useMemo(() => {
    return questions[currentQuestionIndex];
  }, [questions, currentQuestionIndex]);

  const score = useMemo(() => {
    return userAnswers.reduce((acc, answer, index) => {
        return answer === questions[index]?.correctAnswer ? acc + 1 : acc;
    }, 0);
  }, [userAnswers, questions]);

  const resumeQuiz = () => {
    if (savedQuiz) {
        setSubject(savedQuiz.subject);
        setQuestions(savedQuiz.questions);
        setCurrentQuestionIndex(savedQuiz.currentQuestionIndex);
        setUserAnswers(savedQuiz.userAnswers);
        setSavedQuiz(null);
    }
  };

  const discardSavedQuiz = () => {
    clearActiveQuiz();
    setSavedQuiz(null);
  }

  // View: Creation Form
  if (isCreating) {
      return (
          <div className="max-w-4xl mx-auto p-4 md:p-8 animate-fade-in">
              <div className="bg-white rounded-3xl shadow-2xl border border-white/50 p-8 md:p-12 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                      <PencilIcon className="w-64 h-64 text-gray-900" />
                  </div>
                  <div className="flex justify-between items-center mb-8 relative z-10">
                      <div>
                          <h2 className="text-3xl font-extrabold text-gray-900">Create Custom Quiz</h2>
                          <p className="text-gray-500 mt-2">Design your own learning experience</p>
                      </div>
                      <button onClick={() => setIsCreating(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                          <XMarkIcon className="w-6 h-6 text-gray-600"/>
                      </button>
                  </div>

                  <form onSubmit={handleCreateQuiz} className="space-y-8 relative z-10">
                      <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">Quiz Title</label>
                          <input 
                              type="text" 
                              value={newQuizTitle} 
                              onChange={e => setNewQuizTitle(e.target.value)}
                              className="w-full px-5 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-lg bg-gray-50 transition-shadow"
                              placeholder="e.g. Biology Midterm Review"
                              required
                          />
                      </div>

                      <div className="space-y-6">
                          {newQuestions.map((q, qIndex) => (
                              <div key={qIndex} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative group hover:shadow-md transition-shadow">
                                  <div className="flex justify-between items-start mb-4">
                                      <h3 className="font-bold text-gray-800 flex items-center">
                                          <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-md mr-2">#{qIndex + 1}</span>
                                          Question
                                      </h3>
                                      {newQuestions.length > 1 && (
                                          <button type="button" onClick={() => removeQuestionField(qIndex)} className="text-red-400 hover:text-red-600 p-1 rounded-full hover:bg-red-50 transition-colors">
                                              <TrashIcon className="w-5 h-5" />
                                          </button>
                                      )}
                                  </div>

                                  <div className="space-y-4">
                                      <input 
                                          type="text" 
                                          value={q.question} 
                                          onChange={e => updateQuestionField(qIndex, 'question', e.target.value)}
                                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary text-gray-800 placeholder-gray-400"
                                          placeholder="Type your question here..."
                                          required
                                      />

                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                          {q.options.map((opt, oIndex) => (
                                              <div key={oIndex} className={`relative flex items-center border rounded-xl overflow-hidden transition-all ${q.correctAnswerIndex === oIndex ? 'border-green-500 ring-1 ring-green-500 bg-green-50' : 'border-gray-200 focus-within:border-primary'}`}>
                                                  <div className="flex items-center justify-center pl-3">
                                                       <input 
                                                          type="radio" 
                                                          name={`correct-${qIndex}`} 
                                                          checked={q.correctAnswerIndex === oIndex}
                                                          onChange={() => updateQuestionField(qIndex, 'correctAnswerIndex', oIndex)}
                                                          className="w-4 h-4 accent-green-600 cursor-pointer"
                                                          title="Mark as correct answer"
                                                      />
                                                  </div>
                                                  <input 
                                                      type="text" 
                                                      value={opt} 
                                                      onChange={e => updateOption(qIndex, oIndex, e.target.value)}
                                                      className="w-full px-3 py-3 bg-transparent border-none focus:ring-0 text-sm"
                                                      placeholder={`Option ${oIndex + 1}`}
                                                      required
                                                  />
                                                  {q.correctAnswerIndex === oIndex && (
                                                      <span className="pr-3 text-xs font-bold text-green-600 uppercase">Correct</span>
                                                  )}
                                              </div>
                                          ))}
                                      </div>

                                      <textarea 
                                          value={q.explanation} 
                                          onChange={e => updateQuestionField(qIndex, 'explanation', e.target.value)}
                                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary h-20 resize-none text-sm bg-gray-50"
                                          placeholder="Add an explanation for the correct answer..."
                                          required
                                      />
                                  </div>
                              </div>
                          ))}
                      </div>

                      <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-100">
                          <button 
                              type="button" 
                              onClick={addQuestionField} 
                              className="flex-1 py-3 px-6 bg-white border-2 border-dashed border-gray-300 text-gray-600 font-bold rounded-xl hover:border-primary hover:text-primary hover:bg-primary/5 transition-all flex items-center justify-center"
                          >
                              <PlusIcon className="w-5 h-5 mr-2" /> Add Question
                          </button>
                          <button 
                              type="submit" 
                              className="flex-1 py-3 px-6 bg-gradient-to-r from-primary to-indigo-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all transform hover:scale-[1.02]"
                          >
                              <CheckCircleIcon className="w-5 h-5 mr-2 inline-block" /> Save Quiz
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      );
  }

  // View: Results
  if (showResults) {
    const percentage = Math.round((score / questions.length) * 100);
    let message = "Good job!";
    let emoji = "👍";
    if (percentage >= 90) { message = "Outstanding! You're a master!"; emoji = "🏆"; }
    else if (percentage >= 70) { message = "Great work! Keep it up!"; emoji = "⭐"; }
    else if (percentage >= 50) { message = "Nice effort! Study a bit more."; emoji = "📚"; }
    else { message = "Don't give up! Review and try again."; emoji = "💪"; }

    return (
      <div className="max-w-3xl mx-auto p-4 animate-fade-in">
        <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-white/50 relative">
            {/* Header Background */}
            <div className={`absolute top-0 left-0 w-full h-48 bg-gradient-to-br ${percentage >= 70 ? 'from-green-400 to-emerald-600' : percentage >= 40 ? 'from-yellow-400 to-orange-500' : 'from-red-400 to-pink-600'}`}></div>
            
            <div className="relative z-10 pt-12 pb-8 px-8 text-center">
                <div className="w-32 h-32 bg-white rounded-full mx-auto flex items-center justify-center shadow-2xl mb-6 text-6xl ring-8 ring-white/30 animate-scale-in">
                    {emoji}
                </div>
                <h2 className="text-4xl font-black text-gray-900 mb-2">Quiz Complete!</h2>
                <p className="text-xl text-gray-600 font-medium">{message}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 px-8 mb-8 max-w-lg mx-auto">
                 <div className="bg-gray-50 rounded-2xl p-4 text-center border border-gray-100 hover:scale-105 transition-transform">
                     <p className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-1">Score</p>
                     <p className="text-4xl font-black text-primary">{percentage}%</p>
                 </div>
                 <div className="bg-gray-50 rounded-2xl p-4 text-center border border-gray-100 hover:scale-105 transition-transform">
                     <p className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-1">Correct</p>
                     <p className="text-4xl font-black text-gray-800">{score}<span className="text-xl text-gray-400 font-bold">/{questions.length}</span></p>
                 </div>
            </div>

            <div className="px-8 pb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <StarIcon className="w-6 h-6 mr-2 text-yellow-500" />
                    Review Answers
                </h3>
                
                <div className="space-y-4">
                    {questions.map((q, index) => {
                        const isCorrect = userAnswers[index] === q.correctAnswer;
                        return (
                            <div key={index} className="group bg-white border border-gray-100 rounded-xl p-5 hover:shadow-md transition-all">
                                <div className="flex gap-4">
                                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {index + 1}
                                    </div>
                                    <div className="flex-grow">
                                        <p className="font-bold text-gray-800 mb-3">{q.question}</p>
                                        <div className="flex flex-col sm:flex-row gap-3 text-sm">
                                            <div className={`flex-1 p-3 rounded-lg border ${isCorrect ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                                                <span className="font-bold opacity-70 block text-xs mb-1 uppercase">Your Answer</span>
                                                {userAnswers[index]}
                                            </div>
                                            {!isCorrect && (
                                                <div className="flex-1 p-3 rounded-lg border bg-green-50 border-green-200 text-green-800">
                                                    <span className="font-bold opacity-70 block text-xs mb-1 uppercase">Correct Answer</span>
                                                    {q.correctAnswer}
                                                </div>
                                            )}
                                        </div>
                                        <div className="mt-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                                            <span className="font-bold text-gray-400 text-xs uppercase mr-2">Explanation:</span>
                                            {q.explanation}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>

                <div className="mt-8 flex justify-center">
                    <button onClick={resetQuiz} className="px-8 py-4 bg-primary text-white font-bold text-lg rounded-full shadow-lg shadow-primary/30 hover:bg-primary-dark hover:scale-105 transition-all flex items-center">
                        <ArrowPathIcon className="w-6 h-6 mr-2" />
                        Take Another Quiz
                    </button>
                </div>
            </div>
        </div>
      </div>
    );
  }

  // View: Active Quiz
  if (questions.length > 0 && currentQuestion) {
    return (
      <div className="max-w-3xl mx-auto p-4 md:p-8 animate-fade-in h-full flex flex-col justify-center">
        <div className="bg-white rounded-[2.5rem] shadow-2xl border border-white/60 p-6 md:p-10 relative overflow-hidden">
            
            {/* Decorative BG */}
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-purple-500/5 rounded-full blur-3xl"></div>

            {/* Header */}
            <div className="flex justify-between items-center mb-8 relative z-10">
                <span className="px-4 py-1.5 bg-gray-100 text-gray-600 text-sm font-bold rounded-full uppercase tracking-wider">{subject === Subject.Custom ? 'Custom Quiz' : subject}</span>
                <span className="text-sm font-bold text-gray-400 tracking-widest">{currentQuestionIndex + 1} / {questions.length}</span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-100 rounded-full h-2 mb-8 overflow-hidden relative z-10">
                <div 
                    className="bg-gradient-to-r from-primary to-purple-500 h-full rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(79,70,229,0.5)]" 
                    style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                ></div>
            </div>
            
            {/* Question */}
            <h3 className="text-2xl md:text-3xl font-black text-gray-900 mb-8 leading-tight relative z-10 min-h-[100px] flex items-center">
                {currentQuestion.question}
            </h3>
            
            {/* Options */}
            <div className="grid grid-cols-1 gap-4 relative z-10">
                {currentQuestion.options.map((option, idx) => {
                    const isSelected = selectedOption === option;
                    const showResultState = !!selectedOption;
                    const isActualCorrect = showResultState && option === currentQuestion.correctAnswer;
                    const isIncorrect = isSelected && option !== currentQuestion.correctAnswer;
                    
                    let buttonClass = "bg-white border-2 border-gray-100 text-gray-700 hover:border-primary/50 hover:bg-gray-50 hover:shadow-md hover:scale-[1.01]";
                    
                    if (showResultState) {
                        if (isActualCorrect) buttonClass = "bg-green-50 border-green-500 text-green-800 shadow-md ring-1 ring-green-500 scale-[1.01]";
                        else if (isIncorrect) buttonClass = "bg-red-50 border-red-500 text-red-800 shadow-md ring-1 ring-red-500";
                        else buttonClass = "bg-gray-50 border-gray-100 text-gray-400 opacity-50 cursor-not-allowed";
                    } else if (isSelected) {
                        buttonClass = "bg-primary text-white border-primary shadow-lg scale-[1.02]";
                    }

                    return (
                        <button
                            key={idx}
                            onClick={() => handleAnswer(option)}
                            disabled={showResultState}
                            className={`w-full text-left p-5 rounded-2xl font-bold text-lg transition-all duration-200 flex items-center justify-between group active:scale-[0.98] ${buttonClass}`}
                        >
                            <span className="flex-grow">{option}</span>
                            <span className="ml-4 flex-shrink-0">
                                {showResultState && isActualCorrect && <CheckCircleIcon className="w-6 h-6 text-green-600 animate-bounce" />}
                                {showResultState && isIncorrect && <XCircleIcon className="w-6 h-6 text-red-600" />}
                                {!showResultState && <div className={`w-5 h-5 rounded-full border-2 transition-colors ${isSelected ? 'border-white bg-white/20' : 'border-gray-200 group-hover:border-primary'}`}></div>}
                            </span>
                        </button>
                    )
                })}
            </div>

            {/* Explanation Popup (Inline) */}
            {selectedOption && (
                <div className="mt-6 p-5 rounded-2xl bg-gray-50 border border-gray-100 animate-fade-in">
                    <div className="flex gap-3">
                        <div className="mt-1">
                            {selectedOption === currentQuestion.correctAnswer 
                                ? <CheckCircleIcon className="w-6 h-6 text-green-500" />
                                : <XCircleIcon className="w-6 h-6 text-red-500" />
                            }
                        </div>
                        <div>
                            <p className={`font-bold ${selectedOption === currentQuestion.correctAnswer ? 'text-green-700' : 'text-red-700'}`}>
                                {selectedOption === currentQuestion.correctAnswer ? 'Correct!' : 'Incorrect'}
                            </p>
                            <p className="text-gray-600 text-sm mt-1 leading-relaxed">{currentQuestion.explanation}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
      </div>
    );
  }

  // View: Loading
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 animate-fade-in">
        <div className="relative w-32 h-32 mb-8">
             <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping"></div>
             <div className="absolute inset-0 bg-white rounded-full shadow-xl flex items-center justify-center relative z-10 animate-bounce">
                <BrainCircuitIcon className="w-16 h-16 text-primary" />
             </div>
        </div>
        <h2 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">Generating Quiz</h2>
        <p className="text-gray-500 text-xl font-medium text-center max-w-md animate-pulse">{loadingMessage}</p>
      </div>
    );
  }

  // View: Topic Selection
  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 animate-fade-in space-y-12">
      <div className="text-center py-8">
        <h2 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-500 to-indigo-600 mb-6 tracking-tight pb-2">Quiz Challenge</h2>
        <p className="text-xl text-gray-500 font-medium max-w-2xl mx-auto">Master your subjects. Select a topic to generate a new AI-powered quiz instantly, or design your own.</p>
      </div>

      {error && <ErrorDisplay message={error} onClear={() => setError(null)} className="max-w-2xl mx-auto" />}

      {savedQuiz && (
        <div className="max-w-3xl mx-auto bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-6 shadow-xl text-white flex flex-col sm:flex-row items-center justify-between gap-6 transform hover:-translate-y-1 transition-transform">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-full">
                    <StarIcon className="w-8 h-8 text-yellow-300" />
                </div>
                <div>
                    <h3 className="font-bold text-xl">Resume {savedQuiz.subject} Quiz</h3>
                    <p className="text-indigo-100 text-sm">You have an unfinished session.</p>
                </div>
            </div>
            <div className="flex gap-3">
                <button onClick={discardSavedQuiz} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-semibold transition-colors">Discard</button>
                <button onClick={resumeQuiz} className="px-6 py-2 bg-white text-indigo-700 rounded-lg font-bold hover:bg-indigo-50 transition-colors shadow-md">Continue</button>
            </div>
        </div>
      )}

      {/* AI Generated Subjects */}
      <div>
          <div className="flex items-center mb-8">
              <div className="h-px bg-gray-200 flex-grow"></div>
              <span className="px-4 text-gray-400 font-bold uppercase tracking-widest text-sm">Select a Subject</span>
              <div className="h-px bg-gray-200 flex-grow"></div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.values(SUBJECTS).filter(s => s.name !== Subject.Custom).map(({ name, color, icon: Icon }) => (
              <button
                key={name}
                onClick={() => startQuiz(name)}
                className="group relative h-64 rounded-[2rem] p-1 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 focus:outline-none"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${color} rounded-[2rem] opacity-80 group-hover:opacity-100 transition-opacity`}></div>
                <div className="absolute inset-0.5 bg-white/90 backdrop-blur-xl rounded-[1.9rem] p-6 flex flex-col items-center justify-between text-center transition-colors group-hover:bg-white/95">
                     <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${color} flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-500`}>
                        <Icon className="w-12 h-12 text-white drop-shadow-md" />
                     </div>
                    <div>
                        <span className="block text-2xl font-bold text-gray-800 mb-1">{name}</span>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest group-hover:text-primary transition-colors">AI Generated</span>
                    </div>
                </div>
              </button>
            ))}
          </div>
      </div>

      {/* Custom Quizzes Section */}
      <div>
        <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                <PencilIcon className="w-6 h-6 mr-3 text-pink-500" /> 
                My Custom Quizzes
            </h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Create New Button */}
            <button
                onClick={() => setIsCreating(true)}
                className="group h-48 rounded-3xl border-2 border-dashed border-gray-300 hover:border-pink-500 hover:bg-pink-50/50 transition-all flex flex-col items-center justify-center gap-4 text-gray-400 hover:text-pink-600 hover:scale-[1.02]"
            >
                <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-pink-100 transition-colors">
                    <PlusIcon className="w-7 h-7" />
                </div>
                <span className="font-bold">Create New Quiz</span>
            </button>

            {/* Existing Custom Quizzes */}
            {customQuizzes.map((quiz) => (
                <div key={quiz.id} className="group bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 relative h-48 flex flex-col justify-between hover:-translate-y-1 hover:scale-[1.02]">
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => { e.stopPropagation(); deleteCustomQuiz(quiz.id); }} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all">
                            <TrashIcon className="w-4 h-4" />
                        </button>
                    </div>
                    
                    <div>
                        <div className="inline-block px-3 py-1 bg-pink-100 text-pink-700 text-[10px] font-bold rounded-full uppercase tracking-wider mb-3">Custom</div>
                        <h4 className="text-xl font-bold text-gray-900 leading-snug line-clamp-2">{quiz.title}</h4>
                    </div>
                    
                    <div>
                        <p className="text-sm text-gray-500 mb-4">{quiz.questions.length} Questions</p>
                        <button 
                            onClick={() => startCustomQuiz(quiz)}
                            className="w-full py-2.5 bg-gray-50 text-gray-700 font-bold rounded-xl hover:bg-pink-500 hover:text-white transition-all shadow-sm active:scale-95"
                        >
                            Start
                        </button>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default Quiz;