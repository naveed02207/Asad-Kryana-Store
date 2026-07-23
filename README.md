# Asad Karyana Store POS & Management System

A modern, full-featured Point of Sale (POS), Inventory Management, Customer Khata Ledger, and Sales Analytics web application tailored for retail grocery stores (Karyana stores).

---

## 🌟 Key Features

### 🛒 Point of Sale & Billing
- **Fast Cart & Item Search:** Search inventory items by name or category, adjust quantities, and calculate subtotal/totals instantly.
- **Flexible Payment Methods:** Support for **Cash** and **Khata (Credit Ledger)** checkouts with discount fields and partial advance payments.
- **Thermal Receipt Generator (80mm):**
  - Generates compact receipts formatted for standard **80mm thermal receipt printers**.
  - Opens in a clean, dedicated browser tab with auto-triggered print (`window.print()`).
  - Displays Store Name (*Asad Karyana Store*), date/time, customer details, itemized table (Qty, Price, Total), discounts, payment method, and updated Khata balance.
  - Dynamically renders a **UBL Bank / Raast Payment QR Code** with account title and account number.

### 📖 Customer Khata Ledger
- **Customer Profiles:** Maintain customer contact details, addresses, and running balances (Credit vs. Payment).
- **Transaction History:** Record manual cash payments or store credit additions with instant balance recalculation.
- **Statement & Receipt View:** Print or inspect historical Khata transactions per customer.

### 📦 Inventory & Stock Control
- **Stock Tracking:** Real-time stock updates automatically deducted upon billing checkout.
- **Product Management:** Add, edit, or remove inventory items with custom pricing, categories, stock limits, and measurement units (kg, liter, pack, etc.).
- **Low Stock Highlights:** Visual indicators for items running low on stock.

### 📊 Analytics & Reports
- **Dashboard Overview:** Displays **Today's Sales**, **Today's Orders**, **Total Customers**, and **Active Inventory Count**.
- **Top Selling Products:** Visual breakdown of most frequently purchased items.
- **Hourly Sales Distribution:** Recharts interactive bar/line graphs showing sales flow throughout the day.
- **Custom Reports:** Filter sales history and revenue summaries by start and end dates.

### 👤 Customer Portal
- Dedicated customer-facing view allowing customers to look up store products, current prices, and track their personal Khata balance & transaction logs.

---

## 🛠️ Tech Stack

- **Frontend Framework:** React 19, TypeScript
- **Styling & UI:** Tailwind CSS v4, Lucide React Icons
- **Charting & Visualizations:** Recharts
- **Routing:** React Router v7 (`react-router-dom`)
- **Build Tool:** Vite 6
- **Database / Backend API:** Sheety REST API / Google Apps Script (Google Sheets Backend)

---

## 📂 Project Structure

```
├── src/
│   ├── components/
│   │   ├── AdminLayout.tsx       # Admin header & navigation tabs
│   │   └── CustomerLayout.tsx    # Customer portal navigation
│   ├── lib/
│   │   ├── api.ts                # Sheety API client, fallback parsing & endpoints
│   │   └── utils.ts              # UI utility functions
│   ├── pages/
│   │   ├── admin/
│   │   │   ├── Billing.tsx       # Checkout POS & Thermal Print generator
│   │   │   ├── Customers.tsx     # Customer management & Khata ledger
│   │   │   ├── Dashboard.tsx     # Real-time metrics & charts
│   │   │   ├── Inventory.tsx     # Product & stock management
│   │   │   └── Reports.tsx       # Sales reports & historical filters
│   │   └── customer/
│   │       ├── Khata.tsx         # Customer personal Khata lookup
│   │       └── Products.tsx      # Customer product catalog
│   ├── App.tsx                   # Route definitions & layout wrapping
│   ├── main.tsx                  # React entry point
│   └── types.ts                  # Shared TypeScript interfaces & types
├── .env.example                  # Environment variable reference
├── SETUP_SHEETS.md               # Google Apps Script setup instructions
├── metadata.json                 # Applet metadata
├── package.json                  # Dependencies and scripts
└── vite.config.ts                # Vite configuration
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18 or higher recommended)
- **npm** or **bun**

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy `.env.example` to `.env` if needed:
   ```env
   VITE_APPS_SCRIPT_URL=https://api.sheety.co/1aca09256686540369a341fc8eb55d15/kryanaStore
   ```

4. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   The application will be accessible at `http://localhost:3000`.

---

## ⚙️ Backend & Sheety API Integration

The app connects to a RESTful Google Sheet endpoint via **Sheety** (or Google Apps Script):

### API Endpoints
- `/inventory`: GET, POST, PUT, DELETE for inventory items.
- `/customers`: GET, POST, PUT for customer records.
- `/khataTransactions`: GET, POST for credit ledger entries.
- `/billing`: GET, POST for order checkouts and historical bills.
- `/settings`: GET for store configurations (Admin PIN, Bank Name, Account Title, Account Number).

### Default Store Settings
- **Admin PIN:** `1234`
- **Bank Name:** `UBL`
- **Account Title:** `Asad Karyana`
- **Account Number:** `1234567890123`

*(For details on setting up a free Google Apps Script backend directly attached to a Google Sheet, see [`SETUP_SHEETS.md`](./SETUP_SHEETS.md)).*

---

## 📜 Available Scripts

- `npm run dev` - Starts the Vite dev server on port 3000.
- `npm run build` - Builds the production bundle using Vite.
- `npm run lint` - Runs TypeScript typechecking (`tsc --noEmit`).
- `npm run preview` - Previews the production build locally.

---

## 📄 License

Apache-2.0 License.
