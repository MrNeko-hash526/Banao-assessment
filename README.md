# Banao Assessment – Full-Stack Demo

A minimal full-stack project with a Vite + React + TypeScript frontend (using Chakra UI) and a small Express backend that persists signups to a JSON file and supports profile image uploads.

Banao-assessment/
├── frontend/       # Vite + React + TypeScript (Chakra UI)
│   └── src/
│       ├── AuthPages/
│       │   ├── Signup.tsx         # Signup form with image upload & preview
│       │   └── Login.tsx          # Login page
│       └── dashboards/
│           ├── PatientDash.tsx    # Patient dashboard
│           └── DocDash.tsx        # Doctor dashboard
│
├── backend/        # Express server
│   ├── index.js    # Main server entry
│   ├── signups.json# Stores user signups
│   └── uploads/    # Stores uploaded images (ignored by git)
│
└── .gitignore      # Ignores node_modules, uploads, signups.json


## Requirements

- Node.js (16+ recommended)
- npm
- Windows PowerShell 

## Quick start (Windows PowerShell)

Open two PowerShell terminals and run the following.

1. Start the backend

```powershell
cd 'd:/Banao-assessment/backend'

# Install dependencies (first time only)
npm install

# Ensure multer is installed (needed for file uploads)
npm install multer --save

# Start backend server
node index.js
```

The backend listens on port 5000 by default (the frontend fetches `http://localhost:5000`).

2. Start the frontend (Vite dev server)

```powershell
cd 'd:/Banao-assessment/frontend'
# install frontend deps (run once)
npm install
# start dev server
npm run dev
```

Open the frontend URL printed by Vite (typically `http://localhost:5173`) and navigate to:

- `/signup` — signup page (file upload optional)
- `/login` — login page
- `/patient-dashboard` and `/doctor-dashboard` — dashboards

## API endpoints (backend)

- `GET /signups` — get all saved signups (JSON array)
- `POST /save-signup` — save a signup
  - If a file is included the frontend sends a multipart FormData with `profileImage` and other fields; the backend saves the file into `backend/uploads` and stores `profileImage` as `/uploads/<filename>` in the saved object.
- Static files served from `/uploads` if the server is configured with express.static.

## Notes & troubleshooting

- Multer dependency: the backend code expects `multer` if file uploads were enabled. If you see `Error: Cannot find module 'multer'`, run in the `backend` folder:

```powershell
npm install multer --save
```

- If uploads don't appear in the dashboards, check:

  1. Backend is running on port 5000.
  2. The saved signup object has a `profileImage` that starts with `/uploads/`.
  3. The frontend `getImageUrl()` helper prefixes `http://localhost:5000` for `/uploads` paths.

- Type checking: the frontend is TypeScript. To run a quick type check from the `frontend` folder:

```powershell
cd 'd:/Banao-assessment/frontend'
npx tsc --noEmit
```

- If you revert changes while I'm editing files, re-run the dev servers to pick up changes.

## Development notes & possible improvements

- Add file size/type validation on the client and server (currently any image file is accepted).
- Resize or sanitize uploaded images server-side (e.g., use `sharp`) before storing.
- Replace manual pathname-based routing with a router (React Router) if the app grows.
- Add unit tests for server endpoints and frontend components.

---

This README covers running and testing the current app locally on Windows PowerShell. If you'd like a different format or extra sections (architecture diagram, API contract, or test harness), tell me what to include and I'll add it.
