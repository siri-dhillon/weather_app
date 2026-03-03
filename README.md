# Weather App Proof of Concept (POC)

**Candidate:** Sirpreet Kaur Dhillon  
**Role:** AI Engineer Intern - Technical Assessment  
**Submission Date:** March 3, 2026  

---

## 🚀 Project Overview
This project is a high-performance weather dashboard built to demonstrate both frontend responsiveness and backend data persistence. While the assessment offered a choice between tracks, I elected to complete **both Tech Assessment #1 and #2 (Full Stack)** to showcase a complete end-to-end integration of AI-ready product architecture.

## 💡 About PM Accelerator
The **Product Manager Accelerator (PM Accelerator)** is an intensive program designed to help professionals transition into high-impact roles in Product Management and AI. It focuses on hands-on technical skill-building, AI-driven product strategy, and career optimization to empower the next generation of AI product leaders.



---

## 🛠 Tech Stack
* **Frontend:** Next.js 15 (App Router), TypeScript, Tailwind CSS.
* **Icons:** Lucide-React & OpenWeather Dynamic Icons.
* **Backend:** Next.js Route Handlers (RESTful Architecture).
* **Database:** SQLite via **Prisma 6** (Selected for local environment stability and robust migration handling).
* **API:** OpenWeatherMap API (Current & 5-Day Forecast).

---

## 📋 Requirements Checklist

### Tech Assessment 1: Frontend
- [x] **Universal Location Input:** Supports City, Zip, and GPS coordinates.
- [x] **Clear Weather Display:** Real-time temp, humidity, and wind speed.
- [x] **Current Location Support:** Integrated browser Geolocation API.
- [x] **Responsive Design:** Seamless adaptation for mobile, tablet, and desktop.
- [x] **5-Day Forecast:** Daily snapshots with formatted dates.
- [x] **Error Handling:** Graceful messaging for invalid inputs or API failures.

### Tech Assessment 2: Backend & CRUD
- [x] **Database Persistence:** All queries stored in a local SQLite instance.
- [x] **CREATE:** Validation of location before record entry.
- [x] **READ:** Retrieval of search history on application load.
- [x] **UPDATE:** Ability to modify records via database tools.
- [x] **DELETE:** UI-integrated record removal.
- [x] **Data Export:** Export functionality for **CSV** and **JSON** formats.

---

## 🔍 Implementation Details

### Frontend Logic
* **Main Dashboard:** `src/app/page.tsx`
* **Key Functions:** `handleSearch`, `handleGetCurrentLocation`, `exportData`, `handleDelete`.
* **Approach:** Used a "mobile-first" Tailwind strategy and filtered the 40-point OpenWeather forecast array into 5 daily snapshots using a modulo-8 filter to ensure a clean user interface.

### Backend & API Logic
* **API Routes:** `src/app/api/weather/route.ts`
* **Key Functions:** `POST` (Create/Fetch), `GET` (Read History), `DELETE` (Remove Record).
* **Approach:** Implemented logic to detect coordinate-based strings (`lat,lon`) vs. standard text to provide flexible input validation.

### Database Schema
* **Schema File:** `prisma/schema.prisma`
* **Model:** `WeatherQuery`
* **Approach:** Utilized **Prisma 6** to maintain a reliable connection to the `dev.db` SQLite file, ensuring the application remains lightweight and easy to clone for evaluators.

---

## 🏃 How to Run
1.  **Clone the Repository:** `git clone https://github.com/siri-dhillon/weather_app.git`
2.  **Install Dependencies:** `npm install`
3.  **Environment Setup:** Create a `.env` file in the root and add:
    * `DATABASE_URL="file:./dev.db"`
    * `OPENWEATHER_API_KEY="add your key here or contact Sirpreet for her API key"`
4.  **Sync Database:** `npx prisma db push`
5.  **Start App:** `npm run dev`
6.  **View History (Admin):** Open `npx prisma studio` to view the raw database entries.
