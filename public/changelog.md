# Changelog

All notable changes to the **ZYN Construction Management System** (Backend API, Admin Console, and Staff PWA) will be documented in this file in reverse chronological order.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [2026-10-09] - Warehouse Stock Telemetry & Core Syntax Hardening

### Added
- **Warehouse Stock Append-Only Transaction Ledger (`zyn-api/src/Application/Actions/CommonController.php`)**:
  - Re-engineered `handleWarehouseStock()` from an in-place single-row update model into an immutable chronological transaction ledger.
  - For Stock IN: fetches latest closing stock for `(warehouse_id, project_id, item_id)` ordered chronologically by `id DESC LIMIT 1`, calculates `new_closing = old_closing + quantity`, and appends a new row with `qnty_in = quantity`, `qnty_out = 0`, `current_stock = new_closing`, and detailed audit remarks.
  - For Stock OUT: verifies stock availability from latest chronological record, prevents overdraw/negative balance, calculates `new_closing = old_closing - quantity`, and appends a new transaction row with `qnty_in = 0`, `qnty_out = quantity`, `current_stock = new_closing`, and detailed audit remarks.
  - Added descriptive context-aware `sys_remark` logs capturing units received or dispatched with previous and closing balances.

### Fixed
- **Warehouse Stock Management (`zyn-api/src/Application/Actions/CommonController.php`)**:
  - Resolved fatal parse syntax error on line 3638 in `handleWarehouseStock` method (missing array separator comma).
  - Validated syntax integrity across all PHP files in `zyn-api` with zero errors.
  - Committed and pushed to `staging` (`d333f1a3`) and merged into `master` (`ee8358b7`) on `VictorBorah/ZYN-MSK-WEBSERVICE`.

### Changed
- **Procurement Stock Automation (`zyn-api/src/Application/Actions/AppController.php`)**:
  - Added safety guard to prevent invalid stock movements when items have empty or unset `warehouse_id`.
  - Added audit telemetry fields (`record_date`, `record_time`, `sys_remark`) to track automated inventory intake and user-controlled stock transfers.
- **Admin App Warehouses Module (`admin/src/app/(admin)/warehouses/page.tsx`)**:
  - Deployed "MAKE DEFAULT" column and row-level patch interaction to both `staging` (`fde19fd`) and `master` (`148d0c5`) on `VictorBorah/MSK-Darshh-Admin`.

---

## [2026-10-08] - Admin Changelog Viewer & PWA Staging Host Realignment

### Added
- **Admin Changelog Viewer & Markdown Engine (`admin/src/components/changelog.tsx`, `admin/src/app/(admin)/changelog/page.tsx`)**:
  - Implemented dedicated full-featured Changelog Viewer page and component (`changelog.tsx`) rendering changelog markdown to HTML via `marked`.
  - Added interactive release search, category filters (`Added`, `Changed`, `Fixed`, `Security`), metrics overview, and view switcher (Interactive, Rendered HTML, Raw Markdown).
  - Added dedicated 'Changelog' navigation link beside the frontend version indicator on the sidebar (`admin/src/components/layout/Sidebar.tsx`).
  - Bundled changelog markdown dataset into static application assets (`src/data/changelogData.ts` and `public/changelog.md`) ensuring offline and remote static export visibility.

### Changed
- **Warehouses Module UI (`admin/src/app/(admin)/warehouses/page.tsx`)**:
  - Integrated 'MAKE DEFAULT' column with row-level checkboxes preceding the 'DEFAULT' column.
  - Implemented on-check handler with validation toast ("Please select a default warehouse" on uncheck) and automated remote patch via `admin/patchWarehouse` with `is_default=1`, followed by table reload.
- **Warehouse Module & Stock Operations (`zyn-api/src/Application/Actions/AdminController.php`, `AppController.php`)**:
  - Integrated default warehouse setting handler in `AdminController.php` supporting `is_default` parameter with validation and single-default reset logic.
  - Connected automated warehouse stock intake during procurement update in `AppController.php` via `handleWarehouseStock` ('in' transaction).
  - Pushed commit `02141142` to branch `staging` on `VictorBorah/ZYN-MSK-WEBSERVICE`.
- **Admin Home Dashboard (`admin/src/app/(admin)/home/page.tsx`)**:
  - Added dedicated Staging Environment Information panel positioned in a responsive 2-column layout beside the Current Status widget.
  - Displayed environment header: "Zyn Construction Management system has a staging environment for Development & Testing."
  - Embedded quick-access links and endpoints with distinctive iconography for Staging Domain, Admin App, Staff PWA, API Base URL, and MySQL cPanel Database.
  - Committed and pushed changes to `staging` (`8cd3382`) and merged into `master` (`bf908b3`) on `VictorBorah/MSK-Darshh-Admin`.
