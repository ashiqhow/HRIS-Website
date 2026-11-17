# HRIS Portal - Human Resource Information System (MERN Stack)

A modern full-stack Human Resource Information System built with **MongoDB, Express.js, React, and Node.js**, featuring role-based access control (RBAC), personalized dashboards, real-time notification broadcast, **Module 1: Employee and Attendance Management**, and **Module 2: Recruitment and Employee Development**.

---

## 🧭 Core Workflows & Security Foundation

| SL | Common Workflow | Feature Description |
|:---:|---|---|
| **1** | **Registration and Login System** | Secure JWT authentication with bcrypt password hashing. First registered user is automatically promoted to **HR Admin** to bootstrap the organization. |
| **2** | **Role & Access Management** | Granular Role-Based Access Control (**HR Admin**, **Manager**, and **Employee**) with fine-grained permission toggles (`canManageUsers`, `canApproveLeaves`, `canViewSalaries`). |
| **3** | **Dashboard Management** | Role-personalized dashboards: Executive workforce KPIs for HR Admin, department approval queues for Managers, and daily punch cards & timesheets for Employees. |
| **4** | **Notification System** | Centralized notification center with unread badges, automated notifications upon leave decisions, appraisals, training assignments, and HR broadcast capabilities. |
| **5** | **Profile Management** | Permitted self-service profile updates (address, phone, emergency contacts, password change) with read-only access to employee ID, role, department, and salary. |

---

## 📦 Module 1 – Employee and Attendance Management

### 1. Employee Information Management
Centralized digital record-keeping for all employees across the organization:
- **Centralized Digital Records**: Replaces physical paperwork and disparate spreadsheets with searchable, unified employee profiles.
- **Full Employee Lifecycle**: HR administrators can add new employees, update personal and professional data, delete records, and manage employee profiles.
- **Tracked Employee Details**:
  - Employee ID (custom or auto-generated, e.g., `EMP-1042`, `HRA-9021`, `MGR-4190`)
  - Full Name, Work Email, Phone Number, Residential Address, Work Location
  - Department, Designation / Job Title, Date of Joining, Employment Type (Full-time, Part-time, Contract, Intern), Status (Active, Inactive, Suspended)
  - **Salary Information**: Base salary, Currency (USD, EUR, GBP, BDT, etc.), Pay Frequency (Monthly, Bi-weekly, Weekly, Annually)
  - Emergency contact records (Name, Relationship, Phone Number)
- **Role-Aware Access**:
  - **Employees**: View their full profile and update permitted personal information.
  - **Managers**: Scoped directory to search and access records of their respective team members.
  - **HR Administrators**: Full global directory with role assignment, salary administration, and account management.
- **Search & Filtering Engine**: Instant multi-criteria search by **Name**, **Employee ID**, **Department**, and **Designation**, plus CSV export.

### 2. Attendance Management System
Paperless, automated digital attendance and timesheet tracking:
- **Digital Check-In & Check-Out**: Real-time digital clocking station that automatically records precise dates and timestamps.
- **Status Tracking**: Automatically classifies attendance into **Present**, **Late Arrivals** (after 09:30 AM), **Half Day**, and **Absent**.
- **Timesheet History**: Employees can browse their daily and monthly attendance history logs with a dedicated month/year picker.
- **Organizational Monitoring**: Managers monitor their department's attendance, while HR administrators oversee the entire organization.
- **Attendance Summaries and Reports**:
  - Timeframe selector: *Today*, *Last 7 Days*, *This Month*, or custom date ranges.
  - Metrics: Total shifts logged, Punctuality Rate (%), Late arrivals count, Total hours worked, and Average shift length.
  - Department comparison cards with on-time percentage bars.
  - Individual timesheet summaries matrix per employee.
  - **CSV Export & Print Report** capability for HR records and payroll audit.

### 3. Leave Management System
Streamlined online workflow replacing paper leave slips:
- **Online Leave Applications**: Employees submit time-off requests selecting Leave Type (Annual, Sick, Casual, Maternity/Paternity, Unpaid), Start Date, End Date, and detailed reason.
- **Real-Time Leave Balances**: Clear live indicators of remaining balances (e.g. Annual: 14d, Sick: 10d, Casual: 8d) with validation preventing over-allocation.
- **Application Tracking**: Tracks each request dynamically as **Pending**, **Approved**, or **Rejected**.
- **Manager Approval Queue**: Department managers review submissions with one-click Approve/Reject buttons and can provide review comments/feedback.
- **Automated Balance Adjustment**: Upon approval, the system immediately deducts days from the employee's balance and issues an automated decision notification.
- **Leave Reports and Analytics**:
  - Organization-wide leave utilization report by Year and Department.
  - KPI cards: Total Requests, Approved, Rejected, Pending, Days Granted, and Approval Rate.
  - Usage breakdown by Leave Classification.
  - Complete workforce remaining leave balance table.
  - **CSV Export** for HR audit and record-keeping.

