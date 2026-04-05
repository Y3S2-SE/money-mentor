import React, { useState, useEffect } from 'react';
import { getAllArticles, deleteArticle, updateArticle } from '../../services/articleService';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import useConfirm from '../../hooks/useConfirm';
import ConfirmWindow from '../ui/ConfirmWindow';

const AdminArticleList = ({ onAddArticle, onEditArticle }) => {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const { confirm, modalProps } = useConfirm();

    useEffect(() => {
        fetchArticles();
    }, []);

    const fetchArticles = async () => {
        try {
            setLoading(true);
            const res = await getAllArticles();
            setArticles(res.data);
        } catch (error) {
            toast.error('Failed to load articles');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id, title) => {
        const confirmed = await confirm({
            title: 'Delete Article?',
            description: `"${title}" will be permanently removed.`,
            confirmLabel: 'Delete',
            cancelLabel: 'Keep',
            variant: 'danger',
        });
        if (!confirmed) return;

        try {
            await deleteArticle(id);
            toast.success('Article deleted');
            setArticles(articles.filter(a => a._id !== id));
        } catch (error) {
            toast.error('Failed to delete article');
        }
    };

    const togglePublish = async (article) => {
        try {
            const newStatus = !article.isPublished;
            await updateArticle(article._id, { isPublished: newStatus });
            toast.success(newStatus ? 'Article published' : 'Article unpublished');
            setArticles(articles.map(a => 
                a._id === article._id ? { ...a, isPublished: newStatus } : a
            ));
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-headline font-bold text-on-surface flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">description</span>
                        Manage Articles
                    </h2>
                    <button
                        onClick={onAddArticle}
                        className="bg-primary text-white px-6 py-2.5 rounded-2xl font-bold text-sm flex items-center gap-2 hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95"
                    >
                        <span className="material-symbols-outlined text-[20px]">add</span>
                        New Article
                    </button>
                </div>

                <div className="bg-white rounded-3xl border border-outline-variant/20 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-surface-bright border-b border-outline-variant/10">
                                    <th className="px-6 py-4 text-[10px] uppercase font-bold tracking-widest text-on-surface/40">Article</th>
                                    <th className="px-6 py-4 text-[10px] uppercase font-bold tracking-widest text-on-surface/40 text-center">Stats</th>
                                    <th className="px-6 py-4 text-[10px] uppercase font-bold tracking-widest text-on-surface/40 text-center">Status</th>
                                    <th className="px-6 py-4 text-[10px] uppercase font-bold tracking-widest text-on-surface/40 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant/10">
                                {articles.length > 0 ? (
                                    articles.map((article) => (
                                        <tr key={article._id} className="hover:bg-surface-bright/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-outline-variant/10 overflow-hidden shrink-0 border border-outline-variant/20">
                                                        {article.thumbnail ? (
                                                            <img src={article.thumbnail} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-on-surface/20">
                                                                <span className="material-symbols-outlined text-[20px]">image</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-sm text-on-surface truncate max-w-[200px] md:max-w-[300px]">
                                                            {article.title}
                                                        </p>
                                                        <p className="text-[10px] text-on-surface/40 uppercase font-bold tracking-widest mt-0.5">
                                                            {article.category} • {format(new Date(article.createdAt || Date.now()), 'MMM d, yyyy')}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col items-center gap-1">
                                                    <div className="flex items-center gap-1 text-[11px] font-bold text-on-surface/60">
                                                        <span className="material-symbols-outlined text-[14px]">auto_stories</span>
                                                        {article.wordCount} words
                                                    </div>
                                                    <div className="flex items-center gap-1 text-[11px] font-bold text-primary">
                                                        <span className="material-symbols-outlined text-[14px]">stars</span>
                                                        {article.pointsPerRead} pts
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-center">
                                                    <button
                                                        onClick={() => togglePublish(article)}
                                                        className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all ${
                                                            article.isPublished
                                                                ? 'bg-green-500/10 text-green-600 border-green-500/20'
                                                                : 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
                                                        }`}
                                                    >
                                                        {article.isPublished ? 'Published' : 'Draft'}
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => onEditArticle(article)}
                                                        className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-sm"
                                                        title="Edit"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">edit</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(article._id, article.title)}
                                                        className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                                        title="Delete"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-16 text-center text-on-surface/40 italic">
                                            No articles created yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <ConfirmWindow {...modalProps} />
        </>
    );
};

export default AdminArticleList;
