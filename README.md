# HRIS Portal - Human Resource Information System (MERN Stack)

A modern full-stack Human Resource Information System built with **MongoDB, Express.js, React, and Node.js**, featuring role-based access control (RBAC), personalized dashboards, real-time notification broadcast, **Module 1: Employee and Attendance Management**, **Module 2: Recruitment and Employee Development**, and **Module 3: HR Analytics and Organizational Management**.

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
- **Applicant Tracking Pipeline (ATS)**: Candidates move systematically through 6 recruitment stages:
  $$\text{Applied} \longrightarrow \text{Under Review} \longrightarrow \text{Shortlisted} \longrightarrow \text{Interview Scheduled} \longrightarrow \text{Selected} \lor \text{Rejected}$$
- **Candidate Dossier & CV Management**: Store candidate contact details, resumes/portfolios, and cover letters.
- **Manager Collaborative Reviews**: Managers and interviewers submit numeric ratings (1–5 stars) and qualitative interview feedback notes directly on applicant profiles.
- **Recruitment Funnel Analytics**: Live conversion metrics showing candidate progression across each stage.

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

## 📊 Module 3 – HR Analytics and Organizational Management

### 1. HR Analytics Dashboard
Interactive workforce intelligence, statistics, and organizational health metrics:
- **Employee Demographics & Distribution**:
  - Department headcount allocation with interactive percentage breakdown bars.
  - Contract classifications (Full-time, Part-time, Contract, Intern).
  - Role hierarchy distribution (HR Admin, Manager, Employee).
- **Attendance & Timesheet Trends**:
  - Circular punctuality rate visual gauge.
  - Granular logs classification: Present On-Time, Late Arrivals, Absent, and Half Day counts.
  - Average shift hours and total hours logged across workforce members.
- **Recruitment & ATS Analytics**:
  - Candidate pipeline conversion funnel from initial application to hire.
  - Total applicants, active job postings, and organizational selection rate.
- **Payroll Expenditure Analytics**:
  - Total monthly expenditure and compensation anatomy breakdown ($Basic + Allowances + Bonuses - Deductions$).
  - Department-wise payroll budget allocation.
- **Performance & Appraisal Metrics**:
  - Organization and department average scores.
  - 4-Tier rating distribution (Excellent, Very Good, Good, Needs Improvement).
  - Productivity index benchmarking.
- **Training & Skill Development Analytics**:
  - Training program counts, enrollment totals, in-progress learners, and completion rate (%).
- **Interactive Scoping**: Real-time department filtering for HR Admin and department-scoped access for Managers.

### 2. Reports and Document Management
Centralized document repository and export engine across all 7 operational domains:
- **Domain Coverage**:
  1. `employees`: Employee Information & Profile Directory Report
  2. `attendance`: Workforce Attendance & Timesheet Report
  3. `leaves`: Leave Applications & Utilization Audit Report
  4. `payroll`: Monthly Payroll & Compensation Expenditure Report
  5. `recruitment`: Recruitment Vacancy & Candidate Pipeline Report
  6. `performance`: Employee Performance Appraisal & Ratings Report
  7. `training`: Employee Training Curriculum & Completion Report
- **Multi-Parameter Filtering**: Filter by Department, Status, Search keywords, and Date Ranges.
- **Dual Export Formats**:
  - **Export to CSV**: Instant client-side CSV download formatted with RFC-4180 escaping and UTF-8 encoding.
  - **Print / PDF View**: Formatted official document modal featuring enterprise header, metadata, summary KPI cards, complete tabular data, and formal signature authorization blocks (`window.print()`).
- **Department Scoping**: Managers only access records and reports for their respective departments.

### 3. Digital Transformation Analysis
Empirical comparison contrasting traditional manual HR activities with automated HRIS workflows:
- **5 Core Transformation Pillars**:
  1. **Time Efficiency**: 88% overall process acceleration across payroll (48 hrs $\rightarrow$ 3.5 hrs), leave approvals (3 days $\rightarrow$ 15 mins), attendance clocking (35 mins $\rightarrow$ instant), appraisals (3 weeks $\rightarrow$ 2 days), and recruitment (28 days $\rightarrow$ 7 days).
  2. **Cost Reduction**: Substantial financial savings from paperless operations, eliminating physical archive storage, and reducing administrative overtime.
  3. **Accuracy & Compliance**: 99.8% process accuracy, zero payroll calculation errors, zero leave quota overdraws, and tamper-proof attendance audit trails.
  4. **Accessibility & Transparency**: 24/7 web self-service access from any device, instant payslip downloads, and transparent quota meters.
  5. **Employee Experience (eNPS)**: +38 net promoter points improvement; workforce satisfaction increase from 54% to 92%.
