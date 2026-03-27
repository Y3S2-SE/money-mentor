import React, { useState } from 'react';
import Sidebar from '../components/dashboard/Sidebar';
import CourseList from '../components/knowledge-hub/CourseList';
import ChatAdvisor from '../components/knowledge-hub/ChatAdvisor';

const KnowledgeHub = () => {
  const [activeTab, setActiveTab] = useState('courses');

  return (
    <Sidebar>
      <div className="flex flex-col h-full bg-surface-bright pb-4 pt-4 px-4">
        <div className="mb-6">
          <div className="flex gap-6 border-b border-outline-variant/30">
            <button
              onClick={() => setActiveTab('courses')}
              className={`pb-3 px-4 font-label tracking-widest uppercase text-[11px] font-bold transition-all relative ${activeTab === 'courses' ? 'text-primary' : 'text-on-surface/50 hover:text-on-surface'
                }`}
            >
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">school</span>
                Finance Courses
              </span>
              {activeTab === 'courses' && (
                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-primary rounded-t" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('advisor')}
              className={`pb-3 px-4 font-label tracking-widest uppercase text-[11px] font-bold transition-all relative ${activeTab === 'advisor' ? 'text-primary' : 'text-on-surface/50 hover:text-on-surface'
                }`}
            >
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">smart_toy</span>
                AI Advisor
              </span>
              {activeTab === 'advisor' && (
                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-primary rounded-t" />
              )}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2">
          {activeTab === 'courses' ? <CourseList /> : <ChatAdvisor />}
        </div>
      </div>
    </Sidebar>
  );
};

export default KnowledgeHub;