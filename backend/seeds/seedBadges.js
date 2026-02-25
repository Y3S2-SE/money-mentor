export const BADGE_SEEDS = [
    {
        key: 'first_login',
        name: 'Welcome Aboard!',
        description: 'Logged in for the first time',
        category: 'action',
        xpReward: 25,
        condition: { type: 'action', actionKey: 'first_login' }
    },
    {
        key: 'first_saving_goal',
        name: 'Goal Setter',
        description: 'Created your first saving goal',
        category: 'action',
        xpReward: 40,
        condition: { type: 'action', actionKey: 'first_saving_goal' }
    },
    {
        key: 'first_investment',
        name: 'Investor',
        description: 'Made your first investment',
        category: 'action',
        xpReward: 50,
        condition: { type: 'action', actionKey: 'first_investment' }
    },
    {
        key: 'read_5_articles',
        name: 'Bookworm',
        description: 'Read 5 financial articles',
        category: 'action',
        xpReward: 30,
        condition: { type: 'action', actionKey: 'read_5_articles' }
    },
    {
        key: 'milestone_100xp',
        name: 'Century Club',
        description: 'Earned 100 total XP',
        category: 'milestone',
        xpReward: 10,
        condition: { type: 'xp_total', threshold: 100 }
    },
    {
        key: 'milestone_super_saver',
        name: 'Super Saver',
        description: 'Saved $500 total',
        category: 'milestone',
        xpReward: 30,
        condition: { type: 'xp_total', threshold: 500 }
    },
    {
        key: 'milestone_1000xp',
        name: 'XP Legend',
        description: 'Earned 1000 total XP',
        category: 'milestone',
        xpReward: 75,
        condition: { type: 'xp_total', threshold: 1000 }
    },
    {
        key: 'milestone_level5',
        name: 'Rising Star',
        description: 'Reached Level 5',
        category: 'milestone',
        xpReward: 20,
        condition: { type: 'level', threshold: 5 }
    },
    {
        key: 'milestone_budget_master',
        name: 'Budget Master',
        description: 'Reached Level 10',
        category: 'milestone',
        xpReward: 50,
        condition: { type: 'level', threshold: 10 }
    },
    {
        key: 'streak_3_days',
        name: 'On Fire!',
        description: 'Logged in 3 days in a row',
        category: 'streak',
        xpReward: 15,
        condition: { type: 'streak_days', threshold: 3 }
    },
    {
        key: 'streak_7_days',
        name: 'Week Warrior',
        description: 'Maintained a 7-day streak',
        category: 'streak',
        xpReward: 50,
        condition: { type: 'streak_days', threshold: 7 }
    },
    {
        key: 'streak_30_days',
        name: 'Monthly Legend',
        description: 'Maintained a 30-day streak',
        category: 'streak',
        xpReward: 150,
        condition: { type: 'streak_days', threshold: 30 }
    }
];