- **PWA CI/CD Pipeline (`pwa/.github/workflows/main.yml`)**:
  - Realigned staging FTP credentials for the new hosting environment (`server: xlabz.space`, port 21, `username: zynpwa@zynapp.xlabz.space`).
  - Aligned `NEXT_PUBLIC_API_BASE_URL` resolution with Admin console architecture (`https://zynapi.xlabz.space/webservices/v1/` for staging).
  - Pushed commit `637f658` to branch `staging` on `VictorBorah/ZYN-Staff-App` to initiate a fresh build and deploy run.

---

## [2026-10-07] - CI/CD Pipeline, Security Governance & System Documentation

### Added
- **API CI/CD Pipeline (`zyn-api/.github/workflows/deployment.yml`)**:
  - Implemented multi-branch workflow for `staging` and `master` with manual `workflow_dispatch` trigger.
  - Added automated PHP 8.3 setup and dependency building (`composer install --no-dev --optimize-autoloader`) with cache layer.
  - Implemented staging deployment step targeting cPanel FTP (`xlabz.space`, port 21) via `SamKirkland/FTP-Deploy-Action@v4.3.4`.
  - Implemented production deployment step targeting DigitalOcean Droplet (`165.245.152.35`, port 22 SSH) via `rsync` over SSH into `/var/www/zynapi/public`.
  - Resolved production pipeline SSH rejection (`Permission denied (publickey,password)`): identified that the droplet's `/root/.ssh/authorized_keys` was empty, installed the corresponding public key directly onto the DigitalOcean Droplet (`165.245.152.35`), and verified direct passwordless OpenSSH authentication.
  - Standardized production branch trigger strictly to `master` (matching Admin and PWA architectures), removing redundant `main` trigger to prevent duplicate parallel deployments and race conditions.
  - Streamlined `Configure SSH Key for Production Droplet` to directly use unencrypted RSA PEM key without `ssh-agent` or passphrase overhead.
  - Verified staging pipeline success and pushed commits `0739fe29`, `9321d28d`, `de7f5e4b`, and `c90d02dc` to `master` and `main`.
- **System Technical Documentation (`documentation/documentation.md`)**:
  - Created comprehensive 550+ line technical architecture document covering system architecture, data models, API catalog, security model, and operational workflows for Darsh Builders.
- **Central Project Changelog (`changelog/changelog.md`)**:
  - Initialized unified tracking for all development, refactoring, and bug fixes across Backend API, Admin, and Staff PWA.

### Security
- **SSH Key Protection**:
  - Updated `zyn-api/.gitignore` to strictly exclude `ssh-key/`, `*.ppk`, `*.pem`, and `*.key`.
  - Verified local `ssh-key/msk-zyn-production.ppk` remains strictly untracked.
- **Environment Isolation Strategy**:
  - Established persistent server-side `.env` architecture for both Staging and Production.
  - Excluded `.env` from CI/CD overwrite routines (`--exclude '.env'` and `dangerous-clean-slate: false`) to safeguard production credentials.

---

## [2026-09-02] - Staging CI/CD & API Domain Realignment (Admin App)

### Fixed
- **Admin Deployment**:
  - Forced `NEXT_PUBLIC_API_BASE_URL` to `https://zynapi.xlabz.space/webservices/v1/` for staging builds to bypass stale environment secrets.
  - Corrected FTP username mapping for cPanel staging builds (`msk@xlabz.space`).

---

## [2026-08-01] - Project Identification Refactoring (Admin App)

### Changed
- Refactored UI displays across Admin modules from project name labels to concise project codes (`project_code`) for improved readability on data grids.

---

## [2026-07-31] - Purchase Order Concurrency Locking (Admin App)

### Added
- **Procurements**:
  - Added support for `is_locked` attribute handling in purchase modals to prevent concurrent editing of finalized supplier orders.

---

## [2026-07-26] - Purchase Approval Fixes (Admin App)

### Fixed
- Resolved state synchronization bugs during multi-step purchase approval transitions.

---

## [2026-07-22] - Additional Expenses & Table Space Optimization (Admin App)

### Fixed
- Fixed missing additional expenses handling in item configuration modal during new purchase creation.
- Excluded removed items from purchase totals in `ViewPurchaseModal`.
- Optimized vertical layout spacing in purchase overview tables.

---

## [2026-07-21] - Warehouse Binding in Purchase Approval (Admin App)

### Fixed
- Fixed missing warehouse configuration handling during purchase approval workflow.
- Inverted payment mode selection responsibility in purchase flow from Accountant to Admin group.

---

## [2026-07-17] - Purchase Identifier Visibility (Admin App)

### Added
- Added explicit `Purchase ID` column across Purchases datatable view.

---

## [2026-07-05] - Payment Approval & Disbursement Pipeline (Admin App)

### Added
- **Payments**:
  - Implemented final payment approval and disbursement pipeline.
  - Added item-level columns to payment ledger view.
  - Added handlers for quantity scaling, unit cost calculation, and disabled delete action on approved vouchers.

---

## [2026-07-01] - Vendor Validation & Status Timestamps (Admin App)

### Changed
- Added validation for vendor fields and updated status change timestamps in purchase modals.

