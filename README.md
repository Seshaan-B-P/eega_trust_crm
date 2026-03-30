# EEGA Trust CRM 🚀

A comprehensive Management Information System (MIS) and Customer Relationship Management (CRM) platform built on the **MERN Stack** to streamline operations for non-profit organizations or trusts.

## 🌟 Key Features

### 🏘️ Resident Management
- **Children's Wing**: Enroll and track children, maintain detailed records, and manage admissions/discharges.
- **Elderly Care**: Profile management for elderly residents, focusing on healthcare and daily needs.
- **Daily Reporting**: Systematically log daily activities and health reports for all residents.

### 👥 Human Resources
- **Staff Management**: Centralized staff directory, role assignments, and performance monitoring.
- **Attendance Tracking**: Automated daily attendance for staff and residents with detailed historical reporting.

### 💰 Financial Management
- **Donation Tracking**: Comprehensive donor management, donation categorization (cash/goods), and automated receipt generation.
- **Expense Management**: Track organizational expenditures with category-based filtering and analytics.

### 📦 Operations & Logistics
- **Inventory Control**: Real-time stock tracking for food, medicine, and other essentials with transaction logs.
- **Analytics Dashboard**: Visual data representation using Chart.js for donations, expenses, and resident occupancy.

### 🔐 Security & Access
- **Role-Based Access Control (RBAC)**: Secure access for Admin and Staff users.
- **JWT Authentication**: Safe and persistent sessions with encrypted passwords.

---

## 🛠️ Technical Stack

### **Frontend**
- **React.js**: Modern component-based UI.
- **Tailwind CSS**: Utility-first styling for a responsive and premium design.
- **Framer Motion**: Smooth micro-animations and transitions.
- **Chart.js**: Interactive data visualizations.
- **Formik & Yup**: Robust form handling and validation.

### **Backend**
- **Node.js & Express**: Scalable server architecture.
- **MongoDB & Mongoose**: Flexible NoSQL database for structured data.
- **JSON Web Tokens (JWT)**: Secure authentication.
- **PDFKit & ExcelJS**: Automated reporting and export functionality.
- **Multer**: Support for document and image uploads.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v16+)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Seshaan-B-P/eega_trust_crm.git
   cd eega_trust_crm
   ```

2. **Backend Setup**:
   ```bash
   cd server
   npm install
   ```
   - Create a `.env` file in the `server` directory:
     ```env
     PORT=5000
     MONGODB_URI=your_mongodb_connection_string
     JWT_SECRET=your_secret_key
     ```
   - **Initial Setup (Admin Seeding)**:
     ```bash
     npm run setup
     ```

3. **Frontend Setup**:
   ```bash
   cd ../client
   npm install
   ```

### Running the Application

- **Start Backend**: `npm run dev` (from `server` folder).
- **Start Frontend**: `npm start` (from `client` folder).

---

## 🔑 Test Credentials
| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@eega.com` | `admin123` |
| **Staff** | `staff@eega.com` | `staff123` |

---

## 📂 Project Structure
```text
EEGA Trust CRM
├── client/              # React frontend
│   ├── src/             # Source code (contexts, components, pages)
│   └── tailwind.config  # Design system configuration
├── server/              # Node.js backend
│   ├── models/          # Mongoose schema definitions
│   ├── routes/          # API endpoint controllers
│   ├── middleware/        # Auth & validation guards
│   └── uploads/         # Storage for receipts/documents
└── README.md            # Project documentation
```

---

*Built with ❤️ for non-profit operational excellence.*
