# Deployment Guide

This project is a Vite + React frontend. Below are recommended deployment options and step-by-step instructions for each.

1) Vercel (static frontend, fastest)

- Create a GitHub repo and push your code.
- Sign in to Vercel and import the GitHub repo.
- Set the build command to `npm run build` and the output directory to `dist` (Vercel usually detects this automatically).
- Add environment variables (if using a hosted DB like Supabase, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`).

2) Supabase (database)

- Create a Supabase project: https://supabase.com
- Create tables using the SQL editor or schema migration. Example tables: `users`, `tasks`, `attendance`, `leaves`, `projects`, `announcements`.
- If the frontend needs direct read access, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to Vercel environment variables.
- For secure write operations, implement server-side API (Vercel Serverless functions or a separate backend) that uses the Supabase service_role key.

3) Docker (containerized static deployment)

Build the container locally and run it:

```powershell
cd path/to/raminfosys-portal
npm ci
npm run build
docker build -t raminfosys-portal .
docker run -p 3000:80 raminfosys-portal
```

Open http://localhost:3000 to view the app.

4) Full backend option (if you need secure server-side DB access)

- Create an API (Node/Express, Fastify, or serverless functions) that exposes endpoints for login, attendance logging, tasks, etc.
- Use a managed Postgres (Supabase includes this) and run migrations.
- Deploy the API to Render, Railway, Vercel (serverless), or any VPS.

Notes and tips
- The current project uses `services/mockDb.ts` (localStorage) for data. To use Supabase you will need to replace or refactor `mockDb` to call Supabase or your API. This may require converting synchronous `db` calls to async.
- Never commit service role keys or private DB credentials. Use platform secret managers (Vercel Environment Variables, Render secrets, etc.).
- For CI/CD, enable automatic deployments on Git push.

If you'd like, I can:
- Scaffold a small Express API and update the frontend to call it, or
- Add a Supabase client and convert `mockDb` usage to async calls.
The repository now contains a simple Express backend in `server/` which stores the entire app state into a Postgres table named `app_state`.

Recommended deployment flow to have a global URL and persistent DB:

1) Provision a Postgres instance (Supabase, Render Postgres, Railway, or managed Postgres).
	- Run the SQL in `server/init.sql` to create the `app_state` table.
	- Obtain `DATABASE_URL` for the Postgres instance.

2) Deploy the backend (Render/Heroku/Railway) or build/push the `server/Dockerfile` to your container host.
	- Set the environment variable `DATABASE_URL` on the host.
	- Start the server (it listens by default on port 4000).

3) Deploy the frontend (Vercel is recommended):
	- Add an environment variable `VITE_BACKEND_URL` pointing to your backend public URL (e.g. `https://my-backend.onrender.com`).
	- Vercel will build the site with `npm run build` and serve the static `dist` folder.

4) Flow:
	- On app start the frontend will fetch server state (if available) and merge it into localStorage.
	- Whenever the app writes data to localStorage the updated state is POSTed to `/state` on the backend (best-effort, non-blocking).

This approach minimizes changes to the existing frontend while providing persistent, server-side storage for user records.

If you want, I can now:
- Initialize a Git repo here, commit the files, and show the exact commands to push to a new GitHub repo (you'll need to provide the remote or authenticate), then I can trigger a deploy on Render and Vercel if you provide access tokens, OR
- Walk you through the manual steps to create the Postgres instance and deploy both services with commands you can run locally.
