# VICOBA Collaborative Banking & Secure Meeting Frontend

A modern, highly responsive Next.js 16 and React 19 web application serving as the user interface for the **VICOBA (Village Community Banking) & Virtual Private Meeting Platform**. Built with Tailwind CSS v4, Zustand, and Live Sessions WebRTC, this frontend delivers a premium, secure, and responsive dashboard for collaborative micro-banking and encrypted virtual group meetings.

---

## 🚀 Key Features

### 1. Unified Authentication (`(auth)`)
- **Secure Onboarding**: Complete sign-up flow supporting localized user profile configuration.
- **Account Verification**: Dedicated landing path to consume Django Djoser verification tokens seamlessly.
- **Credential Recovery**: Multi-stage password reset/recovery interfaces.
- **Cookie-backed Auth**: Deep integration with Django JWT cookies (`access`/`refresh`) for secure session recovery.

### 2. User Home Dashboard (`(home)`)
- Overview of all active and pending VICOBA group memberships.
- Direct quick-join actions for ongoing virtual meetings.
- Unread notification center tracking group alerts, invitations, meeting schedules, and financial transactions.

### 3. VICOBA Group Spaces (`group/[groupId]`)
- **Overview Dashboard**: High-fidelity visual metrics displaying group capital pools, personal savings, active loans, and due fines.
- **Savings / Contributions**: Record contributions with transaction reference numbers. Verification flow for Treasurers to mark contributions as `Verified` or `Rejected`.
- **Loan Desk**:
  - Browse group-specific Loan Categories (duration, interest rate, limit).
  - Multi-step Loan Request workflow.
  - Administration panel to approve or reject pending loans.
  - Loan Repayment modal with reference checks.
- **Fines / Penalties**: Lists issued fines with status (Paid/Unpaid) and instant repayment integrations.
- **Meeting Center**:
  - Schedule and list upcoming virtual banking meetings.
  - Review archived meetings, attendee stats, and historical meeting minutes.
- **Active Video Conference**: High-fidelity Live Session meeting room. Includes real-time audio/video stream controls, screen sharing, automatic presence/attendance logs, and collaborative live minutes logging.
- **Members Ledger**: Member list showing active status, verified state, and role assignments (Chairperson, Treasurer, Secretary, Member).
- **Settings**: Administrative settings for the Chairperson to customize group metadata or dissolve the group.

### 4. System Administration Workspace (`admin`)
- High-level oversight panel for platform operators.
- Complete search, edit, and ban controls for user accounts.
- Complete tracking of active VICOBA groups globally.

---

## 🛠️ Technology Stack

| Technology | Purpose | Description |
| :--- | :--- | :--- |
| **Next.js 16.2.5** | Core Framework | App Router architecture, server/client component optimization. |
| **React 19.2.4** | UI Runtime | State, effects, and modern hooks integration. |
| **Tailwind CSS v4** | Style Engine | Dynamic variables, glassmorphism, premium typography, and theme scaling. |
| **Zustand 5.0.12** | State Manager | Decoupled client-side data stores for auth, group state, and notifications. |
| **Live Sessions SDK** | Real-time WebRTC | High-performance audio, video, and screen-sharing client components. |
| **Axios** | HTTP Client | Network layer with custom interceptors for CSRF handling and auth token refreshing. |
| **React Hook Form + Zod** | Form Validation | Strict schema validation and performance-optimized input structures. |
| **Radix UI** | Accessible Primitives | Keyboard-accessible, robust components (Dialogs, Dropdowns, Sheets). |
| **Lucide React** | Icon Suite | Premium vector iconography throughout the system. |
| **XLSX** | Data Export | Generate Excel reports for group savings, loans, and meeting attendances. |

---

## 📂 Project Directory Structure

```text
frontend/
├── public/                 # Static assets (logos, fallback images)
└── src/
    ├── api/                # Network abstraction layer
    │   ├── services/       # Feature-specific API calls (auth, group, meeting, admin)
    │   ├── axios.ts        # Axios client instance with cookie interceptors
    │   └── endpoints.ts    # Centralized URL directory matching Django routes
    ├── app/                # Next.js App Router (Routing Tree)
    │   ├── (auth)/         # Unprotected routes (login, register, activate, reset)
    │   ├── (protected)/    # Private authenticated pages
    │   │   ├── (admin)/    # Administrative control panel routes
    │   │   └── (user)/     # Standard user dashboards, groups, and meetings
    │   ├── globals.css     # Tailwind imports and theme styling variables
    │   └── layout.tsx      # Main application frame and Toastify wrappers
    ├── components/         # Reusable presentation and interaction components
    ├── hooks/              # Custom React hooks (presence, responsiveness triggers)
    ├── lib/                # Client configurations and utility helpers
    ├── store/              # Zustand global client-side state slices
    │   ├── auth/           # Active session state, profile info
    │   ├── group/          # Group balance sheets, savings, loans lists
    │   ├── meeting/        # Meeting state, ongoing participant listing
    │   └── notifications/  # Notification center badge & messages array
    └── types/              # Unified TypeScript definitions and interfaces
```

---

## 💻 Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn

### 1. Install Dependencies
Navigate to the `frontend/` directory and install the packages:
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file in the root of the `frontend/` directory:
```env
# Backend API Base URL
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. Run Development Server
Start the Next.js development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## ⚙️ Development & Production

- **Linter checks**: Verify code consistency by running `npm run lint`.
- **Production Build**: Generate an optimized production package with `npm run build`, then preview it locally using `npm run start`.
