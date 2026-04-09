# 🎓 Smart Edu LMS

A full-stack Learning Management System (LMS) built using the MERN stack, designed to manage courses, users, and academic workflows with a modern UI.

---

## 🚀 Features

* 🔐 User Authentication (Login/Register)
* 👨‍🎓 Role-based Access (Admin / Teacher / Student)
* 📚 Course & Academic Management
* 📊 Dashboard & Analytics
* 🧾 Timetable & Exam Management
* ⚡ Modern UI with React + Vite
* 🌐 REST API with Express.js
* 🗄 MongoDB Database Integration

---

## 🛠 Tech Stack

### Frontend

* React.js
* Vite
* TypeScript
* Tailwind CSS

### Backend

* Node.js
* Express.js
* TypeScript

### Database

* MongoDB Atlas

---

## 📂 Project Structure

```
Smart-edu-lms/
│
├── backend/        # Express server & APIs
├── frontend/       # React client
├── .gitignore
└── README.md
```

---

## ⚙️ Installation & Setup

### 🔹 1. Clone Repository

```
git clone https://github.com/syamli-3/Smart-edu-lms.git
cd Smart-edu-lms
```

---

### 🔹 2. Setup Backend

```
cd backend
npm install
```

Create a `.env` file inside `backend/`:

```
PORT=5000
STAGE=development
CLIENT_URL=http://localhost:5173
MONGO_URL=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

Run backend:

```
npm run dev
```

---

### 🔹 3. Setup Frontend

Open new terminal:

```
cd frontend
npm install
npm run dev
```

---

## 🌐 Running the App

* Frontend: http://localhost:5173
* Backend: http://localhost:5000

---

## 🔐 Authentication Notes

* Register & Login APIs are available
* Some routes are protected and require authentication
* Role-based access control implemented (Admin/Teacher)

---

## ⚠️ Known Issues

* Some UI buttons may require backend authentication setup
* Navigation for certain actions is under development

---

## 🚀 Future Improvements

* Complete application flow (Apply / Enrollment)
* Improved UI/UX interactions
* Deployment (Docker / Cloud)
* Email notifications
* Payment integration

