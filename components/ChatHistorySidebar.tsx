
import React, { useState, useMemo } from 'react';
import { type ChatSession } from '../types';
import { PlusIcon, TrashIcon, PencilIcon, CheckIcon, XMarkIcon, MagnifyingGlassIcon, ChatBubbleLeftIcon } from './icons/ActionIcons';

interface ChatHistorySidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onNewChat: () => void;
  onSelectSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onRenameSession: (sessionId: string, newName: string) => void;
}

const ChatHistorySidebar: React.FC<ChatHistorySidebarProps> = ({ sessions, activeSessionId, onNewChat, onSelectSession, onDeleteSession, onRenameSession }) => {
    const [renamingId, setRenamingId] = useState<string | null>(null);
    const [renameValue, setRenameValue] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const handleStartRename = (session: ChatSession) => {
        setRenamingId(session.id);
        setRenameValue(session.name);
    };

    const handleConfirmRename = () => {
        if (renamingId && renameValue.trim()) {
            onRenameSession(renamingId, renameValue.trim());
        }
        setRenamingId(null);
        setRenameValue('');
    };

    const handleCancelRename = () => {
        setRenamingId(null);
        setRenameValue('');
    };

    const handleDelete = (sessionId: string) => {
        if (window.confirm("Are you sure you want to delete this chat?")) {
            onDeleteSession(sessionId);
        }
    };

    const groupedSessions = useMemo<{ [key: string]: ChatSession[] }>(() => {
        const sorted = [...sessions].sort((a, b) => b.createdAt - a.createdAt);
        
        // Filter first
        const filtered = !searchQuery.trim() 
            ? sorted 
            : sorted.filter(session => {
                const lowercasedQuery = searchQuery.toLowerCase();
                const nameMatch = session.name.toLowerCase().includes(lowercasedQuery);
                const messageMatch = session.messages.some(message =>
                    message.content.toLowerCase().includes(lowercasedQuery)
                );
                return nameMatch || messageMatch;
            });

        // Then group
        const groups: { [key: string]: ChatSession[] } = {
            'Today': [],
            'Yesterday': [],
            'Previous 7 Days': [],
            'Older': []
        };

        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const yesterdayStart = todayStart - 86400000;
        const lastWeekStart = todayStart - 86400000 * 7;

        filtered.forEach(session => {
            if (session.createdAt >= todayStart) {
                groups['Today'].push(session);
            } else if (session.createdAt >= yesterdayStart) {
                groups['Yesterday'].push(session);
            } else if (session.createdAt >= lastWeekStart) {
                groups['Previous 7 Days'].push(session);
            } else {
                groups['Older'].push(session);
            }
        });

        return groups;
    }, [sessions, searchQuery]);

    const hasSessions = sessions.length > 0;
    const hasFilteredSessions = Object.values(groupedSessions).some((group: ChatSession[]) => group.length > 0);

    return (
        <div className="w-full h-full bg-gray-50 flex flex-col border-r border-gray-200">
            {/* Header / New Chat */}
            <div className="p-4 border-b border-gray-200/50 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
                <button
                    onClick={onNewChat}
                    className="flex items-center justify-center w-full px-4 py-3 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary-dark transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                    <PlusIcon className="w-5 h-5 mr-2" />
                    New Chat
                </button>
            </div>
            
            {/* Search */}
            <div className="px-4 pt-3 pb-2">
                 <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors group-focus-within:text-primary">
                        <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search conversations..."
                        className="w-full pl-9 pr-8 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                    />
                    {searchQuery && (
                        <button 
                            onClick={() => setSearchQuery('')}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                        >
                            <XMarkIcon className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Session List */}
            <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-4 custom-scrollbar">
                {hasFilteredSessions ? (
                    Object.entries(groupedSessions).map(([groupName, groupSessions]) => {
                        const sessionsList = groupSessions as ChatSession[];
                        return sessionsList.length > 0 && (
                            <div key={groupName}>
                                <h3 className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider sticky top-0 bg-gray-50 z-10">
                                    {groupName}
                                </h3>
                                <ul className="space-y-1">
                                    {sessionsList.map(session => (
                                        <li key={session.id} className="group">
                                            <div 
                                                className={`relative flex items-center p-3 mx-2 rounded-xl cursor-pointer transition-all duration-200 ${
                                                    session.id === activeSessionId 
                                                    ? 'bg-white shadow-sm border border-gray-200 text-primary ring-1 ring-primary/5' 
                                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                                }`}
                                                onClick={() => onSelectSession(session.id)}
                                            >
                                                {/* Active Indicator */}
                                                {session.id === activeSessionId && (
                                                    <div className="absolute left-0 top-3 bottom-3 w-1 bg-primary rounded-r-full"></div>
                                                )}

                                                {renamingId === session.id ? (
                                                    <div className="flex-1 flex items-center pl-2" onClick={e => e.stopPropagation()}>
                                                        <input
                                                            type="text"
                                                            value={renameValue}
                                                            onChange={(e) => setRenameValue(e.target.value)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') handleConfirmRename();
                                                                if (e.key === 'Escape') handleCancelRename();
                                                            }}
                                                            onFocus={(e) => e.target.select()}
                                                            className="w-full text-sm p-1.5 border border-primary rounded-md focus:outline-none bg-white shadow-inner"
                                                            autoFocus
                                                            onBlur={handleCancelRename}
                                                        />
                                                        <button onMouseDown={(e) => { e.preventDefault(); handleConfirmRename(); }} className="p-1.5 text-green-600 hover:bg-green-100 rounded-md ml-1"><CheckIcon className="w-4 h-4" /></button>
                                                        <button onMouseDown={(e) => { e.preventDefault(); handleCancelRename(); }} className="p-1.5 text-red-600 hover:bg-red-100 rounded-md"><XMarkIcon className="w-4 h-4" /></button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="flex-shrink-0 mr-3 text-gray-400 group-hover:text-primary/70">
                                                            <ChatBubbleLeftIcon className="w-5 h-5" />
                                                        </div>
                                                        <div className="flex-1 min-w-0" title="Double click to rename">
                                                            <p 
                                                                className={`text-sm font-medium truncate ${session.id === activeSessionId ? 'text-gray-900' : ''}`}
                                                                onDoubleClick={(e) => { e.stopPropagation(); handleStartRename(session); }}
                                                            >
                                                                {session.name}
                                                            </p>
                                                            <div className="flex items-center text-[10px] text-gray-400 mt-0.5">
                                                                <span className="truncate max-w-[120px]">
                                                                    {session.messages.length > 0 
                                                                        ? session.messages[session.messages.length - 1].content.substring(0, 30) 
                                                                        : 'Empty chat'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        
                                                        {/* Actions: Always visible for active session, otherwise on hover */}
                                                        <div className={`flex items-center transition-opacity ml-2 bg-white/80 rounded-lg shadow-sm ${session.id === activeSessionId ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); handleStartRename(session); }} 
                                                                className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" 
                                                                title="Rename"
                                                            >
                                                                <PencilIcon className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); handleDelete(session.id); }} 
                                                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" 
                                                                title="Delete"
                                                            >
                                                                <TrashIcon className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        );
                    })
                ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-center px-6">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
                            <MagnifyingGlassIcon className="w-8 h-8" />
                        </div>
                        <p className="text-sm font-medium text-text-primary">
                            {hasSessions ? "No matching chats" : "No chats yet"}
                        </p>
                        <p className="text-xs text-text-secondary mt-1">
                            {hasSessions ? "Try a different search term" : "Start a new conversation!"}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatHistorySidebar;