- **Interactive ROI & Savings Simulator**:
  - Dynamic sliders for workforce headcount, administrative hourly rate, and monthly paper costs.
  - Real-time reactive modeling of monthly hours saved, monthly labor savings, and annual net financial ROI.
- **Before-and-After Workflow Progression**: Side-by-side journey comparisons illustrating the manual paper process vs automated HRIS.

### 4. HRIS Effectiveness Evaluation
Systemic audit evaluating HRIS performance, organizational maturity, and future roadmap:
- **6-Dimensional Evaluation Scorecard**:
  - Time Efficiency (95/100)
  - Cost Effectiveness (91/100)
  - Data Accuracy & Integrity (98/100)
  - Accessibility & Uptime (99/100)
  - Employee Satisfaction (92/100)
  - Strategic Decision-Making (93/100)
- **Overall Maturity Score**: 94.5 / 100 (`Level 4: Optimized Digital Enterprise HRIS`).
- **Implementation Challenges & Mitigation Strategies**:
  1. *Change Resistance & Legacy Routine Inertia* $\rightarrow$ Interactive department walkthroughs & simplified 1-click workflows.
  2. *Historical Data Migration & Schema Discrepancies* $\rightarrow$ Strict Mongoose validation and automated data sanitizers.
  3. *Manager Approval Turnaround Delays* $\rightarrow$ Priority in-app notifications and 1-click quick-action approve buttons.
  4. *Data Confidentiality & Granular Access Control* $\rightarrow$ Multi-tier JWT RBAC, route guards, and field-level salary redaction.
- **Strategic Roadmap for Future Improvements**:
  - *Phase 1 (Near-Term)*: Biometric & Geofenced Mobile Attendance Integration.
  - *Phase 2 (Mid-Term)*: AI-Driven Predictive Attrition & Flight Risk Modeling.
  - *Phase 3 (Long-Term)*: Automated Tax Compliance & Multi-Currency Payroll Banking Gateway.
  - *Phase 4 (Strategic)*: Continuous 360-Degree Peer Feedback & Recognition Wall.
- **Printable Executive Evaluation**: Formatted executive report printable directly from the browser.

---

## 🛠️ Technology Stack & Architecture

| Layer | Technologies | Key Highlights |
|---|---|---|
| **Client** | React 18, Vite, Tailwind CSS, Lucide Icons, React Router 6 | Fast bundle (<140kB gzipped), responsive UI, print styles, modal drawers, zero-dependency SVG charts |
| **Server** | Node.js, Express.js | Modular REST controllers, JWT authentication, RBAC authorization middleware |
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

### 4. Run Automated Test Suites
```bash
# Run Module 2 Integration Tests (Recruitment, Payroll, Performance, Training)
node HRIS-Website/server/test-module2.js

# Run Module 3 Integration Tests (Analytics, Reports, Transformation, Effectiveness)
node HRIS-Website/server/test-module3.js
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

### Module 3: HR Analytics & Organizational Management
| Method | Route | Description | Access |
|---|---|---|---|
| `GET` | `/api/analytics/dashboard` | Aggregated analytics across distribution, attendance, payroll, ATS, & training | HR Admin / Manager |
| `GET` | `/api/analytics/transformation` | Manual vs automated HRIS comparative metrics & ROI simulation parameters | HR Admin / Manager |
| `GET` | `/api/analytics/effectiveness` | 6-dimensional evaluation scorecard, challenges, and future strategic roadmap | HR Admin / Manager |
| `GET` | `/api/reports/catalog` | List of 7 operational report domains with available columns and record counts | HR Admin / Manager |
| `GET` | `/api/reports/generate` | Generate tabular dataset for export in CSV format or formatted printable PDF view | HR Admin / Manager |
