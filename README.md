# ExamFlow

**Smart Examination Scheduling and Invigilation Management System**

## Overview
ExamFlow is a full‑stack MERN application that helps colleges manage examinations, invigilation, seating, and timetables. It supports three user roles (Admin, Faculty, Student) with secure JWT authentication and role‑based authorization.

## Features
- User authentication (JWT + bcrypt)
- CRUD for Students, Faculty, Subjects, Groups, Rooms, Examinations
- Examination scheduling with conflict detection (student, room, capacity, faculty)
- Automatic seating allocation across multiple rooms
- Invigilator assignment and workload reporting
- Role‑based dashboards with Recharts visualizations
- PDF export of timetables, seating plans, hall tickets, and faculty duty rosters (jsPDF)
- Audit history for all critical modifications

## Prerequisites
- **Node.js** v18+ (download from https://nodejs.org)
- **npm** (comes with Node)
- **MongoDB Atlas** cluster (or local MongoDB) – you need a connection string.
- **Git** (optional, for cloning the repo)

## Repository Structure
```
ExamFlow/
├─ client/          # React frontend (Vite)
├─ server/          # Express backend
│   ├─ config/      # db.js, env handling
│   ├─ models/      # Mongoose schemas
│   ├─ routes/      # API endpoints
│   ├─ controllers/ # Business logic
│   └─ scripts/     # Seed script
└─ README.md        # THIS FILE
```

## Installation
1. **Clone the repository** (or copy the folder you already have).
   ```bash
   git clone <repo-url>
   cd ExamFlow
   ```
2. **Install backend dependencies**
   ```bash
   cd server
   npm install
   ```
3. **Install frontend dependencies**
   ```bash
   cd ../client
   npm install
   ```

## Environment Configuration
Create a `.env` file inside `server/` (do **not** commit this file).
```
MONGODB_URI=<your‑atlas‑connection‑string>
JWT_SECRET=your_jwt_secret_key
PORT=5000
```
- Use the same connection string you used to create the Atlas cluster (e.g. `mongodb+srv://username:password@cluster0.mongodb.net/examflow?retryWrites=true&w=majority`).
- **Never** share the real password in chat; keep it local.

Create a template for collaborators:
```bash
cp server/.env.example server/.env
```
Then edit the generated `.env` with your credentials.

## Seed Demo Data
A seed script populates the database with a small set of demo users, subjects, rooms, and an examination.
```bash
# From the repository root
node server/scripts/seedDemoData.js
```
You should see console logs confirming successful seeding.

## Running the Application
### Development mode (hot‑reload)
Open **two** terminal windows (or VS Code split terminals).
1. **Backend**
   ```bash
   cd server
   npm run dev   # runs nodemon on port 5000
   ```
2. **Frontend**
   ```bash
   cd client
   npm run dev   # Vite dev server on http://localhost:5173
   ```
The frontend proxies API calls to `http://localhost:5000` (configured in `vite.config.js`).

### Production build
```bash
# Build the React app
cd client
npm run build

# Start the backend (it will serve the built client if configured)
cd ../server
npm start   # uses NODE_ENV=production
```

## Demo Login Credentials
| Role   | Email                 | Password   |
|--------|----------------------|------------|
| Admin  | admin@example.com    | admin123   |
| Faculty| faculty1@example.com | faculty123 |
| Student| student1@example.com | student123 |

Use these accounts to explore the dashboards and test the workflow.

## API Reference (selected endpoints)
- `POST /api/auth/login` – returns JWT token.
- `GET /api/dashboard/admin` – admin KPI data (protected, admin only).
- `POST /api/students` – create student (admin).
- `POST /api/faculties` – create faculty (admin).
- `POST /api/rooms` – create room (admin).
- `POST /api/examinations` – create exam (admin).
- `POST /api/schedules` – schedule an exam (admin) – conflict detection runs automatically.
- `POST /api/seating/generate` – generate seating allocation (admin).
- `POST /api/invigilators/assign` – assign invigilator (admin).
- `GET /api/reports/timetable/:examId` – download timetable PDF (admin/faculty/student).

For the full list, see the Swagger docs (if enabled) or the `routes/` folder.

## Testing the Workflow
1. Log in as **admin**.
2. Verify the **Admin Dashboard** shows KPIs.
3. Navigate to **Students** → *Add* a new student (or use the seeded one).
4. Create a **Room** and a **Subject** if you removed the seed data.
5. Create an **Examination** (date, time, subject).
6. **Schedule** the exam – try entering a conflicting time to see the error message.
7. After a conflict‑free schedule, click **Generate Seating**.
8. Assign an **Invigilator** (faculty) manually or click *Auto‑Balance*.
9. Publish the timetable (admin action).
10. Switch to the **Student** account – the published timetable appears with seat number and a *Download Hall Ticket* button.
11. Switch to the **Faculty** account – view assigned invigilation duties and download the duty roster PDF.

## Known Issues / TODO
- Unit tests are not yet integrated into CI.
- Role‑based navigation for faculty/student dashboards needs minor UI polishing.
- PDF styling could be improved (font sizes, page breaks).
- Add pagination to large tables (students, audit logs).

## License
MIT – feel free to fork, modify, and deploy.

---
*Generated with Antigravity AI.*