---

## [2026-06-27] - Privilege Preselection Fix (Admin App)

### Fixed
- Resolved permission preselection checkbox bugs in `EditItemModal` and `NewItemModal`.

---

## [2026-06-26] - Additional Expenses API & PDF Monochrome Rendering (Admin App)

### Added
- Integrated additional expenses backend API with frontend procurement view.
### Fixed
- **PDF Generation (`pdfGenerator.ts`)**:
  - Fixed dark-mode text and background bleed into exported PDFs by introducing off-screen white DOM clone at fixed 800px document scale.
  - Fixed table total calculations in exported invoice statements.

---

## [2026-06-25] - Site Petty Cash / Additional Expenses Engine (Backend & Admin)

### Added
- **Backend API (`zyn-api`)**:
  - Implemented `additional_expenses` handling in `save_Purchase` action in `AppController.php`.
  - Added endpoints `/v1/app/addNewAdditionalExpenses`, `/v1/app/updateAdditionalExpenses`, and `/v1/app/removeAdditionalExpense`.
- **Admin App**:
  - Implemented `EditAdditionalExpense` modal dialog with non-editable item name lock.
  - Expanded modal layout width to 1250px with equal column spacing.

---

## [2026-06-24] - Streamlined Material Intake (Staff PWA)

### Changed
- Simplified field goods receipt flow in `recieve_item.tsx` by eliminating redundant demand selection and directly presenting open procured items.

---

## [2026-06-22] - Field Demand Verification Modal (Staff PWA)

### Added
- Implemented `VerifyDemandModal.tsx` and stage dropdown scheduling selector for field engineers.

---

## [2026-05-31] - Repository Clean-Up & Gitignore Hardening (Backend API)

### Security
- Untracked `vendor/`, `logs/*.log`, `garbage/`, and local staging configuration directories.

---

## [2026-05-29] - Scheduling Datepicker Interceptor (Staff PWA)

### Added
- Intercepted material demand save workflow with custom on-site datepicker scheduling modal.

---

## [2026-05-22] - Labor Wage Calculation & Dark Mode Overlays (Staff PWA)

### Added
- Implemented `worker_payments.tsx` widget with double-overlay modals, payout calculation, and payment API integration.
- Added dark mode support for wage settlement dialogs.

---

## [2026-05-21] - Daily Worker Attendance & Session Focus Fix (Staff PWA & Backend)

### Added
- Implemented `worker_attendance.tsx` widget with daily headcount tracking and total paid summaries.
- Added backend parameters for `payment_date`, `purchase_date`, and verification flags.
### Fixed
- Switched session auth focus listener in PWA from `window.focus` to `visibilitychange` to eliminate infinite reload loops.

---

## [2026-05-20] - Stock Movements, Workforce Telemetry & Versioning (All Modules)

### Added
- **Backend API**:
  - Integrated real-time stock processing engine (`handleStockInventory`) with negative-stock prevention.
  - Added workforce summary and project setup status endpoints.
- **Admin & PWA**:
  - Displayed `frontendVersion` in system settings.
  - Updated PWA branding and mobile-first manifest configurations.

---

## [2026-05-15] - Geotagged Field Inspection Photos & API Interceptor (Staff PWA)

### Added
- Implemented `gps_photo.tsx` with on-device HTML5 canvas image compression (`compressImage`) to optimize cellular bandwidth.
- Implemented client-side ray-casting `pointInPolygon` geofencing check validating supervisor presence within project boundary polygon.
- Implemented centralized `apiClient.ts` wrapper with Bearer token injection, single-element response unwrapping, and 401 `auth-expired` dispatch.
- Added shimmering preloaders across PWA views.

---

## [2026-05-14] - Field Goods Receipt & Mobile Camera Capture (Staff PWA)

### Fixed
- Fixed native camera file permissions on iOS and Android for image capture.
- Fixed item state toggling in goods receipt challan logging.

---

## [2026-05-08] - Granular User Groups & RBAC Governance (Backend & Admin)

### Added
- Integrated `tbl_usergroups`, `tbl_permissons`, and `tbl_staff_permissions` into dynamic role-based administration.
- Integrated staff directory management and credentials generation.

---

## [2026-04-20] - Automated Demands-to-Purchase Pipeline (Backend API)

### Added
- Implemented automated demand title generator (`autogen_demand_title`).
- Connected verified field indents directly into procurement purchase order generation.

---

## [2026-04-07] - Initial Commit & Core Architecture Inception

### Added
- **Backend API (`zyn-api`)**:
  - Established Slim Framework 4 foundation with PHP-DI container.
  - Built PDO database connection wrappers with dual-node architecture (`PDO` and `PDO2`).
  - Implemented Tuupola JWT authentication and CryptoJS AES credentials encryption.
  - Implemented baseline schema entities (`tbl_projects`, `tbl_stages`, `tbl_budget_heads`, `tbl_items`, `tbl_vendors`, `tbl_demands`, `tbl_procurements`, `tbl_payments`).
