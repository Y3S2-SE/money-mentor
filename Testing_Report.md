## Testing Report for Unit, Integration and Performance Testings

### 1. Complete Tests Execution (Unit + Integration)
```bash
   # change the directory to backend
      cd backend

   # Run all unit tests with coverage
      npm run test
```

**Reports generated in** `backend/coverage` **directory with HTML visualization at** `coverage/lcov-report/index.html`

---

### 2. Unit Tests

#### **Running Unit Tests**
   ```bash
   # change the directory to backend
      cd backend

   # Run all unit tests with coverage
      npm run test:unit

   # Run specific test file
      npm run test .tests/unit/models/course.model.test.js
   ```
---

### 3. Integration Tests

#### **Running Integration Tests**
```bash
# change the directory to backend
   cd backend

# Run specific integration test with coverage
   npm run test:integration 
```

#### **Integration Test Setup**
- **Database:** Test database runs on MongoDB (separate from production)
- **Environment:** Uses .env.test configuration
- **Isolation:** Database auto-resets between test suites via jest.setup.js
- **API Testing:** Uses Supertest for HTTP assertions

#### **Test Coverage by Module**
- **Authentication:** Register, login, profile management, password changes
- **Gamification:** XP system, daily streaks, leaderboard, badges
- **Transactions:** Income/expense CRUD, filtering, pagination
- **Courses:** Create, update, submit, automatic grading
- **Chat:** Conversation management, message persistence
- **Groups:** Creation, membership, real-time messaging
- **Dashboard:** Analytics, savings goals, currency conversion

#### **Testing Environment Configuration**
- .env.test File in backend directory

```bash
   NODE_ENV=test
   PORT=5085
   MONGODB_URI=mongodb://localhost:27017/test_db
   JWT_SECRET=test_secret_key_12345
   JWT_EXPIRE=1h
   ALLOWED_ORIGINS=http://localhost:5173
```
#### **Jest Configuration**
 - Key settings in jest.config.js:
   - Test Environment: Node
   - Test Timeout: 10000ms for integration tests
   - Coverage Paths: All files except node_modules and tests
   - Setup File: jest.setup.js handles database setup/teardown

### 4. CI/CD Pipeline
- **Automated testing runs on GitHub Actions (`backend-test.yaml`):**
- **Triggered on push to main and pull requests**
- **Runs all unit tests with coverage report**
- **Fails if any unit test unable to pass.**

---

### 5. Test Coverage Summary

#### i. Unit Tests — Models

| Test Suite | File | Type | Tests |
|------------|------|------|-------|
| Article Model | `article.model.test.js` | Unit | Default values, schema validation, wordCount & readTime auto-calculation, completions, anti-gaming logic, ObjectId |
| Chat Model | `chat.model.test.js` | Unit | Creation, defaults, message roles, content trim, keyword storage |
| Course Model | `course.model.test.js` | Unit | Creation, defaults, question validation, option count, `totalPoints` calculation, completions |
| Gamification Model | `gamification.model.test.js` | Unit | `getLevelFromXP`, `getTitleForLevel`, `awardXP`, `updateStreak`, `awardBadge`, `levelProgress` virtual |
| Group Model | `group.model.test.js` | Unit | Creation, members, admin ref, invite code, timestamps, validation |
| Message Model | `message.model.test.js` | Unit | Group reference, sender reference, content, type, readBy array, deletedAt, timestamps |
| SavingsGoal Model | `savingsGoal.model.test.js` | Unit | Required fields, monthlyGoal validation (min, negative, zero), month format (YYYY-MM), userId ObjectId, compound unique index (userId + month) |
| Transaction Model | `transaction.model.test.js` | Unit | Required fields, type enum (`income`/`expense`), amount validation (min, negative, zero), defaults, indexes (userId, date, compound) |
| User Model | `user.model.test.js` | Unit | `toAuthJSON`, `comparePassword`, defaults, field assignments |
| Youtube Model | `youtube.model.test.js` | Unit | Creation, keyword normalization, video field defaults, staleness logic |

#### ii. Unit Tests — Controllers

