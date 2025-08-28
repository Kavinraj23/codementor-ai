# MongoDB Integration Setup Guide

## Overview
This project now includes MongoDB integration for persistent interview session storage. Users can refresh the page and continue their interview sessions without losing progress.

## Environment Variables Required

Create a `.env.local` file in your project root with the following variables:

```bash
# MongoDB Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/codementor-ai?retryWrites=true&w=majority

# Judge0 API (for code execution)
JUDGE0_API_KEY=your_rapidapi_key_here
JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com
```

## Setup Steps

### 1. MongoDB Setup
1. Create a MongoDB Atlas account or use a local MongoDB instance
2. Create a database named `codementor-ai`
3. Copy your connection string to `MONGODB_URI`

### 2. Judge0 API Setup
1. Go to [RapidAPI Judge0 CE](https://rapidapi.com/judge0-official/api/judge0-ce/)
2. Sign up and subscribe to get your API key
3. Add the key to `JUDGE0_API_KEY`

### 3. Install Dependencies
```bash
npm install
```

### 4. Start Development Server
```bash
npm run dev
```

## Features Implemented

### Session Persistence
- ✅ Interview sessions are automatically saved to MongoDB
- ✅ Sessions persist across page refreshes
- ✅ Auto-save every 30 seconds and on changes
- ✅ Session recovery on page load

### Session Management
- ✅ Create new sessions automatically
- ✅ Update sessions with code, chat, and test results
- ✅ Track performance metrics
- ✅ Session status tracking (active/completed/incomplete)

### Dashboard
- ✅ View all interview sessions
- ✅ Filter by status (all/active/completed)
- ✅ Performance metrics display
- ✅ Continue active sessions

## API Endpoints

- `POST /api/sessions` - Create new session
- `GET /api/sessions` - List all sessions
- `GET /api/sessions/[sessionId]` - Get specific session
- `PUT /api/sessions/[sessionId]` - Update session
- `DELETE /api/sessions/[sessionId]` - Delete session

## How It Works

1. **Session Creation**: When a user starts an interview, a new session is created in MongoDB
2. **Auto-save**: The session is automatically saved every 30 seconds and when changes occur
3. **Session Recovery**: On page refresh, the app checks localStorage for a session ID and restores the session from MongoDB
4. **Persistence**: All interview data (code, chat, test results) is stored and can be restored

## Troubleshooting

### "API call failed: unknown" Error
This usually means the Judge0 API key is not set. Make sure to:
1. Add `JUDGE0_API_KEY` to your `.env.local` file
2. Restart the development server
3. Verify the API key is valid

### MongoDB Connection Issues
1. Check your `MONGODB_URI` format
2. Ensure your IP is whitelisted in MongoDB Atlas
3. Verify the database name is correct

### Session Not Persisting
1. Check browser console for errors
2. Verify MongoDB connection is working
3. Check that the session API endpoints are responding

## Future Enhancements

- User authentication and session ownership
- Advanced analytics and performance tracking
- AI-powered code review and feedback
- Session sharing and collaboration
- Export session data

