# 🏥 CareOS — Hospital Management & Operations Platform

<div align="center">

![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Groq](https://img.shields.io/badge/Groq-F55036?style=for-the-badge&logo=groq&logoColor=white)
![Status](https://img.shields.io/badge/Status-Active%20Development-brightgreen?style=for-the-badge)

**A full-stack, role-based Hospital Management System built on the MERN stack**
*Streamlining patient care, clinical workflows, billing, and hospital operations — end to end.*

</div>

---

## 📋 Table of Contents

<details>
<summary><strong>Click to expand</strong></summary>

- [About the Project](#-about-the-project)
- [Internship & Author Details](#-internship--author-details)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [System Architecture](#-system-architecture)
- [Workflow Diagrams](#-workflow-diagrams)
- [Project Structure](#-project-structure)
- [Backend Folder Structure Deep Dive](#-backend-folder-structure-deep-dive)
- [Database Schema Overview](#-database-schema-overview)
- [Getting Started](#-getting-started)
- [Sample API Calls](#-sample-api-calls)
- [API Reference](#-api-reference)
- [Deployment](#️-deployment)

</details>

---

## 📖 About the Project

**CareOS** is an industrial-grade, multi-role hospital management system engineered to digitize and optimize the complete patient care lifecycle—from initial appointment scheduling to final billing reconciliation. Built following modern product development standards, the platform features a robust service-layer architecture, RESTful API endpoints, secure JWT authentication, advanced MongoDB aggregation pipelines, and an integrated AI clinical assistant complete with persistent conversation history.

The platform supports **six distinct user roles** — Patient, Doctor, Receptionist, Pharmacist, Lab Technician, and Nurse — each with a tailored dashboard and permission set, all backed by a single unified backend.

> This project was built as part of an internship engagement to demonstrate full-stack engineering capability across backend architecture, frontend UX, database design, and deployment practices.

---

## 🎓 Internship & Author Details

| Field | Detail |
|---|---|
| **Project Name** | `CareOS Hospital Management ERP System` |
| **Author** | `Het Limbani` |
| **Role** | `MERN Stack Developer` |
| **Institution** | `Adani University` |
| **Internship Company** | [Covrize IT Solutions Private Limited](https://www.covrize.com/) |
| **Duration** | `Summer Internship  June 1, 2026` – `July 26, 2026` |
| **Live Deployment** | `<DEPLOYED_URL>` |

---

## ✨ Key Features

<details>
<summary><strong>🧑‍⚕️ Patient Module</strong></summary>

- Profile management with medical details, emergency contacts, and insurance info
- Search doctors by specialization and view live availability calendars
- Book, reschedule, and cancel appointments in real time (slot-collision safe)
- View complete prescription history with medicine and lab test breakdowns
- Track diagnostic lab report status and results
- Personal clinical dashboard — allergies, chronic conditions, vitals log
- Domain-restricted AI Assistant with persistent, per-user chat history
- Billing history tracking with insurance verification status (verified or pending) and completed billing information details

</details>

<details>
<summary><strong>🩺 Doctor Module</strong></summary>

- Profile & clinic setup (specialization, fee, qualifications, bio)
- Appointment request management (confirm/reject) with monthly calendar view
- Issue & edit e-prescriptions (medicines + lab test orders) linked to catalogs
- Full patient roster with clinical history timeline per patient
- Review completed diagnostic lab reports
- Manage inpatient ward treatment directives and admission plans

</details>

<details>
<summary><strong>💳 Receptionist Module</strong></summary>

- Visited-queue → auto-aggregated draft invoice generation (consultation + treatment + medicine + lab costs)
- Insurance coverage validation and adjustment charge handling
- Partitioned billing ledger: Unpaid / Insurance Pending / Paid / Cancelled
- Invoice status lifecycle management with payment method tracking
- Appointment management with real-time slot booking, rescheduling, and accept/reject request handling backed by automated email notifications
- Admission processing and dynamic room/bed assignment tracking
- Consultation request management handling incoming walk-in or phone schedules with automated email response dispatch

</details>

<details>
<summary><strong>💊 Pharmacist Modules</strong></summary>

- Prescription-linked medicine dispensing and pharmacy invoice generation
- Medicine inventory management with real-time stock updates, low-stock alerts, and new stock batch registration
- Comprehensive pharmacy billing history with status tracking to view paid, pending, and voided bills instantly

</details>

<details>
<summary><strong>🧪 Lab Technician Modules</strong></summary>

- Manage upcoming lab requests
- Lab test request intake, result upload, and status pipeline tracking
- Comprehensive pharmacy billing history with status tracking to view paid, pending, and voided bills instantly

</details>

<details>
<summary><strong>🧑🏼‍⚕️ Nurse Modules</strong></summary>

- Access assigned patient data including prescription record files and lab report files
- Ward management restricted to assigned patients, including tracking status such as ready for discharge
- Record and store vital logs including Blood Pressure, Heart Rate (BPM), and Temperature (°C), and view Historical Evaluation Logs
- Manage treatment plans prescribed by doctors, execute them to completion, and update treatment plan details as a nurse
</details>

<details>
<summary><strong>🤖 CareOS AI Assistant</strong></summary>

- Domain-restricted conversational assistant (hospital ops only — guardrailed system prompt)
- **Persistent chat sessions** stored per authenticated user in MongoDB
- Multi-session history sidebar — resume, rename, or delete past conversations
- Role-aware quick-action suggestions
- Powered by Groq (Llama 3.3 70B) for low-latency inference

</details>

---

## 🛠 Tech Stack

<details>
<summary><strong>Click to expand full stack breakdown</strong></summary>

### Frontend
| Technology | Purpose |
|---|---|
| **React 18** | Component-based UI |
| **Axios** | HTTP client for API communication |
| **React Router** | Client-side routing |
| **Lucide React** | Icon system |
| **Custom CSS (BEM-style modules)** | Styling, no framework lock-in |

### Backend
| Technology | Purpose |
|---|---|
| **Node.js + Express.js** | REST API server |
| **MongoDB + Mongoose** | Primary data store & ODM |
| **JWT** | Stateless authentication |
| **Groq SDK** | LLM inference for the AI Assistant |
| **bcrypt** | Password hashing |

### DevOps / Tooling
| Technology | Purpose |
|---|---|
| **Vercel** | Frontend + serverless backend deployment |
| **MongoDB Atlas** | Managed cloud database |
| **Postman** | API testing & documentation |
| **Git / GitHub** | Version control |

</details>

---

## 🏗 System Architecture

```mermaid
flowchart TD

subgraph Frontend["🌐 Frontend (React + Vite)"]
    Patient["👤 Patient Portal"]
    Doctor["🩺 Doctor Portal"]
    Receptionist["🧾 Receptionist Portal"]
    Pharmacist["💊 Pharmacist Portal"]
    Lab["🧪 Lab Technician Portal"]
    Nurse["👩‍⚕️ Nurse Portal"]
end

subgraph Backend["⚙️ Express.js Backend"]
    Middleware["Authentication Middleware"]
    Authorization["Role-Based Authorization"]
    Controllers["REST Controllers"]
    Services["Business Logic Services"]

    Auth["Auth Module"]
    Appointment["Appointment Module"]
    DoctorAPI["Doctor Module"]
    Reception["Receptionist Module"]
    Pharmacy["Pharmacy Module"]
    Laboratory["Lab Module"]
    Nursing["Nurse Module"]
    AI["AI Assistant Module"]
end

subgraph Database["☁️ MongoDB Atlas"]
    UserIdentity
    PatientProfile
    DoctorProfile
    AppointmentDB["Appointments"]
    Prescription
    Admission
    WardBed
    Medicine
    LabHistory["Lab Report History"]
    Billing
    ChatSession
end

subgraph External["🤖 External Services"]
    Groq["Groq API"]
    Llama["Llama 3.3 LLM"]
end

Frontend -->|Axios REST API + JWT| Middleware
Middleware --> Authorization
Authorization --> Controllers
Controllers --> Services

Services --> Auth
Services --> Appointment
Services --> DoctorAPI
Services --> Reception
Services --> Pharmacy
Services --> Laboratory
Services --> Nursing
Services --> AI

Auth --> Database
Appointment --> Database
DoctorAPI --> Database
Reception --> Database
Pharmacy --> Database
Laboratory --> Database
Nursing --> Database

AI --> Groq
Groq --> Llama
```

---

## 🔄 Workflow Diagrams

<details>
<summary><strong>1️⃣ Patient Appointment → Consultation → Billing Lifecycle</strong></summary>

```
 [Patient]                [Doctor]              [Receptionist]
     │                        │                        │
     ▼                        │                        │
Search Doctor                 │                        │
by Specialization              │                        │
     │                        │                        │
     ▼                        │                        │
View Live Availability         │                        │
(Month/Date/Slot)              │                        │
     │                        │                        │
     ▼                        │                        │
Book Appointment  ────────────▶  Pending Request         │
  (status: pending)            appears on Doctor         │
                                Dashboard                 │
                                     │                    │
                                     ▼                    │
                          Confirm / Reject                │
                          (status: confirmed/rejected)     │
                                     │                    │
                                     ▼                    │
                          Patient Visits Clinic            │
                                     │                    │
                                     ▼                    │
                          Doctor Issues E-Prescription     │
                          (medicines + lab orders)         │
                                     │                    │
                          ┌──────────┴──────────┐         │
                          ▼                     ▼         │
                   Pharmacist Dispenses   Lab Technician   │
                   Medicines               Processes Tests │
                          │                     │          │
                          └──────────┬──────────┘          │
                                     ▼                      │
                     Appointment marked "Visited/Completed" │
                                     │                      │
                                     ▼                      ▼
                          Appears in Receptionist's   Aggregate Draft
                          Visited Queue         ────▶  Invoice (auto-
                                                        computed costs)
                                                             │
                                                             ▼
                                                  Validate Insurance /
                                                  Add Adjustments
                                                             │
                                                             ▼
                                                  Finalize Invoice
                                                  (Unpaid/Insurance/Paid)
                                                             │
                                                             ▼
                                                  Patient Pays Online
                                                  (UPI/Card/Net Banking)
                                                             │
                                                             ▼
                                                     Invoice → Paid
```

</details>

<details>
<summary><strong>2️⃣ Authentication & Role-Based Routing Flow</strong></summary>

```mermaid
flowchart TD

    A["👤 User submits login credentials"]

    B["📨 POST /api/v1/auth/login"]

    C["🔐 Validate Email & Password<br/>(bcrypt.compare)"]

    D{"Credentials Valid?"}

    E["❌ Return Authentication Error"]

    F["🎟️ Generate JWT<br/>Payload: { id, email, role }"]

    G["💾 Store JWT & User Object<br/>(localStorage / sessionStorage)"]

    H["📡 Client sends API requests<br/>Authorization: Bearer &lt;token&gt;"]

    I["🛡️ protectRoute Middleware<br/>Verify JWT"]

    J{"JWT Valid?"}

    K["❌ Return 401 Unauthorized"]

    L["🔒 requireRole()<br/>Authorize User Role"]

    M{"Role Authorized?"}

    N["❌ Return 403 Forbidden"]

    O["⚙️ Execute Controller & Service"]

    P["📤 Send API Response"]

    Q["🖥️ React Router redirects<br/>to Role Dashboard"]

    A --> B
    B --> C
    C --> D

    D -- "No" --> E
    D -- "Yes" --> F

    F --> G
    G --> H
    H --> I

    I --> J

    J -- "No" --> K
    J -- "Yes" --> L

    L --> M

    M -- "No" --> N
    M -- "Yes" --> O

    O --> P
    P --> Q
```

</details>

<details>
<summary><strong>3️⃣ AI Assistant Chat Persistence Flow</strong></summary>

```mermaid
flowchart TD

    A["👤 User sends message<br/>(with or without sessionId)"]

    B["📨 POST /api/v1/ai/chat"]

    C{"Session ID provided?"}

    D["🆕 Create new ChatSession<br/>Title = First User Prompt"]

    E["📂 Load Existing ChatSession"]

    F["📝 Retrieve Last 20 Messages<br/>for Context Window"]

    G["🛡️ Prepend System Prompt<br/>+ User Role & Email Context"]

    H["🤖 Call Groq API<br/>Llama 3.3 70B"]

    I["💬 Generate AI Response"]

    J["➕ Append User & Assistant Messages<br/>to session.messages[]"]

    K["💾 Save ChatSession"]

    L["📤 Return Reply + sessionId"]

    M["🗂️ Sidebar Refresh<br/>Move Session to Top"]

    A --> B
    B --> C

    C -- "No" --> D
    C -- "Yes" --> E

    D --> G
    E --> F
    F --> G

    G --> H
    H --> I
    I --> J
    J --> K
    K --> L
    L --> M
```

</details>

---

## 📁 Project Structure

```
careos-hospital-management/
│
├── Backend/                       # Node.js + Express API server
│   ├── src/
│   │   ├── modules/                # Feature-based module organization
│   │   │   ├── auth/
│   │   │   ├── patients/
│   │   │   ├── doctor/
│   │   │   ├── receptionist/
│   │   │   ├── pharmacist/
│   │   │   ├── nurse/
│   │   │   ├── lab_technician/
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js
│   │   │   └── errorHandler.js
│   │   ├── service/
│   │   │   ├── ai.service.js
│   │   │   └── email.service.js
│   │   ├── utils/
│   │   │   ├── ai.controller.js
│   │   │   └── ai.routes.js
│   │   │   ├── ai.recaptcha.js
│   │   │   └── ...
│   │   ├── config/
│   │   └── app.js
│   ├── .env.example
│   ├── package.json
│   └── vercel.json
│
├── Frontend/                      # React SPA
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── common/
│   │   │   ├── landing/
│   │   │   ├── patient/
│   │   │   ├── doctor/
│   │   │   ├── receptionist/
│   │   │   ├── pharmacist/
│   │   │   ├── nurse/
│   │   │   ├── lab_technician/
│   │   ├── App.jsx
│   │   └── main.jsx
│   │   ├── App.css
│   │   └── index.css
│   ├── .env.example
│   ├── package.json
│   └── vite.config.js
├── CareOS-Hospital_ERP_System.xlsx
└── README.md
```

---

## 🔍 Backend Folder Structure Deep Dive

<details>
<summary><strong>Backend: modules/ (feature-sliced architecture)</strong></summary>

Each module follows a consistent 4-file pattern for separation of concerns:

```
modules/<feature>/
├── <feature>.model.js         # Mongoose schema
├── <feature>.service.js       # Business logic, DB queries (pure functions)
├── <feature>.controller.js    # Request/response handling, calls service
└── <feature>.routes.js        # Express router, wires middleware + controller
```

**Why this pattern?**
- **Testability** — services are pure functions, easy to unit test without HTTP mocking
- **Reusability** — services can be called from multiple controllers (e.g. AI assistant querying billing service)
- **Scalability** — new features are additive folders, not edits to a monolithic file

Example — `receptionist/` module:
```
receptionist/
├── billing.model.js           # Billing schema (items, status, insurance)
├── billing.service.js         # aggregateDraftInvoiceData(), saveConfirmedLedgerBill()...
├── billing.controller.js      # HTTP handlers
└── billing.routes.js          # /api/v1/receptionist/* routes
```

</details>

---

## 🗄 Database Schema Overview

<details>
<summary><strong>Core Collections</strong></summary>

| Collection | Purpose | Key Relationships |
|---|---|---|
| `UserIdentity` | Base auth identity for all roles | Referenced by every profile collection |
| `PatientProfile` | Medical details, insurance, emergency contacts | `patient_id → UserIdentity` |
| `DoctorProfile` | Specialization, fee, clinic info | `doctor_id → UserIdentity` |
| `PatientDashboard` | Vitals, allergies, chronic conditions | `patient_id → UserIdentity` |
| `Appointment` | Booking records with status lifecycle | `patient_id`, `doctor_id → UserIdentity` |
| `Prescription` | Medicines + lab orders per appointment | `appointmentId → Appointment` |
| `Billing` | Finalized invoices with itemized costs | `appointmentId`, `patientId`, `doctorId` |
| `LabReportHistory` | Diagnostic test pipeline & results | `patientId → UserIdentity` |
| `PharmacyInvoice` | Medicine dispensing records | `appointmentId → Appointment` |
| `ChatSession` | AI assistant persistent conversations | `userEmail → UserIdentity` |

</details>

---

## 🚀 Getting Started

### Prerequisites
```bash
node >= 18.x
npm >= 9.x
MongoDB Atlas account (or local MongoDB instance)
Groq API key (for AI Assistant feature)
```

### Installation

<details>
<summary><strong>1. Clone the repository</strong></summary>

```bash
git clone https://github.com/HetLimbani-learnerboy/CareOS.git
cd CareOS
```

</details>

<details>
<summary><strong>2. Backend setup</strong></summary>

```bash
cd Backend
npm install
cp .env.example .env
# Fill in your MongoDB URI, JWT secret, Groq API key
npm start
```

Server runs on `http://localhost:8000` by default.

</details>

<details>
<summary><strong>3. Frontend setup</strong></summary>

```bash
cd Frontend
npm install
cp .env.example .env
# Set VITE_API_BASE_URL=http://localhost:8000
npm run dev
```

App runs on `http://localhost:5173` by default.

</details>

---

## 📡 Sample API Calls

<details>
<summary><strong>🔑 Login</strong></summary>

**Request**
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "doctor@careos.com",
  "password": "Temp1234!",
  "captchaToken": "<enter_reCAPTCHA_response_token_here>",
  "rememberMe": true
}
```

**Response**
```json
{
    "status": "success",
    "user": {
        "_id": "**",
        "firstName": "Rohan",
        "lastName": "Joshi",
        "email": "doctor@careos.com",
        "countryCode": "+91",
        "phone": "909090909",
        "role": "doctor",
        "profile_image": null,
        "is_verified": true,
        "createdAt": "2026-06-18T16:19:21.449Z",
        "updatedAt": "2026-06-19T00:15:53.723Z",
        "id": 107,
        "__v": 0
    },
    "token": "ey..."
}
```

</details>


## 📚 API Reference

<details>
<summary><strong>Full endpoint index by module</strong></summary>

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/auth/register` | Create new user account |
| POST | `/api/v1/auth/login` | Authenticate & issue JWT |

### Appointments
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/appointments/doctors-by-spec` | Search doctors by specialization |
| GET | `/api/v1/appointments/public-doctor-meta` | Get public doctor profile |
| GET | `/api/v1/appointments/doctor-slots-live` | Live monthly availability |
| GET | `/api/v1/appointments/booked-ledger` | Patient's own appointments |
| POST | `/api/v1/appointments/book-request` | Book / reschedule / cancel |

### Patients
| Method | Endpoint | Description |
|---|---|---|
| GET / PUT | `/api/v1/patients/profile` | Get / update patient profile |
| GET / POST | `/api/v1/patients/dashboard-summary` | Clinical dashboard (vitals, allergies) |
| GET | `/api/v1/patients/prescriptions` | Prescription history |
| GET | `/api/v1/patients/my-reports` | Lab report history |
| GET | `/api/v1/patients/billing-history` | Partitioned billing history |
| POST | `/api/v1/patients/invoice/:invoiceId/pay` | Online payment |

### Receptionist (Billing)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/receptionist/visited-appointments` | Unbilled visited queue |
| GET | `/api/v1/receptionist/draft-invoice/:appointmentId` | Aggregated cost draft |
| POST | `/api/v1/receptionist/finalize-invoice` | Commit invoice |
| GET | `/api/v1/receptionist/billing-history-partition` | Full ledger, partitioned |
| PATCH | `/api/v1/receptionist/invoice/:invoiceId/status` | Update invoice status |

### AI Assistant
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/ai/chat` | Send message (creates/continues session) |
| GET | `/api/v1/ai/sessions` | List user's chat sessions |
| GET | `/api/v1/ai/sessions/:sessionId` | Get full thread |
| PATCH | `/api/v1/ai/sessions/:sessionId` | Rename session |
| DELETE | `/api/v1/ai/sessions/:sessionId` | Delete session |

</details>

## ☁️ Deployment

<details>
<summary><strong>Deploying to Vercel</strong></summary>

Both frontend and backend are configured for Vercel deployment.

**Backend (`vercel.json`)**
```json
{
  "version": 2,
  "builds": [{ "src": "src/app.js", "use": "@vercel/node" }],
  "routes": [{ "src": "/(.*)", "dest": "src/app.js" }]
}
```

**Critical:** cache your MongoDB connection across serverless invocations to avoid exhausting connections — see `docs/DEPLOYMENT_NOTES.md`.

Set all environment variables in **Vercel Project Settings → Environment Variables** for both the frontend and backend projects.

</details>
