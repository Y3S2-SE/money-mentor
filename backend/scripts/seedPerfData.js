import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { writeFileSync, mkdirSync } from 'fs';

dotenv.config({ path: '.env.performance' });

import User from '../models/user.model.js';
import Course from '../models/course.model.js';
import Article from '../models/article.model.js';
import Transaction from '../models/transaction.model.js';
import Group from '../models/group.model.js';
import GamificationProfile from '../models/gamification.model.js';
import BadgeDefinition from '../models/badge.model.js';
import SavingsGoal from '../models/savingsGoal.model.js';

const BADGE_SEEDS = [
  {
    key: 'first_login',
    name: 'First Login',
    description: 'Logged in for the first time',
    category: 'action',
    xpReward: 25,
    condition: { type: 'action', actionKey: 'first_login' },
    isActive: true,
  },
  {
    key: 'streak_7_days',
    name: '7 Day Streak',
    description: 'Logged in 7 days in a row',
    category: 'streak',
    xpReward: 50,
    condition: { type: 'streak_days', threshold: 7 },
    isActive: true,
  },
  {
    key: 'milestone_100xp',
    name: '100 XP Club',
    description: 'Earned 100 total XP',
    category: 'milestone',
    xpReward: 20,
    condition: { type: 'xp_total', threshold: 100 },
    isActive: true,
  },
  {
    key: 'first_saving_goal',
    name: 'Goal Setter',
    description: 'Set your first savings goal',
    category: 'action',
    xpReward: 40,
    condition: { type: 'action', actionKey: 'first_saving_goal' },
    isActive: true,
  },
  {
    key: 'first_investment',
    name: 'First Income',
    description: 'Recorded first income',
    category: 'action',
    xpReward: 30,
    condition: { type: 'action', actionKey: 'first_investment' },
    isActive: true,
  },
  {
    key: 'read_5_articles',
    name: 'Bookworm',
    description: 'Read 5 articles',
    category: 'milestone',
    xpReward: 50,
    condition: { type: 'action', actionKey: 'read_5_articles' },
    isActive: true,
  },
  {
    key: 'streak_30_days',
    name: '30 Day Streak',
    description: 'Logged in 30 days in a row',
    category: 'streak',
    xpReward: 75,
    condition: { type: 'streak_days', threshold: 30 },
    isActive: true,
  },
];

