# Healthcare Diet Management System - Complete Documentation

**Project Name:** Diet Management & AI Meal Analysis App  
**Date:** May 18, 2026  
**Version:** 2.0 (3-Meal Restructure)  
**Stack:** React Native (Expo) | Node.js/Express | MongoDB | Google Gemini API

---

## Table of Contents
1. [System Architecture](#system-architecture)
2. [Workflow](#workflow)
3. [Functional Requirements](#functional-requirements)
4. [Non-Functional Requirements](#non-functional-requirements)
5. [Data Models](#data-models)
6. [API Specifications](#api-specifications)
7. [User Stories](#user-stories)

---

## System Architecture

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React Native (Expo) | Cross-platform mobile app for iOS/Android |
| **Backend** | Node.js/Express | REST API server |
| **Database** | MongoDB + Mongoose | NoSQL document storage |
| **AI Service** | Google Gemini API | Meal image analysis & macro calculation |
| **Authentication** | JWT Tokens | Secure user sessions |
| **File Storage** | Local/Cloud (configurable) | Store meal photos |

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    MOBILE APP (React Native)                │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐   │
│  │  Dietitian  │  │    Patient   │  │   Shared Comps  │   │
│  │ DietDetail  │  │  Dashboard   │  │  LoginScreen    │   │
│  │ Screen      │  │  PatientDiet │  │  Navigation     │   │
│  │             │  │  View        │  │  Auth Handling  │   │
│  └─────────────┘  └──────────────┘  └─────────────────┘   │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP/REST (Axios)
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              BACKEND API (Node.js/Express)                  │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐ │
│  │Auth      │  │Dietitian │  │Patient   │  │Nutrition   │ │
│  │Routes    │  │Routes    │  │Routes    │  │Service     │ │
│  │          │  │          │  │          │  │(AI Calls)  │ │
│  └──────────┘  └──────────┘  └──────────┘  └────────────┘ │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
    ┌────────┐  ┌────────────┐  ┌──────────┐
    │MongoDB │  │Google Gemini│ │File Host │
    │Database│  │API (Vision) │  │(Storage) │
    └────────┘  └────────────┘  └──────────┘
```

### Deployment Architecture

```
LOCAL DEVELOPMENT:
┌──────────────────────────────────────────┐
│ Windows Machine (D:\food)                │
├──────────────────────────────────────────┤
│ Backend: localhost:5000                  │
│ Mobile:  Expo Client (Android/iOS)       │
│ DB:      MongoDB local instance          │
│ Network: Local hotspot @ 10.91.241.37    │
└──────────────────────────────────────────┘

NOTE: Backend server accessible via:
- Local: http://localhost:5000
- Network: http://10.91.241.37:5000
- Mobile app configured to use network IP
```

---

## Workflow

### High-Level Workflow

```
STEP 1: USER REGISTRATION & LOGIN
└─ Patient/Dietitian creates account
└─ JWT token issued
└─ User logged in

STEP 2: DIETITIAN CREATES MEAL PLAN
└─ Dietitian views patient list
└─ Selects patient
└─ Sets daily nutrition goals (1 goal for all meals):
   ├─ Calorie target (e.g., 2000 kcal)
   ├─ Protein target (e.g., 100g)
   ├─ Carbs target (e.g., 250g)
   ├─ Fat target (e.g., 65g)
   └─ Fiber target (e.g., 30g)
└─ Adds foods to 3 meal sessions:
   ├─ Breakfast (8:00 AM)
   ├─ Lunch (12:30 PM)
   └─ Dinner (7:30 PM)
└─ Searches master food database OR adds custom foods
└─ Specifies quantities and units
└─ Sets restricted foods list
└─ Saves plan → AI calculates total macros

STEP 3: PATIENT VIEWS ASSIGNED MEAL PLAN
└─ Patient logs into app
└─ Views diet plan with daily goals displayed
└─ Sees 3 meals with food options
└─ Reads quantity recommendations

STEP 4: PATIENT LOGS MEALS
└─ Patient opens meal logging screen
└─ Takes photo of meal they ate
└─ AI analyzes image:
   ├─ Detects food items
   ├─ Estimates portions
   ├─ Calculates all 5 macros
   └─ Compares to prescribed plan
└─ Log saved to database
└─ Status determined: GOOD / WARNING / EXCEEDED

STEP 5: PATIENT VIEWS DAILY PROGRESS
└─ Dashboard shows remaining macros for today
└─ Calculated as: (daily goal - logged amount)
└─ Color-coded progress bars show status
└─ Real-time updates after each meal log

STEP 6: DIETITIAN MONITORS PATIENT
└─ Dietitian opens AI Monitor tab
└─ Sees all meal logs for patient
└─ Views:
   ├─ Date & meal name
   ├─ Food photo
   ├─ AI-detected items
   ├─ Target vs. actual macros (all 5)
   ├─ Status badge (GOOD/WARNING/EXCEEDED)
   └─ AI feedback message
└─ Can make adjustments to plan as needed
```

### Detailed Actor Workflows

#### **Dietitian Workflow: Creating/Editing Diet Plan**

```
START: DietDetailScreen (Edit Plan Tab)
│
├─ 1. FETCH PATIENT DATA
│  └─ GET /api/dietitian/patient/:patientId/diet
│     └─ Returns: current dietPlan with sessions, goals, avoidables
│
├─ 2. DISPLAY GOAL SETTING SECTION
│  └─ Show 5 input fields:
│     ├─ Calorie Target (default: 2000)
│     ├─ Protein Target (default: 100g)
│     ├─ Carbs Target (default: 250g)
│     ├─ Fat Target (default: 65g)
│     └─ Fiber Target (default: 30g)
│
├─ 3. DISPLAY RUNNING TOTALS (REAL-TIME)
│  └─ Calculate from current meal plan:
│     └─ Sum of all foods' macros
│     └─ Show progress bars with color coding:
│        ├─ 0-75% of goal = GREEN
│        ├─ 75-100% of goal = YELLOW
│        └─ >100% of goal = RED
│
├─ 4. MANAGE MEALS (3 sessions)
│  ├─ Breakfast (8:00 AM)
│  ├─ Lunch (12:30 PM)
│  └─ Dinner (7:30 PM)
│  │
│  └─ For Each Session:
│     ├─ Display current food items
│     ├─ Allow SEARCH FOOD button
│     │  └─ Opens modal with filtered master foods
│     │     ├─ User types search query
│     │     ├─ FlatList shows matching foods
│     │     └─ User taps to add (copies all properties)
│     │
│     ├─ Allow ADD CUSTOM button
│     │  └─ Creates blank food item with:
│     │     ├─ Custom category name (user types)
│     │     ├─ Empty options array
│     │     ├─ Default qty: 1
│     │     └─ Default unit: portion
│     │
│     ├─ For Each Food Item:
│     │  ├─ Show category name
│     │  ├─ Show available options (read-only reference)
│     │  ├─ Input: quantity value
│     │  ├─ Input: unit (ml, g, cup, piece, etc.)
│     │  └─ Delete button (removes item)
│     │
│     └─ Running totals update LIVE
│
├─ 5. SET RESTRICTED FOODS
│  └─ Text input: "e.g., Sugar, Sweets, Deep Fried..."
│
├─ 6. SAVE PLAN
│  └─ PUT /api/dietitian/patient/:patientId/diet-full
│     ├─ Payload:
│     │  ├─ sessions (all 3 with updated items)
│     │  ├─ avoidables (restricted foods string)
│     │  └─ dailyGoals (all 5 targets)
│     │
│     └─ Backend Response:
│        ├─ Call nutritionService.calculateAndFillNutrition()
│        ├─ Calculate total macros from all foods
│        ├─ Save totalDailyTarget to database
│        └─ Return updated dietPlan with calculations
│
└─ END: Show "Diet Plan Saved & Macros Calculated!" message
```

#### **Dietitian Workflow: Monitoring Patient Meals**

```
START: DietDetailScreen (AI Monitor Tab)
│
├─ 1. FETCH ALL MEAL LOGS
│  └─ GET /api/dietitian/patient/:patientId/all-logs
│     └─ Returns: array of DailyLog documents
│
├─ 2. DISPLAY LOGS IN CHRONOLOGICAL ORDER
│  └─ For Each Log (newest first):
│     │
│     ├─ Header Card:
│     │  ├─ Date (e.g., "5/18/2026")
│     │  ├─ Meal name (Breakfast/Lunch/Dinner)
│     │  └─ Status badge:
│     │     ├─ GOOD (green) = within 10% of goal
│     │     ├─ WARNING (yellow) = 10-20% off goal
│     │     └─ EXCEEDED (red) = >20% off goal
│     │
│     ├─ Food Image
│     │  └─ Tap to view full resolution
│     │
│     ├─ AI Analysis Results:
│     │  ├─ "AI Detected: Chicken Rice, Salad, etc."
│     │  └─ List of food items identified
│     │
│     ├─ Macro Comparison Table:
│     │  ├─ Column 1: Nutrient (Calories/Protein/Carbs/Fat/Fiber)
│     │  ├─ Column 2: Target (from prescribed plan)
│     │  ├─ Column 3: Actual (from AI analysis, highlighted in blue)
│     │  │
│     │  └─ All 5 rows:
│     │     ├─ Calories: 650 / 750
│     │     ├─ Protein: 25g / 30g
│     │     ├─ Carbs: 80g / 90g
│     │     ├─ Fat: 18g / 20g
│     │     └─ Fiber: 6g / 8g
│     │
│     └─ AI Feedback Message
│        ├─ Green box: "Good job! Well within targets"
│        └─ Orange box: "WARNING: High sodium, watch salt intake"
│
└─ END: Swipe to view more logs
```

#### **Patient Workflow: Viewing Diet Plan**

```
START: PatientDietView Screen
│
├─ 1. FETCH DIET PLAN
│  └─ GET /api/patient/my-diet/:patientId
│     └─ Returns: dietPlan with sessions and dailyGoals
│
├─ 2. DISPLAY DAILY GOALS CARD
│  └─ Show 5 badges:
│     ├─ 🔥 Calories: 2000 kcal
│     ├─ 💪 Protein: 100g
│     ├─ 🍞 Carbs: 250g
│     ├─ 🥑 Fat: 65g
│     └─ 🌾 Fiber: 30g
│
├─ 3. DISPLAY 3 MEAL SESSIONS (SWIPEABLE)
│  └─ Horizontal FlatList with pagination
│     │
│     ├─ BREAKFAST CARD:
│     │  ├─ Title: "Breakfast"
│     │  ├─ Time: "🕒 8:00 AM"
│     │  └─ For Each Food:
│     │     ├─ Name: "Oatmeal"
│     │     ├─ Options: "With milk, With water, Dry"
│     │     ├─ Target: "1 Cup"
│     │     └─ Note: "(Swipe for next meal)"
│     │
│     ├─ LUNCH CARD: (Swipe right)
│     │  └─ Similar structure
│     │
│     └─ DINNER CARD: (Swipe right)
│        └─ Similar structure
│
└─ END: Can swipe between meals
```

#### **Patient Workflow: Logging Meals**

```
START: PatientDashboard Screen
│
├─ 1. FETCH TODAY'S MEALS LOGGED
│  └─ GET /api/patient/:patientId/today-logs/:date
│     └─ Returns: array of logs for today
│
├─ 2. DISPLAY REMAINING MACROS CARD
│  └─ Calculate for each macro:
│     └─ Remaining = dailyGoal - (sum of logged meals)
│     │
│     └─ Show 5 rows:
│        ├─ Calories: 2000 - 650 = 1350 remaining
│        ├─ Protein: 100 - 25 = 75g remaining
│        ├─ Carbs: 250 - 80 = 170g remaining
│        ├─ Fat: 65 - 18 = 47g remaining
│        └─ Fiber: 30 - 6 = 24g remaining
│
├─ 3. TAKE MEAL PHOTO
│  └─ Tap "LOG MEAL" button
│     ├─ Open camera or gallery (expo-image-picker)
│     ├─ Select/capture photo
│     └─ Show preview
│
├─ 4. SUBMIT FOR AI ANALYSIS
│  └─ POST /api/patient/:patientId/analyze-meal
│     ├─ Send: photo file + sessionName + date
│     │
│     └─ Backend:
│        ├─ Call Gemini Vision API
│        ├─ Get: detected items + macro estimates
│        ├─ Compare: actual vs. prescribed (from dietPlan)
│        ├─ Determine status: GOOD/WARNING/EXCEEDED
│        ├─ Generate feedback
│        └─ Save as DailyLog document
│
├─ 5. DISPLAY RESULT
│  └─ Show:
│     ├─ "✅ Meal Logged Successfully!"
│     ├─ AI detected: "Chicken, Rice, Broccoli"
│     ├─ Macros added to today's total
│     └─ Remaining macros updated in real-time
│
└─ END: User can log more meals or view dashboard
```

---

## Functional Requirements

### F1: User Authentication
- **Description:** Secure user login and registration
- **Actors:** Patient, Dietitian
- **Preconditions:** User has not logged in
- **Steps:**
  1. User enters email and password
  2. System validates credentials against MongoDB
  3. On success: JWT token issued
  4. User redirected to dashboard
- **Postconditions:** User authenticated, token stored on device
- **Priority:** CRITICAL
- **Status:** Implemented ✅

### F2: Dietitian Creates Patient Diet Plan
- **Description:** Dietitian can create/edit comprehensive meal plan with nutrition goals
- **Actors:** Dietitian
- **Preconditions:** Dietitian logged in, patient selected
- **Steps:**
  1. Dietitian sets 5 daily nutrition goals (1 goal, all meals)
  2. Adds foods to 3 meal sessions (Breakfast, Lunch, Dinner)
  3. Can search master food database
  4. Can add custom foods
  5. Specifies quantities and units
  6. Sets list of restricted foods
  7. Saves plan
- **Data Used:** DietPlan model, masterDietData
- **Postconditions:** Plan saved, macros calculated via AI
- **Priority:** CRITICAL
- **Status:** Implemented ✅

### F3: Real-Time Running Totals
- **Description:** Display cumulative nutrition macros as dietitian edits plan
- **Actors:** Dietitian
- **Preconditions:** Dietitian in Edit Plan tab
- **Steps:**
  1. Dietitian adds/edits food items
  2. System automatically calculates sum of all foods' macros
  3. Displays totals with progress bars
  4. Color codes: GREEN (0-75%), YELLOW (75-100%), RED (>100%)
- **Postconditions:** User sees live feedback on plan balance
- **Priority:** HIGH
- **Status:** Implemented ✅

### F4: Food Search Modal
- **Description:** Search and select foods from master database
- **Actors:** Dietitian
- **Preconditions:** Edit Plan tab, user taps "Search Food"
- **Steps:**
  1. Modal opens with search input
  2. User types food name (e.g., "Rice")
  3. FlatList filters masterDietData in real-time
  4. User taps food item
  5. Food added to selected meal session
  6. Modal closes, running totals update
- **Data Used:** masterDietData.js (7 sessions × food categories)
- **Postconditions:** Food item added to session
- **Priority:** HIGH
- **Status:** Implemented ✅

### F5: Custom Food Addition
- **Description:** Dietitian can add custom foods not in master database
- **Actors:** Dietitian
- **Preconditions:** Edit Plan tab, user taps "Add Custom"
- **Steps:**
  1. Blank food item created in session
  2. Dietitian can edit:
     - Category name (custom text)
     - Quantity value
     - Unit (ml, g, cup, piece, etc.)
  3. Item appears in session list
  4. Can be deleted if needed
- **Postconditions:** Custom food persisted in dietPlan
- **Priority:** MEDIUM
- **Status:** Implemented ✅

### F6: Patient Views Assigned Diet Plan
- **Description:** Patient can view the meal plan assigned by dietitian
- **Actors:** Patient
- **Preconditions:** Patient logged in
- **Steps:**
  1. Patient navigates to "My Diet Plan"
  2. System fetches dietPlan with dailyGoals
  3. Displays daily nutrition goals (5 macros)
  4. Shows 3 meals (Breakfast, Lunch, Dinner) as swipeable cards
  5. Each meal shows food items with options and target quantities
- **Data Used:** DietPlan model
- **Postconditions:** Patient informed of meal plan
- **Priority:** CRITICAL
- **Status:** Implemented ✅

### F7: AI Meal Analysis
- **Description:** AI analyzes meal photos and estimates macros
- **Actors:** Patient, AI Service (Google Gemini)
- **Preconditions:** Patient logged in, photo selected
- **Steps:**
  1. Patient takes/selects photo of meal
  2. System calls Gemini Vision API
  3. API detects food items in photo
  4. API estimates portions and calculates macros:
     - Calories
     - Protein (g)
     - Carbs (g)
     - Fat (g)
     - Fiber (g)
  5. System compares actual vs. prescribed amounts
  6. Determines status: GOOD / WARNING / EXCEEDED
  7. Generates feedback message
  8. Saves as DailyLog document
- **External Service:** Google Gemini Pro Vision API
- **Postconditions:** Meal logged, available on dashboard
- **Priority:** CRITICAL
- **Status:** Implemented ✅

### F8: Remaining Macros Calculation
- **Description:** Show patient how many macros they can still consume today
- **Actors:** Patient
- **Preconditions:** Patient logged in, at least 1 meal logged today
- **Steps:**
  1. System fetches today's logs
  2. Sums all macro amounts from logs
  3. Calculates: Remaining = dailyGoal - sum
  4. Displays 5 rows showing remaining amounts
  5. Updates in real-time after each meal log
- **Data Used:** DailyLog collection, DietPlan.dailyGoals
- **Postconditions:** Patient sees remaining allowance
- **Priority:** HIGH
- **Status:** Implemented ✅

### F9: Dietitian Monitors Patient Meals
- **Description:** Dietitian views all meal logs for a patient
- **Actors:** Dietitian
- **Preconditions:** Dietitian in AI Monitor tab
- **Steps:**
  1. System fetches all DailyLog entries for patient
  2. Displays logs in chronological order (newest first)
  3. For each log shows:
     - Date & meal name
     - Meal photo
     - AI-detected foods
     - Macro comparison table (target vs. actual, all 5)
     - Status badge (GOOD/WARNING/EXCEEDED)
     - AI feedback message
  4. Dietitian can assess patient compliance
  5. Can make plan adjustments as needed
- **Data Used:** DailyLog collection, DietPlan
- **Postconditions:** Dietitian has visibility into patient nutrition
- **Priority:** HIGH
- **Status:** Implemented ✅

### F10: Nutrition Goal Setting
- **Description:** Dietitian sets personalized daily nutrition targets
- **Actors:** Dietitian
- **Preconditions:** Dietitian in Edit Plan tab
- **Steps:**
  1. Dietitian sees 5 input fields:
     - Calorie target (default: 2000)
     - Protein target (default: 100g)
     - Carbs target (default: 250g)
     - Fat target (default: 65g)
     - Fiber target (default: 30g)
  2. Can modify any value
  3. Same goal applies to all 3 meals
  4. Saved on plan save
- **Data Used:** DietPlan.dailyGoals
- **Postconditions:** Goals persisted, shown to patient
- **Priority:** CRITICAL
- **Status:** Implemented ✅

### F11: Restricted Foods List
- **Description:** Dietitian specifies foods patient must avoid
- **Actors:** Dietitian
- **Preconditions:** Dietitian in Edit Plan tab
- **Steps:**
  1. Text input field: "Restricted Foods"
  2. Dietitian enters comma-separated list
  3. Example: "Sugar, Sweets, Deep Fried, High Sodium"
  4. Saved on plan save
  5. Displayed to patient for reference
- **Data Used:** DietPlan.avoidables
- **Postconditions:** Patient aware of dietary restrictions
- **Priority:** MEDIUM
- **Status:** Implemented ✅

### F12: Macro Calculation Service
- **Description:** Backend calculates total macros from meal plan
- **Actors:** Backend service
- **Preconditions:** Dietitian saves diet plan
- **Steps:**
  1. Backend receives sessions with food items
  2. For each food item:
     - Look up nutritional values from food database
     - Multiply by quantity
     - Sum across all foods
  3. Calculate totals:
     - Total calories
     - Total protein (g)
     - Total carbs (g)
     - Total fat (g)
     - Total fiber (g)
  4. Save as totalDailyTarget in DietPlan
- **External Service:** Gemini API (or nutritional database)
- **Postconditions:** totalDailyTarget saved
- **Priority:** HIGH
- **Status:** Implemented ✅

---

## Non-Functional Requirements

### NFR1: Performance

#### Response Time
- **Requirement:** API responses < 2 seconds under normal load
- **Scope:** All endpoints except image analysis
- **Measurement:** Monitor server logs, APM tools
- **Status:** Monitored during testing

#### Image Analysis Response
- **Requirement:** Meal photo analysis (Gemini API call) < 5 seconds
- **Justification:** Network + AI processing time
- **Scope:** `/api/patient/:patientId/analyze-meal`
- **Status:** Dependent on Gemini API performance

#### UI Responsiveness
- **Requirement:** Touch interactions respond < 100ms
- **Scope:** Button taps, modal opens, FlatList scrolling
- **Technology:** React Native optimizations, memoization
- **Status:** Implemented

#### Real-Time Running Totals
- **Requirement:** Totals update < 50ms after user input
- **Scope:** DietDetailScreen running totals
- **Technology:** useState + useMemo hooks
- **Status:** Implemented ✅

### NFR2: Scalability

#### Database Scalability
- **Requirement:** Support up to 10,000 patient records
- **Current State:** MongoDB document-based, indexed queries
- **Indexes Created:**
  ```
  DietPlan: { patientId: 1 }
  DailyLog: { patientId: 1, date: 1 }
  User: { email: 1, role: 1 }
  ```
- **Future Plan:** Implement pagination for large datasets

#### API Scalability
- **Requirement:** Handle 100 concurrent users
- **Current Tech:** Node.js event-driven, single-threaded
- **Scaling Strategy:**
  - Load balancer (Nginx)
  - Horizontal scaling (multiple server instances)
  - Database read replicas
  - CDN for static assets
- **Status:** Basic implementation, scaling ready

#### File Storage Scalability
- **Requirement:** Store meal photos efficiently
- **Current:** Local filesystem or cloud storage (AWS S3 compatible)
- **Optimization:**
  - Image compression before storage
  - Size limit: 5MB per photo
  - Cleanup old logs after retention period
- **Status:** Implemented

### NFR3: Security

#### Authentication & Authorization
- **JWT Tokens:** 24-hour expiration
- **Password Hashing:** bcryptjs (salted, 10 rounds)
- **Authorization Levels:**
  - Patient: Can only access own diet plan & logs
  - Dietitian: Can access assigned patients only
  - Admin: Full system access (future)
- **Status:** Implemented ✅

#### Data Encryption
- **HTTPS/SSL:** Required for production
- **Database:** MongoDB authentication required
- **Sensitive Data:** Passwords hashed, tokens signed
- **Status:** Configurable in deployment

#### API Security
- **CORS:** Configured for mobile app domain only
- **Rate Limiting:** 100 requests/minute per user (configurable)
- **Input Validation:** All inputs sanitized
- **SQL Injection:** MongoDB doesn't use SQL (safe)
- **Status:** Implemented ✅

#### Photo Privacy
- **Meal Photos:** Stored securely, accessible only to patient & assigned dietitian
- **Retention Policy:** Delete after 90 days (configurable)
- **Access Logs:** Track who views patient data
- **Status:** Implemented (access control in routes)

### NFR4: Reliability

#### Uptime
- **Target:** 99.5% availability (45 minutes downtime/month)
- **Strategy:**
  - Health check endpoints
  - Automated restart on failure
  - Redundant database backups
- **Status:** Development phase, production ready

#### Error Handling
- **Try-Catch Blocks:** All async operations wrapped
- **Graceful Degradation:** App continues if non-critical features fail
- **User Feedback:** Clear error messages displayed
- **Logging:** All errors logged to server
- **Status:** Implemented ✅

#### Data Backup
- **Frequency:** Daily automated backups
- **Retention:** 30-day rolling backup window
- **Recovery:** Restore to any point within 30 days
- **Status:** MongoDB Atlas automatic backups (production)

#### Offline Support (Future)
- **Requirement:** Allow basic functionality without internet
- **Current:** Mobile app shows cached data
- **Future:** Implement service workers, local database sync
- **Status:** Not yet implemented

### NFR5: Usability

#### Intuitive UI
- **Design Patterns:**
  - Consistent color scheme (medical theme: blues, greens)
  - Clear hierarchy (headers, sections, actions)
  - Standard React Native components
- **User Testing:** Validated with healthcare professionals
- **Status:** User-approved in development ✅

#### Accessibility (A11y)
- **Text Contrast:** WCAG AA compliant (4.5:1 ratio)
- **Font Sizes:** Minimum 14pt readable
- **Touch Targets:** Minimum 44x44 pt (Apple HIG)
- **Screen Reader Support:** Semantic HTML/view labels (future)
- **Status:** Partially implemented, full implementation planned

#### Mobile Responsiveness
- **Platforms:** iOS 13+ and Android 8+
- **Screen Sizes:** Tested on 5.0" to 6.5" screens
- **Orientation:** Supports both portrait and landscape
- **Status:** React Native handles automatically ✅

#### Localization (Future)
- **Languages:** Currently English, extensible to other languages
- **Currencies:** Currently USD, configurable
- **Date Formats:** Locale-aware formatting
- **Status:** Framework ready, not yet implemented

### NFR6: Maintainability

#### Code Quality
- **Language:** JavaScript/TypeScript
- **Linting:** ESLint configured
- **Code Style:** Consistent formatting (Prettier)
- **Documentation:** Inline comments for complex logic
- **Status:** Implemented ✅

#### Modular Architecture
- **Separation of Concerns:**
  - Screens: UI components
  - Routes: API endpoint handlers
  - Models: Database schemas
  - Services: Business logic (nutrition calculations)
- **Reusable Components:** Shared UI components
- **Status:** Well-structured ✅

#### Version Control
- **System:** Git (GitHub/GitLab ready)
- **Branching:** Feature branches, main/develop
- **Commits:** Descriptive commit messages
- **Status:** Repository initialized ✅

#### Testing Framework (Future)
- **Unit Tests:** Jest + React Native Testing Library
- **Integration Tests:** API endpoint testing
- **E2E Tests:** Detox for mobile UI testing
- **Coverage Target:** 80%+ code coverage
- **Status:** Not yet implemented

### NFR7: Compatibility

#### Cross-Platform
- **iOS:** Minimum version 13.0
- **Android:** Minimum version 8.0 (API level 26)
- **Testing:** Regular testing on multiple devices
- **Status:** Expo handles compatibility ✅

#### API Compatibility
- **REST Conventions:** RESTful design
- **Versioning:** `/api/v1/` prefix (future)
- **Backward Compatibility:** Maintain existing endpoints
- **Status:** Ready for versioning

#### Database Compatibility
- **MongoDB Version:** 4.4+
- **Mongoose:** Compatible ODM
- **Cloud Deployments:** MongoDB Atlas, self-hosted
- **Status:** Flexible, cloud-ready ✅

### NFR8: Compliance & Privacy

#### HIPAA Compliance (Healthcare)
- **Patient Privacy:** Encrypt patient health information
- **Access Controls:** Role-based access control (RBAC)
- **Audit Logs:** Track all data access
- **Data Retention:** Comply with retention policies
- **Status:** Framework implemented, full compliance in production phase

#### GDPR Compliance (EU)
- **Data Subject Rights:** Right to access, delete, export
- **Consent Management:** Explicit consent collection
- **Data Processing:** Transparent processing policies
- **DPA:** Data Processing Agreement with third parties
- **Status:** Documented, implementation in progress

#### Data Protection
- **PII Masking:** Sensitive data masked in logs
- **Encryption:** AES-256 for stored data (production)
- **Tokenization:** Tokens used instead of credentials
- **Status:** Basic implementation, enhanced for production

### NFR9: Portability

#### Data Export
- **Format:** JSON/CSV export of patient data
- **Scope:** Diet plans, meal logs, nutrition history
- **Frequency:** On-demand exports
- **Status:** Planned for future release

#### API-First Design
- **Current:** Frontend consumes REST API
- **Future:** Enables third-party integrations
- **WebHooks:** Notify external systems of events
- **Status:** API designed for extensibility ✅

#### Cloud Readiness
- **Containerization:** Docker support (planned)
- **Orchestration:** Kubernetes-ready (planned)
- **CI/CD:** GitHub Actions integration (planned)
- **Status:** Architecture supports cloud deployment

### NFR10: Monitoring & Support

#### Logging
- **Server Logs:** Error, warning, info levels
- **Database Logs:** Query monitoring
- **Client Logs:** Crashes, errors sent to server
- **Retention:** 30-day log retention
- **Status:** Implemented ✅

#### Metrics & Analytics
- **User Engagement:** Active users, session duration
- **Feature Usage:** Which features used most
- **Performance:** API response times, error rates
- **Tools:** Google Analytics (mobile), custom logging
- **Status:** Basic analytics implemented

#### User Support
- **Documentation:** In-app help section (planned)
- **Support Portal:** Email support endpoint (planned)
- **FAQ:** Comprehensive FAQ (planned)
- **Status:** Support structure ready

---

## Data Models

### User Model (Authentication)

```javascript
{
  _id: ObjectId,
  email: String (unique),
  password: String (bcrypt hashed),
  role: String (enum: 'patient', 'dietitian', 'admin'),
  profile: {
    firstName: String,
    lastName: String,
    phone: String,
    dateOfBirth: Date,
    gender: String (enum: 'M', 'F', 'Other'),
    profilePhoto: String (URL)
  },
  medicalHistory: {
    conditions: [String], // e.g., ['Diabetes', 'Hypertension']
    allergies: [String],
    medications: [String]
  },
  // For patients: assigned dietitian
  assignedDietitian: ObjectId (ref: User),
  
  // For dietitians: list of assigned patients
  assignedPatients: [ObjectId] (ref: User),
  
  createdAt: Date,
  updatedAt: Date
}
```

### DietPlan Model (Meal Planning)

```javascript
{
  _id: ObjectId,
  patientId: ObjectId (ref: User),
  
  // Daily nutrition goals (1 goal shared by all meals)
  dailyGoals: {
    calorieTarget: Number (default: 2000),
    proteinTarget: Number (default: 100),
    carbsTarget: Number (default: 250),
    fatTarget: Number (default: 65),
    fiberTarget: Number (default: 30)
  },
  
  // 3 meals only
  sessions: [
    {
      sessionName: String (enum: 'Breakfast', 'Lunch', 'Dinner'),
      time: String (e.g., '8:00 AM'),
      items: [
        {
          categoryName: String (e.g., 'Rice'),
          options: [String], (e.g., ['White Rice', 'Brown Rice'])
          quantityValue: String (e.g., '1'),
          unit: String (e.g., 'cup', 'g', 'ml', 'piece')
        }
      ]
    }
  ],
  
  // Restricted foods for patient
  avoidables: String (e.g., 'Sugar, Sweets, Deep Fried'),
  
  // AI-calculated totals
  totalDailyTarget: {
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number,
    fiber: Number
  },
  
  // Daily allowances (optional)
  dailyAllowances: {
    oil: { value: String, unit: String },
    sugar: { value: String, unit: String },
    water: { value: String, unit: String },
    salt: { value: String, unit: String }
  },
  
  createdAt: Date,
  updatedAt: Date
}
```

### DailyLog Model (Meal Tracking)

```javascript
{
  _id: ObjectId,
  patientId: ObjectId (ref: User),
  date: Date (YYYY-MM-DD),
  sessionName: String (enum: 'Breakfast', 'Lunch', 'Dinner'),
  
  // Photo & AI Analysis
  imageUrl: String (URL to stored photo),
  aiDetectedItems: [String], (e.g., ['Chicken', 'Rice', 'Broccoli'])
  
  // Prescribed macros from diet plan
  prescribedMacros: {
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number,
    fiber: Number
  },
  
  // Actual macros from AI analysis
  actualMacros: {
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number,
    fiber: Number
  },
  
  // Status determined by comparing prescribed vs actual
  status: String (enum: 'GOOD', 'WARNING', 'EXCEEDED'),
  
  // AI feedback message
  feedback: String (e.g., "Good portion! Stay under salt next time."),
  
  createdAt: Date,
  updatedAt: Date
}
```

---

## API Specifications

### Authentication Routes

#### POST `/api/auth/register`
- **Description:** Create new user account
- **Payload:**
  ```json
  {
    "email": "user@example.com",
    "password": "securePassword123",
    "role": "patient",
    "firstName": "John",
    "lastName": "Doe"
  }
  ```
- **Response (200):**
  ```json
  {
    "message": "User registered successfully",
    "userId": "507f1f77bcf86cd799439011",
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
  ```
- **Errors:** 400 (invalid email), 409 (email exists), 500 (server error)

#### POST `/api/auth/login`
- **Description:** Authenticate user and receive JWT token
- **Payload:**
  ```json
  {
    "email": "user@example.com",
    "password": "securePassword123"
  }
  ```
- **Response (200):**
  ```json
  {
    "message": "Login successful",
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "role": "patient",
      "profile": { "firstName": "John", "lastName": "Doe" }
    }
  }
  ```
- **Errors:** 401 (invalid credentials), 404 (user not found)

---

### Dietitian Routes

#### GET `/api/dietitian/patients`
- **Description:** Get list of all patients
- **Headers:** `Authorization: Bearer <token>`
- **Response (200):**
  ```json
  [
    {
      "_id": "507f...",
      "email": "patient1@example.com",
      "profile": { "firstName": "Jane", "lastName": "Doe" }
    }
  ]
  ```

#### GET `/api/dietitian/patient/:patientId/diet`
- **Description:** Get patient's current diet plan with goals
- **Response (200):**
  ```json
  {
    "_id": "507f...",
    "patientId": "507f...",
    "dailyGoals": {
      "calorieTarget": 2000,
      "proteinTarget": 100,
      "carbsTarget": 250,
      "fatTarget": 65,
      "fiberTarget": 30
    },
    "sessions": [
      {
        "sessionName": "Breakfast",
        "time": "8:00 AM",
        "items": [...]
      }
    ],
    "totalDailyTarget": { "calories": 1950, "protein": 98, ... }
  }
  ```

#### PUT `/api/dietitian/patient/:patientId/diet-full`
- **Description:** Save complete diet plan with daily goals
- **Payload:**
  ```json
  {
    "sessions": [
      {
        "sessionName": "Breakfast",
        "time": "8:00 AM",
        "items": [
          {
            "categoryName": "Oatmeal",
            "options": ["With milk", "With water"],
            "quantityValue": "1",
            "unit": "cup"
          }
        ]
      }
    ],
    "avoidables": "Sugar, Deep Fried",
    "dailyGoals": {
      "calorieTarget": 2000,
      "proteinTarget": 100,
      "carbsTarget": 250,
      "fatTarget": 65,
      "fiberTarget": 30
    }
  }
  ```
- **Response (200):**
  ```json
  {
    "message": "Diet plan saved successfully",
    "dietPlan": { ... (updated plan with calculated macros) }
  }
  ```

#### GET `/api/dietitian/patient/:patientId/all-logs`
- **Description:** Get all meal logs for patient (for monitoring)
- **Response (200):**
  ```json
  [
    {
      "_id": "507f...",
      "date": "2026-05-18",
      "sessionName": "Breakfast",
      "imageUrl": "https://...",
      "aiDetectedItems": ["Oatmeal", "Milk", "Banana"],
      "prescribedMacros": { "calories": 500, ... },
      "actualMacros": { "calories": 480, ... },
      "status": "GOOD",
      "feedback": "Good portion!"
    }
  ]
  ```

---

### Patient Routes

#### GET `/api/patient/my-diet/:patientId`
- **Description:** Get patient's assigned diet plan
- **Response (200):** (Same as GET `/api/dietitian/patient/:patientId/diet`)

#### POST `/api/patient/:patientId/analyze-meal`
- **Description:** Analyze meal photo with AI
- **Payload:** FormData with image file
  ```
  photo: <binary image data>
  sessionName: "Breakfast"
  date: "2026-05-18"
  ```
- **Response (200):**
  ```json
  {
    "message": "Meal analyzed successfully",
    "log": {
      "_id": "507f...",
      "aiDetectedItems": ["Chicken", "Rice", "Salad"],
      "actualMacros": {
        "calories": 650,
        "protein": 28,
        "carbs": 75,
        "fat": 18,
        "fiber": 5
      },
      "status": "GOOD",
      "feedback": "Well balanced meal! Good protein content."
    }
  }
  ```
- **Errors:** 400 (no image), 500 (API error)

#### GET `/api/patient/:patientId/today-logs/:date`
- **Description:** Get all meal logs for a specific date
- **Response (200):**
  ```json
  [
    {
      "_id": "507f...",
      "sessionName": "Breakfast",
      "actualMacros": { "calories": 480, "protein": 15, ... }
    },
    {
      "_id": "507f...",
      "sessionName": "Lunch",
      "actualMacros": { "calories": 620, "protein": 30, ... }
    }
  ]
  ```

#### POST `/api/patient/:patientId/update-weight`
- **Description:** Update patient's weight (for medical records)
- **Payload:**
  ```json
  {
    "weight": 75.5,
    "unit": "kg",
    "date": "2026-05-18"
  }
  ```
- **Response (200):**
  ```json
  {
    "message": "Weight updated",
    "user": { "_id": "...", "profile": { "weight": 75.5 } }
  }
  ```

---

## User Stories

### Epic 1: Diet Plan Management

#### US1.1: Create Initial Diet Plan
```gherkin
Given a dietitian has logged in
When the dietitian selects a patient from the list
And opens the "Edit Plan" tab
Then the system displays an empty diet plan
And the dietitian can set daily nutrition goals
And the dietitian can add foods to 3 meal sessions
And the dietitian can save the plan

Acceptance Criteria:
- Goals default to recommended values
- 3 meals are pre-labeled (Breakfast, Lunch, Dinner)
- Save button sends data to backend
- Macros are calculated after save
- Patient receives notification (future)
```

#### US1.2: Modify Diet Plan
```gherkin
Given a diet plan already exists for a patient
When the dietitian opens the "Edit Plan" tab
Then the dietitian sees all previous goals and foods
And the dietitian can modify any goal value
And the dietitian can add/remove/edit foods
And the dietitian can change restricted foods list
And the dietitian can save changes

Acceptance Criteria:
- Previous data pre-fills all fields
- Running totals update as user edits
- Save updates totalDailyTarget
- Changes don't affect patient's historical logs
```

#### US1.3: Search Master Food Database
```gherkin
Given a dietitian is editing a diet plan
When the dietitian taps "Search Food" in a meal session
Then a modal opens with a search input
And the dietitian types a food name
And the system filters masterDietData in real-time
And the dietitian taps a food item
Then the food is added to the session
And the modal closes
And running totals update

Acceptance Criteria:
- Search is case-insensitive
- Partial matches work (typing "ric" shows "Rice")
- Food properties (options, qty, unit) are copied
- Duplicate foods can be added
```

#### US1.4: Add Custom Food
```gherkin
Given a dietitian is editing a diet plan
When the dietitian taps "Add Custom" in a meal session
Then a blank food item appears in the session
And the dietitian can edit:
  - Category name
  - Quantity value
  - Unit
And the custom food is saved with the plan

Acceptance Criteria:
- Category field is editable (no dropdown)
- Quantity defaults to "1"
- Unit defaults to "portion"
- Custom foods don't need options
- Can be deleted before saving
```

---

### Epic 2: Patient Meal Tracking

#### US2.1: View Assigned Diet Plan
```gherkin
Given a patient has logged in
When the patient navigates to "My Diet Plan"
Then the system fetches the diet plan
And displays the daily nutrition goals
And shows 3 meal sessions as swipeable cards
And each meal shows food items with options and quantities

Acceptance Criteria:
- Goals display with emoji icons (💪 Protein, 🥑 Fat, etc.)
- Meals are swipeable horizontally
- Each meal shows "Swipe for next meal →" hint
- Food options shown as read-only reference text
- Page is responsive on all screen sizes
```

#### US2.2: Log Meal with Photo
```gherkin
Given a patient is on the dashboard
When the patient taps "Log Meal"
And selects/captures a meal photo
And submits the photo
Then the system calls Gemini Vision API
And receives detected foods and macro estimates
And compares to the diet plan
And determines status (GOOD/WARNING/EXCEEDED)
And saves the log to database
And displays success message with results

Acceptance Criteria:
- Photo can be from camera or gallery
- API call shows loading indicator
- Result shows AI-detected foods
- Status badge is color-coded
- Feedback message is specific to the situation
```

#### US2.3: View Remaining Macros
```gherkin
Given a patient has logged at least one meal today
When the patient views the dashboard
Then the system fetches today's logs
And calculates: Remaining = DailyGoal - Sum(LoggedMacros)
And displays remaining amounts for all 5 macros
And updates in real-time after each new log

Acceptance Criteria:
- Remaining shows both numeric value and bar
- Bar color: GREEN if >25% goal remaining, RED if <5%
- Updates immediately after meal log
- Shows zero or negative if exceeded goal
```

---

### Epic 3: Dietitian Monitoring

#### US3.1: Monitor Patient Meal Logs
```gherkin
Given a dietitian is on the "AI Monitor" tab
When the system fetches all meal logs for the patient
Then logs display in reverse chronological order
And for each log shows:
  - Date and meal name
  - Meal photo
  - AI-detected foods
  - Macro comparison table (target vs actual, all 5)
  - Status badge (GOOD/WARNING/EXCEEDED)
  - AI feedback message
And the dietitian can assess patient compliance

Acceptance Criteria:
- At least 5 logs display with pagination
- Photos are clickable to view full resolution
- Actual values are highlighted in blue
- Feedback is contextual (e.g., "High sodium")
- Empty state shows "No meal logs yet"
```

#### US3.2: Provide Feedback to Patient
```gherkin
Given a dietitian is reviewing meal logs
When the dietitian identifies trends or issues
Then the dietitian can send messages to patient (future)
Or modify the diet plan
And patient receives notification (future)

Acceptance Criteria:
- Feedback history is maintained
- Patient can view all feedback messages
- Notifications are sent via push (future)
```

---

## Summary Table

| Aspect | Details |
|--------|---------|
| **Architecture** | 3-tier: Mobile UI → Express API → MongoDB |
| **Platforms** | iOS 13+, Android 8+ (React Native) |
| **Users** | Patients, Dietitians, Future: Admins |
| **Meals** | 3 (Breakfast, Lunch, Dinner) |
| **Nutrition Macros** | 5 (Calories, Protein, Carbs, Fat, Fiber) |
| **AI Service** | Google Gemini Pro Vision |
| **Authentication** | JWT tokens, 24-hour expiration |
| **Database** | MongoDB, ~3 collections |
| **Key Features** | Diet planning, food search, meal logging, AI analysis, progress tracking |
| **Deployment** | Local/Cloud ready, Docker-compatible |
| **Security** | HTTPS, password hashing, role-based access control |
| **Status** | Functional, beta-ready |

---

## Document Metadata

- **Last Updated:** May 18, 2026
- **Version:** 2.0 (Post-3-Meal Restructure)
- **Author:** Development Team
- **Approval Status:** Draft
- **Next Review:** June 1, 2026

---

*For questions or updates to this documentation, please contact the development team.*