---

## 🚀 Module 2 – Recruitment and Employee Development

### 1. Recruitment Management System
Automates vacancy management and candidate pipeline progression:
- **Job Opening Creation**: HR administrators post vacancies with Title, Department, Job Description, Required Qualifications, Employment Type, Work Location, and Application Deadlines.
- **Applicant Tracking Pipeline (ATS)**: Candidates move systematically through recruitment stages:
  1. `Applied`
  2. `Under Review`
  3. `Shortlisted`
  4. `Interview Scheduled`
  5. `Selected`
  6. `Rejected`
- **Candidate Dossier & CV Management**: Store candidate contact details, resumes/portfolios, and cover letters.
- **Manager Collaborative Reviews**: Managers and interviewers submit numeric ratings (1–5 stars) and qualitative interview feedback notes directly on applicant profiles.
- **Recruitment Funnel Analytics**: Live conversion metrics showing candidate drop-off and progression across each stage.

### 2. Payroll Management System
Automates salary calculations and digital compensation management:
- **Automatic Salary Calculation**:
  $$\text{Net Salary} = \text{Basic Salary} + \text{Allowances} + \text{Bonuses} - \text{Deductions}$$
- **Monthly Payroll Generation**: Batch generation for all active employees for any target month and year with custom bonus and tax deduction defaults.
- **Compensation Adjustment**: HR administrators can customize individual employee payroll entries (bonuses, allowances, deductions, payment statuses).
- **Salary History & Audit**: Comprehensive archive of monthly payroll records, searchable by department and payment status (`Pending`, `Processed`, `Paid`).
- **Digital Payslips**:
  - Employees securely view and verify their individual monthly payslips.
  - Printable, official company payslip modal with formatted earnings, deductions, and net payout summary.

### 3. Performance Management System
Replaces manual appraisal forms with centralized performance reviews:
- **Evaluation Periods**: Periodic performance evaluations (`Q1 2026`, `Q2 2026`, `Q3 2026`, `Q4 2026`, `Annual 2026`).
- **Goal-Oriented Assessments**: Managers establish specific goals, define targets, and score achievements (0–100%) with qualitative review notes.
- **Productivity & Overall Scoring**: Continuous scoring sliders for productivity and overall effectiveness.
- **Automated Rating Categorization**:
  - `Excellent` ($\ge 90$)
  - `Very Good` ($75 - 89$)
  - `Good` ($60 - 74$)
  - `Needs Improvement` ($< 60$)
- **Strengths & Growth Feedback**: Qualitative capture of key employee strengths and actionable areas for improvement.
- **Employee Self-Service**: Employees review their appraisal dossier, goal breakdowns, and manager comments in real time.
- **Printable Performance Dossiers**: Full printable appraisal reports with evaluator verification.

### 4. Training Management System
Coordinates skill enhancement programs and workforce learning:
- **Training Program Creation**: HR administrators configure curriculum titles, descriptions, trainer/instructor names, target departments, schedules, and virtual/hall locations.
- **Workforce Enrollment**: Assign individual employees or department cohorts to specific training sessions with automated notification dispatches.
- **Progress & Completion Tracking**:
  - Statuses: `Enrolled`, `In Progress`, `Completed`, `Dropped`.
  - Participant test/course scores (0–100%) and feedback notes.
- **Employee Learning Portal**: Employees view their enrolled courses, schedules, syllabus, and can submit course completion feedback.
- **Completion Analytics & Reporting**:
  - Summary metrics: Total Programs, Total Enrolled, Total Completed, and Organization Completion Rate (%).
  - Printable workforce training log for compliance audits.

---

## 🛠️ Technology Stack & Architecture

| Layer | Technologies | Key Highlights |
|---|---|---|
| **Client** | React 18, Vite, Tailwind CSS, Lucide Icons, React Router 6 | Fast bundle (<130kB gzipped), responsive UI, print styles, modal drawers |
| **Server** | Node.js, Express.js | Modular controllers, JWT authentication, RBAC authorization middleware |
| **Database** | MongoDB, Mongoose 8.x | 8 robust schemas with pre-validate formula calculation, auto-generated IDs |
| **Fallback** | `mongodb-memory-server` | Zero-configuration local development mode with instant in-memory MongoDB |

---

## 🏁 Quick Start Guide

