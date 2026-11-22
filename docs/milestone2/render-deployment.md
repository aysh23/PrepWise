# PrepWise - Public Demo Deployment Guide (Render)

The Microsoft Form requires a prototype link that opens for anyone with the link. A local `http://localhost:5173` URL is not a public demo link.

Render supports free static sites and free web services. A free web service spins down after 15 minutes without inbound traffic and can take about a minute to wake on the next request; this is suitable for a student demonstration, not production availability. See [Render free deployment documentation](https://render.com/docs/free).

## 1. Deploy the backend

1. Sign in to Render and choose **New > Web Service**.
2. Connect the GitHub repository `aysh23/PrepWise`, branch `main`.
3. Configure:
   - Runtime: Node
   - Root directory: `server`
   - Build command: `npm ci`
   - Start command: `npm start`
   - Health check path: `/api/health`
   - Plan: Free
4. Add backend environment variables in the Render dashboard:
   - `GROQ_API_KEY`: paste the private Groq key directly into the Render secret field.
   - `GROQ_MODEL`: `openai/gpt-oss-120b`
   - `CLIENT_ORIGIN`: temporarily use `http://localhost:5173`; update it after deploying the frontend.
   - `STUDY_PLAN_REFINEMENT_LIMIT`: `2`
   - `TOPIC_COVERAGE_REQUIRED`: `true`
5. Deploy. Copy the backend URL, e.g. `https://prepwise-api.onrender.com`.
6. Open `https://YOUR-BACKEND-URL/api/health` and confirm the health JSON.

**Never** put `GROQ_API_KEY` into a frontend `VITE_*` variable or commit it to GitHub.

## 2. Deploy the frontend

1. In Render choose **New > Static Site** and connect the same repository and branch.
2. Configure:
   - Root directory: repository root
   - Build command: `npm ci && npm run build`
   - Publish directory: `dist`
3. Add the build-time environment variable:
   - `VITE_PREPWISE_API_URL`: the full backend URL from step 1, for example `https://prepwise-api.onrender.com`.
4. Deploy and copy the public frontend URL, e.g. `https://prepwise.onrender.com`.

## 3. Allow the public frontend through backend CORS

Return to the backend service in Render and change `CLIENT_ORIGIN` to the exact frontend origin, including `https://` and without a trailing slash, e.g. `https://prepwise.onrender.com`. Save/redeploy the backend.

## 4. Verify and submit

1. Open the public frontend URL in an incognito/private browser window.
2. Add a small test plan and generate a timetable.
3. Confirm the app displays the returned timetable and no CORS/network error.
4. Open the backend health URL once more.
5. Paste the public frontend URL into Microsoft Form Q11.

Free Render services can sleep after inactivity, so the first demo request may be slow while the backend wakes. This is expected for the free plan.
