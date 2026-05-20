# Zyn Admin Panel - Corporate Administration Console

An enterprise-grade, high-performance administration console explicitly engineered to power the **Zyn Constructions Network**. Built on a modern Next.js architecture, this dashboard orchestrates distributed construction site configurations, staff allocations, real-time supply chains, vendor master ledgers, inventory audits, and role-based permissions management.

---

## 🏗️ System Architecture & Stack

- **Frontend Framework**: Built using **Next.js 16 (App Router)** and **React 19** for server-side rendering, layout inheritance, and optimized performance.
- **Type Safety**: Fully integrated with **TypeScript** for robust typing across all data transfer objects, components, and API integrations.
- **Modern Styling**: Styled dynamically via **Tailwind CSS v4** utilizing custom design palettes and a responsive administrative layout.
- **Interactive Maps & Geofencing**: Powered by **Leaflet** and **Google Maps API** integrations to configure site coordinates and support supervisor check-in validation.
- **Data Integration & Persistence**: Connected seamlessly to the central RESTful API engine and integrated with secure **Firebase** cloud client services.
- **Utility Libraries**: Integrates **Lucide React** for modern iconography, **PDF & Image generation** libraries (`jspdf`, `html-to-image`, `html2canvas`) for automated ledger exports, and **Drag & Drop** utilities (`@hello-pangea/dnd`) for interactive task and stage scheduling.

---

## 📁 Repository Structure

```
├── public/               # Static assets, icons, and map components
├── src/                  # Centralized application source code
│   ├── app/              # Next.js App Router route declarations
│   │   ├── (admin)/      # Role-restricted dashboard and operations modules
│   │   │   ├── dashboard/       # Operations summaries and analytical graphics
│   │   │   ├── demands/         # Materials request pipeline and approvals
│   │   │   ├── item-categories/ # Central material category taxonomy
│   │   │   ├── item-master/     # Global inventory catalog registry
│   │   │   ├── menu-config/     # Dynamic sidebar layout & access profiles
│   │   │   ├── payments/        # Ledger entries, payment approvals, TDS & GST
│   │   │   ├── procurements/    # Supplier procurement registry & intake logs
│   │   │   ├── projects/        # Construction project configurations & milestones
│   │   │   ├── staff/           # Staff profiles and compliance logs
│   │   │   ├── stock-inventory/ # Real-time stock movement audits
│   │   │   ├── supply-ledger/   # Site-specific supplier and sub-contractor ledgers
│   │   │   ├── sys-log/         # System logs of administrative interventions
│   │   │   ├── system-settings/ # System-wide properties and configuration variables
│   │   │   ├── user-groups/     # Access levels & security profiles matrix
│   │   │   └── vendor-master/   # Supplier databases and compliance indices
│   │   ├── layout.tsx    # Root layout and global theme structures
│   │   └── page.tsx      # System gatekeeper / Authentication page
│   ├── components/       # Reusable UI components
│   │   ├── layout/       # Sidebar and TopBar navigational frameworks
│   │   └── providers/    # Context providers for theme, authentication, and state
│   └── utils/            # Helper utilities and generation handlers (e.g. PDF reports)
├── package.json          # Node package and script dependencies
├── tsconfig.json         # TypeScript compiler configurations
└── README.md             # Project documentation
```

---

## 🛠️ Main Modules & Capabilities

### 📊 1. Operations Dashboard & Analytics
- **Executive Summaries**: A consolidated executive view featuring dynamic operational statuses, material demands overview, recent procurement activities, and real-time ledger metrics.
- **Attendance Quotas**: Interactive summary panels tracking daily attendance quotas and site activities.

### 🏗️ 2. Project & Geofence Management
- **Geographic Bounding**: Configures and updates central construction site parameters including geographic bounding boxes (geofencing) using integrated map views.
- **Milestone Tracking**: Sets custom budget frameworks, construction phases, and active stage configurations.

### 📋 3. Demands, Procurement & Logistics
- **Material Demands**: Manages procurement pipelines from intake requests to site delivery validation.
- **Double-Entry Auditing**: Real-time stock movement registers with strict double-entry protection and transaction history tracking.

### 💼 4. Procurement Ledgers & Taxation
- **Financial Calculations**: Calculates dynamic tax structures (GST) and tax deductions (TDS) on the fly for precise ledger entry.
- **Statement Exports**: Integrated export modules utilizing `jspdf` to compile and export professional, client-ready transaction statements, invoices, and ledgers in PDF format.

### 👷 5. Workforce & Access Control (RBAC)
- **KYC Registry**: Central staff management dashboard for supervisor profiling and KYC document validation.
- **Role Permissions**: Dynamic role-based configuration allows administrators to customize user-group permission indices, controlling sidebar navigation and module access dynamically.

---

## 🚀 Environment Setup & Installation

### Prerequisites
- **Node.js** `18.x` or higher (LTS recommended)
- **npm** `9.x` or higher

### Standard Installation

1. Clone this repository to your local web project directory:
   ```bash
   git clone https://github.com/VictorBorah/MSK-Darshh-Admin.git admin
   ```

2. Install external package dependencies via `npm`:
   ```bash
   npm install
   ```

3. Establish your localized configuration parameters by creating a secure `.env.local` file in the root directory (copied from your environment baseline template):
   ```env
   # Google OAuth Credentials
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id

   # Interactive Maps Integration
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

   # Firebase Client Config
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

   # REST API Integration Root
   NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com/webservices/v1/

   # Client-Side Security & Communication Encryption
   NEXT_PUBLIC_ENCRYPTION_KEY=your_secure_encryption_key
   ```

4. Launch the local development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) with your browser to view the application.

5. Build the application for production:
   ```bash
   npm run build
   ```
   Start the optimized production server:
   ```bash
   npm run start
   ```
