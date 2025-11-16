# Face Recognition Attendance System — Full Project Guide


# 📌 Project Overview

This system provides:

* **Student login & registration**
* **Teacher login** (admin)
* Student photo upload
* Teacher registers *face descriptors* using face-api.js
* Attendance marking (face recognition side can be added later)
* Student remarks for attendance
* Teacher attendance management (edit/delete)
* CSV export
* Light/Dark theme

Backend: **Node.js + Express + SQLite (better-sqlite3)**
Frontend: **React + Vite + TailwindCSS + DaisyUI + face-api.js**

---

# 📁 Folder Structure

```
face-attendance/
├── README.md
├── backend/
│   ├── index.js
│   ├── db.js
│   ├── auth.js
│   ├── users.js (if added)
│   ├── uploads/
│   ├── models/
│   ├── exports/
│   ├── scripts/export-daily.js
│   └── package.json
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── package.json
    └── src/
        ├── main.jsx
        ├── Router.jsx
        ├── index.css
        ├── components/
        │   ├── ThemeToggle.jsx
        │   └── StudentCard.jsx
        └── pages/
            ├── Login.jsx
            ├── Register.jsx
            ├── StudentDashboard.jsx
            ├── TeacherDashboard.jsx
            ├── AttendanceList.jsx
            └── UsersPage.jsx
```

---

# ⚙️ Backend Setup

## 1️⃣ Install dependencies

```
cd backend
npm install
```

## 2️⃣ Create database

```
node db.js
```

You should see:

```
DB ready
Seeded teacher account...
```

Teacher default login:

```
Email: teacher@school.local
Password: teacher123
```

## 3️⃣ Start backend server

```
npm start
```

Backend runs at:
👉 [http://localhost:4000](http://localhost:4000)

---

# 🎨 Frontend Setup

## 1️⃣ Install dependencies

```
cd frontend
npm install
```

## 2️⃣ Start the development server

```
npm run dev
```

Frontend runs at:
👉 [http://localhost:5173](http://localhost:5173)

---

# 🤖 Face Recognition Model Setup

Download models from:
[https://github.com/justadudewhohacks/face-api.js/tree/master/weights](https://github.com/justadudewhohacks/face-api.js/tree/master/weights)

Required models:

* ssd_mobilenetv1*** files
* face_landmark_68*** files
* face_recognition_model*** files

Place them here:

```
backend/models/
```

The backend already serves them at:

```
http://localhost:4000/models
```

---

# 🧑‍🎓 Student Workflow

### 1. Open frontend → Register

Fill details → upload face photo → register.

### 2. Login

Students login using email & password.

### 3. Upload/Update Photo

StudentDashboard → Upload Photo.

### 4. View Attendance

Students can see:

* Date
* Note
* Status

### 5. Add Remarks

If there is an issue with attendance, student can click **Add Remark**.

---

# 👨‍🏫 Teacher Workflow

### 1. Login

Use seeded teacher account.

### 2. Manage Students

TeacherDashboard → **Manage Students**

* View students
* See uploaded photos
* Click **Register Descriptor** (runs face-api.js in browser)

### 3. Manage Attendance

TeacherDashboard → **View Attendance**

* Filter by class
* Edit timestamp
* Edit notes
* Clear student remarks
* **Delete attendance**

### 4. Export CSV

TeacherDashboard → **Export CSV**
Downloads attendance.csv for today.

### 5. Save Daily Export

Saves CSV into:

```
backend/exports/
```

---

# 🧪 Testing API (Optional)

You can test endpoints using Postman:

* POST /api/register-user
* POST /api/upload-photo
* POST /api/login
* GET /api/attendance
* PUT /api/attendance/:id
* DELETE /api/attendance/:id

---

# 🚀 Deployment Notes

* Use **Node 20 LTS** (not Node 24!).
* Use `pm2` for backend.
* Use `npm run build` for frontend.
* Serve frontend with Nginx.
* Enable HTTPS if using face recognition in production.

---