async function seed() {
  const dbTarget = (process.env.PERF_DB_TARGET || "atlas").toLowerCase();
  const selectedUri =
    dbTarget === "docker" ? process.env.MONGODB_DOCKER_URI : process.env.MONGODB_URI;

  if (!selectedUri) {
    const missingVar = dbTarget === "docker" ? "MONGODB_DOCKER_URI" : "MONGODB_URI";
    console.error(
      "Seeding failed: missing " + missingVar + " for PERF_DB_TARGET=" + dbTarget
    );
    process.exit(1);
  }

  await mongoose.connect(selectedUri);
  console.log('Connected to performance DB:', mongoose.connection.name);

  const dbName = mongoose.connection.name.toLowerCase();
  if (!dbName.includes('perf') && !dbName.includes('test')) {
    console.error('ERROR: Refusing to seed non-perf/test database:', dbName);
    process.exit(1);
  }

  await mongoose.connection.dropDatabase();
  console.log('Dropped existing data');

  // ── Badges ─────────────────────────────────────────────────────
  for (const badge of BADGE_SEEDS) {
    await BadgeDefinition.create(badge);
  }
  console.log(`Seeded ${BADGE_SEEDS.length} badges`);

  // ── Admin user ─────────────────────────────────────────────────
  //const adminPassword = await bcrypt.hash('PerfAdmin123!', 10);
  const admin = await User.create({
    username: 'perf_admin',
    email: 'admin@perf.com',
    password: 'PerfAdmin123!',
    role: 'admin',
    isActive: true,
  });
  const adminToken = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
    expiresIn: '24h',
  });
  console.log('Created admin user');

  // ── Regular users ──────────────────────────────────────────────
  const users = [];
  const userTokens = [];

  for (let i = 1; i <= 20; i++) {
    //const password = await bcrypt.hash('PerfUser123!', 10);
    const password = 'PerfUser123!';
    const user = await User.create({
      username: `perf_user_${i}`,
      email: `user${i}@perf.com`,
      password,
      role: 'user',
      isActive: true,
    });
    await GamificationProfile.create({ user: user._id });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '24h',
    });
    users.push(user);
    userTokens.push({
      userId: user._id.toString(),
      token,
      email: `user${i}@perf.com`,
    });
  }
  console.log(`Created ${users.length} regular users`);

  // ── Courses ────────────────────────────────────────────────────
  const courseIds = [];
  const categories = ['budgeting', 'investing', 'saving', 'debt', 'taxes'];
  const difficulties = ['beginner', 'intermediate', 'advanced', 'beginner', 'intermediate'];

  for (let i = 1; i <= 5; i++) {
    const course = await Course.create({
      title: `Performance Test Course ${i} - ${categories[i - 1]}`,
      description: `A course about ${categories[i - 1]} for performance testing`,
      category: categories[i - 1],
      difficulty: difficulties[i - 1],
      createdBy: admin._id,
      isPublished: true,
      passingScore: 70,
      questions: [
        {
          question: 'What is personal budgeting?',
          options: ['Managing your money', 'Spending freely', 'Avoiding banks'],
          correctAnswerIndex: 0,
          explanation: 'Budgeting means managing your money intentionally.',
          points: 10,
        },
        {
          question: 'What is the 50/30/20 rule?',
          options: [
            '50% needs, 30% wants, 20% savings',
            '50% savings, 30% needs, 20% wants',
            '50% wants, 30% needs, 20% savings',
          ],
          correctAnswerIndex: 0,
          explanation: 'Allocate 50% to needs, 30% to wants, and 20% to savings.',
          points: 10,
        },
        {
          question: 'Which of these is a fixed expense?',
          options: ['Groceries', 'Rent', 'Entertainment'],
          correctAnswerIndex: 1,
          explanation: 'Rent stays the same every month.',
          points: 10,
        },
      ],
    });
    courseIds.push(course._id.toString());
  }
  console.log(`Created ${courseIds.length} courses`);

  // ── Articles (no thumbnail — no Cloudinary needed) ─────────────
  const articleIds = [];
  const articleCategories = [
    'budgeting', 'investing', 'saving', 'debt', 'taxes',
    'general', 'budgeting', 'investing', 'saving', 'debt',
  ];
  const sampleContent = {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'Personal finance is the management of your money. Budgeting helps you save more and spend wisely each month. Understanding your income and expenses is the first step toward financial freedom. You should track every dollar that comes in and goes out of your accounts. This habit will help you identify areas where you tend to overspend. Creating a budget allows you to allocate money intentionally toward your goals. The 50/30/20 rule is a popular budgeting method used by many financial advisors.',
          },
        ],
      },
    ],
  };

  for (let i = 1; i <= 10; i++) {
    const article = await Article.create({
      title: `Financial Literacy Article ${i} - ${articleCategories[i - 1]}`,
      summary: `Learn important financial tips about ${articleCategories[i - 1]} in this article.`,
      content: sampleContent,
      category: articleCategories[i - 1],
      difficulty: 'beginner',
      createdBy: admin._id,
      isPublished: true,
      pointsPerRead: 15,
      // No thumbnail field — avoids Cloudinary entirely
    });
    articleIds.push(article._id.toString());
  }
  console.log(`Created ${articleIds.length} articles`);

  // ── Transactions for first 10 users ───────────────────────────
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  for (let u = 0; u < 10; u++) {
    const uid = users[u]._id;
    await Transaction.insertMany([
      { userId: uid, type: 'income', amount: 50000, category: 'Salary', date: new Date(currentYear, currentMonth, 1) },
      { userId: uid, type: 'expense', amount: 15000, category: 'Food', date: new Date(currentYear, currentMonth, 5) },
      { userId: uid, type: 'expense', amount: 10000, category: 'Transport', date: new Date(currentYear, currentMonth, 8) },
      { userId: uid, type: 'expense', amount: 5000, category: 'Utilities', date: new Date(currentYear, currentMonth, 12) },
      { userId: uid, type: 'income', amount: 10000, category: 'Freelance', date: new Date(currentYear, currentMonth, 15) },
      { userId: uid, type: 'expense', amount: 8000, category: 'Shopping', date: new Date(currentYear, currentMonth, 18) },
      // Previous month transactions for trends endpoint
      { userId: uid, type: 'income', amount: 48000, category: 'Salary', date: new Date(currentYear, currentMonth - 1, 1) },
      { userId: uid, type: 'expense', amount: 12000, category: 'Food', date: new Date(currentYear, currentMonth - 1, 10) },
    ]);
  }
  console.log('Created transactions for 10 users');

  // ── Savings goals for first 10 users ──────────────────────────
  const monthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
  for (let u = 0; u < 10; u++) {
    await SavingsGoal.create({
      userId: users[u]._id,
      monthlyGoal: 20000,
      month: monthStr,
    });
  }
  console.log('Created savings goals for 10 users');

  // ── Group with first 5 users ───────────────────────────────────
  const group = await Group.create({
    name: 'Performance Test Group',
    description: 'A savings group for performance testing',
    admin: users[0]._id,
    members: users.slice(0, 5).map(u => u._id),
    maxMembers: 10,
    inviteCode: 'PERFTEST',
  });
  console.log('Created test group');

  // ── Write seed output ──────────────────────────────────────────
  mkdirSync('./tests/performance/reports', { recursive: true });

  const seedData = {
    adminToken,
    adminEmail: 'admin@perf.com',
    adminPassword: 'PerfAdmin123!',
    users: userTokens,
    courseIds,
    articleIds,
    groupId: group._id.toString(),
    groupInviteCode: group.inviteCode,
    baseUrl: 'http://localhost:5081',
    currentMonth: monthStr,
  };

  writeFileSync('./tests/performance/seed-data.json', JSON.stringify(seedData, null, 2));
  console.log('Seed data written to tests/performance/seed-data.json');
  console.log('Summary:');
  console.log(`  Users         : ${users.length}`);
  console.log(`  Courses       : ${courseIds.length}`);
  console.log(`  Articles      : ${articleIds.length}`);
  console.log(`  Transactions  : ${10 * 8} records`);
  console.log(`  Savings Goals : 10 records`);
  console.log(`  Group         : 1 (5 members)`);

  await mongoose.disconnect();
  console.log('\nSeeding complete!');
}

seed().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});