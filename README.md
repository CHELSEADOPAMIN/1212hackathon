This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Environment Variables

Before running the project, you must set up the environment variables.

1. Copy the example environment file (if available) or create a new `.env.local` file in the root directory:

```bash
cp .env.example .env.local
# or just create it
touch .env.local
```

2. Add the following variables to `.env.local`:

```env
# --- Core AI & Database Configuration (Required) ---

# OpenAI API Key for AI Analysis, Matching, and TTS
OPENAI_API_KEY=sk-proj-...

# MongoDB Atlas Connection String
# Must be a standard connection string (e.g. mongodb+srv://...)
# Ensure your IP is whitelisted in MongoDB Atlas Network Access
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxx.mongodb.net/

# --- Optional Configurations ---

# GitHub Personal Access Token
# Highly recommended to avoid GitHub API rate limits during candidate analysis
# Generate at: https://github.com/settings/tokens (No special scopes needed for public repos)
GITHUB_TOKEN=ghp_...

# Database Name (Default: lyrathon)
MONGODB_DB=lyrathon

# Vector Search Index Names (Default: vector_index)
# These must match the index names created in MongoDB Atlas
MONGODB_JOBS_INDEX=vector_index
MONGODB_CANDIDATES_INDEX=vector_index

# Default Company ID for Demo/Testing
DEFAULT_COMPANY_ID=demo-company
NEXT_PUBLIC_COMPANY_ID=demo-company
```

## Getting Started

First, install dependencies:

```bash
pnpm install
```

Then, run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
