import React, { useState } from 'react';
import { createCourse, updateCourse } from '../../services/courseService';

const AdminCourseForm = ({ initialData, onBack }) => {
  const isEditing = !!initialData;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    category: initialData?.category || 'budgeting',
    difficulty: initialData?.difficulty || 'beginner',
    thumbnail: initialData?.thumbnail || '',
    passingScore: initialData?.passingScore || 70,
    isPublished: initialData?.isPublished || false,
    questions: initialData?.questions || []
  });

  const handleAddQuestion = () => {
    setFormData({
      ...formData,
      questions: [
        ...formData.questions,
        { question: '', options: ['', '', '', ''], correctAnswerIndex: 0, explanation: '', points: 50 }
      ]
    });
  };

  const handleRemoveQuestion = (index) => {
    const newQs = [...formData.questions];
    newQs.splice(index, 1);
    setFormData({ ...formData, questions: newQs });
  };

  const currentPoints = formData.questions.reduce((sum, q) => sum + Number(q.points || 0), 0);

  const handleQuestionChange = (qIndex, field, value) => {
    const newQs = [...formData.questions];
    newQs[qIndex][field] = value;
    setFormData({ ...formData, questions: newQs });
  };

  const handleOptionChange = (qIndex, optIndex, value) => {
    const newQs = [...formData.questions];
    newQs[qIndex].options[optIndex] = value;
    setFormData({ ...formData, questions: newQs });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.questions.length === 0) {
      alert("Please add at least one question.");
      return;
    }
    setLoading(true);
    try {
      if (isEditing) {
        await updateCourse(initialData._id, formData);
      } else {
        await createCourse(formData);
      }
      onBack(); // return to list on success
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Failed to save course.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <button 
        onClick={onBack}
        className="flex items-center gap-1 text-on-surface/60 hover:text-primary font-label text-[11px] uppercase tracking-wider font-bold mb-4"
      >
        <span className="material-symbols-outlined text-sm">arrow_back</span>
        Back to Courses
      </button>

      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-3xl font-headline font-bold text-on-surface">{isEditing ? 'Edit Course' : 'Create New Course'}</h2>
          <p className="text-on-surface/60 text-sm mt-1">Total Course Points Available: <span className="text-primary font-bold">{currentPoints} pts</span></p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Basic Details Section */}
        <div className="bg-surface-bright p-6 md:p-8 rounded-2xl border border-outline-variant/30 space-y-6">
          <h3 className="font-bold text-lg font-headline border-b border-outline-variant/30 pb-3">Basic Details</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-label uppercase tracking-wider text-on-surface/70 mb-2 font-bold">Course Title</label>
              <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-surface border border-outline-variant/30 rounded-xl px-4 py-3 focus:border-primary focus:ring-1 focus:ring-primary/20" placeholder="e.g. Budgeting 101" />
            </div>

            <div>
              <label className="block text-xs font-label uppercase tracking-wider text-on-surface/70 mb-2 font-bold">Description</label>
              <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-surface border border-outline-variant/30 rounded-xl px-4 py-3 focus:border-primary focus:ring-1 focus:ring-primary/20 min-h-[100px]" placeholder="Brief course overview..." />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-label uppercase tracking-wider text-on-surface/70 mb-2 font-bold">Category</label>
                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-surface border border-outline-variant/30 rounded-xl px-4 py-3 focus:border-primary focus:ring-1 focus:ring-primary/20">
                  <option value="budgeting">Budgeting</option>
                  <option value="investing">Investing</option>
                  <option value="saving">Saving</option>
                  <option value="debt">Debt Management</option>
                  <option value="taxes">Taxes</option>
                  <option value="crypto">Cryptocurrency</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-label uppercase tracking-wider text-on-surface/70 mb-2 font-bold">Difficulty</label>
                <select value={formData.difficulty} onChange={e => setFormData({...formData, difficulty: e.target.value})} className="w-full bg-surface border border-outline-variant/30 rounded-xl px-4 py-3 focus:border-primary focus:ring-1 focus:ring-primary/20">
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-label uppercase tracking-wider text-on-surface/70 mb-2 font-bold">Thumbnail URL (Optional)</label>
                <input type="url" value={formData.thumbnail} onChange={e => setFormData({...formData, thumbnail: e.target.value})} className="w-full bg-surface border border-outline-variant/30 rounded-xl px-4 py-3 focus:border-primary focus:ring-1 focus:ring-primary/20" placeholder="https://..." />
              </div>
              <div>
                <label className="block text-xs font-label uppercase tracking-wider text-on-surface/70 mb-2 font-bold">Passing Score (%)</label>
                <input required type="number" min="1" max="100" value={formData.passingScore} onChange={e => setFormData({...formData, passingScore: e.target.value})} className="w-full bg-surface border border-outline-variant/30 rounded-xl px-4 py-3 focus:border-primary focus:ring-1 focus:ring-primary/20" />
              </div>
            </div>
            
            <label className="flex items-center gap-3 bg-surface p-4 rounded-xl border border-outline-variant/30 w-max cursor-pointer">
              <input type="checkbox" checked={formData.isPublished} onChange={e => setFormData({...formData, isPublished: e.target.checked})} className="w-4 h-4 accent-primary" />
              <span className="font-bold text-sm">Publish Course</span>
            </label>
          </div>
        </div>

        {/* Questions Section */}
        <div className="bg-surface-bright p-6 md:p-8 rounded-2xl border border-outline-variant/30 space-y-6">
          <div className="flex justify-between items-end border-b border-outline-variant/30 pb-3">
            <h3 className="font-bold text-lg font-headline">Quiz Questions</h3>
            <button type="button" onClick={handleAddQuestion} className="flex items-center gap-1 text-primary font-label text-[10px] uppercase font-bold tracking-wider hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors">
              <span className="material-symbols-outlined text-[16px]">add</span> Add Question
            </button>
          </div>

          <div className="space-y-6">
            {formData.questions.map((q, qIndex) => (
              <div key={qIndex} className="p-6 bg-surface rounded-xl border border-outline-variant/30 relative shadow-sm">
                <button 
                  type="button" 
                  onClick={() => handleRemoveQuestion(qIndex)}
                  className="absolute top-4 right-4 text-red-500/50 hover:text-red-500 transition-colors"
                  title="Remove Question"
                >
                  <span className="material-symbols-outlined">delete</span>
                </button>
                
                <h4 className="font-bold text-sm uppercase tracking-wider font-label text-on-surface/50 mb-4">Question {qIndex + 1}</h4>
                
                <div className="space-y-4">
                  <input required placeholder="Question text..." value={q.question} onChange={e => handleQuestionChange(qIndex, 'question', e.target.value)} className="w-full bg-surface-bright border border-outline-variant/30 rounded-xl px-4 py-3 font-medium focus:border-primary focus:ring-1 focus:ring-primary/20" />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-4 border-l-2 border-outline-variant/30">
                    {q.options.map((opt, optIndex) => (
                      <div key={optIndex} className="flex items-center gap-2">
                        <span className="text-on-surface/40 text-xs font-bold font-mono">{optIndex + 1}.</span>
                        <input required placeholder={`Option ${optIndex + 1}`} value={opt} onChange={e => handleOptionChange(qIndex, optIndex, e.target.value)} className="flex-1 bg-surface-bright border border-outline-variant/30 rounded-lg px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20" />
                      </div>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-outline-variant/5 p-4 rounded-xl border border-outline-variant/10">
                    <div>
                      <label className="block text-[10px] font-label uppercase tracking-widest text-on-surface/70 mb-2 font-bold">Correct Option</label>
                      <select value={q.correctAnswerIndex} onChange={e => handleQuestionChange(qIndex, 'correctAnswerIndex', Number(e.target.value))} className="w-full bg-surface border border-outline-variant/30 rounded-lg px-3 py-2 text-sm">
                        <option value={0}>Option 1</option>
                        <option value={1}>Option 2</option>
                        <option value={2}>Option 3</option>
                        <option value={3}>Option 4</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-label uppercase tracking-widest text-on-surface/70 mb-2 font-bold">Point Value</label>
                      <input required type="number" min="0" value={q.points} onChange={e => handleQuestionChange(qIndex, 'points', Number(e.target.value))} className="w-full bg-surface border border-outline-variant/30 rounded-lg px-3 py-2 text-sm" />
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-[10px] font-label uppercase tracking-widest text-on-surface/70 mb-2 font-bold">Explanation (Optional)</label>
                      <input placeholder="Why is this answer correct?" value={q.explanation} onChange={e => handleQuestionChange(qIndex, 'explanation', e.target.value)} className="w-full bg-surface border border-outline-variant/30 rounded-lg px-3 py-2 text-sm" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {formData.questions.length === 0 && (
              <div className="text-center p-8 text-on-surface/50 border border-dashed border-outline-variant/30 rounded-xl">
                No questions added yet.
              </div>
            )}
          </div>
        </div>

        {/* Floating Save Button */}
        <div className="fixed bottom-0 left-0 right-0 bg-surface/80 backdrop-blur-md border-t border-outline-variant/20 p-4 md:pl-64 z-50 flex justify-end px-6 md:px-16">
          <div className="flex gap-4 items-center">
            {formData.questions.length > 0 && (
              <span className="text-sm font-bold text-on-surface/60 hidden md:block">{formData.questions.length} Qs • {currentPoints} pts total</span>
            )}
            <button 
              type="button" 
              onClick={onBack}
              className="px-6 py-3 border border-outline-variant/30 rounded-xl font-label tracking-widest text-[11px] uppercase font-bold hover:bg-outline-variant/10 text-on-surface transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="px-10 py-3 bg-primary text-white rounded-xl font-label tracking-widest text-[11px] uppercase font-bold hover:bg-primary/90 shadow-[0_4px_12px_rgba(16,185,129,0.3)] transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>Saving...</>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">save</span> 
                  Save Course
                </>
              )}
            </button>
          </div>
        </div>

      </form>
    </div>
  );
};

export default AdminCourseForm;
