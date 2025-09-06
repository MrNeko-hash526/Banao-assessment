# Banao Assessment – Full-Stack Demo

A minimal full-stack project with a Vite + React + TypeScript frontend (using Chakra UI) and a small Express backend that persists signups to a JSON file and supports profile image uploads.

```
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
# Banao Assessment — Full‑Stack Blog Demo

A small full‑stack demo with a Vite + React + TypeScript frontend (Chakra UI) and an Express + Prisma backend (MySQL). The app supports user roles (doctor/patient), blog CRUD for doctors, image uploads for blog posts, and a patient-facing blog list filtered by category.

Project layout
```
```
Banao-assessment/
├─ backend/ # Express server, Prisma, uploads
│ ├─ prisma/ # Prisma schema (MySQL datasource)
│ ├─ controller/ # API controllers (blogs, upload, auth)
│ ├─ routes/ # Express routes
│ └─ uploads/ # Uploaded files (ignored by git)
├─ frontend/ # Vite + React + TypeScript (Chakra UI)
│ └─ src/
│ ├─ blogs/ # Blog pages, dashboard, forms, cards
│ └─ components/ # Shared UI components
└─ .gitignore

````

Highlights
- Blog categories are defined in Prisma: MENTAL_HEALTH, HEART_DISEASE, COVID19, IMMUNIZATION.
- Doctors can create/edit/delete blogs, mark drafts, and upload an image per blog.
- Patients can view published (non-draft) blogs and filter by category.
- The backend stores image paths and serves uploads from `/uploads`.
- Database: MySQL via Prisma (see `backend/prisma/schema.prisma`).

Requirements
- Node.js 16+ (recommended)
- npm
- MySQL server (or a MySQL-compatible connection string in `DATABASE_URL`)

Quick start (Windows PowerShell)

1) Backend

```powershell
cd 'd:/Banao-assessment/backend'
# install dependencies (first time)
npm install

# create .env (see .env.example) and set DATABASE_URL for MySQL
# run prisma migrations if you want to create the schema:
npx prisma migrate dev --name init

# start the server
node index.js
````

The backend listens on port 5000 by default. Adjust the frontend API URL via `VITE_API_URL` if needed.

2. Frontend

```powershell
cd 'd:/Banao-assessment/frontend'
npm install
npm run dev
```

Open the Vite URL (usually `http://localhost:5173`) and use the app.

Important files & features

- `backend/prisma/schema.prisma` — defines `Blog`, `User`, the `Category` enum (the four required categories) and MySQL datasource.
- `backend/controller/blogController.js` — blog CRUD, draft handling, and server-side image saving for base64 payloads.
- `backend/routes/blogRoutes.js` — public and protected blog routes (`/blogs`, `/blogs/mine`, `/blogs/:id`, POST/PUT/DELETE).
- `frontend/src/blogs/CreateBlog.tsx` (and `DoctorBlogForm.tsx`) — blog creation/edit form (title, image upload, category, summary, content, draft toggle).
- `frontend/src/components/blog/BlogCard.tsx` — blog list card; summary truncated to 15 words (per requirement).
- Uploads are saved under `backend/uploads` and served from the server; the client maps `/uploads/...` paths to the backend origin.

Security & env

- Do not commit `.env` to git. `.env.example` is provided. Add `DATABASE_URL` pointing at your MySQL instance.

Notes & troubleshooting

- If image upload fails with a missing module error, install multer in the backend:
  ```powershell
  cd backend
  npm install multer --save
  ```
- If uploads return 404, ensure the server is running, check `backend/uploads` for files, and confirm the stored image URL is correct.
