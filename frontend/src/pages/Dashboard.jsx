import { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Plus, LayoutDashboard, Wallet, CalendarDays } from 'lucide-react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Sidebar from '../components/dashboard/Sidebar';
import useSwipeTabs from '../hooks/useSwipeTabs';

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
import TransactionFilters, { MonthCalendarPicker, formatDisplay, CURRENT_MONTH_VALUE } from '../components/transactions/TransactionFilters';
import TransactionList from '../components/transactions/TransactionList';
import TransactionModal from '../components/transactions/TransactionModal';

// Services
import dashboardService from '../services/dashboardService';
import transactionService from '../services/transactionService';

const Dashboard = () => {
    const { user } = useSelector((state) => state.auth);
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedMonth, setSelectedMonth] = useState(CURRENT_MONTH_VALUE);

    // Dashboard state 
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

    // Transaction state 
    const [transactions, setTransactions] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [txLoading, setTxLoading] = useState(false);
    const [filters, setFilters] = useState({ month: CURRENT_MONTH_VALUE, page: 1, limit: 10 });
    const [modalOpen, setModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [calOpen, setCalOpen] = useState(false);
    const monthBtnRef = useRef(null);

    // Fetch dashboard data
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

    // Fetch transactions 
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

    // Initial load 
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

    // Handlers 
    const handleMonthChange = (val) => {
        setSelectedMonth(val);
    };

    const handleCategoryTypeChange = (type) => {
        setCategoryType(type);
        fetchBreakdown(selectedMonth, type);
    };

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
    };

    const handleFilterReset = () => {
        const reset = { month: CURRENT_MONTH_VALUE, page: 1, limit: 10 };
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
        { id: 'overview', label: 'Overview', short: 'Overview', icon: LayoutDashboard },
        { id: 'wallet', label: 'My Wallet', short: 'Wallet', icon: Wallet },
    ];

    const TAB_KEYS = tabs.map(t => t.id);
    const { handleTouchStart, handleTouchEnd } = useSwipeTabs(TAB_KEYS, activeTab, setActiveTab);

    return (
        <Sidebar>
            <div className="flex flex-col h-full min-h-screen bg-surface-bright font-body px-0 sm:px-1">

                {/* ── Page header ── */}
                <div className="bg-surface-bright px-4 sm:px-6 pt-4 sticky top-0 z-20 shrink-0 border-b border-outline-variant/20">
                    <div className="mb-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                            <div>
                                <h1 className="text-xl font-headline font-bold text-on-surface">Dashboard</h1>
                                <p className="text-xs font-body text-on-surface-variant mt-0.5">
                                    Wealth status for {formatDisplay(selectedMonth)}
                                </p>
                            </div>

                            <div className="flex items-center justify-end w-full sm:w-auto mt-3 px-4 sm:mt-0">
                            {/* Add transaction button — visible on both tabs */}
                                <button
                                    onClick={handleOpenAdd}
                                    className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 bg-primary text-on-primary text-xs font-label font-bold uppercase tracking-wider rounded-xl hover:bg-primary/90 transition-colors duration-150 w-full sm:w-auto shadow-sm"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span className="inline">Add Transaction</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-6 border-b border-outline-variant/30 px-2 overflow-x-auto scrollbar-none whitespace-nowrap scroll-smooth snap-x snap-mandatory">
                        {tabs.map(({ id, label, short, icon: Icon }) => (
                            <button
                                key={id}
                                onClick={() => setActiveTab(id)}
                                className={`pb-3 px-2 font-label tracking-widest uppercase text-[11px] font-bold
                                    transition-all relative flex items-center gap-2 shrink-0 snap-start ${
                                    activeTab === id
                                        ? 'text-blue-900'
                                        : 'text-on-surface-variant hover:text-on-surface'
                                    }`}
                            >
                                <Icon strokeWidth={2} className="w-4 h-4" />
                                <span className="hidden sm:inline">{label}</span>
                                <span className="sm:hidden">{short}</span>

                                {activeTab === id && (
                                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-900 rounded-t" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Area */}
                <div
                    className="flex-1 overflow-y-auto p-4 sm:p-6"
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                >
                    <div key={activeTab} style={{ animation: 'tabSlideIn 0.25s cubic-bezier(0.4, 0, 0.2, 1) both' }}>
                        {/* ── OVERVIEW TAB ───────────────────────────────────── */}
                        {activeTab === 'overview' && (
                            <div className="flex flex-col lg:flex-row gap-6">
                                {/* Main content (left/center — 2/3 width) */}
                                <div className="flex-1 min-w-0 space-y-5">

                                    {/* Month Picker */}
                                    <div className="flex flex-col gap-1 w-full sm:w-55 shrink-0 relative z-10 bg-surface-container-lowest rounded-2xl p-4 border border-outline-variant/30">
                                        <label className="text-[10px] font-label text-on-surface-variant font-bold uppercase tracking-wider">Overview Month</label>
                                        <button
                                            ref={monthBtnRef}
                                            type="button"
                                            onClick={() => setCalOpen(p => !p)}
                                            className={`w-full flex items-center gap-2.5 px-4 py-2.25 rounded-xl border
                                                text-sm font-body text-left bg-surface-bright transition-all focus:outline-none shadow-sm
                                                ${calOpen
                                                    ? 'border-primary/40 ring-2 ring-primary/10'
                                                    : 'border-outline-variant/30 hover:border-outline-variant/60'
                                                }`}
                                        >
                                            <CalendarDays
                                                className={`w-4 h-4 shrink-0 transition-colors ${calOpen ? 'text-primary' : 'text-on-surface/35'}`}
                                            />
                                            <span className={`flex-1 truncate font-bold ${calOpen ? 'text-primary' : 'text-on-surface'}`}>
                                                {formatDisplay(selectedMonth)}
                                            </span>
                                            <span className={`material-symbols-outlined pointer-events-none text-[18px] transition-transform duration-200 ${calOpen ? 'rotate-180 text-primary/60' : 'text-on-surface/40'}`}>
                                                expand_more
                                            </span>
                                        </button>

                                        {calOpen && (
                                            <MonthCalendarPicker
                                                value={selectedMonth}
                                                onChange={(val) => handleMonthChange(val)}
                                                onClose={() => setCalOpen(false)}
                                                anchorRef={monthBtnRef}
                                            />
                                        )}
                                    </div>

                                    {/* Mobile: AI Insight Top */}
                                    <div className="block lg:hidden">
                                        <FinancialInsight
                                            insight={insight}
                                            loading={dashLoading.insight}
                                            selectedMonth={selectedMonth}
                                            onRefresh={fetchInsight}
                                        />
                                    </div>

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
                                <div className="w-full lg:w-80 shrink-0 space-y-4">
                                    {/* AI Insight (Desktop) */}
                                    <div className="hidden lg:block">
                                        <FinancialInsight
                                            insight={insight}
                                            loading={dashLoading.insight}
                                            selectedMonth={selectedMonth}
                                            onRefresh={fetchInsight}
                                        />
                                    </div>

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
                        )}

                                {/* ── MY WALLET TAB ──────────────────────────────────── */}
                        {activeTab === 'wallet' && (
                            <div className="space-y-4">
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
            </div>
        </Sidebar>
    );
};

export default Dashboard;