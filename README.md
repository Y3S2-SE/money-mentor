# MoneyMentor - Gamified Savings Coach for Low-Income Youth

## Project Overview
MoneyMentor is a full-stack web application designed to provide gamified financial literacy coaching specifically for low-income youth. The platform helps young users develop healthy savings habits through interactive challenges, progress tracking, and educational content.

### Tech Stack
- **Backend**: Express.js, Node.js, MongoDB
- **Frontend**: React, Tailwind CSS
- **Deployment**: 
  - Backend: Render
  - Frontend: Vercel

## Team Members
- **[Hiruvinda ](URL)** 
- **[Thimeth Sathmika](URL)** 
- **[Dishan](URL)** 
- **[Ravindu Thiranjaya](URL)** 

##  Core Features
### 1. Income & Expense Tracker
> Developed by Dishan
- Record income and expense transactions
- Categorize spending for better financial analysis
- View transaction history and summaries
- Monitor balance and spending trends

### 2. Gamification Engine
> Developed by Ravindu
- Progress tracking based on user activity
- Achievement and reward system
- Financial goal milestones
- Motivation through engagement mechanics

### 3. Learning Hub
> Developed by Thimeth
- Financial literacy learning modules
- Structured educational content
- Progress-based learning experience
- Knowledge tracking and improvement

### 4. Grouping & Chat Feature
> Developed by Hiruvinda
- Create and manage user groups
- Real-time messaging functionality
- Community-based financial discussions
- Collaborative engagement features

## Project Structure 
Project Structure and File naming convetion
```
MoneyMentor/
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
│   ├── jest.config.js 
│   ├── server.js 
│   ├── app.js
│   └── .env.example
└── frontend/
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
│   └── public/
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
## API Endpoint Documentation

The MoneyMentor REST API is documented and tested using Postman. Click the links below to explore the live API documentation for each module.

| Module | Maintainer | Documentation |
|---|---|---|
| User Authentication | Ravindu | [View Docs →](https://documenter.getpostman.com/view/52326226/2sBXcBmgg3) |
| Income & Expense Tracker | Dishan | [View Docs →](your-postman-link-here) |
| Gamification Engine | Ravindu | [View Docs →](https://documenter.getpostman.com/view/52326226/2sBXcGFfiP) |
| Knowledge Hub | Thimeth | [View Docs →](https://documenter.getpostman.com/view/43108804/2sBXcHhJUQ#6f3f6126-8286-40c6-a695-c8d1c6f27b21) |
| Group & Chat Function | Hiruvinda | [View Docs →](your-postman-link-here) |

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
| GET | `/api/play/leaderboard` | Global XP leaderboard |  User |
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
| Course Model | `course.model.test.js` | Unit | Creation, defaults, question validation, option count, `totalPoints` calculation, completions |
| Chat Model | `chat.model.test.js` | Unit | Creation, defaults, message roles, content trim, keyword storage |
| Youtube Model | `youtube.model.test.js` | Unit | Creation, keyword normalization, video field defaults, staleness logic |
| Validation Middleware | `validation.middleware.test.js` | Unit | Pass, fail, multiple error formatting |
| Auth Endpoints | `auth.integration.test.js` | Integration | Register, login, profile, update, change password, logout |
| Gamification Endpoints | `gamification.integration.test.js` | Integration | Profile, daily login, award XP, leaderboard, badges, admin stats |
| Course Endpoints | `course.integration.test.js` | Integration | Create, list with filters/pagination, get by ID, update, delete, submit & grade, points award, duplicate submission prevention |
| Chat Endpoints | `chat.integration.test.js` | Integration | Start conversation, send message, list chats, get by ID, delete, ownership checks, Gemini mocked |
| YouTube Endpoints | `youtube.integration.test.js` | Integration | Video search, cache hit/miss, staleness check, deduplication, keyword-based fetch |

### Test Environment
Tests use a separate `.env.test` file pointing to a dedicated test database (`moneymentor_test`). The database is dropped and recreated between test suites automatically via `testSetup.js`.
