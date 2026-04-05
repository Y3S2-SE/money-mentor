import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import "@blocknote/mantine/style.css";
import { MantineProvider } from "@mantine/core";
import { getArticleById, completeArticle } from '../../services/articleService';
import Lottie from 'lottie-react';
import { useDispatch } from 'react-redux';
import { addToast } from '../../store/slices/toastSlice';

const ArticleView = ({ articleId, onBack, onComplete }) => {
    const dispatch = useDispatch();
    
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [secondsElapsed, setSecondsElapsed] = useState(0);
    const [isCompleting, setIsCompleting] = useState(false);
    const [alreadyCompleted, setAlreadyCompleted] = useState(false);
    const [completionAnim, setCompletionAnim] = useState(null);

    const containerRef = useRef(null);
    const timerRef = useRef(null);
    // FIX BUG 2 & 4: keep a ref to always-current secondsElapsed so handleComplete
    // never reads a stale closure value, regardless of deps array.
    const secondsElapsedRef = useRef(0);

    const editor = useCreateBlockNote();

    // FIX BUG 2 & 4: wrap in useCallback so it's stable, and read from the ref
    // instead of the state variable to avoid the stale closure entirely.
    const handleComplete = useCallback(async () => {
        if (isCompleting) return;
        setIsCompleting(true);
        try {
            const res = await completeArticle(articleId, secondsElapsedRef.current);
            setAlreadyCompleted(true);
            clearInterval(timerRef.current);
            
            const { 
                pointsEarned,
                leveledUp,
                level, 
                newlyEarnedBadges = [],
            } = res.data;

            dispatch(addToast({
                type: 'xp',
                message: `${pointsEarned} XP Earned!`,
                subMessage: 'Article mastered',
            }));

            if (leveledUp) {
                setTimeout(() => {
                    dispatch(addToast({
                        type: 'level',
                        message: `Level Up! You're Level ${level}`,
                        subMessage: 'Keep reading to grow knowledge!',
                    }));
                }, 900);
            }

            newlyEarnedBadges.forEach((badge, i) => {
                setTimeout(() => {
                    dispatch(addToast({
                        type: 'badge',
                        message: `Badge Unlocked: ${badge.name}!`,
                        subMessage: `+${badge.xpReward} XP. ${badge.description}`,
                    }));
                }, 1400 + i * 700);
            });

            if (onComplete) onComplete(res.data);
        } catch (error) {
            console.error('Completion error:', error);
            if (error.response?.status !== 400) {
                dispatch(addToast({
                    type: 'error',
                    message: 'Could not record completion',
                    subMessage: 'Please check you connection',
                }));
            }
        } finally {
            setIsCompleting(false);
        }
    }, [articleId, isCompleting, onComplete, dispatch]);

    useEffect(() => {
        // FIX BUG 3: clear any existing interval before starting a new one,
        // so switching articleId doesn't leave a ghost timer running.
        clearInterval(timerRef.current);
        setSecondsElapsed(0);
        secondsElapsedRef.current = 0;
        setAlreadyCompleted(false);
        setArticle(null);

        fetchArticle();
        import('../../assets/lottie/rising_star.json').then(data => setCompletionAnim(data.default));

        return () => clearInterval(timerRef.current);
    }, [articleId]);

    const fetchArticle = async () => {
        try {
            setLoading(true);
            const res = await getArticleById(articleId);
            setArticle(res.data);
            setAlreadyCompleted(res.data.isRead);

            if (res.data.content) {
                const blocks = typeof res.data.content === 'string'
                    ? JSON.parse(res.data.content)
                    : res.data.content;
                const initialBlocks = blocks.content || (Array.isArray(blocks) ? blocks : []);
                editor.replaceBlocks(editor.topLevelBlocks, initialBlocks);
            }

            if (!res.data.isRead) {
                // FIX BUG 3: guard against a double-start (fetchArticle called twice)
                clearInterval(timerRef.current);
                timerRef.current = setInterval(() => {
                    if (!document.hidden) {
                        // FIX BUG 2: keep the ref in sync with every tick
                        secondsElapsedRef.current += 1;
                        setSecondsElapsed(prev => prev + 1);
                    }
                }, 1000);
            }
        } catch (error) {
            dispatch(addToast({
                type: 'error',
                message: 'Failed to load article',
                subMessage: 'Please try again!',
            }));
            onBack();
        } finally {
            setLoading(false);
        }
    };


    // Trigger completion purely on time — once the required seconds elapse, call the endpoint.
    useEffect(() => {
        if (!article || alreadyCompleted || isCompleting) return;

        const minSeconds = Math.floor(article.readTime * 60 * 0.6);

        if (secondsElapsed >= minSeconds) {
            handleComplete();
        }
    }, [secondsElapsed, article, alreadyCompleted, isCompleting, handleComplete]);

    // FIX BUG 5: guard the render-time computation so it only runs when article exists.
    if (loading || !article) {
        return (
            <div className="flex flex-col items-center justify-center py-40 gap-4">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                <p className="text-on-surface/40 text-sm font-medium">Brewing your knowledge...</p>
            </div>
        );
    }

    // Safe: article is guaranteed non-null past this point.
    const minSecondsRequired = Math.floor(article.readTime * 60 * 0.6);
    const progressPercent = Math.min(100, Math.ceil((secondsElapsed / minSecondsRequired) * 100));

    return (
        <MantineProvider>
            <div className="max-w-5xl mx-auto flex flex-col h-full bg-white rounded-[48px] border border-outline-variant/10 shadow-2xl shadow-primary/5 overflow-hidden animate-in zoom-in-95 duration-500">
                {/* Immersive Sticky Header */}
                <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-outline-variant/5 px-6 py-4 flex items-center justify-between">
                    <button
                        onClick={onBack}
                        className="group flex items-center gap-3 text-on-surface/50 hover:text-primary transition-all text-xs font-bold uppercase tracking-widest"
                    >
                        <div className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                        </div>
                        Back
                    </button>

                    <div className="flex items-center gap-6">
                        {!alreadyCompleted && (
                            <div className="flex items-center gap-4">
                                <div className="text-right hidden sm:block">
                                    <p className="text-[10px] uppercase font-bold tracking-tighter text-on-surface/30 leading-none mb-1">Focus Time</p>
                                    <p className="text-[11px] font-bold text-primary">{progressPercent}%</p>
                                </div>
                                <div className="w-20 h-2 bg-surface-container-low rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary transition-all duration-1000 ease-out"
                                        style={{ width: `${progressPercent}%` }}
                                    />
                                </div>
                            </div>
                        )}
                        {alreadyCompleted && (
                            <div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-2xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 border border-emerald-100 shadow-sm animate-in fade-in slide-in-from-right-4">
                                <span className="material-symbols-outlined text-[16px] font-bold">verified</span>
                                Article Mastered
                            </div>
                        )}
                    </div>
                </div>

                <div
                    className="flex-1 overflow-y-auto px-6 md:px-16 py-12 md:py-20 scroll-smooth relative"
                    ref={containerRef}
                >
                    <div className="max-w-3xl mx-auto space-y-12">
                        {/* Hero Section */}
                        <div className="text-center space-y-6 mb-16">
                            <div className="flex items-center justify-center gap-3">
                                <span className="px-3 py-1 bg-primary/5 text-primary text-[10px] font-bold uppercase tracking-widest rounded-lg border border-primary/10">
                                    {article.category}
                                </span>
                                <div className="w-1 h-1 rounded-full bg-outline-variant/30" />
                                <span className="text-[10px] text-on-surface/40 font-bold uppercase tracking-widest flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-[16px]">timer</span>
                                    {article.readTime} min read
                                </span>
                            </div>

                            <h1 className="text-4xl md:text-6xl font-headline font-bold text-on-surface leading-[1.1] tracking-tight">
                                {article.title}
                            </h1>

                            <p className="text-xl md:text-2xl text-on-surface-variant font-medium leading-relaxed max-w-2xl mx-auto italic opacity-70">
                                {article.summary}
                            </p>
                        </div>

                        {article.thumbnail && (
                            <div className="group rounded-[40px] overflow-hidden shadow-2xl shadow-primary/10 border border-outline-variant/10 mb-20 relative">
                                <img src={article.thumbnail} alt="" className="w-full h-auto object-cover max-h-125 group-hover:scale-105 transition-transform duration-[2s]" />
                                <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        )}

                        <div className="prose prose-xl prose-primary max-w-none prose-headings:font-headline prose-headings:font-bold prose-p:text-on-surface/80 prose-p:leading-[1.8] prose-p:mb-8 prose-strong:text-on-surface prose-blockquote:border-primary prose-blockquote:bg-primary/5 prose-blockquote:p-8 prose-blockquote:rounded-3xl prose-blockquote:not-italic">
                            <BlockNoteView editor={editor} editable={false} theme="light" />
                        </div>

                        {/* Completion Logic Feedback */}
                        {!alreadyCompleted && (
                            <div className="mt-24 p-10 md:p-16 bg-surface-container-low rounded-[48px] border border-primary/10 border-dashed text-center relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full -translate-y-20 translate-x-20 blur-3xl" />

                                <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner ring-1 ring-primary/20">
                                    <span className="material-symbols-outlined text-3xl">local_library</span>
                                </div>

                                <h3 className="text-2xl font-headline font-bold text-on-surface mb-2">Deep Learning in Progress</h3>
                                <p className="text-on-surface-variant font-medium mb-10 max-w-sm mx-auto">
                                    Take your time to absorb the knowledge. Completing this will earn you <span className="text-primary font-bold">{article.pointsPerRead} XP</span>.
                                </p>

                                <div className="flex flex-col items-center gap-3">
                                    <div className="flex gap-10 text-[10px] font-bold uppercase tracking-widest text-on-surface/40">
                                        <div className="flex flex-col gap-1 items-center">
                                            <span className={secondsElapsed >= minSecondsRequired ? 'text-emerald-500' : ''}>Focus Time</span>
                                            <div className={`w-2 h-2 rounded-full ${secondsElapsed >= minSecondsRequired ? 'bg-emerald-500' : 'bg-outline-variant/30 animate-pulse'}`} />
                                        </div>
                                    </div>
                                    <div className="w-56 h-1.5 bg-outline-variant/10 rounded-full overflow-hidden mt-2">
                                        <div
                                            className="h-full bg-primary transition-all duration-1000"
                                            style={{ width: `${progressPercent}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {alreadyCompleted && (
                            <div className="mt-24 p-12 md:p-20 text-center space-y-6 bg-emerald-50/50 rounded-[56px] border border-emerald-100 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-linear-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

                                <div className="w-24 h-24 mx-auto relative z-10">
                                    {completionAnim && <Lottie animationData={completionAnim} loop={false} />}
                                </div>

                                <div className="relative z-10">
                                    <h3 className="text-3xl md:text-4xl font-headline font-bold text-emerald-900 tracking-tight">Wisdom Unlocked!</h3>
                                    <p className="text-emerald-800/60 font-medium text-lg max-w-md mx-auto mt-2 leading-relaxed">
                                        You've successfully completed this module. Your understanding of financial concepts is growing!
                                    </p>

                                    <button
                                        onClick={onBack}
                                        className="mt-10 px-10 py-4 bg-emerald-600 text-white rounded-3xl font-bold text-sm shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 hover:shadow-emerald-600/40 transition-all active:scale-95 flex items-center gap-3 mx-auto"
                                    >
                                        Explore Next Topic
                                        <span className="material-symbols-outlined text-[20px]">auto_stories</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="h-40 shrink-0" />
                </div>
            </div>
        </MantineProvider>
    );
};

export default ArticleView;
