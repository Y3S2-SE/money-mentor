import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Plus, LayoutDashboard, Wallet } from 'lucide-react';
import { format } from 'date-fns';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Sidebar from '../components/dashboard/Sidebar';

// Dashboard components
import SummaryCards from '../components/dashboard/SummaryCards';
import MonthlyFlow from '../components/dashboard/MonthlyFlow';
import MonthlyTrendsChart from '../components/dashboard/MonthlyTrendsChart';
import CategoryBreakdown from '../components/dashboard/CategoryBreakdown';
import FinancialInsight from '../components/dashboard/FinancialInsight';
import SavingsGoalWidget from '../components/dashboard/SavingsGoalWidget';
import RecentTransactions from '../components/dashboard/RecentTransactions';
import CurrencyConverter from '../components/dashboard/CurrencyConverter';

// Transaction components
import TransactionFilters from '../components/transactions/TransactionFilters';
import TransactionList from '../components/transactions/TransactionList';
import TransactionModal from '../components/transactions/TransactionModal';

// Services
import dashboardService from '../services/dashboardService';
import transactionService from '../services/transactionService';

const getCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const formatMonthLabel = (month) => {
    try {
        const [year, mon] = month.split('-');
        return format(new Date(year, mon - 1, 1), 'MMMM yyyy');
    } catch {
        return month;
    }
};

