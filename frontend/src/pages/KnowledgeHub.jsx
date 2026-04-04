import React, { useState } from 'react';
import Sidebar from '../components/dashboard/Sidebar';
import CourseList from '../components/knowledge-hub/CourseList';
import ArticleList from '../components/knowledge-hub/ArticleList';
import ArticleView from '../components/knowledge-hub/ArticleView';
import ChatAdvisor from '../components/knowledge-hub/ChatAdvisor';

const KnowledgeHub = () => {
    const [activeTab, setActiveTab] = useState('courses');
    const [selectedArticle, setSelectedArticle] = useState(null);

    const tabs = [
        { id: 'courses', label: 'Finance Courses', icon: 'school' },
        { id: 'articles', label: 'Financial Articles', icon: 'menu_book' },
        { id: 'advisor', label: 'AI Advisor', icon: 'smart_toy' }
    ];

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
            case 'courses': return <CourseList />;
            case 'articles': return <ArticleList onSelectArticle={setSelectedArticle} />;
            case 'advisor': return <ChatAdvisor />;
            default: return <CourseList />;
        }
    };

    return (
        <Sidebar>
            <div className="flex flex-col h-full bg-surface pb-8 pt-4 px-4 md:px-8 overflow-y-auto animate-in fade-in duration-700">
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

                            {/* Standardized Tab Switcher */}
                            <div className="flex gap-6 border-b border-outline-variant/30 px-2">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`pb-3 px-4 font-label tracking-widest uppercase text-[11px] font-bold transition-all relative flex items-center gap-2 ${activeTab === tab.id
                                            ? 'text-blue-900'
                                            : 'text-on-surface-variant hover:text-on-surface'
                                            }`}
                                    >
                                        <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
                                        {tab.label}
                                        {activeTab === tab.id && (
                                            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-blue-900 rounded-t" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Main Content Area */}
                    <div className={`${!selectedArticle ? 'animate-in slide-in-from-bottom-4 duration-500' : ''}`}>
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