import React, { useState, useRef, useEffect } from 'react';
import { type View, type User } from '../types';
import { LearnMateLogo } from './icons/BrandIcons';
import { UserCircleIcon, ArrowRightOnRectangleIcon, MagnifyingGlassIcon, Bars3Icon, XMarkIcon } from './icons/ActionIcons';

interface HeaderProps {
    user: User;
    currentView: View;
    setView: (view: View) => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
}

const Header: React.FC<HeaderProps> = ({ user, currentView, setView, searchQuery, setSearchQuery }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const navItems: { id: View; label: string }[] = [
    { id: 'chat', label: 'AI Assistant' },
    { id: 'quiz', label: 'Quiz' },
    { id: 'todo', label: 'Study Planner' },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
            setIsDropdownOpen(false);
        }
        if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node) && !dropdownRef.current?.contains(event.target as Node)) {
             // Basic click outside for mobile menu if needed, though usually handled by toggle
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (currentView !== 'home') {
        setView('home');
    }
  };

  const handleNavClick = (view: View) => {
      setView(view);
      setIsMobileMenuOpen(false);
  }

  return (
    <header className="bg-surface/90 backdrop-blur-xl shadow-sm sticky top-0 z-40 border-b border-gray-200/80 transition-all duration-300">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          
          {/* Logo */}
          <button onClick={() => { setView('home'); setSearchQuery(''); }} className="flex items-center gap-3 focus:outline-none group flex-shrink-0">
             <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <LearnMateLogo className="h-9 w-9 md:h-10 md:w-10 relative z-10 transition-transform duration-300 group-hover:rotate-6" />
             </div>
            <h1 className="text-xl md:text-2xl font-bold text-text-primary tracking-tight font-sans">LearnMate</h1>
          </button>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 justify-center px-8 lg:px-12">
            <div className="relative w-full max-w-md group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors duration-200 group-focus-within:text-primary text-gray-400">
                    <MagnifyingGlassIcon className="h-5 w-5" />
                </div>
                <input
                    type="search"
                    name="search"
                    id="search"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="block w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-full leading-5 bg-gray-50/50 text-text-primary placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 shadow-sm"
                    placeholder="Search features, topics..."
                />
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-4">
            <div className="flex items-center bg-gray-100/50 rounded-full p-1 border border-gray-200/50">
              {navItems.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setView(id)}
                  className={`relative px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 focus:outline-none ${
                    currentView === id
                      ? 'bg-white text-primary shadow-sm ring-1 ring-black/5'
                      : 'text-text-secondary hover:text-text-primary hover:bg-gray-200/50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            
            {/* User Profile Dropdown */}
            <div className="relative ml-2" ref={dropdownRef}>
                <button 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 p-0.5 flex items-center justify-center text-primary font-bold text-lg hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary overflow-hidden"
                >
                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                        {user.profilePicture ? (
                            <img src={user.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            user.name.charAt(0).toUpperCase()
                        )}
                    </div>
                </button>
                {isDropdownOpen && (
                    <div className="absolute right-0 mt-3 w-64 bg-white rounded-xl shadow-xl ring-1 ring-black ring-opacity-5 origin-top-right animate-fade-in border border-gray-100 overflow-hidden z-50">
                         <div className="px-5 py-4 bg-gray-50/50 border-b border-gray-100">
                            <p className="text-sm font-bold text-text-primary truncate">{user.name}</p>
                            <p className="text-xs text-text-secondary truncate mt-0.5">{user.email}</p>
                            <div className="mt-2 text-xs font-semibold px-2 py-0.5 bg-primary/10 text-primary rounded-full inline-block">
                                {user.rank} Rank
                            </div>
                        </div>
                        <div className="py-2">
                            <button
                                onClick={() => { setView('profile'); setIsDropdownOpen(false); }}
                                className="w-full text-left px-5 py-2.5 text-sm text-text-primary hover:bg-gray-50 flex items-center transition-colors"
                            >
                                <UserCircleIcon className="w-5 h-5 mr-3 text-gray-500" />
                                Profile & Progress
                            </button>
                             <div className="border-t border-gray-100 my-1"></div>
                              <button
                                onClick={() => alert("Log out functionality would be here.")}
                                className="w-full text-left px-5 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center transition-colors"
                            >
                                <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3 text-red-400" />
                                Log Out
                            </button>
                        </div>
                    </div>
                )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden gap-3">
             <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
             <div className="w-9 h-9 rounded-full bg-gray-200 overflow-hidden" onClick={() => setView('profile')}>
                {user.profilePicture ? (
                    <img src={user.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                   <div className="w-full h-full flex items-center justify-center text-primary font-bold">
                       {user.name.charAt(0).toUpperCase()}
                   </div>
                )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 absolute w-full shadow-lg z-50 animate-slide-in-up" ref={mobileMenuRef}>
            <div className="px-4 pt-4 pb-2">
                 <div className="relative w-full mb-4">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <MagnifyingGlassIcon className="h-5 w-5" />
                    </div>
                    <input
                        type="search"
                        value={searchQuery}
                        onChange={handleSearchChange}
                        className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary"
                        placeholder="Search..."
                    />
                </div>
            </div>
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navItems.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => handleNavClick(id)}
                className={`block w-full text-left px-3 py-3 rounded-lg text-base font-medium ${
                  currentView === id
                    ? 'bg-primary/10 text-primary'
                    : 'text-text-secondary hover:text-text-primary hover:bg-gray-50'
                }`}
              >
                {label}
              </button>
            ))}
            <button
                onClick={() => handleNavClick('profile')}
                className={`block w-full text-left px-3 py-3 rounded-lg text-base font-medium ${
                  currentView === 'profile'
                    ? 'bg-primary/10 text-primary'
                    : 'text-text-secondary hover:text-text-primary hover:bg-gray-50'
                }`}
              >
                Profile
            </button>
          </div>
          <div className="pt-4 pb-4 border-t border-gray-100">
            <div className="flex items-center px-5">
              <div className="flex-shrink-0">
                 <div className="h-10 w-10 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center font-bold text-primary">
                    {user.profilePicture ? (
                        <img src={user.profilePicture} alt="" className="h-full w-full object-cover" />
                    ) : user.name.charAt(0).toUpperCase()}
                 </div>
              </div>
              <div className="ml-3">
                <div className="text-base font-medium leading-none text-gray-800">{user.name}</div>
                <div className="text-sm font-medium leading-none text-gray-500 mt-1">{user.email}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;