const Dashboard = () => {
    const { user } = useSelector((state) => state.auth);
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());

    // ── Dashboard state ──────────────────────────────────────────
    const [summary, setSummary] = useState(null);
    const [categoryBreakdown, setCategoryBreakdown] = useState(null);
    const [categoryType, setCategoryType] = useState('expense');
    const [trends, setTrends] = useState([]);
    const [insight, setInsight] = useState(null);
    const [recentTransactions, setRecentTransactions] = useState([]);
    const [savingsGoalProgress, setSavingsGoalProgress] = useState(null);

    const [dashLoading, setDashLoading] = useState({
        summary: true,
        breakdown: true,
        trends: true,
        insight: true,
        recent: true,
        savings: true,
    });

    // ── Transaction state ─────────────────────────────────────────
    const [transactions, setTransactions] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [txLoading, setTxLoading] = useState(false);
    const [filters, setFilters] = useState({ month: getCurrentMonth(), page: 1, limit: 10 });
    const [modalOpen, setModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);

    // ── Fetch dashboard data ──────────────────────────────────────
    const fetchSummary = useCallback(async (month) => {
        setDashLoading((prev) => ({ ...prev, summary: true }));
        try {
            const res = await dashboardService.getSummary(month);
            setSummary(res.data);
        } catch (err) {
            console.error('Failed to fetch summary', err);
        } finally {
            setDashLoading((prev) => ({ ...prev, summary: false }));
        }
    }, []);

    const fetchBreakdown = useCallback(async (month, type = 'expense') => {
        setDashLoading((prev) => ({ ...prev, breakdown: true }));
        try {
            const res = await dashboardService.getCategoryBreakdown(month, type);
            setCategoryBreakdown(res.data);
        } catch (err) {
            console.error('Failed to fetch breakdown', err);
        } finally {
            setDashLoading((prev) => ({ ...prev, breakdown: false }));
        }
    }, []);

    const fetchTrends = useCallback(async () => {
        setDashLoading((prev) => ({ ...prev, trends: true }));
        try {
            const res = await dashboardService.getMonthlyTrends();
            setTrends(res.data);
        } catch (err) {
            console.error('Failed to fetch trends', err);
        } finally {
            setDashLoading((prev) => ({ ...prev, trends: false }));
        }
    }, []);

    const fetchInsight = useCallback(async (month) => {
        setDashLoading((prev) => ({ ...prev, insight: true }));
        try {
            const res = await dashboardService.getFinancialInsight(month);
            setInsight(res.data);
        } catch (err) {
            console.error('Failed to fetch insight', err);
        } finally {
            setDashLoading((prev) => ({ ...prev, insight: false }));
        }
    }, []);

    const fetchRecentTransactions = useCallback(async () => {
        setDashLoading((prev) => ({ ...prev, recent: true }));
        try {
            const res = await dashboardService.getRecentTransactions();
            setRecentTransactions(res.data);
        } catch (err) {
            console.error('Failed to fetch recent transactions', err);
        } finally {
            setDashLoading((prev) => ({ ...prev, recent: false }));
        }
    }, []);

    const fetchSavingsGoalProgress = useCallback(async (month) => {
        setDashLoading((prev) => ({ ...prev, savings: true }));
        try {
            const res = await dashboardService.getSavingsGoalProgress(month);
            setSavingsGoalProgress(res.data);
        } catch (err) {
            // 404 means no goal set — not an error
            if (err.response?.status !== 404) {
                console.error('Failed to fetch savings goal', err);
            }
            setSavingsGoalProgress(null);
        } finally {
            setDashLoading((prev) => ({ ...prev, savings: false }));
        }
    }, []);

    // ── Fetch transactions ────────────────────────────────────────
    const fetchTransactions = useCallback(async (overrideFilters = null) => {
        const activeFilters = overrideFilters || filters;
        setTxLoading(true);
        try {
            const res = await transactionService.getTransactions(activeFilters);
            setTransactions(res.data);
            setPagination(res.pagination);
        } catch (err) {
            console.error('Failed to fetch transactions', err);
        } finally {
            setTxLoading(false);
        }
    }, [filters]);

    // ── Initial load ──────────────────────────────────────────────
    useEffect(() => {
        fetchSummary(selectedMonth);
        fetchBreakdown(selectedMonth, categoryType);
        fetchTrends();
        fetchInsight(selectedMonth);
        fetchRecentTransactions();
        fetchSavingsGoalProgress(selectedMonth);
    }, [selectedMonth]);

    useEffect(() => {
        if (activeTab === 'wallet') {
            fetchTransactions();
        }
    }, [activeTab, filters]);

    // ── Handlers ──────────────────────────────────────────────────
    const handleMonthChange = (e) => {
        setSelectedMonth(e.target.value);
    };

    const handleCategoryTypeChange = (type) => {
        setCategoryType(type);
        fetchBreakdown(selectedMonth, type);
    };

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
    };

    const handleFilterReset = () => {
        const reset = { month: getCurrentMonth(), page: 1, limit: 10 };
        setFilters(reset);
    };

    const handlePageChange = (page) => {
        const updated = { ...filters, page };
        setFilters(updated);
        fetchTransactions(updated);
    };

    const handleTransactionSuccess = () => {
        fetchTransactions();
        // Also refresh dashboard widgets
        fetchSummary(selectedMonth);
        fetchRecentTransactions();
        fetchSavingsGoalProgress(selectedMonth);
        fetchBreakdown(selectedMonth, categoryType);
    };

    const handleGoalUpdated = () => {
        fetchSavingsGoalProgress(selectedMonth);
    };

    const handleEditTransaction = (tx) => {
        setEditingTransaction(tx);
        setModalOpen(true);
    };

    const handleOpenAdd = () => {
        setEditingTransaction(null);
        setModalOpen(true);
    };

    const tabs = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'wallet', label: 'My Wallet', icon: Wallet },
    ];

    return (
        <Sidebar>
            <div className="min-h-screen bg-gray-50">
                {/* Page header */}
                <div className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-20">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
                            <p className="text-xs text-gray-400 mt-0.5">
                                Wealth status for {formatMonthLabel(selectedMonth)}
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Month picker */}
                            <input
                                type="month"
                                value={selectedMonth}
                                onChange={handleMonthChange}
                                max={getCurrentMonth()}
                                className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-950/20 focus:border-blue-950"
                            />

                            {/* Add transaction button — visible on both tabs */}
                            <button
                                onClick={handleOpenAdd}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-950 text-white text-sm font-medium rounded-xl hover:bg-blue-900 transition-colors duration-150"
                            >
                                <Plus className="w-4 h-4" />
                                <span className="hidden sm:inline">Add Transaction</span>
                            </button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-1 mt-4">
                        {tabs.map(({ id, label, icon: Icon }) => (
                            <button
                                key={id}
                                onClick={() => setActiveTab(id)}
                                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all duration-150 ${
                                    activeTab === id
                                        ? 'bg-blue-950 text-white'
                                        : 'text-gray-500 hover:bg-gray-100'
                                }`}
                            >
                                <Icon className="w-4 h-4" />
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── OVERVIEW TAB ───────────────────────────────────── */}
                {activeTab === 'overview' && (
                    <div className="p-6">
                        <div className="flex gap-6">
                            {/* Main content (left/center — 2/3 width) */}
                            <div className="flex-1 min-w-0 space-y-5">
                                {/* Summary cards */}
                                <SummaryCards
                                    summary={summary}
                                    loading={dashLoading.summary}
                                />

                                {/* Monthly flow */}
                                <MonthlyFlow
                                    summary={summary}
                                    categoryBreakdown={categoryBreakdown}
                                    loading={dashLoading.summary}
                                />

                                {/* Trends chart */}
                                <MonthlyTrendsChart
                                    trends={trends}
                                    loading={dashLoading.trends}
                                />

                                {/* Category breakdown */}
                                <CategoryBreakdown
                                    breakdown={categoryBreakdown}
                                    loading={dashLoading.breakdown}
                                    onTypeChange={handleCategoryTypeChange}
                                />
                            </div>

                            {/* Right panel (1/3 width) */}
                            <div className="w-80 shrink-0 space-y-4">
                                {/* AI Insight */}
                                <FinancialInsight
                                    insight={insight}
                                    loading={dashLoading.insight}
                                    selectedMonth={selectedMonth}
                                    onRefresh={fetchInsight}
                                />

                                {/* Savings goal */}
                                <SavingsGoalWidget
                                    progress={savingsGoalProgress}
                                    loading={dashLoading.savings}
                                    selectedMonth={selectedMonth}
                                    onGoalUpdated={handleGoalUpdated}
                                />

                                {/* Recent transactions */}
                                <RecentTransactions
                                    transactions={recentTransactions}
                                    loading={dashLoading.recent}
                                />

                                {/* Currency converter */}
                                <CurrencyConverter />
                            </div>
                        </div>
                    </div>
                )}

                {/* ── MY WALLET TAB ──────────────────────────────────── */}
                {activeTab === 'wallet' && (
                    <div className="p-6 space-y-4">
                        {/* Filters */}
                        <TransactionFilters
                            filters={filters}
                            onChange={handleFilterChange}
                            onReset={handleFilterReset}
                        />

                        {/* Transaction list */}
                        <TransactionList
                            transactions={transactions}
                            pagination={pagination}
                            loading={txLoading}
                            onEdit={handleEditTransaction}
                            onRefresh={handlePageChange}
                        />
                    </div>
                )}
            </div>

            {/* Transaction modal */}
            <TransactionModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                transaction={editingTransaction}
                onSuccess={handleTransactionSuccess}
            />

            <ToastContainer
                position="bottom-right"
                autoClose={3000}
                hideProgressBar={false}
                closeOnClick
                pauseOnHover
                theme="light"
                toastClassName="text-sm"
            />
        </Sidebar>
    );
};

export default Dashboard;