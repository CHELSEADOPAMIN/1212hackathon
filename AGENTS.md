# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

** 用中文和我对话 **
** 涉及开发库的使用时，必须使用context7MCP来调查对应库的真实资料，避免幻觉 **

## Project Overview

**Lyrathon** is an AI-powered recruitment matching platform that uses semantic analysis to match candidates and companies. It analyzes GitHub repositories and resumes using OpenAI to create multi-dimensional candidate profiles, moving beyond traditional keyword-based screening.

This is a **dual-portal full-stack application** with separate interfaces for candidates and companies, both using the same underlying matching engine.

## Development Commands

```bash
# Development server (http://localhost:3000)
pnpm dev

# Production build
pnpm build

# Start production server
pnpm start

# Run linter
pnpm lint
```

**Package Manager:** This project uses `pnpm` (not npm/yarn).

## Architecture Overview

### Dual Portal System

The application has **two separate user experiences** with different layouts, color schemes, and workflows:

1. **Candidate Portal** ([src/app/candidate/](src/app/candidate/))
   - Onboarding flow with GitHub analysis
   - Profile dashboard with job preferences
   - Tinder-style job discovery (swipe interface)
   - Application tracking

2. **Company Portal** ([src/app/company/](src/app/company/))
   - Job management with AI-generated descriptions
   - Tinder-style candidate discovery (swipe interface)
   - Hiring pipeline tracker (Interested → Interview → Offer)
   - Semantic candidate search

### Key Architectural Patterns

**State Management Strategy:**
- **Company Context** ([src/app/company/context.tsx](src/app/company/context.tsx)): React Context manages the entire company-side hiring pipeline state (interested candidates, interviews, offers). Access via `useCompany()` hook.
- **localStorage**: Candidate profile data persists from onboarding through the dashboard experience using the `userProfile` key.
- **Server Components by Default**: Most pages are Server Components; only use `"use client"` when needed for hooks or interactivity.

**Layout Nesting:**
```
Root Layout (src/app/layout.tsx) - Sonner toaster
  └─ Candidate Dashboard Layout (src/app/candidate/dashboard/layout.tsx) - Sidebar navigation
     └─ Individual pages
  └─ Company Layout (src/app/company/layout.tsx) - Dark sidebar, CompanyProvider
     └─ Individual pages
```

### Data Flow: GitHub Analysis Pipeline

The core AI feature is in [src/app/api/analyze/route.ts](src/app/api/analyze/route.ts):

1. **Input:** GitHub URL + resume text from candidate onboarding
2. **GitHub API:** Fetches user's repositories, filters forks vs original repos
3. **Intelligent Filtering:** Takes top 15 most active repos, detects meaningful forks (checks commit activity)
4. **OpenAI Analysis:** Sends repo metadata (name, language, stars, description) to GPT-4o
5. **Output:** Structured JSON with `name`, `role`, `summary`, `skills[]`, `matchReason`
6. **Persistence:** Stored in localStorage, used throughout candidate dashboard

**Error Handling:** Gracefully handles GitHub API rate limits with fallback behavior.

### Component Architecture

**UI Component Layer:**
- All UI primitives are in [src/components/ui/](src/components/ui/) using Shadcn UI (Radix UI + Tailwind)
- Components are unstyled primitives composed with Tailwind classes
- Use `cn()` utility from [src/lib/utils.ts](src/lib/utils.ts) to merge Tailwind classes

**Page Components:**
- Candidate pages use blue/green color scheme -目前是蓝紫，要将紫色逐渐替换为绿色
- Company pages use emerald/teal color scheme with dark theme
- Both use card-based layouts with similar swipe interaction patterns

### Swipe Interface Pattern

Both candidate and company discovery pages use the same Tinder-style interaction:
- Cards animate left (reject) or right (accept) with rotation
- Toast notifications confirm actions
- State updates trigger re-renders with new candidates/jobs
- Uses Tailwind transform utilities, not react-tinder-card library

## Code Style Guidelines

### TypeScript & React
- **TypeScript for all code**; prefer `interface` over `type`
- **Functional components** with hooks; use `const MyComponent = () => ...`
- **Server Components by default**; only add `"use client"` when using hooks (`useState`, `useEffect`) or event handlers

### Styling
- **Tailwind CSS only** - avoid custom CSS unless absolutely necessary
- Use **Shadcn UI components** from `@/components/ui` for all UI elements
- Use **Lucide React** for icons
- Follow existing color patterns: blue/purple (candidate), emerald/teal (company)

