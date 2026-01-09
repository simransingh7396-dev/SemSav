View app in AI Studio: https://ai.studio/apps/drive/19bServ4dcZarq5XxFqQYsUv8MO1_qiuI
   
# 🎓 Open-Verse (Semester Saviours)

![Status](https://img.shields.io/badge/Status-Hackathon_Prototype-orange?style=for-the-badge&logo=fire)
![AI](https://img.shields.io/badge/AI-Gemini_2.0_Flash-blue?style=for-the-badge&logo=google-gemini)
![Stack](https://img.shields.io/badge/Tech-React_19_|_Tailwind_|_IndexedDB-cyan?style=for-the-badge&logo=react)

> **"Chaos, Organized."**  
> The decentralized, crowdsourced academic command center that turns chaotic WhatsApp groups into a streamlined intelligence dashboard.

---

##  The Problem (The "Why")

*   **Information Fragmentation:** Critical deadlines and exam dates are lost in a sea of spam across hundreds of WhatsApp groups and email threads.
*   **The Trust Deficit:** Rumors about "Class Cancellations" or "Rescheduled Exams" spread like wildfire without verification.
*   **Manual Friction:** Digitizing handwritten blackboard notes is tedious. Students take photos, but they get lost in their gallery and are never searchable.

##  The Solution (The "What")

**Open-Verse** is a Progressive Web Application (PWA) that acts as a single source of truth. It centralizes notes, deadlines, and alerts into one real-time, peer-verified dashboard.

###  Key Innovations

1.  ** The Security Gate (Custom Auth Protocol):**
    *   We moved beyond standard email logins. We utilize a **Mock Enrollment ID System** that restricts access to verified student IDs (e.g., `24CSE001`).
    *   *Implementation:* Simulated OTP and branch-specific logic ensures a trusted private network.

2.  ** The AI "Wow" Factor (Multimodal Gemini Integration):**
    *   **Snap & Sync:** Users take a photo of a handwritten syllabus or blackboard.
    *   **Intelligence:** We utilize the **Google Gemini API (Model: `gemini-2.0-flash-exp`)** to parse the image.
    *   **Action:** The AI extracts the `Subject`, `Assignment Title`, and `Deadline` (YYYY-MM-DD) and auto-populates the calendar.
    *   **PDF-to-Notes:** Upload a 50MB PDF, and Gemini acts as an expert tutor, generating structured study notes and summaries instantly.

3.  **  Trust Protocol (Peer Verification):**
    *   To kill spam, uploads enter a **Verification Queue**.
    *   Peers must verify content. Content only goes "Live" to the dashboard after receiving **5 Upvotes**.
    *   Items with excessive downvotes are automatically purged.

4.  ** Gamification (Karma Hub):**
    *   Contributors earn **XP** and **Karma Points** for every verified upload.
    *   Users climb the "Hall of Saviours" leaderboard, turning academic help into a competitive sport.

---

## 🔄 App Usage Flow (User Journey)

### 1.  Authenticate (The Gate)
*   **Action:** Launch the app and select "Register".
*   **Input:** Enter a valid ID (e.g., `24CSE001`), Branch, and Mobile Number.
*   **Verification:** The system simulates an OTP sent to your mobile. Enter the code shown in the in-app notification to enter the "Private Network".

### 2.  Contribute (The Engine)
*   Navigate to the **Upload** tab.
*   **Option A (AI Power):** Click "AI Image Extraction". Upload a photo of a handwritten assignment or blackboard. Watch Gemini parse the text and auto-fill the form.
*   **Option B (PDF Agent):** Upload a PDF. Click "Generate AI Study Notes" to have Gemini summarize the document into a cheat sheet or u can upload whithout using ai.
*   **Commit:** Submit the data. It does *not* go live immediately.

### 3. Validate (The Filter)
*   Navigate to the **Review** tab.
*   You will see contributions from other students in your branch.
*   **Vote:** Verify the information.
    *   **Upvote:** If accurate. (Needs 5 to go live).
    *   **Downvote:** If spam/fake. (5 downvotes delete the item).

### 4. Consume (The Value)
*   Once verified, items appear on the **Feed (Dashboard)**.
*   **Deadlines:** Appear in the Timeline view.
*   **Sync:** Click the **Calendar Icon** on any item to instantly add it to your Google Calendar.

---

## Technical Architecture


| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | **React 19** | Utilizing the latest React features for a snappy UI. |
| **Styling** | **Tailwind CSS** | For a dark-mode first, glassmorphism aesthetic. |
| **Language** | **TypeScript** | Ensuring type safety across our data models. |
| **AI Engine** | **Google GenAI SDK** | Direct integration with Gemini 2.0 Flash (`@google/genai`). |
| **Persistence** | **IndexedDB / LocalStorage** | **Offline-first architecture.** Data is stored locally on the client device for instant access without server latency (Mock Store pattern). |
| **Build Tool** | **Vite** | For lightning-fast HMR and optimized production builds. |

### Data Flow
`User Image Input` -> `React Service` -> `Gemini API` -> `JSON Extraction` -> `Local Store (IndexedDB)` -> `Verification Queue UI`

---
## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
---

##  Testing the Mock Systems

Since this is a hackathon prototype using a **Mock Backend**:

1.  **Login:** Use any valid Enrollment ID format (e.g., `24CSE001`).
2.  **Admin Access:**
    *   **User:** `ADMIN`
    *   **Pass:** `admin`
    *   *Unlocks:* Global delete permissions, Force Verify buttons, and System Logs.
3.  **Calendar Sync:** Click the calendar icon on any deadline to generate a Google Calendar link.

---

##  Future Roadmap

*   **P2P Sync:** Moving from LocalStorage to a decentralized P2P database (like GunDB) to remove server reliance entirely.
*   **Voice Commands:** Using Gemini's audio capabilities to add deadlines verbally.
*   **Canvas/LMS Integration:** Direct two-way sync with university portals.

---

**Built with ❤️ for the Hackathon.**
