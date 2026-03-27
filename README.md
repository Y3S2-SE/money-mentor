# MoneyMentor - Gamified Savings Coach for Low-Income Youth

## Project Overview
MoneyMentor is a full-stack web application designed to provide gamified financial literacy coaching specifically for low-income youth. The platform helps young users develop healthy savings habits through interactive challenges, progress tracking, and educational content.

## Tech Stack

### Backend
- **Runtime**: [Node.js](https://nodejs.org/)
- **Framework**: [Express.js v5](https://expressjs.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) *with* [Mongoose](https://mongoosejs.com/)
- **Authentication**: [JSON Web Tokens (JWT)](https://jwt.io/), [bcryptjs](https://github.com/dcodeIO/bcrypt.js)
- **Validation**: [express-validator](https://express-validator.github.io/)
- **Security**: [helmet](https://helmetjs.github.io/), [cors](https://github.com/expressjs/cors), [express-rate-limit](https://github.com/express-rate-limit/express-rate-limit)
- **Real-time**: [ws (WebSocket)](https://github.com/websockets/ws)
- **AI Integration**: [Google Generative AI (Gemini)](https://ai.google.dev/)
- **Testing**: [Jest](https://jestjs.io/), [Supertest](https://github.com/ladjs/supertest)
- **Dev Tools**: [nodemon](https://nodemon.io/), [cross-env](https://github.com/kentcdodds/cross-env)

### Frontend
- **Framework**: [React](https://react.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **State Management**: [Redux Toolkit](https://redux-toolkit.js.org/)
- **HTTP Client**: [Axios](https://axios-http.com/)

### Deployment
- **Backend**: [Render](https://render.com/) — *`render url`*
- **Frontend**: [Vercel](https://vercel.com/) — *`vercel url`*

## Team Members
- **[Hiruvinda ](https://github.com/hiruvindajayashanka2001)** 
- **[Thimeth Sathmika](https://github.com/Thimeth0013)** 
- **[Dishan](https://github.com/Dish-K)** 
- **[Ravindu Thiranjaya](https://github.com/ravindu422)** 

##  Core Features
### 1. Income & Expense Tracker
> Developed by Dishan
- Record and manage income & expense transactions with filtering, pagination and date validation
- Monthly financial dashboard with income, expense, net savings, savings rate and financial health score
- Category breakdown with percentage analysis and 6-month income vs expense trends
- Set and track monthly savings goals with progress monitoring and achievement detection
- AI-powered personalized financial tips using *`Gemini API`*
- Real-time currency conversion with LKR support using *`Fawazahmed0`* Exchange API

### 2. User Authentication
> Core system used across all features
- JWT-based authentication with bcrypt password hashing
- Role-based access control (user / admin) with protected routes
- Profile management with username, email, and password update support
- Input validation with structured field-level error responses

### 3. Gamification Engine
> Developed by Ravindu
- XP-based leveling system with 5 progressive tiers (Money Newbie → Ultimate Saver)
- Daily login streaks with milestone bonuses at 7 and 30 days
- 12 achievement badges across action, milestone, and streak categories
- Friends leaderboard ranked by total XP with personal rank tracking
- XP history log and real-time level progress tracking


### 4. Knowledge Hub
> Developed by Thimeth
- Finance courses with MCQ quizzes and automatic grading (pass at 70%)
- Points awarded on course completion, tracked on user profile
- AI financial advisor chatbot powered by *`Google Gemini`* with persistent conversation history
- YouTube video suggestions generated from chat topics, cached for 7 days to reduce API quota usage

### 4. Group & Chat Feature
> Developed by Hiruvinda

- Create and manage groups, add or remove members, and organise communities around shared financial goals
- Send and receive messages in real time, enabling fluid conversations within groups
- Share achievements, badges, and milestones with group members to encourage peer motivation
- Collaborate on financial discussions and foster a supportive, goal-driven community

## Project Structure 
Project Structure and File naming convetion
```
MoneyMentor/
├── .github/
│   ├── workflow/
│   │   └── backend-test.yaml
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   └── user.controller.js
│   ├── middleware/
│   │   └── auth.middleware.js
│   ├── models/
│   │   └── user.model.js
│   ├── routes/
│   │   └── user.route.js
│   ├── utils/
│   │   └── logger.js
│   ├── validations/
│   │   └── user.validations.js
│   ├── tests/
│   │   ├── setup/
│   │   │    └── testSetup.js
│   │   ├── unit/
│   │   │    ├── middleware/
│   │   │    │     └── validations.middleware.test.js
│   │   │    └── models/
│   │   │         └── user.model.test.js
│   │   └── integration/
│   │        └── auth.integration.test.js
│   ├── websocket/
│   ├── services/
│   ├── seeds/
│   │   └── seedBadges.js
│   ├── jest.config.js 
│   ├── package.json
│   ├── package-lock.json
│   ├── server.js 
│   ├── app.js
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── Dashboard.jsx
│   │   ├── pages/
│   │   │   └── LoginPage.jsx
│   │   ├── context/
│   │   ├── hooks/
│   │   │   └── useAuth.js
│   │   ├── services/
│   │   │   └── apiService.js
│   │   └── App.jsx
│   ├── public/
│   ├── package.json
│   └── package-lock.json
├── .gitignore
└── README.md
```

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local installation or Atlas account)

### Backend Setup
1. Clone the repository
```bash
   git clone https://github.com/Y3S2-SE/money-mentor.git
   cd money-mentor/backend
```

2. Install dependencies
```bash
   npm install
```

3. Configure environment variables
   - Copy `.env.example` to `.env`
   - Add your MongoDB connection string
   - Add other required API keys

4. Run the development server
```bash
   npm run dev
```

### Frontend Setup
1. Navigate to frontend directory
```bash
   cd ../frontend
```

2. Install dependencies
```bash
   npm install
```

3. Configure environment variables
   - Copy `.env.example` to `.env`
   - Add backend API URL

4. Run the development server
```bash
   npm run dev
```

## Development Guidelines

See [**DEVELOPMENT_GUIDELINES.md**](./DEVELOPMENT_GUIDELINES.md) for commit message standards, branch naming conventions, and git workflow.

## API Endpoint Documentation

The MoneyMentor REST API is documented and tested using Postman. Click the links below to explore the live API documentation for each module.

| Module | Maintainer | Documentation |
|---|---|---|
| User Authentication | Ravindu | [View Docs →](https://documenter.getpostman.com/view/52326226/2sBXcBmgg3) |
| Income & Expense Tracker | Dishan | [View Docs →](https://documenter.getpostman.com/view/43514147/2sBXcHhdsu) |
| Gamification Engine | Ravindu | [View Docs →](https://documenter.getpostman.com/view/52326226/2sBXcGFfiP) |
| Knowledge Hub | Thimeth | [View Docs →](https://documenter.getpostman.com/view/43108804/2sBXcHhJUQ#6f3f6126-8286-40c6-a695-c8d1c6f27b21) |
| Group & Chat Function | Hiruvinda | [View Docs →](https://documenter.getpostman.com/view/52186165/2sBXcGDzcJ) |

### Health Check
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/health` | Server & DB status | Public |

### Authentication — `/api/auth`
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register new user | Public |
| POST | `/api/auth/login` | Login user | Public |
| GET | `/api/auth/profile` | Get current user profile |  User |
| PUT | `/api/auth/profile` | Update username / email |  User |
| PUT | `/api/auth/change-password` | Change password |  User |
| POST | `/api/auth/logout` | Logout |  User |

### User Management — `/api/users`
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/users` | Get all users (paginated, searchable) |  Admin |
| GET | `/api/users/:id` | Get user by ID |  Admin |
| DELETE | `/api/users/:id` | Delete user |  Admin |

### Gamification — `/api/play`
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/play/profile` | Get gamification profile |  User |
| POST | `/api/play/daily-login` | Claim daily login XP + streak |  User |
| POST | `/api/play/award-xp` | Award XP for an action |  User |
| GET | `/api/play/leaderboard` | XP leaderboard among friends |  User |
| GET | `/api/play/badges` | All badges with earned status |  User |
| GET | `/api/play/xp-history` | User XP history |  User |
| POST | `/api/play/admin/seed-badges` | Seed badge definitions |  Admin |
| GET | `/api/play/admin/stats` | Platform-wide stats |  Admin |

### Grouping and Chat feature — `/api/group`
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/group/create` | Create new saving group |  User |
| POST | `/api/group/join` | Join saving group |  User |
| POST | `/api/group/leave` | Leave saving group |  User |
| GET | `/api/group/user-groups` | All user joined groups |  User |
| GET | `/api/group/get-group` | Get specific group |  User |
| DELETE | `/api/group/delete` | Delete saving group |  Group Admin |
| POST | `/api/group/remove-member` | Remove member from saving group |  Group Admin |
| PUT | `/api/group/update` | Update saving group details |  Group Admin |
| POST | `/api/group/regenerate-invite` | Regenerate group invite code |  Group Admin |
||
| POST | `/api/chat-room/ticket` | Generate 30s TTL ticket |   |
| GET | `/api/chat-room/:groupId/messages` | get previous message history |   |
| Delete | `/api/chat-room//:groupId/messages/:messageId` | Delete user send message |  User |


### Course — `/api/course`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/course/create` | Create a new course | Admin |
| GET | `/api/course` | Get all published courses with filters, search & pagination | User |
| GET | `/api/course/:id` | Get a single course by ID | User |
| PUT | `/api/course/:id` | Update course details or publish status | Admin |
| DELETE | `/api/course/:id` | Delete a course | Admin |
| POST | `/api/course/:id/submit` | Submit answers, get graded, earn points | User |

### Chat — `/api/chat`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/chat` | Start a new AI conversation | User |
| POST | `/api/chat/:id/message` | Send a message in an existing conversation | User |
| GET | `/api/chat` | Get all conversations for the logged-in user | User |
| GET | `/api/chat/:id` | Get a single conversation with full message history | User |
| DELETE | `/api/chat/:id` | Delete a conversation | User |

### YouTube — `/api/youtube`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/youtube/search?chatId=:id` | Get video suggestions based on a chat's keywords | User |

### Income & Expenses - `/api/transactions`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/transactions` | Create transaction (Income or Expense) | User |
| GET | `/api/transactions` | Get all transactions with filters & pagination (defaul expenses) | User |
| GET | `/api/transactions/:id` | Get single transaction | User |
| PUT | `/api/transactions/:id` | Update transaction (Income or Expense) | User |
| DELETE | `/api/transactions/:id` | Delete transaction (Income or Expense) | User |

### Dashboard Analytics & Saving Goals - `/api/dashboard`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/dashboard/savings-goal` | Set monthly savings goal | User |
| GET | `/api/dashboard/summary` |Get monthly financial summary with health score | User |
| GET | `/api/dashboard/category-breakdown` | Get single transaction | User |
| GET | `/api/dashboard/trends` | Get last 6 months income and expense trends | User |
| GET | `/api/dashboard/insight` |Get AI generated personalized financial tip | User |
| GET | `/api/dashboard/recent-transactions` | Get last 5 transactions | User |
| GET | `/api/dashboard/convert` | Convert currency with LKR support | User |
| GET | `/api/dashboard/savings-goal` | Get current savings goal | User |
| GET | `/api/dashboard/savings-goal-progress` | Track progress toward savings goal | User |
| PUT | `/api/dashboard/savings-goal` | Update savings goal | User |

##  Testing

### Running Tests

```bash
# All tests with coverage
npm test

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# Watch mode
npm run test:watch
```

### Test Coverage Summary

| Test Suite | File | Type | Tests |
|------------|------|------|-------|
| User Model | `user.model.test.js` | Unit | `toAuthJSON`, `comparePassword`, defaults, field assignments |
| Gamification Model | `gamification.model.test.js` | Unit | `getLevelFromXP`, `getTitleForLevel`, `awardXP`, `updateStreak`, `awardBadge`, `levelProgress` virtual |
| Group Model | `group.model.test.js` | Unit | Creation, members, admin ref, invite code, timestamps, CRUD (mocked) |
| Message Model | `message.model.test.js` | Unit | Group reference, sender reference, content, type, readBy array, deletedAt, timestamps, CRUD (mocked) |
| Course Model | `course.model.test.js` | Unit | Creation, defaults, question validation, option count, `totalPoints` calculation, completions |
| Chat Model | `chat.model.test.js` | Unit | Creation, defaults, message roles, content trim, keyword storage |
| Youtube Model | `youtube.model.test.js` | Unit | Creation, keyword normalization, video field defaults, staleness logic |
| Transaction Model | `transaction.model.test.js` | Unit | Required fields, type enum (`income`/`expense`), amount validation (min, negative, zero), defaults, indexes (userId, date, compound) |
| SavingsGoal Model | `savingsGoal.model.test.js` | Unit | Required fields, monthlyGoal validation (min, negative, zero), month format (YYYY-MM), userId ObjectId, compound unique index (userId + month) |
| Dashboard Controller | `dashboard.controller.test.js` | Unit | `getSummary`, `getCategoryBreakdown`, `getMonthlyTrends`, `getFinancialInsight`, `getRecentTransactions`, `convertCurrency` (service mocked) |
| Validation Middleware | `validation.middleware.test.js` | Unit | Pass, fail, multiple error formatting |
| Auth Endpoints | `auth.integration.test.js` | Integration | Register, login, profile, update, change password, logout |
| Gamification Endpoints | `gamification.integration.test.js` | Integration | Profile, daily login, award XP, leaderboard, badges, admin stats |
| Course Endpoints | `course.integration.test.js` | Integration | Create, list with filters/pagination, get by ID, update, delete, submit & grade, points award, duplicate submission prevention |
| Chat Endpoints | `chat.integration.test.js` | Integration | Start conversation, send message, list chats, get by ID, delete, ownership checks, Gemini mocked |
| YouTube Endpoints | `youtube.integration.test.js` | Integration | Video search, cache hit/miss, staleness check, deduplication, keyword-based fetch |
| Group Endpoints | `group.integration.test.js` | Integration | create group, join, leave, get groups details, delete group, remove member, update group, re-generate invite code,  |
| ChatRoom Endpoints | `chatRoom.integration.test.js` | Integration | get WebSocket ticket, get message history (pagination, member access control, soft-delete filtering), delete message (owner, admin, unauthorized) |
| Dashboard Endpoints | `dashboard.integration.test.js` | Integration | Summary (income/expense/savings, user isolation, month filter), category breakdown, monthly trends, recent transactions (limit 5, sort desc), currency conversion, savings goal CRUD (create, get, update, conflict, 404), savings goal progress (achieved, partial, overspend warning) |


### Test Environment
Tests use a separate `.env.test` file pointing to a dedicated test database (`test_db`). The database is dropped and recreated between test suites automatically via `testSetup.js`.
