import React, { useState, useEffect } from 'react';
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import "@blocknote/mantine/style.css";
import { MantineProvider } from "@mantine/core";
import { createArticle, updateArticle } from '../../services/articleService';
import { toast } from 'react-hot-toast';

const AdminArticleForm = ({ initialData, onBack }) => {
    const isEdit = !!initialData;
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        summary: '',
        category: 'general',
        thumbnail: '',
        pointsPerRead: 50,
        isPublished: false
    });

    const [preview, setPreview] = useState(null);

    // Initialize BlockNote editor
    const editor = useCreateBlockNote();

    useEffect(() => {
        if (initialData) {
            setFormData({
                title: initialData.title || '',
                summary: initialData.summary || '',
                category: initialData.category || 'general',
                thumbnail: initialData.thumbnail || '',
                pointsPerRead: initialData.pointsPerRead || 50,
                isPublished: initialData.isPublished || false
            });
            setPreview(initialData.thumbnail || null);

            // Load content into editor
            if (initialData.content) {
                try {
                    const blocks = typeof initialData.content === 'string' 
                        ? JSON.parse(initialData.content) 
                        : initialData.content;
                    
                    const initialBlocks = blocks.content || (Array.isArray(blocks) ? blocks : []);
                    if (initialBlocks.length > 0) {
                        editor.replaceBlocks(editor.topLevelBlocks, initialBlocks);
                    }
                } catch (e) {
                    console.error("Failed to parse article content", e);
                }
            }
        }
    }, [initialData, editor]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData({ ...formData, thumbnail: file });
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e, shouldPublish = null) => {
        if (e) e.preventDefault();
        
        // Validation
        if (!formData.title.trim()) return toast.error('Title is required');
        if (!formData.summary.trim()) return toast.error('Summary is required');

        const content = editor.topLevelBlocks; // BlockNote content as JSON blocks
        
        const payload = {
            ...formData,
            content: content,
            // If shouldPublish is provided (true/false), use it. Otherwise use current state.
            isPublished: shouldPublish !== null ? shouldPublish : formData.isPublished
        };

        try {
            setLoading(true);
            if (isEdit) {
                await updateArticle(initialData._id, payload);
                toast.success('Article updated successfully');
            } else {
                await createArticle(payload);
                toast.success('Article created successfully');
            }
            onBack();
        } catch (error) {
            console.error('Submission error:', error);
            const message = error.response?.data?.message || 'Failed to save article';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const categories = ['budgeting', 'investing', 'saving', 'debt', 'taxes', 'general'];

    return (
        <MantineProvider>
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-outline-variant/20 shadow-sm">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onBack}
                            className="w-10 h-10 rounded-full bg-outline-variant/10 text-on-surface flex items-center justify-center hover:bg-outline-variant/20 hover:text-primary transition-all"
                        >
                            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                        </button>
                        <div>
                            <h2 className="text-xl font-headline font-bold text-on-surface">
                                {isEdit ? 'Edit Article' : 'Create New Article'}
                            </h2>
                            <p className="text-[10px] uppercase font-bold tracking-widest text-on-surface/40 mt-0.5">
                                Content Management Hub
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={(e) => handleSubmit(e, false)}
                            disabled={loading}
                            className="px-6 py-2.5 rounded-2xl border border-outline-variant/30 text-on-surface/60 font-bold text-sm hover:bg-surface-bright transition-all active:scale-95 disabled:opacity-50"
                        >
                            Save as Draft
                        </button>
                        <button
                            type="button"
                            onClick={(e) => handleSubmit(e, true)}
                            disabled={loading}
                            className="px-6 py-2.5 rounded-2xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading ? (
                                <div className="animate-spin w-4 h-4 border-2 border-white/30 border-b-white rounded-full"></div>
                            ) : (
                                <span className="material-symbols-outlined text-[18px]">publish</span>
                            )}
                            {isEdit ? 'Update & Publish' : 'Save & Publish'}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column - Metadata */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-white p-6 rounded-3xl border border-outline-variant/20 shadow-sm space-y-6">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface/40 border-b border-outline-variant/10 pb-4">Article Details</h3>
                            
                            {/* Title */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase font-bold tracking-widest text-on-surface/50 px-1">Article Title</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="Enter exploring title..."
                                    className="w-full px-4 py-3 bg-surface-bright rounded-2xl border border-outline-variant/20 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium"
                                />
                            </div>

                            {/* Summary */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase font-bold tracking-widest text-on-surface/50 px-1">Short Summary</label>
                                <textarea
                                    value={formData.summary}
                                    onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                                    placeholder="Briefly describe what this article covers..."
                                    rows="3"
                                    className="w-full px-4 py-3 bg-surface-bright rounded-2xl border border-outline-variant/20 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium resize-none"
                                />
                            </div>

                            {/* Category & Points */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] uppercase font-bold tracking-widest text-on-surface/50 px-1">Category</label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full px-4 py-3 bg-surface-bright rounded-2xl border border-outline-variant/20 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-bold capitalize"
                                    >
                                        {categories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] uppercase font-bold tracking-widest text-on-surface/50 px-1">Points</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={formData.pointsPerRead}
                                            onChange={(e) => setFormData({ ...formData, pointsPerRead: parseInt(e.target.value) })}
                                            className="w-full pl-4 pr-10 py-3 bg-surface-bright rounded-2xl border border-outline-variant/20 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-bold"
                                        />
                                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-primary text-[20px]">stars</span>
                                    </div>
                                </div>
                            </div>

                            {/* Thumbnail */}
                            <div className="space-y-3">
                                <label className="text-[10px] uppercase font-bold tracking-widest text-on-surface/50 px-1">Article Thumbnail</label>
                                <div className="space-y-4">
                                    <div className={`relative group w-full ${preview ? 'aspect-video' : 'aspect-[21/9]'} rounded-2xl overflow-hidden border border-outline-variant/20 bg-surface-bright transition-all`}>
                                        {preview ? (
                                            <>
                                                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                                    <button 
                                                        type="button"
                                                        onClick={() => { setPreview(null); setFormData({...formData, thumbnail: ''}); }}
                                                        className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/30 transition-all flex items-center justify-center"
                                                    >
                                                        <span className="material-symbols-outlined">delete</span>
                                                    </button>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-on-surface/30">
                                                <span className="material-symbols-outlined text-4xl mb-2">image</span>
                                                <p className="text-[10px] font-bold uppercase tracking-widest">No Image Selected</p>
                                            </div>
                                        )}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        className="w-full py-3 bg-surface-bright rounded-2xl border border-outline-variant/20 text-[10px] font-bold uppercase tracking-widest text-on-surface/60 hover:bg-surface hover:text-primary transition-all flex items-center justify-center gap-2"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
                                        {preview ? 'Change Image' : 'Upload Image'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Editor */}
                    <div className="lg:col-span-8">
                        <div className="bg-white rounded-3xl border border-outline-variant/20 shadow-sm min-h-[600px] flex flex-col overflow-hidden">
                            <div className="shrink-0 p-6 border-b border-outline-variant/10 flex items-center justify-between bg-surface-bright/50">
                                <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface/40 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[20px]">article</span>
                                    Article Content
                                </h3>
                                <div className="flex items-center gap-2 text-[10px] font-bold text-on-surface/30 uppercase tracking-widest">
                                    <span className="material-symbols-outlined text-[14px]">info</span>
                                    Use / for commands
                                </div>
                            </div>
                            <div className="flex-1 p-4 md:p-8 overflow-y-auto max-h-[800px]">
                                <div className="prose prose-lg prose-primary max-w-none">
                                    <BlockNoteView 
                                        editor={editor} 
                                        theme="light"
                                        className="min-h-[400px]"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </MantineProvider>
    );
};

export default AdminArticleForm;
