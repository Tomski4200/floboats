# Floboats

A Next.js application with Supabase integration.

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Tomski4200/floboats.git
cd floboats
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up environment variables:
   - Copy `.env.example` to `.env.local`
   - Fill in your Supabase credentials

4. Run the development server:
```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Vercel Configuration (for deployment monitoring)
VERCEL_TOKEN=your_vercel_api_token
VERCEL_PROJECT_ID=your_vercel_project_id
VERCEL_PROJECT_NAME=floboats
```

## Deployment

This project is configured to deploy automatically to Vercel when you push to GitHub.

### Deployment Scripts

1. **Deploy and Check Build Status**:
   ```bash
   ./deploy-and-check.sh
   ```
   This script will:
   - Check for uncommitted changes
   - Push to GitHub (triggering Vercel deployment)
   - Wait 120 seconds and check the build status
   - Display build logs if the build fails

2. **Check Build Status Only**:
   ```bash
   ./check-vercel-build.sh [wait_seconds]
   ```
   This script checks the latest Vercel deployment status. Default wait is 120 seconds.

3. **Auto-Fix Deployment Errors**:
   ```bash
   python3 auto-fix-deployment.py deploy
   ```
   This will:
   - Deploy your code
   - Monitor the build
   - Extract specific TypeScript errors if build fails
   - Save errors to `deployment-errors.json` for fixing

4. **Continuous Deploy & Fix** (Interactive):
   ```bash
   ./continuous-deploy-fix.sh
   ```
   This will:
   - Deploy and monitor
   - Show you errors to fix
   - Wait for you to fix them
   - Automatically commit and redeploy
   - Repeat until successful (max 5 attempts)

### Important Notes

- **Project Name**: Ensure deployments go to the "floboats" project
- **Project ID**: `prj_DU3SwuN5Jx3mTNy4TDCIZMAwakok`
- The scripts will warn if deployment appears to be going to the wrong project

## Build Process

The project uses a custom build script (`vercel-build.sh`) for Vercel deployments:

1. The script runs automatically during Vercel builds
2. It executes `npm run build` after initial setup
3. Case-sensitive imports are handled via redirect files (e.g., Button.tsx → button-component.tsx)

For local builds:
```bash
npm run build  # Standard Next.js build
npm run type-check  # Check TypeScript types only
```

## Known Issues

### Case-Sensitive Imports
- Vercel runs on Linux (case-sensitive) while local dev may be case-insensitive
- Solution: We use redirect files for components (Button.tsx exports from button-component.tsx)
- Always import from capitalized paths: `@/components/ui/Button` not `@/components/ui/button`

### Next.js 15 Requirements
- Pages using `useSearchParams()` must wrap content in Suspense boundaries
- Pages using `cookies()` need `export const dynamic = 'force-dynamic'`
- See DEVELOPMENT.md for detailed patterns

## Deployment Troubleshooting

Common deployment errors and solutions:

1. **"Circular definition of import alias"**
   - Cause: Lowercase redirect files importing from themselves
   - Solution: Fixed in vercel-build.sh - no longer creates problematic redirects

2. **"Type 'destructive' is not assignable to type..."**
   - Cause: Button component doesn't support all variants
   - Solution: Use `variant="secondary"` with className for styling

3. **"useSearchParams() should be wrapped in a suspense boundary"**
   - Solution: Wrap component using useSearchParams in Suspense
   - See DEVELOPMENT.md for the pattern

4. **"Dynamic server usage: Route couldn't be rendered statically"**
   - Solution: Add `export const dynamic = 'force-dynamic'` to the page

For detailed deployment guidance, see DEPLOYMENT_GUIDE.md

## Deployment

This project is optimized for deployment on [Vercel](https://vercel.com/).

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Tomski4200/floboats)

## Tech Stack

- **Framework:** Next.js 15
- **Database:** Supabase
- **Styling:** Tailwind CSS
- **TypeScript:** Full TypeScript support

## Project Structure

```
├── app/              # Next.js App Router pages
├── components/       # Reusable React components
├── hooks/           # Custom React hooks
├── lib/             # Utility functions and configurations
├── public/          # Static assets
├── supabase/        # Database migrations and types
└── ...
```

## Contributing

Please read [DEVELOPMENT.md](DEVELOPMENT.md) for important patterns and requirements before contributing.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.