### Prerequisites
- Node.js (v18+ or v20+)
- npm or pnpm

### 1. Setup & Launch Backend
```bash
cd HRIS-Website/server
npm install
npm start
```
*Backend runs on `http://localhost:5000` (auto-connects to `MONGODB_URI` if provided, or launches the embedded in-memory MongoDB server).*

### 2. Setup & Launch Frontend
```bash
cd HRIS-Website/client
npm install
npm run dev
```
*Frontend runs on `http://localhost:3000`.*

### 3. Build Client for Production
```bash
npm --prefix HRIS-Website/client run build
```

### 4. Run Automated Test Verification
```bash
# Run Module 2 Integration Tests
node HRIS-Website/server/test-module2.js
```

---

## 🛡️ Complete REST API Reference

### Core & Auth
| Method | Route | Description | Access |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new account (1st user becomes HR Admin) | Public |
| `POST` | `/api/auth/login` | Authenticate user & issue JWT token | Public |
| `GET` | `/api/auth/me` | Fetch authenticated user session | Authenticated |
| `GET` | `/api/dashboard/stats` | Role-personalized dashboard statistics | Authenticated |
| `GET` | `/api/notifications` | List user notifications | Authenticated |
| `PUT` | `/api/notifications/:id/read` | Mark notification as read | Authenticated |

### Module 1: Employee & Attendance
| Method | Route | Description | Access |
|---|---|---|---|
| `GET` | `/api/users` | Filter employees by Name, ID, Dept, Designation | HR Admin / Manager |
| `POST` | `/api/users` | Add employee with salary and profile details | HR Admin |
| `GET` | `/api/users/:id` | Get single employee digital file | Authenticated |
| `PUT` | `/api/users/:id/role-access` | Update employee role, permissions, and salary | HR Admin |
| `DELETE` | `/api/users/:id` | Delete employee record | HR Admin |
| `POST` | `/api/attendance/check-in` | Punch in timestamp | Authenticated |
| `POST` | `/api/attendance/check-out` | Punch out & calculate work hours | Authenticated |
| `GET` | `/api/attendance/logs` | Browse daily & monthly timesheet history | Authenticated |
| `GET` | `/api/attendance/reports` | Attendance summaries and department metrics | HR Admin / Manager |
| `POST` | `/api/leaves` | Submit online leave request | Authenticated |
| `GET` | `/api/leaves` | List leave requests (personal / team queue) | Authenticated |
| `PUT` | `/api/leaves/:id/review` | Approve/reject leave request with comment | Manager / HR Admin |
| `GET` | `/api/leaves/reports` | Organization leave reports & remaining balances | HR Admin / Manager |

### Module 2: Recruitment & Employee Development
| Method | Route | Description | Access |
|---|---|---|---|
| `GET` | `/api/recruitment/jobs` | List active job openings | Authenticated |
| `POST` | `/api/recruitment/jobs` | Post new job opening | HR Admin |
| `GET` | `/api/recruitment/applicants` | Candidate pipeline by stage/job | HR Admin / Manager |
| `POST` | `/api/recruitment/applicants` | Submit candidate application & CV | Public / HR Admin |
| `PUT` | `/api/recruitment/applicants/:id/stage` | Transition applicant pipeline stage | HR Admin / Manager |
| `POST` | `/api/recruitment/applicants/:id/review` | Add manager review & rating | HR Admin / Manager |
| `GET` | `/api/payroll` | Workforce payroll records and summary | HR Admin |
| `POST` | `/api/payroll/generate` | Batch calculate monthly payroll | HR Admin |
| `PUT` | `/api/payroll/:id` | Adjust basic, allowances, bonuses, deductions | HR Admin |
| `GET` | `/api/payroll/my-payslips` | Employee personal payslip history | Authenticated |
| `GET` | `/api/performance` | Workforce appraisal dossiers and score metrics | HR Admin / Manager |
| `POST` | `/api/performance` | Create performance evaluation with goals & scores | HR Admin / Manager |
| `GET` | `/api/performance/my-appraisals` | Employee personal appraisal evaluations | Authenticated |
| `GET` | `/api/training` | List training programs | Authenticated |
| `POST` | `/api/training` | Create training program | HR Admin |
| `POST` | `/api/training/:id/assign` | Enroll employees into training program | HR Admin / Manager |
| `PUT` | `/api/training/:id/participants/:employeeId` | Update employee status, score, & feedback | Authenticated |
| `GET` | `/api/training/my-trainings` | Employee assigned training programs | Authenticated |
| `GET` | `/api/training/reports` | Completion analytics & workforce learning reports | HR Admin / Manager |
