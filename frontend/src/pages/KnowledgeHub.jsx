import React, { useState } from 'react';
import Sidebar from '../components/dashboard/Sidebar';
import CourseList from '../components/knowledge-hub/CourseList';
import ArticleList from '../components/knowledge-hub/ArticleList';
import ArticleView from '../components/knowledge-hub/ArticleView';
import ChatAdvisor from '../components/knowledge-hub/ChatAdvisor';
import useSwipeTabs from '../hooks/useSwipeTabs';

const KnowledgeHub = () => {
    const [activeTab, setActiveTab] = useState('courses');
    const [selectedArticle, setSelectedArticle] = useState(null);

    const tabs = [
        { id: 'courses', label: 'Finance Courses', short: 'Courses', icon: 'school' },
        { id: 'articles', label: 'Financial Articles', short: 'Articles', icon: 'menu_book' },
        { id: 'advisor', label: 'AI Advisor', short: 'Advisor', icon: 'smart_toy' }
    ];

    const TAB_IDS = tabs.map(t => t.id);
    const { handleTouchStart, handleTouchMove, handleTouchEnd } = useSwipeTabs(TAB_IDS, activeTab, setActiveTab);

    const renderContent = () => {
        if (selectedArticle) {
            return (
                <ArticleView
                    articleId={selectedArticle._id}
                    onBack={() => setSelectedArticle(null)}
                />
            );
        }

        switch (activeTab) {
            case 'courses': return (
                <div style={{ animation: 'tabSlideIn 0.25s cubic-bezier(0.4, 0, 0.2, 1) both' }}>
                    <CourseList />
                </div>
            );
            case 'articles': return (
                <div style={{ animation: 'tabSlideIn 0.25s cubic-bezier(0.4, 0, 0.2, 1) both' }}>
                    <ArticleList onSelectArticle={setSelectedArticle} />
                </div>
            );
            case 'advisor': return (
                <div style={{ animation: 'tabSlideIn 0.25s cubic-bezier(0.4, 0, 0.2, 1) both' }}>
                    <ChatAdvisor />
                </div>
            );
            default: return <CourseList />;
        }
    };

    return (
        <Sidebar>
            <div className="flex flex-col h-full bg-surface pb-8 pt-4 px-4 md:px-8 overflow-y-auto animate-in fade-in duration-700 overflow-x-hidden">
                <div className="max-w-7xl mx-auto w-full space-y-10">
                    {!selectedArticle && (
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-6 px-2 mt-4">
                                <div>
                                    <h1 className="text-xl font-headline font-bold text-on-surface">Knowledge Hub</h1>
                                    <p className="text-xs font-body text-on-surface-variant mt-0.5">
                                        Master your finances through structured courses and deep-dive articles.
                                    </p>
                                </div>
                            </div>

                            {/* Standardized Tab Switcher - Responsive */}
                            <div className="flex gap-6 border-b border-outline-variant/30 px-2 overflow-x-auto scrollbar-hide whitespace-nowrap">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`pb-3 px-2 sm:px-4 font-label tracking-widest uppercase text-[11px] font-bold transition-all relative flex items-center gap-2 shrink-0 ${activeTab === tab.id
                                            ? 'text-blue-900'
                                            : 'text-on-surface-variant hover:text-on-surface'
                                            }`}
                                    >
                                        <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                                        <span className="hidden sm:inline">{tab.label}</span>
                                        <span className="sm:hidden">{tab.short}</span>
                                        {activeTab === tab.id && (
                                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-900 rounded-t" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Main Content Area - Swipe Handlers here */}
                    <div 
                        className={`${!selectedArticle ? 'animate-in slide-in-from-bottom-4 duration-500' : ''}`}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                    >
                        {renderContent()}
                    </div>
                </div>
            </div>

            <style>{`
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </Sidebar>
    );
};

export default KnowledgeHub;