| Test Suite | File | Type | Tests |
|------------|------|------|-------|
| Article Controller | `article.controller.test.js` | Unit | `createArticle`, `getAllArticles`, `getArticleById`, `deleteArticle`, `getUserReadPoints` (model mocked) |
| Auth Controller | `auth.controller.test.js` | Unit | `register`, `login`, `getProfile`, `updateProfile`, `changePassword`, `logout` (model mocked) |
| Chat Controller | `chat.controller.test.js` | Unit | `startConversation`, `sendMessage`, `getAllConversations`, `getConversation`, `deleteConversation` (Gemini & model mocked) |
| ChatRoom Controller | `chatRoom.controller.test.js` | Unit | `getWsTicket`, `getMessageHistory`, `deleteMessage` (model mocked) |
| Course Controller | `course.controller.test.js` | Unit | `createCourse`, `getAllCourses`, `getCourseById`, `deleteCourse`, `submitCourse`, `getUserPoints` (model mocked) |
| Dashboard Controller | `dashboard.controller.test.js` | Unit | `getSummary`, `getCategoryBreakdown`, `getMonthlyTrends`, `getFinancialInsight`, `getRecentTransactions`, `convertCurrency` (service mocked) |
| Gamification Controller | `gamification.controller.test.js` | Unit | `getMyProfile`, `dailyLogin`, `awardXP`, `getLeaderboard` (model & engine mocked) |
| Group Controller | `group.controller.test.js` | Unit | `createGroup`, `joinGroup`, `leaveGroup`, `getUserGroups`, `getGroupById`, `deleteGroup`, `removeMember`, `updateGroup`, `regenerateInviteCode` (model mocked) |
| SavingsGoal Controller | `savingGoal.controller.test.js` | Unit | `createSavingsGoal`, `getSavingsGoal`, `updateSavingsGoal`, `getSavingsGoalProgress` (service mocked) |
| Transaction Controller | `transaction.controller.test.js` | Unit | `createTransaction`, `getTransactions`, `getTransactionById`, `updateTransaction`, `deleteTransaction` (service mocked) |
| User Controller | `user.controller.test.js` | Unit | `getAllUsers`, `getUserByID`, `deleteUser` (model mocked) |
| YouTube Controller | `youtube.controller.test.js` | Unit | `getVideoSuggestions` — chatId validation, ownership, empty keywords, cache check (model mocked) |

#### iii. Unit Tests — Middleware

| Test Suite | File | Type | Tests |
|------------|------|------|-------|
| Auth Middleware | `auth.middleware.test.js` | Unit | `protect` — valid token, missing token, invalid/expired token, user not found, deactivated account; `authorize` — role allow/deny |
| Error Handler Middleware | `errorHandler.middleware.test.js` | Unit | `notFound` — 404 with URL; `errorHandler` — status code passthrough, default 500, error message |
| Validation Middleware | `validation.middleware.test.js` | Unit | Pass, fail, multiple error formatting |

#### iv. Integration Tests

| Test Suite | File | Type | Tests |
|------------|------|------|-------|
| Article Endpoints | `article.integration.test.js` | Integration | Create (admin/user/unauth), list (all vs published, isRead flag), get by ID (draft access), update, delete, complete article (points, anti-gaming, duplicate prevention), my-points |
| Auth Endpoints | `auth.integration.test.js` | Integration | Register, login, profile, update, change password, logout |
| ChatRoom Endpoints | `chatRoom.integration.test.js` | Integration | WebSocket ticket, message history (pagination, member access control, soft-delete filtering), delete message (owner, admin, unauthorized) |
| Chat Endpoints | `chat.integration.test.js` | Integration | Start conversation, send message, list chats, get by ID, delete, ownership checks, Gemini mocked |
| Course Endpoints | `course.integration.test.js` | Integration | Create, list with filters/pagination, get by ID, update, delete, submit & grade, points award, duplicate submission prevention |
| Dashboard Endpoints | `dashboard.integration.test.js` | Integration | Summary (income/expense/savings, user isolation, month filter), category breakdown, monthly trends, recent transactions (limit 5, sort desc), currency conversion, savings goal CRUD (create, get, update, conflict, 404), savings goal progress (achieved, partial, overspend warning) |
| Gamification Endpoints | `gamification.integration.test.js` | Integration | Profile, daily login, award XP, leaderboard, badges, admin stats |
| Group Endpoints | `group.integration.test.js` | Integration | Create group, join, leave, get group details, delete group, remove member, update group, regenerate invite code |
| Transaction Endpoints | `transaction.integration.test.js` | Integration | Income/expense CRUD, field validation, user isolation, type/category/date/month/year filtering, pagination, sorted results |
| User Endpoints | `user.integration.test.js` | Integration | Get all users (pagination, search, filter by active/role), get by ID, delete, self-deletion prevention, admin-only access |
| YouTube Endpoints | `youtube.integration.test.js` | Integration | Video search, cache hit/miss, staleness check, deduplication, keyword-based fetch |


### 6. Test Environment
Tests use a separate `.env.test` file pointing to a dedicated test database (`test_db`). The database is dropped and recreated between test suites automatically via `testSetup.js`.

### 7. Test Statistics

**Total Test Files:** 36
- **Unit Tests:** 25 files (12 controllers + 3 middleware + 10 models)
   - **Statement Coverage (%)**: `88.35`
   - **Branch Coverage (%)**: `75.91`
   - **Functions (%)**: `87.09`
   - **Lines (%)**: `89.89`
- **Integration Tests:** 11 files (API endpoints)

- **Setup Files:** 3 files
   
   | File | Location | Purpose |
   |------|----------|---------|
   | `jest.unit.config.js` | `tests/setup/` | Global Jest configuration & hooks for unit test |
   | `jest.setup.js` | `tests/setup/` | Global Jest configuration & hooks |
   | `testSetup.js` | `tests/setup/` | Database setup, teardown, test utilities |