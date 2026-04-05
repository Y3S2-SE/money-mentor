import React, { useState, useEffect } from 'react';
import { getAllArticles } from '../../services/articleService';
import { useDispatch } from 'react-redux';
import { addToast } from '../../store/slices/toastSlice';
import Lottie from 'lottie-react';

const ArticleList = ({ onSelectArticle }) => {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [emptyAnim, setEmptyAnim] = useState(null);
    const dispatch = useDispatch();

    useEffect(() => {
        fetchArticles();
        import('../../assets/lottie/bookworm.json').then(data => setEmptyAnim(data.default));
    }, [filter]);

    const fetchArticles = async () => {
        try {
            setLoading(true);
            const params = filter !== 'all' ? { category: filter } : {};
            const res = await getAllArticles(params);
            // Show only published articles to users
            const publishedArticles = res.data.filter(article => article.isPublished === true);
            setArticles(publishedArticles);
        } catch (error) {
            dispatch(addToast({
                type: 'error',
                message: 'Failed to load articles',
                subMessage: 'Please try again later!'
            }));
        } finally {
            setLoading(false);
        }
    };

    const categories = [
        { id: 'all', label: 'All', icon: 'apps' },
        { id: 'budgeting', label: 'Budgeting', icon: 'account_balance_wallet' },
        { id: 'investing', label: 'Investing', icon: 'trending_up' },
        { id: 'saving', label: 'Saving', icon: 'savings' },
        { id: 'debt', label: 'Debt', icon: 'money_off' },
        { id: 'taxes', label: 'Taxes', icon: 'description' },
    ];

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="text-on-surface/40 text-sm font-medium">Fetching articles...</p>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* Standardized Category Filters */}
            <div className="flex gap-2 pb-6 overflow-x-auto scrollbar-hide">
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => setFilter(cat.id)}
                        className={`flex items-center gap-2  px-4 py-2 text-sm font-medium rounded-xl transition-all whitespace-nowrap ${filter === cat.id
                            ? 'bg-[#111c44] text-indigo-100'
                            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
                            }`}
                    >
                        <span className="material-symbols-outlined text-[18px]">{cat.icon}</span>
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* Article Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {articles.length > 0 ? (
                    articles.map((article, i) => (
                        <div
                            key={article._id}
                            onClick={() => onSelectArticle(article)}
                            style={{ animationDelay: `${i * 50}ms` }}
                            className="group relative bg-white rounded-4xl border border-outline-variant/10 overflow-hidden hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 cursor-pointer flex flex-col animate-in slide-in-from-bottom-4 h-full"
                        >
                            {/* Read Status Badge Overlay (No Image) */}
                            {article.isRead && !article.thumbnail && (
                                <div className="absolute top-6 right-6 z-10 w-8 h-8 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-100 shadow-sm animate-in zoom-in group-hover:scale-110 transition-transform">
                                    <span className="material-symbols-outlined text-[16px] font-bold">done_all</span>
                                </div>
                            )}

                            {/* Thumbnail Area */}
                            {article.thumbnail && (
                                <div className="h-48 w-full bg-surface-container-low overflow-hidden relative shrink-0">
                                    {article.isRead && (
                                        <div className="absolute top-4 right-4 z-10 w-10 h-10 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                                            <span className="material-symbols-outlined text-[20px] font-bold">done_all</span>
                                        </div>
                                    )}
                                    <img
                                        src={article.thumbnail}
                                        alt={article.title}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                                    />
                                    <div className="absolute bottom-4 left-4">
                                        <span className="px-3 py-1 bg-white/80 backdrop-blur-md rounded-xl text-[9px] text-on-surface font-bold uppercase tracking-widest border border-white/20 shadow-sm">
                                            {article.category}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Content Info */}
                            <div className={`p-7 flex flex-col flex-1 ${!article.thumbnail ? 'pt-8' : ''}`}>
                                {!article.thumbnail && (
                                    <div className="mb-4 pr-10">
                                        <span className="px-2.5 py-1 bg-surface-container-low text-on-surface-variant font-bold uppercase tracking-widest rounded-lg border border-outline-variant/20 shadow-sm text-[9px]">
                                            {article.category}
                                        </span>
                                    </div>
                                )}
                                <h3 className="font-headline font-bold text-xl text-on-surface mb-3 group-hover:text-primary transition-colors line-clamp-2 leading-tight tracking-tight">
                                    {article.title}
                                </h3>
                                <p className="text-on-surface-variant text-sm mb-8 line-clamp-2 flex-1 leading-relaxed">
                                    {article.summary}
                                </p>

                                <div className="flex items-center justify-between border-t border-outline-variant/10 pt-5 mt-auto">
                                    <div className="flex items-center gap-5 text-[10px] font-bold text-on-surface/30 uppercase tracking-widest">
                                        <div className="flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-[16px]">schedule</span>
                                            {article.readTime} min
                                        </div>
                                        <div className="flex items-center gap-1.5 text-primary">
                                            <span className="material-symbols-outlined text-[16px]">stars</span>
                                            {article.pointsPerRead} XP
                                        </div>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-primary/5 text-primary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform -translate-x-2 group-hover:translate-x-0">
                                        <span className="material-symbols-outlined text-[18px]">trending_flat</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-20 text-center bg-white rounded-[40px] border border-outline-variant/10 shadow-sm border-dashed">
                        <div className="w-24 h-24 mx-auto mb-4">
                            {emptyAnim && <Lottie animationData={emptyAnim} loop={true} />}
                        </div>
                        <h4 className="font-headline font-bold text-lg text-on-surface/60">No articles available</h4>
                        <p className="text-on-surface-variant text-sm mt-1">Try exploring another category!</p>
                    </div>
                )}
            </div>

            <style>{`
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
};

export default ArticleList;
