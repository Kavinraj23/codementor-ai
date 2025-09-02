# Codementor AI - Coding Interview Platform

This is a [Next.js](https://nextjs.org) project that provides an AI-powered coding interview platform with automated test case execution using Judge0.

## Features

- **AI-Powered Interviews**: Chat with AI to get help and feedback
- **Automated Testing**: Run test cases against your solutions using Judge0
- **Multiple Problem Types**: Support for various coding problems including arrays, linked lists, and more
- **Real-time Code Execution**: Execute Python code in a secure sandbox environment
- **User Authentication**: Secure user accounts with Clerk authentication
- **Session Management**: Track and manage your interview sessions
- **Voice Interaction**: Speech-to-text and text-to-speech capabilities

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key

# Judge0 API Configuration
# Get your API key from: https://rapidapi.com/judge0-official/api/judge0-ce/
JUDGE0_API_KEY=your_rapidapi_key_here

# Optional: Custom Judge0 API URL (defaults to RapidAPI endpoint)
# JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com

# MongoDB Connection
MONGODB_URI=your_mongodb_connection_string

# OpenAI API
OPENAI_API_KEY=your_openai_api_key
```

## Setup Instructions

### 1. Clerk Authentication Setup
1. **Create Clerk Account**: Go to [https://clerk.com/](https://clerk.com/) and create an account
2. **Create Application**: Create a new application in Clerk dashboard
3. **Get API Keys**: Copy your publishable key and secret key from the Clerk dashboard
4. **Add to .env.local**: Set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`

### 2. Judge0 Setup
1. **Sign up for RapidAPI**: Go to [https://rapidapi.com/](https://rapidapi.com/) and create an account
2. **Subscribe to Judge0**: Search for "Judge0 CE" and subscribe to the API
3. **Get API Key**: Copy your RapidAPI key from your dashboard
4. **Add to .env.local**: Set `JUDGE0_API_KEY=your_key_here`

### 3. MongoDB Setup
1. **Create MongoDB Atlas account** or use a local MongoDB instance
2. **Create a database** named `codementor-ai`
3. **Copy your connection string** to `MONGODB_URI`

### 4. OpenAI Setup
1. **Get OpenAI API Key**: Create an account at [https://openai.com/](https://openai.com/)
2. **Add to .env.local**: Set `OPENAI_API_KEY=your_key_here`

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Authentication Flow

1. **Landing Page**: Users see the homepage with "Get Started" and "Sign In" buttons
2. **Sign Up**: New users create accounts with email/password or social login
3. **Sign In**: Existing users authenticate to access their dashboard
4. **Dashboard**: Authenticated users see their interview sessions and can start new ones
5. **Protected Routes**: All interview functionality requires authentication

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
