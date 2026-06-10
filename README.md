# 🥗 OncoDiet — Eat. Log. Heal.

> *Because cancer treatment is hard enough — nutrition shouldn't be guesswork.*

OncoDiet is an AI-powered clinical nutrition app built for oncology care. Patients snap a photo of their meal, and Gemini AI handles the macro math. Dietitians review, correct, and approve — keeping a human always in the loop. No hallucinated data ever touches a patient's record.

> ⚠️ **Disclaimer:** OncoDiet is an academic research prototype. It is not intended to replace professional medical judgment or licensed healthcare providers.

---

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Functional Requirements](#functional-requirements)
- [Non-Functional Requirements](#non-functional-requirements)
- [Installation](#installation)
- [Environment Setup](#environment-setup)
- [Running the App](#running-the-app)
- [Database Collections](#database-collections)
- [Future Enhancements](#future-enhancements)

---

## ✨ Features

- **Role-Based Authentication** — JWT + Email OTP for patients and dietitians
- **Clinical Diet Templates** — High Protein, Liquid, Ryles Tube, Mixie Mashed diets
- **AI Meal Analysis** — Google Gemini Vision API detects food items and estimates macros
- **Human-in-the-Loop (HITL) Approval** — AI results stay pending until a dietitian approves
- **Macro Progress Charts** — Animated circular and bar charts that update only on approval
- **Avoidables Engine** — Restricted food items fed into AI detection context

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Mobile Frontend | React Native (Expo) |
| Backend | Node.js + Express.js |
| Database | MongoDB Atlas |
| AI Vision | Google Gemini API |
| Email / OTP | Nodemailer (Gmail SMTP) |
| Auth | JWT (JSON Web Tokens) |
| HTTP Client | Axios |

---

## 📁 Project Structure

```
food/
├── backend/                          # Node.js + Express server
│   ├── controllers/
│   │   └── authController.js         # Auth logic (OTP, JWT, login)
│   ├── data/                         # Static diet template data
│   ├── models/
│   │   ├── User.js                   # Patient & dietitian schema
│   │   ├── DietPlan.js               # Diet templates and goals
│   │   └── DailyLog.js               # Meal logs and approval status
│   ├── routes/
│   │   ├── auth.js                   # Auth routes
│   │   ├── dietitian.js              # Dietitian-specific routes
│   │   └── patient.js                # Patient-specific routes
│   ├── .env                          # Backend environment variables (never commit)
│   ├── .gitignore
│   ├── package.json
│   └── server.js                     # Express app entry point
│
├── mobile-app/                       # React Native (Expo) frontend
│   ├── hooks/                        # Custom React hooks
│   ├── screens/
│   │   ├── DietDetailScreen.js       # Diet plan detail view
│   │   ├── DietitianDashboard.js     # Dietitian home
│   │   ├── DietitianProfileScreen.js
│   │   ├── LoginScreen.js            # OTP + fast login
│   │   ├── LogMealScreen.js          # Photo upload + quantity input
│   │   ├── PatientDashboard.js       # Patient home + progress charts
│   │   ├── PatientDietView.js        # Assigned diet view
│   │   ├── PatientNavigation.js      # Stack/tab navigator
│   │   ├── PatientProfileScreen.js
│   │   └── ProgressAnalyticsScreen.js
│   ├── scripts/                      # Utility scripts
│   ├── .env                          # Mobile app environment variables (never commit)
│   ├── .gitignore
│   ├── App.js                        # App entry point
│   ├── app.json
│   ├── eslint.config.js
│   ├── package.json
│   └── tsconfig.json
│
└── README.md
```

---

## ✅ Functional Requirements

### 1. Authentication Module
- New patients register with Name, Email, Phone, OP ID, Height, Weight
- OTP (4-digit) is sent via email and expires after single use
- Returning users log in via Phone + OP ID (fast login, no OTP)
- Dietitians log in via Phone 
- On success, a JWT is issued and stored locally via AsyncStorage

### 2. Diet Management Module (Dietitian)
- Select diet template from backend dropdown (High Protein, Liquid, Ryles Tube, Mixie Mashed)
- Manually set daily macro goals: Calories, Protein, Carbs, Fat, Fiber
- Define avoidable foods per patient (passed to Gemini AI as context)
- Add/edit/delete meal session items (Item Name + Quantity)
- Save and update plans per patient using their Phone / OP ID

### 3. Meal Logging Module (Patient)
- Upload meal photo from camera or gallery
- System auto-captures device timestamp (prevents fraudulent logging)
- Input food quantity manually
- Gemini AI detects food items and estimates macros
- Log saved as **PENDING** — not reflected in charts until approved

### 4. Approval Module (Dietitian)
- View all pending meal logs per patient
- Zoom into high-resolution meal photos to verify portions
- Edit AI-generated macro values if inaccurate
- Add clinical feedback notes
- Approve log → status changes to **APPROVED** → patient chart updates instantly

### 5. Progress & Analytics Module (Patient)
- Circular animated progress indicators for Calories
- Horizontal macro bars for Protein, Carbs, Fat, Fiber
- Color shifts to red when a macro threshold is exceeded
- Charts only render data from APPROVED logs

### 6. User Management
- Unique roles: Admin, Dietitian, Patient
- Track height and weight metrics
- Logout clears AsyncStorage session instantly

---

## 🔒 Non-Functional Requirements

### Performance
- API and dashboard responses: **< 3 seconds**
- Gemini AI macro estimation: **< 8 seconds**
- Concurrent image uploads handled via Node.js async architecture (non-blocking)

### Security
- All API routes protected by role-based JWT middleware
- DB queries scoped strictly to MongoDB ObjectIds (no cross-user data leakage)
- OTPs deleted from DB immediately after successful verification (prevents replay attacks)
- SSL/TLS encryption on all client-server communication
- HITL architecture prevents unverified AI data from modifying official patient records

### Availability
- Hosted on scalable cloud infrastructure (Node.js API + MongoDB Atlas)
- Designed for prototype clinical deployment with high-availability considerations

### Scalability
- Diet templates stored in backend DB — new templates can be pushed globally without app updates

### Backup
- MongoDB Atlas automated daily snapshot backups + real-time replication

---

## 🚀 Installation

### Prerequisites

- Node.js v18+
- npm
- Expo Go app on your phone ([Android](https://play.google.com/store/apps/details?id=host.exp.exponent) / [iOS](https://apps.apple.com/app/expo-go/id982107779))
- MongoDB Atlas account
- Google Gemini API key
- Gmail account with App Password enabled

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/food.git
cd food
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Install Mobile App Dependencies

```bash
cd ../mobile-app
npm install
```

---

## ⚙️ Environment Setup

### Backend — create `backend/.env`

```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/dietAppDB?appName=Cluster0
GEMINI_API_KEY=your_gemini_api_key_here
EMAIL_USER=your_gmail_address@gmail.com
EMAIL_PASS=your_gmail_app_password_here
```

### Mobile App — create `mobile-app/.env`

```env
EXPO_PUBLIC_API_URL=http://<your-local-ip>:5000
```

> 💡 Replace `<your-local-ip>` with your machine's local IP (e.g. `10.165.48.37`). Find it by running `ipconfig` (Windows) or `ifconfig` (Mac/Linux). Your phone and laptop must be on the **same Wi-Fi network**.

> 💡 For `EMAIL_PASS` — use a Gmail App Password, not your account password. Generate one at [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords).

> 🔴 **Never commit `.env` files.** Both are already covered by `.gitignore`.

---

## ▶️ Running the App

### Step 1 — Start the Backend

Open a terminal, navigate to the backend folder, and run:

```bash
cd backend
node server.js
```

You should see:
```
Server running on port 5000
MongoDB connected
```

> To auto-restart on file changes, use `nodemon` instead:
> ```bash
> npx nodemon server.js
> ```

### Step 2 — Start the Mobile App

Open a **second terminal**, navigate to the mobile-app folder, and run:

```bash
cd mobile-app
npx expo start
```

Then:
- Scan the QR code with the **Expo Go** app on your phone
- Or press `a` for Android emulator / `i` for iOS simulator

> Make sure your phone and laptop are on the **same Wi-Fi** — otherwise the app won't reach the backend.

---

## 🗄️ Database Collections

| Collection | Key Fields |
|---|---|
| `users` | email, phone, role, opId, height, weight, otp |
| `diet_plans` | patientId, dietCategory, dailyGoals, avoidables, mealSessions |
| `daily_logs` | capturedAt, imageBase64, approvalStatus (PENDING/APPROVED), actualMacros, feedback |

---

## 🔮 Future Enhancements

- ML-based weight-loss trend analysis against macro deficits
- HIS/EMR integration via HL7/FHIR protocols
- WhatsApp meal reminders via Twilio API

---

## 📄 License

This project is developed for academic and research purposes only.
