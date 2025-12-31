# BeyondChats Article Scraper & Enhancer

A comprehensive 3-phase system for scraping, enhancing, and displaying articles from BeyondChats blog.

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Setup Instructions](#setup-instructions)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Project Structure](#project-structure)
- [Data Flow](#data-flow)

## 🎯 Overview

This project consists of three main phases:

1. **Phase 1**: Scrape 5 oldest articles from BeyondChats blogs and create CRUD APIs
2. **Phase 2**: Enhance articles using Google search results and Gemini AI
3. **Phase 3**: Display articles in a responsive React frontend

## 🏗️ Architecture

```
┌─────────────────┐
│  BeyondChats    │
│  Blog Scraper   │
│  (Phase 1)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  MongoDB Atlas  │
│  (Articles DB)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌──────────────────┐
│  Express API    │◄─────│  Node.js CLI     │
│  (CRUD APIs)    │      │  (Phase 2)       │
└────────┬────────┘      └────────┬─────────┘
         │                        │
         │                        │ Google Search
         │                        │ Gemini API
         │                        │
         ▼                        ▼
┌─────────────────┐      ┌──────────────────┐
│  React Frontend  │      │  Updated Articles│
│  (Phase 3)       │      │  (with citations)│
└─────────────────┘      └──────────────────┘
```

## ✨ Features

- **Web Scraping**: Automatically scrape articles from BeyondChats blog
- **CRUD APIs**: Full REST API for article management
- **AI Enhancement**: Enhance articles using Google Gemini AI based on top-ranking articles
- **Reference Citations**: Automatically cite reference articles
- **Responsive UI**: Modern, professional React frontend
- **Version Comparison**: View original vs updated article versions

## 🛠️ Tech Stack

### Backend

- **Node.js** with **Express**
- **MongoDB Atlas** (Cloud Database)
- **Mongoose** (ODM)
- **Puppeteer** & **Cheerio** (Web Scraping)

### Enhancement Scripts

- **Google Gemini API** (AI Enhancement)
- **Axios** (HTTP Client)
- **Puppeteer** (Content Scraping)

### Frontend

- **React** with **Vite**
- **React Router** (Routing)
- **Tailwind CSS** (Styling)
- **Axios** (API Client)

## 🚀 Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- MongoDB Atlas account
- Google Gemini API key
- npm or yarn

### Phase 1: Backend Setup

1. **Navigate to backend directory:**

   ```bash
   cd backend
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Create a `.env` file in the `backend` directory:

   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/beyondchats?retryWrites=true&w=majority
   PORT=3000
   NODE_ENV=development
   ```

4. **Run the scraper to fetch articles:**

   ```bash
   npm run scrape
   ```

   This will scrape the 5 oldest articles from BeyondChats blog and store them in MongoDB.

5. **Start the server:**

   ```bash
   npm start
   ```

   Or for development with auto-reload:

   ```bash
   npm run dev
   ```

   The API will be available at `http://localhost:3000`

### Phase 2: Enhancement Scripts Setup

1. **Navigate to scripts directory:**

   ```bash
   cd scripts
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Create a `.env` file in the `scripts` directory:

   ```env
   API_BASE_URL=http://localhost:3000/api
   GEMINI_API_KEY=your_gemini_api_key_here
   GOOGLE_API_KEY=your_google_api_key_here (optional)
   GOOGLE_CX=your_google_cx_here (optional)
   ```

4. **Run enhancement script:**

   To enhance all unupdated articles:

   ```bash
   node enhance-articles.js --all
   ```

   To enhance a specific article:

   ```bash
   node enhance-articles.js --article-id=<article_id>
   ```

### Phase 3: Frontend Setup

1. **Navigate to frontend directory:**

   ```bash
   cd frontend
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Create a `.env` file in the `frontend` directory:

   ```env
   VITE_API_URL=http://localhost:3000/api
   ```

4. **Start development server:**

   ```bash
   npm run dev
   ```

   The frontend will be available at `http://localhost:5173`

5. **Build for production:**
   ```bash
   npm run build
   ```

## 📖 Usage

### Complete Workflow

1. **Start Backend:**

   ```bash
   cd backend
   npm start
   ```

2. **Scrape Articles (if not done already):**

   ```bash
   cd backend
   npm run scrape
   ```

3. **Enhance Articles:**

   ```bash
   cd scripts
   node enhance-articles.js --all
   ```

4. **Start Frontend:**

   ```bash
   cd frontend
   npm run dev
   ```

5. **View Articles:**
   Open `http://localhost:5173` in your browser

## 🔌 API Endpoints

### Articles

- `GET /api/articles` - Get all articles (with pagination)
  - Query params: `page`, `limit`
- `GET /api/articles/:id` - Get single article
- `POST /api/articles` - Create article
- `PUT /api/articles/:id` - Update article
- `DELETE /api/articles/:id` - Delete article
- `GET /api/articles/:id/original` - Get original version
- `GET /api/articles/:id/updated` - Get updated version

### Health Check

- `GET /health` - Server health check

## 📁 Project Structure

```
beyond_chats/
├── backend/
│   ├── config/
│   │   └── database.js          # MongoDB connection
│   ├── models/
│   │   └── Article.js           # Article Mongoose model
│   ├── routes/
│   │   └── articles.js          # Article API routes
│   ├── controllers/
│   │   └── articleController.js # Article controllers
│   ├── scraper/
│   │   └── beyondchats-scraper.js # Web scraper
│   ├── server.js                # Express server
│   ├── package.json
│   └── .env                      # Environment variables
├── scripts/
│   ├── enhance-articles.js      # Main enhancement CLI
│   ├── utils/
│   │   ├── google-search.js     # Google search utility
│   │   ├── content-scraper.js   # Content scraping utility
│   │   └── gemini-enhancer.js   # Gemini API integration
│   ├── package.json
│   └── .env                      # Environment variables
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ArticleCard.jsx
│   │   │   └── ReferenceList.jsx
│   │   ├── pages/
│   │   │   ├── ArticleList.jsx
│   │   │   ├── ArticleDetail.jsx
│   │   │   └── ArticleComparison.jsx
│   │   ├── services/
│   │   │   └── api.js            # API service layer
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.js
│   └── .env                      # Environment variables
└── README.md
```

## 🔄 Data Flow

```mermaid
flowchart TD
    A[BeyondChats Blog] -->|Scrape| B[Scraper Script]
    B -->|Store| C[MongoDB Atlas]
    C -->|CRUD Operations| D[Express API]
    E[Enhancement Script] -->|Fetch| D
    E -->|Search| F[Google Search]
    F -->|Get Links| G[Reference Articles]
    G -->|Scrape| H[Content Extractor]
    H -->|Send| I[Gemini API]
    I -->|Enhanced Content| E
    E -->|Update| D
    D -->|Fetch| J[React Frontend]
    J -->|Display| K[User Browser]
```

## 📝 Notes

- The scraper finds the last page of the blog and fetches the 5 oldest articles
- The enhancement script searches Google for each article title and finds top-ranking articles
- Gemini AI enhances the original article to match the style and formatting of reference articles
- All reference articles are cited at the bottom of enhanced articles
- The frontend displays both original and updated versions with comparison view

## 🔗 Live Link

[Add your live frontend link here after deployment]

**Deployment Guide**: See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

**Troubleshooting**: If you encounter deployment issues, see [DEPLOYMENT_TROUBLESHOOTING.md](DEPLOYMENT_TROUBLESHOOTING.md) for solutions.

### Quick Deploy Summary

1. **Backend (Render)**: Deploy `backend/` folder
2. **Frontend (Vercel/Netlify)**: Deploy `frontend/` folder
3. **Environment Variables**: Set `MONGODB_URI`, `VITE_API_URL`, `GEMINI_API_KEY`

See [DEPLOYMENT.md](DEPLOYMENT.md) for step-by-step instructions.

## 📄 License

ISC

## 👤 Author

[Your Name]

---

**Note**: Make sure to set up all environment variables before running the application. The MongoDB Atlas connection string, Gemini API key, and other configurations are required for the system to work properly.
