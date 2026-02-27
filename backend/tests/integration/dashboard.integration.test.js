import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../../app.js';
import Transaction from '../../models/transaction.model.js';
import SavingsGoal from '../../models/savingsGoal.model.js';
import { setupTestDB, teardownTestDB, clearTestDB } from '../setup/testSetup.js';

describe('Dashboard Integration Tests', () => {
  let userToken;
  let userId;

  // ─── Current month helper ────────────────────────────────────────────────
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // ─── DB lifecycle ─────────────────────────────────────────────────────────
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();

    // Register and capture token + userId
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'dashuser', email: 'dashuser@test.com', password: 'Test123!' });

    userToken = res.body.data.token;
    userId = res.body.data.user.id;
  });

  // ─── Seed helpers ─────────────────────────────────────────────────────────
  const seedTransactions = async (overrides = []) => {
    const defaults = [
      { userId, type: 'income',  amount: 50000, category: 'Salary',    date: new Date() },
      { userId, type: 'expense', amount: 15000, category: 'Food',       date: new Date() },
      { userId, type: 'expense', amount: 10000, category: 'Transport',  date: new Date() },
      { userId, type: 'expense', amount: 5000,  category: 'Utilities',  date: new Date() },
    ];
    await Transaction.insertMany([...defaults, ...overrides]);
  };

  const seedSavingsGoal = async (monthlyGoal = 20000, month = currentMonth) => {
    await SavingsGoal.create({ userId, monthlyGoal, month });
  };

  // ───────────────────────────────────────────────────────────────────────────
  // GET /api/dashboard/summary
  // ───────────────────────────────────────────────────────────────────────────
  describe('GET /api/dashboard/summary', () => {
    it('should return 200 with correct income, expense and savings for current month', async () => {
      await seedTransactions();

      const res = await request(app)
        .get('/api/dashboard/summary')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.totalIncome).toBe(50000);
      expect(res.body.data.totalExpense).toBe(30000);
      expect(res.body.data.netSavings).toBe(20000);
      expect(res.body.data.savingsRate).toBe(40);
      expect(res.body.data.period).toBe(currentMonth);
    });

    it('should return zeros when user has no transactions', async () => {
      const res = await request(app)
        .get('/api/dashboard/summary')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body.data.totalIncome).toBe(0);
      expect(res.body.data.totalExpense).toBe(0);
      expect(res.body.data.netSavings).toBe(0);
      expect(res.body.data.savingsRate).toBe(0);
    });

    it('should return a spendingWarning when expenses exceed income', async () => {
      await Transaction.insertMany([
        { userId, type: 'income',  amount: 5000,  category: 'Salary', date: new Date() },
        { userId, type: 'expense', amount: 10000, category: 'Food',   date: new Date() },
      ]);

      const res = await request(app)
        .get('/api/dashboard/summary')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body.data.spendingWarning).not.toBeNull();
      expect(res.body.data.netSavings).toBeLessThan(0);
    });

    it('should filter by ?month= query param', async () => {
      await Transaction.insertMany([
        { userId, type: 'income', amount: 30000, category: 'Salary', date: new Date('2024-03-15') },
      ]);

      const res = await request(app)
        .get('/api/dashboard/summary?month=2024-03')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body.data.totalIncome).toBe(30000);
      expect(res.body.data.period).toBe('2024-03');
    });

    it('should only include current user transactions (user isolation)', async () => {
      // Register a second user and seed their transactions
      const otherRes = await request(app)
        .post('/api/auth/register')
        .send({ username: 'otheruser', email: 'other@test.com', password: 'Test123!' });
      const otherUserId = otherRes.body.data.user.id;

      await Transaction.insertMany([
        { userId,      type: 'income', amount: 50000, category: 'Salary', date: new Date() },
        { userId: otherUserId, type: 'income', amount: 99999, category: 'Salary', date: new Date() },
      ]);

      const res = await request(app)
        .get('/api/dashboard/summary')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body.data.totalIncome).toBe(50000);
    });

    it('should return 401 without a token', async () => {
      await request(app)
        .get('/api/dashboard/summary')
        .expect(401);
    });

    it('should return 400 for invalid month format', async () => {
      await request(app)
        .get('/api/dashboard/summary?month=January-2024')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(400);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // GET /api/dashboard/category-breakdown
  // ───────────────────────────────────────────────────────────────────────────
  describe('GET /api/dashboard/category-breakdown', () => {
    it('should return expense breakdown with correct percentages', async () => {
      await seedTransactions();

      const res = await request(app)
        .get('/api/dashboard/category-breakdown')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.breakdown)).toBe(true);
      expect(res.body.data.type).toBe('expense');

      const food = res.body.data.breakdown.find(b => b.category === 'Food');
      expect(food).toBeDefined();
      expect(food.percentage).toBeCloseTo(50, 1); // 15000/30000 = 50%
    });

    it('should return income breakdown when ?type=income', async () => {
      await seedTransactions();

      const res = await request(app)
        .get('/api/dashboard/category-breakdown?type=income')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body.data.type).toBe('income');
      expect(res.body.data.breakdown[0].category).toBe('Salary');
      expect(res.body.data.breakdown[0].percentage).toBe(100);
    });

    it('should return empty breakdown when no transactions exist', async () => {
      const res = await request(app)
        .get('/api/dashboard/category-breakdown')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body.data.breakdown).toHaveLength(0);
    });

    it('should return 400 for invalid type value', async () => {
      await request(app)
        .get('/api/dashboard/category-breakdown?type=savings')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(400);
    });

    it('should return 401 without a token', async () => {
      await request(app)
        .get('/api/dashboard/category-breakdown')
        .expect(401);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // GET /api/dashboard/trends
  // ───────────────────────────────────────────────────────────────────────────
  describe('GET /api/dashboard/trends', () => {
    it('should return monthly trends for last 6 months', async () => {
      await Transaction.insertMany([
        { userId, type: 'income',  amount: 50000, category: 'Salary', date: new Date() },
        { userId, type: 'expense', amount: 20000, category: 'Food',   date: new Date() },
      ]);

      const res = await request(app)
        .get('/api/dashboard/trends')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);

      const currentEntry = res.body.data.find(t => t.month === currentMonth);
      expect(currentEntry).toBeDefined();
      expect(currentEntry.income).toBe(50000);
      expect(currentEntry.expense).toBe(20000);
      expect(currentEntry.savings).toBe(30000);
    });

    it('should return empty array when user has no transactions', async () => {
      const res = await request(app)
        .get('/api/dashboard/trends')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body.data).toHaveLength(0);
    });

    it('should return 401 without a token', async () => {
      await request(app)
        .get('/api/dashboard/trends')
        .expect(401);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // GET /api/dashboard/recent-transactions
  // ───────────────────────────────────────────────────────────────────────────
  describe('GET /api/dashboard/recent-transactions', () => {
    it('should return at most 5 most recent transactions', async () => {
      // Insert 7 transactions
      await Transaction.insertMany(
        Array.from({ length: 7 }, (_, i) => ({
          userId,
          type: 'expense',
          amount: 1000 * (i + 1),
          category: 'Food',
          date: new Date(Date.now() - i * 86400000), // each 1 day apart
        }))
      );

      const res = await request(app)
        .get('/api/dashboard/recent-transactions')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeLessThanOrEqual(5);
    });

    it('should return transactions sorted by date descending', async () => {
      await Transaction.insertMany([
        { userId, type: 'expense', amount: 1000, category: 'Food',      date: new Date('2024-01-01') },
        { userId, type: 'income',  amount: 5000, category: 'Salary',    date: new Date('2024-01-15') },
        { userId, type: 'expense', amount: 2000, category: 'Transport', date: new Date('2024-01-10') },
      ]);

      const res = await request(app)
        .get('/api/dashboard/recent-transactions')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const dates = res.body.data.map(t => new Date(t.date).getTime());
      expect(dates[0]).toBeGreaterThanOrEqual(dates[1]);
    });

    it('should return empty array when user has no transactions', async () => {
      const res = await request(app)
        .get('/api/dashboard/recent-transactions')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body.data).toHaveLength(0);
    });

    it('should only return transactions for the authenticated user', async () => {
      const otherRes = await request(app)
        .post('/api/auth/register')
        .send({ username: 'other2', email: 'other2@test.com', password: 'Test123!' });
      const otherUserId = otherRes.body.data.user.id;

      await Transaction.insertMany([
        { userId,        type: 'income',  amount: 5000, category: 'Salary', date: new Date() },
        { userId: otherUserId, type: 'income', amount: 9999, category: 'Salary', date: new Date() },
      ]);

      const res = await request(app)
        .get('/api/dashboard/recent-transactions')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body.data.every(t => t.userId.toString() === userId.toString())).toBe(true);
    });

    it('should return 401 without a token', async () => {
      await request(app)
        .get('/api/dashboard/recent-transactions')
        .expect(401);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // GET /api/dashboard/convert
  // ───────────────────────────────────────────────────────────────────────────
  describe('GET /api/dashboard/convert', () => {
    it('should convert LKR to USD successfully', async () => {
      const res = await request(app)
        .get('/api/dashboard/convert?amount=10000&from=LKR&to=USD')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.from).toBe('LKR');
      expect(res.body.data.to).toBe('USD');
      expect(res.body.data.amount).toBe(10000);
      expect(res.body.data.convertedAmount).toBeGreaterThan(0);
      expect(res.body.data.rate).toBeGreaterThan(0);
    });

    it('should use LKR and USD as defaults when from/to are omitted', async () => {
      const res = await request(app)
        .get('/api/dashboard/convert?amount=5000')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body.data.from).toBe('LKR');
      expect(res.body.data.to).toBe('USD');
    });

    it('should return 400 when amount is missing', async () => {
      await request(app)
        .get('/api/dashboard/convert')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(400);
    });

    it('should return 400 when amount is 0 or negative', async () => {
      await request(app)
        .get('/api/dashboard/convert?amount=-100')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(400);
    });

    it('should return 400 for invalid currency code length', async () => {
      await request(app)
        .get('/api/dashboard/convert?amount=100&from=LKRR&to=USD')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(400);
    });

    it('should return 401 without a token', async () => {
      await request(app)
        .get('/api/dashboard/convert?amount=1000')
        .expect(401);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // POST /api/dashboard/savings-goal
  // ───────────────────────────────────────────────────────────────────────────
  describe('POST /api/dashboard/savings-goal', () => {
    it('should create a savings goal and return 201', async () => {
      const res = await request(app)
        .post('/api/dashboard/savings-goal')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ monthlyGoal: 20000, month: currentMonth })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.monthlyGoal).toBe(20000);
      expect(res.body.data.month).toBe(currentMonth);
    });

    it('should default month to current month when not provided', async () => {
      const res = await request(app)
        .post('/api/dashboard/savings-goal')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ monthlyGoal: 15000 })
        .expect(201);

      expect(res.body.data.month).toBe(currentMonth);
    });

    it('should return 409 when a goal already exists for the month', async () => {
      await seedSavingsGoal();

      await request(app)
        .post('/api/dashboard/savings-goal')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ monthlyGoal: 20000, month: currentMonth })
        .expect(409);
    });

    it('should return 400 when monthlyGoal is missing', async () => {
      await request(app)
        .post('/api/dashboard/savings-goal')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ month: currentMonth })
        .expect(400);
    });

    it('should return 400 when monthlyGoal is 0 or negative', async () => {
      await request(app)
        .post('/api/dashboard/savings-goal')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ monthlyGoal: -500, month: currentMonth })
        .expect(400);
    });

    it('should return 400 for invalid month format', async () => {
      await request(app)
        .post('/api/dashboard/savings-goal')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ monthlyGoal: 20000, month: 'Jan-2024' })
        .expect(400);
    });

    it('should return 401 without a token', async () => {
      await request(app)
        .post('/api/dashboard/savings-goal')
        .send({ monthlyGoal: 20000 })
        .expect(401);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // GET /api/dashboard/savings-goal
  // ───────────────────────────────────────────────────────────────────────────
  describe('GET /api/dashboard/savings-goal', () => {
    it('should return the savings goal for current month', async () => {
      await seedSavingsGoal(20000);

      const res = await request(app)
        .get('/api/dashboard/savings-goal')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.monthlyGoal).toBe(20000);
      expect(res.body.data.month).toBe(currentMonth);
    });

    it('should return goal for a specific month via ?month= param', async () => {
      await SavingsGoal.create({ userId, monthlyGoal: 10000, month: '2024-03' });

      const res = await request(app)
        .get('/api/dashboard/savings-goal?month=2024-03')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body.data.monthlyGoal).toBe(10000);
      expect(res.body.data.month).toBe('2024-03');
    });

    it('should return 404 when no goal exists for the month', async () => {
      await request(app)
        .get('/api/dashboard/savings-goal')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);
    });

    it('should return 401 without a token', async () => {
      await request(app)
        .get('/api/dashboard/savings-goal')
        .expect(401);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // PUT /api/dashboard/savings-goal
  // ───────────────────────────────────────────────────────────────────────────
  describe('PUT /api/dashboard/savings-goal', () => {
    it('should update an existing savings goal and return 200', async () => {
      await seedSavingsGoal(20000);

      const res = await request(app)
        .put('/api/dashboard/savings-goal')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ monthlyGoal: 35000, month: currentMonth })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.monthlyGoal).toBe(35000);
    });

    it('should return 404 when trying to update a non-existent goal', async () => {
      await request(app)
        .put('/api/dashboard/savings-goal')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ monthlyGoal: 35000, month: currentMonth })
        .expect(404);
    });

    it('should return 400 when monthlyGoal is missing', async () => {
      await request(app)
        .put('/api/dashboard/savings-goal')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ month: currentMonth })
        .expect(400);
    });

    it('should return 400 when monthlyGoal is negative', async () => {
      await request(app)
        .put('/api/dashboard/savings-goal')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ monthlyGoal: -1000, month: currentMonth })
        .expect(400);
    });

    it('should return 401 without a token', async () => {
      await request(app)
        .put('/api/dashboard/savings-goal')
        .send({ monthlyGoal: 35000 })
        .expect(401);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // GET /api/dashboard/savings-goal-progress
  // ───────────────────────────────────────────────────────────────────────────
  describe('GET /api/dashboard/savings-goal-progress', () => {
    it('should return progress when goal and transactions exist', async () => {
      await seedSavingsGoal(20000);
      await seedTransactions();

      const res = await request(app)
        .get('/api/dashboard/savings-goal-progress')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.goal).toBe(20000);
      expect(res.body.data.saved).toBe(20000); // 50000 income - 30000 expense
      expect(res.body.data.achieved).toBe(true);
      expect(res.body.data.percentage).toBe(100);
      expect(res.body.data.remaining).toBe(0);
    });

    it('should return partial progress when savings are below goal', async () => {
      await seedSavingsGoal(50000);
      await seedTransactions(); // saves 20000

      const res = await request(app)
        .get('/api/dashboard/savings-goal-progress')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body.data.achieved).toBe(false);
      expect(res.body.data.percentage).toBe(40); // 20000/50000
      expect(res.body.data.remaining).toBe(30000);
    });

    it('should return warning when spending exceeds income', async () => {
      await seedSavingsGoal(20000);
      await Transaction.insertMany([
        { userId, type: 'income',  amount: 5000,  category: 'Salary', date: new Date() },
        { userId, type: 'expense', amount: 10000, category: 'Food',   date: new Date() },
      ]);

      const res = await request(app)
        .get('/api/dashboard/savings-goal-progress')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body.data.saved).toBeLessThan(0);
      expect(res.body.data.percentage).toBe(0);
      expect(res.body.data.warning).toMatch(/spending more than you earn/);
    });

    it('should return 404 when no savings goal is set', async () => {
      await request(app)
        .get('/api/dashboard/savings-goal-progress')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);
    });

    it('should return 401 without a token', async () => {
      await request(app)
        .get('/api/dashboard/savings-goal-progress')
        .expect(401);
    });
  });
});