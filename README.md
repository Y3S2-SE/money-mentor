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

## Project Structure 
Project Structure and File naming convetion
```
MoneyMentor/
├── backend/
│   ├── controllers/
│   │   └── userController.js
│   ├── config/
│   ├── models/
│   │   └── User.js
│   ├── routes/
│   │   └── user.js
│   ├── middleware/
│   ├── utils/
│   ├── server.js 
│   └── app.js
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