### Next.js Conventions
- Use App Router (`src/app`)
- Use `next/image` for images
- Use `next/link` for navigation
- API routes in `src/app/api/*/route.ts`

### State Management
- Use `useState`/`useReducer` for local state
- Use `useContext` for cross-component state (see CompanyProvider example)
- Avoid Redux unless complex global state is required

## Important Implementation Details

### Environment Variables
Required for AI features:
- `OPENAI_API_KEY` - For GitHub analysis and profile generation
- `GITHUB_TOKEN` - For GitHub API access (optional, increases rate limits)

### Mock Data vs Real Data
**Current State:** Most features use mock data (hardcoded arrays):
- Jobs, candidates, interviews, offers are all static arrays - 未来均要改成从mongodb数据库中获取。
- Swipe actions update client-side state only

**Future Integration:**
- MongoDB setup ready (dependency installed, not connected)
- Vector database planned for semantic matching (MongoDB Atlas Vector Search)
- Authentication not yet implemented (GitHub/Google OAuth planned)

### Onboarding Flow State Machine
The [candidate onboarding](src/app/candidate/onboarding/page.tsx) uses a 4-step state machine:
1. GitHub URL input
2. Resume upload (drag-drop or paste)
3. AI analysis loading (animated with rotating messages)
4. Results display with profile preview

Each step validates before proceeding. Profile data is saved to localStorage on completion.

### Profile Data Schema
When working with candidate profiles (from onboarding or dashboard), expect this structure:
```typescript
{
  name: string
  role: string
  summary: string
  skills: Array<{ category: string; level: number; }>
  // Optional fields added in dashboard:
  targetRole?: string
  location?: string
  expectedSalary?: string
  experiences?: Array<{ company, role, duration, description }>
}
```

### AI Integration Patterns
- Use `openai` package directly for structured outputs - 接下来的开发要使用Vercel AI SDK
- Include error handling for rate limits and API failures
- Show loading states during AI operations
- Sanitize AI responses (remove markdown formatting in JSON responses)

## Common Development Tasks

### Adding a New Candidate Dashboard Page
1. Create file in `src/app/candidate/dashboard/[name]/page.tsx`
2. Add navigation link to `src/app/candidate/dashboard/layout.tsx` sidebar
3. Use existing blue/green color scheme
4. Access profile data via `localStorage.getItem('userProfile')`

### Adding a New Company Portal Page
1. Create file in `src/app/company/[name]/page.tsx`
2. Add navigation link to `src/app/company/layout.tsx` sidebar
3. Use dark theme with emerald/teal accents
4. Access pipeline state via `useCompany()` hook

### Creating a New API Endpoint
1. Create `src/app/api/[name]/route.ts`
2. Export `POST`, `GET`, etc. as async functions
3. Return `NextResponse.json(data)` for success
4. Use try-catch with proper HTTP status codes
5. Include OpenAI error handling if using AI features

### Adding a New UI Component
1. Use Shadcn UI if possible: check [ui.shadcn.com](https://ui.shadcn.com)
2. Add to `src/components/ui/` following existing patterns
3. Use CVA (class-variance-authority) for variants
4. Compose with Radix UI primitives for accessibility

## Project-Specific Patterns to Follow

### Skill Radar Visualization
When displaying candidate skills, use the radar chart pattern from [candidate/dashboard/page.tsx](src/app/candidate/dashboard/page.tsx):
- Recharts `RadarChart` with 5 skill categories
- Scale 0-100 for skill levels
- Color: blue for candidates, emerald for company context

### Card Swipe Animation
For Tinder-style interfaces, follow the pattern in [company/talent-radar/page.tsx](src/app/company/talent-radar/page.tsx):
- Track `swipeDirection` state (`null | 'left' | 'right'`)
- Apply Tailwind transforms: `translate-x-[200%]` and `rotate-12` for right swipe
- Set `isAnimating` flag during transition, delay state update by 300ms
- Show toast notification after swipe completes

### Dialog Forms
For edit/create forms, use Dialog pattern:
- Keep form state in parent component
- Open/close via boolean state
- Use controlled inputs with `value` and `onChange`
- Reset form state on dialog close

## Performance Considerations

- Implement dynamic imports (`next/dynamic`) for heavy client components like charts
- Optimize images with `next/image` (priority for above-fold images)
- The AI analysis endpoint can be slow (5-10s) - always show loading states
- LocalStorage operations are synchronous - keep payload sizes reasonable

## Testing & Development Notes

- No test suite currently configured
- Development requires active internet for AI features
- OpenAI API calls cost money - be mindful during development
