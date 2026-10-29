# Daily Task Manager

A deployable daily task manager with a **JavaScript (Vite) frontend**, **Spring Boot + Java 21 backend**, and **MySQL database on Aiven**.

## Features
- Add tasks with title, description, and optional due date
- Mark tasks complete / reopen them
- Delete tasks
- Filter All / Pending / Completed
- Responsive layout

## Project layout
- `frontend/` — Vanilla JavaScript, HTML, CSS, built with Vite
- `backend/` — Spring Boot REST API and Dockerfile

## 1. Run locally

### Backend
Install JDK 21 and Maven, then open a terminal in `backend/`:

```bash
mvn spring-boot:run
```

The backend starts on `http://localhost:8080`. If no database environment variables are configured, it uses an in-memory H2 database for local development.

### Frontend
Install Node.js 20+ and open another terminal in `frontend/`:

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`). The default API URL is `http://localhost:8080`.

## 2. Create the Aiven MySQL database
1. Create a **MySQL** service in Aiven and wait until it is running.
2. In the Aiven service overview, copy the host, port, database name, username, and password.
3. In Render, create environment variables for the backend service:
   - `DB_URL` = `jdbc:mysql://YOUR_AIVEN_HOST:YOUR_PORT/YOUR_DATABASE?sslMode=REQUIRED`
   - `DB_USERNAME` = your Aiven username
   - `DB_PASSWORD` = your Aiven password
   - `CORS_ALLOWED_ORIGINS` = your Vercel frontend URL, for example `https://your-project.vercel.app`
4. Do not commit database passwords or other secrets to GitHub.

The backend uses `spring.jpa.hibernate.ddl-auto=update` to create/update the task table. For a real production app, use database migrations before making schema changes.

## 3. Deploy backend to Render using Docker
1. Push this project to GitHub.
2. In Render, choose **New + → Web Service** and connect the repository.
3. Set **Root Directory** to `backend`.
4. Choose **Docker** as the runtime. Render should detect `backend/Dockerfile` from that root directory.
5. Add the environment variables listed in the Aiven section (`DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `CORS_ALLOWED_ORIGINS`).
6. Deploy. Test `https://YOUR-RENDER-SERVICE.onrender.com/api/health` — it should return `{"status":"UP"}`.

If you instead set the Render root directory to the repository root, set the Dockerfile path to `backend/Dockerfile` and build context to the repository root in Render's settings if available.

## 4. Deploy frontend to Vercel
1. In Vercel, import the same GitHub repository.
2. Set **Root Directory** to `frontend`.
3. Framework preset: **Vite** (Vercel usually detects this automatically).
4. Add an environment variable:
   - `VITE_API_BASE_URL` = `https://YOUR-RENDER-SERVICE.onrender.com` (no trailing slash)
5. Deploy or redeploy after adding the variable.

The frontend calls `/api/tasks` on the configured backend URL. If the API URL changes, update the Vercel environment variable and redeploy.

## 5. Upload to GitHub using VS Code (Windows)
1. Extract the ZIP file.
2. Open VS Code → **File → Open Folder** → select the `daily-task-manager` folder.
3. Open **Terminal → New Terminal**. Ensure the terminal is at the project root.
4. Run these commands (replace the URL with your new GitHub repository URL):

```powershell
git init
git add .
git commit -m "Initial Daily Task Manager project"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/daily-task-manager.git
git push -u origin main
```

Create an empty repository on GitHub first. Do not add a README there if you already have this README locally. If Git asks you to sign in, complete the GitHub authentication prompt.

## Troubleshooting
- **Failed to fetch:** check that the Render service is live, `VITE_API_BASE_URL` is correct, and `CORS_ALLOWED_ORIGINS` exactly matches your Vercel origin. Redeploy Vercel after changing its environment variables.
- **Database connection fails:** verify Aiven host/port/database and credentials. Keep `?sslMode=REQUIRED` on the JDBC URL.
- **Render free service sleeps:** the first request after inactivity can take a little while to respond.
- **Do not publish secrets:** never put `DB_PASSWORD` in frontend environment variables or commit it to Git.
