# 🌐 StaffSphere - Employee Management & Payroll System

<div align="center">

![StaffSphere Banner](https://img.shields.io/badge/StaffSphere-HR%20Management-2C5282?style=for-the-badge&logo=organization&logoColor=white)

**A modern, secure, and comprehensive employee management and payroll calculation system built with Python FastAPI and React.**

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.116+-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.3+-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6+-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Material-UI](https://img.shields.io/badge/Material--UI-5.18+-007FFF?style=flat-square&logo=mui&logoColor=white)](https://mui.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)

[Features](#-features) • [Quick Start](#-quick-start) • [Installation](#-installation) • [Documentation](#-documentation) • [Security](#-security)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-features)
- [Technology Stack](#-technology-stack)
- [System Requirements](#-system-requirements)
- [Installation](#-installation)
- [Usage](#-usage)
- [API Documentation](#-api-documentation)
- [Project Structure](#-project-structure)
- [Security Features](#-security)
- [Development](#-development)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview

**StaffSphere** is a full-stack employee management and payroll system designed for Vietnamese businesses. It provides a comprehensive solution for HR departments to manage employee records, calculate salaries according to Vietnamese tax laws, generate payslips, and maintain secure, user-specific data isolation.

### Why StaffSphere?

- ✅ **Vietnamese Tax Compliance** - Built-in salary calculator following 2024 Vietnamese tax regulations
- ✅ **Secure Multi-User System** - User-specific encrypted data storage
- ✅ **Excel Integration** - Import/export employee data and payslips
- ✅ **Modern UI/UX** - Beautiful, responsive interface built with Material-UI
- ✅ **Real-time Statistics** - Visual analytics and reporting
- ✅ **Offline Capable** - Works without constant internet connection

---

## ✨ Features

### 👥 Employee Management
- **CRUD Operations** - Create, read, update, and delete employee records
- **Advanced Filtering** - Filter by department, position, contract type, gender, age range, and search
- **Employee Profiles** - Comprehensive employee information including personal details, contracts, and benefits
- **Import/Export** - Bulk import from Excel files and export to CSV/Excel formats

### 💰 Payroll System
- **Vietnamese Salary Calculator** - Automatic calculation of:
  - Gross salary with bonuses and allowances
  - Personal Income Tax (PIT) based on progressive tax brackets
  - Social insurance (BHXH), health insurance (BHYT), and unemployment insurance (BHTN)
  - Union fees and dependent deductions
  - Overtime pay (1.5x, 2.0x, 3.0x rates)
  - Net income calculation
- **Payslip Generation** - Individual and batch payslip generation in Excel format
- **Payroll Export** - Complete payroll data export with all calculations
- **Bulk Updates** - Apply changes to multiple employees simultaneously

### 🔐 User Authentication & Security
- **User Registration** - Create new user accounts with email and full name
- **Secure Login** - Password hashing with PBKDF2-HMAC-SHA256 (100,000 iterations)
- **Password Recovery** - Username and email verification for password recovery
- **Data Encryption** - User-specific Fernet encryption (AES-128-CBC with HMAC) for sensitive data
- **PII Protection** - Username and email encrypted at rest in user accounts database
- **Multi-User Isolation** - Each user's data is completely isolated and encrypted

### 📊 Statistics & Analytics
- **Dashboard Overview** - Total employees, department distribution, salary ranges
- **Visual Charts** - Department breakdown, position distribution, contract types
- **Salary Analytics** - Average salary, salary range distributions
- **Real-time Updates** - Statistics update automatically with data changes

### 📄 Excel & File Management
- **Excel Import** - Import employee data from Vietnamese-formatted Excel templates
- **Excel Export** - Export employee lists and payroll data
- **Payslip Templates** - Professional Excel payslip templates
- **Batch Operations** - Generate multiple payslips as ZIP archive

---

## 🛠 Technology Stack

### Backend
- **Framework:** FastAPI 0.116+ (High-performance Python web framework)
- **Validation:** Pydantic 2.11+ (Data validation using Python type annotations)
- **Excel Processing:** OpenPyXL 3.1+, Pandas 2.3+ (Excel file manipulation)
- **Security:** Cryptography 43.0+ (Fernet encryption with PBKDF2 key derivation)
- **HTTP Client:** httpx (for development proxy), requests (HTTP utilities)
- **Server:** Uvicorn 0.35+ (ASGI server)

### Frontend
- **Framework:** React 18.3+ with TypeScript 5.6+
- **UI Library:** Material-UI (MUI) 5.18+
- **Routing:** React Router DOM 6.30+
- **State Management:** TanStack Query (React Query) 5.90+
- **Forms:** React Hook Form 7.63+ with Zod validation
- **Build Tool:** Vite 5.4+
- **Styling:** Tailwind CSS 3.4+, Emotion

### Data Storage
- **User Accounts:** JSON-based with PBKDF2-HMAC-SHA256 password hashing + Fernet PII encryption
- **Employee Data:** User-specific encrypted files (Fernet: AES-128-CBC + HMAC)
- **Payroll Data:** User-specific encrypted files (Fernet: AES-128-CBC + HMAC)
- **System Key:** Auto-generated Fernet key for user account PII encryption

---

## 💻 System Requirements

### Prerequisites
- **Python** 3.11 or higher
- **Node.js** 18.0 or higher
- **npm** 9.0 or higher (comes with Node.js)
- **Git** (for version control)

### Operating Systems
- ✅ Windows 10/11
- ✅ macOS 12+
- ✅ Linux (Ubuntu 20.04+, Debian, CentOS)

---

## 🚀 Quick Start

### Windows Users (One-Click Setup)

Simply double-click the batch file:
```batch
setup-and-run.bat
```

This will:
1. Install all backend dependencies
2. Install all frontend dependencies
3. Build the frontend
4. Start the server

### Manual Setup (All Platforms)

#### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/staffsphere.git
cd StaffSphere1
```

#### 2. Backend Setup
```bash
# Install Python dependencies from requirements.txt
pip install -r requirements.txt

# Or navigate to backend directory and use pyproject.toml
cd backend
pip install -e .
```

#### 3. Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Build for production
npm run build
```

#### 4. Start the Application
```bash
# From the backend directory
cd backend
python run.py

# Or run directly
python -m app.main
```

The application will be available at: **http://localhost:3200**

> **Note:** In production mode, the built frontend is served from the backend. In development, run frontend separately on port 12000.

---

## 📖 Usage

### First Time Setup

1. **Access the Application**
   - Open your browser and navigate to `http://localhost:3200` (production mode)
   - Or `http://localhost:12000` (if running frontend dev server separately)

2. **Register an Account**
   - Click "Register" on the login page
   - Fill in your details:
     - Username (unique, will be encrypted in database)
     - Email address (will be encrypted in database)
     - Full name
     - Password (strong password recommended, hashed with PBKDF2-HMAC-SHA256)
   - Click "Create Account"
   - An empty encrypted database will be automatically created for your account

3. **Login**
   - Enter your username and password
   - Click "Login"
   - Your password is used to derive the encryption key for your data

### Managing Employees

#### Add New Employee
1. Click the "Add Employee" button
2. Fill in employee information:
   - Personal details (name, DOB, gender, ID number)
   - Contact information (address, phone)
   - Employment details (department, position, contract type)
   - Salary and benefits
3. Click "Save"

#### Import from Excel
1. Click "Import from Excel"
2. Select your Excel file (must match the template format)
3. Review the import summary
4. Data will be automatically encrypted and saved

#### Filter & Search
- Use the filter dropdowns to filter by department, position, gender, contract type
- Use age range sliders for age-based filtering
- Use the search bar to find employees by name

### Payroll Management

#### Calculate Salary
1. Navigate to the "Payroll" section
2. Enter employee salary details:
   - Base salary
   - Overtime hours (1.5x, 2.0x, 3.0x)
   - Bonuses and allowances
   - Number of dependents
   - Advances (if any)
3. Click "Calculate"
4. Review detailed breakdown

#### Generate Payslips
- **Single Payslip:** Click the download button next to any calculation
- **Batch Payslips:** Click "Download All Payslips" to generate a ZIP file
- **Complete Payroll:** Download payslips + payroll Excel in one ZIP

#### Export Payroll Data
- Click "Export to Excel" to download comprehensive payroll data
- Click "Export to JSON" for JSON format

---

## 🔌 API Documentation

### API Endpoints

#### Authentication
```
POST   /api/auth/register          - Register new user
POST   /api/auth/login             - User login
POST   /api/auth/recover-password  - Password recovery
POST   /api/auth/reset-password    - Reset password
POST   /api/auth/change-password   - Change password
```

#### Employee Management (Dashboard)
```
GET    /api/employees              - Get all employees (with filters)
GET    /api/employees/{id}         - Get single employee
POST   /api/employees              - Create employee
PUT    /api/employees/{id}         - Update employee
DELETE /api/employees/{id}         - Delete employee
POST   /api/import/excel           - Import employees from Excel
GET    /api/export/excel           - Export employees to Excel
GET    /api/export/csv             - Export employees to CSV
GET    /api/filter-options         - Get filter options
GET    /api/statistics             - Get employee statistics
```

#### Payroll Management
```
GET    /api/payroll/employees            - Get payroll employees
POST   /api/payroll/employees            - Create payroll employee
GET    /api/payroll/employees/{id}       - Get single payroll employee
PATCH  /api/payroll/employees/{id}       - Update payroll employee
DELETE /api/payroll/employees/{id}       - Delete payroll employee
DELETE /api/payroll/employees            - Clear all payroll employees
POST   /api/payroll/employees/upload-excel - Import payroll from Excel
PATCH  /api/payroll/employees/bulk-update - Bulk update field
GET    /api/payroll/employees/export-excel - Export to Excel
GET    /api/payroll/employees/export-json  - Export to JSON
```

#### Salary Calculation
```
POST   /api/salary/calculate       - Calculate salary
GET    /api/salary/calculations    - Get all calculations
GET    /api/salary/export          - Export calculations to CSV
GET    /api/salary/tax-brackets    - Get tax brackets
```

#### Payslip Generation
```
POST   /api/payslip/download-excel          - Download single payslip
GET    /api/payslips/download-all-excel     - Download all payslips (ZIP)
GET    /api/payroll/download-complete       - Download complete payroll package
```

### Authentication Headers

All protected endpoints require these headers:
```
X-Username: your-username
X-Password: your-password
```

### Interactive API Documentation

When running in development mode, access the interactive API docs at:
- **Swagger UI:** http://localhost:3200/docs
- **ReDoc:** http://localhost:3200/redoc

> **Note:** API documentation is disabled in production mode for security.

---

## 📁 Project Structure

```
StaffSphere1/
├── backend/                      # Backend Python application
│   ├── app/
│   │   ├── api/                 # API routes and endpoints
│   │   │   └── routes.py        # All API route definitions
│   │   ├── models/              # Data models and schemas
│   │   │   └── schemas.py       # Pydantic models
│   │   ├── services/            # Business logic services
│   │   │   ├── calculator.py              # Salary calculation engine
│   │   │   ├── employee_service.py        # Employee CRUD operations
│   │   │   ├── payroll_service.py         # Payroll management
│   │   │   ├── user_service.py            # User authentication
│   │   │   ├── encryption_service.py      # Data encryption
│   │   │   ├── excel_parser.py            # Excel import
│   │   │   ├── excel_exporter.py          # Excel export
│   │   │   ├── payslip_excel_generator.py # Single payslip
│   │   │   └── batch_payslip_generator.py # Batch payslips
│   │   ├── storage/             # Data storage
│   │   │   ├── mem.py           # In-memory storage manager
│   │   │   ├── user_accounts.json         # User credentials
│   │   │   ├── nhan_vien_*.encrypted      # Employee data (encrypted)
│   │   │   └── payroll_*.encrypted        # Payroll data (encrypted)
│   │   └── main.py              # FastAPI application entry point
│   ├── templates/               # Excel templates
│   │   ├── Payslip_sample.xlsx # Payslip template
│   │   └── salary_template.xlsx # Salary template
│   ├── run.py                   # Server startup script
│   └── pyproject.toml           # Python dependencies
│
├── frontend/                     # Frontend React application
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── EmployeeDashboard.tsx      # Main dashboard
│   │   │   ├── EmployeeDetail.tsx         # Employee details page
│   │   │   ├── Statistics.tsx             # Statistics page
│   │   │   ├── Login.tsx                  # Login page
│   │   │   ├── Register.tsx               # Registration page
│   │   │   ├── ForgotPassword.tsx         # Password recovery
│   │   │   ├── employee-table.tsx         # Employee data table
│   │   │   ├── salary-form.tsx            # Salary input form
│   │   │   ├── salary-results.tsx         # Calculation results
│   │   │   ├── Sidebar.tsx                # Mobile sidebar
│   │   │   ├── PermanentSidebar.tsx       # Desktop sidebar
│   │   │   ├── pages/
│   │   │   │   ├── calculator.tsx         # Payroll calculator
│   │   │   │   └── not-found.tsx          # 404 page
│   │   │   ├── ui/                        # UI components (47 files)
│   │   │   └── lib/                       # Utility functions
│   │   ├── App.tsx              # Main application component
│   │   ├── index.tsx            # Application entry point
│   │   └── index.css            # Global styles
│   ├── public/                  # Static assets
│   ├── package.json             # Node dependencies
│   ├── tsconfig.json            # TypeScript configuration
│   ├── vite.config.ts           # Vite configuration
│   └── tailwind.config.ts       # Tailwind CSS configuration
│
├── requirements.txt             # Python dependencies file
├── setup-and-run.bat            # Windows setup script (if exists)
├── pyproject.toml               # Root Python dependencies
├── package.json                 # Root Node dependencies
├── .gitignore                   # Git ignore rules
├── SECURITY_GUIDE.md            # Security documentation (if exists)
├── USER_PII_ENCRYPTION.md       # Encryption guide (if exists)
├── PASSWORD_RESET_GUIDE.md      # Password reset guide (if exists)
└── README.md                    # This file
```

---

## 🔐 Security

StaffSphere implements multiple layers of security to protect sensitive employee and user data:

### 1. Password Security
- **PBKDF2-HMAC-SHA256:** All passwords are hashed using PBKDF2 with SHA256
  - 100,000 iterations for strong key derivation
  - 32-byte random salt per user
  - Base64-encoded storage
- **No Plain Text Storage:** Passwords are never stored in plain text
- **Secure Verification:** Constant-time comparison to prevent timing attacks
- **Migration Support:** Automatic migration from legacy plain-text passwords (if any)

### 2. Data Encryption (Employee & Payroll Data)
- **Fernet Encryption:** All employee and payroll data encrypted using Fernet (AES-128-CBC with HMAC)
- **User-Specific Keys:** Each user's data encrypted with a key derived from their password
- **Key Derivation:** PBKDF2 with SHA256, 100,000 iterations, 32-byte key
- **Unique Salt per File:** 16-byte random salt generated for each encrypted file
- **Authenticated Encryption:** HMAC ensures data integrity and authenticity

### 3. PII Encryption (User Accounts)
- **System-Level Encryption:** Usernames and emails encrypted using Fernet
- **Separate System Key:** Auto-generated system key (stored in `.system_key` file)
- **Read-Only Key File:** Key file permissions set to 0o400 (read-only for owner)
- **Encrypted at Rest:** PII never stored in plain text in `user_accounts.json`

### 4. Multi-User Isolation
- **Separate Data Files:** Each user has their own encrypted data files
  - Employee data: `nhan_vien_{username}.encrypted`
  - Payroll data: `payroll_{username}.encrypted`
- **Access Control:** Users can only access their own encrypted data
- **Password-Based Decryption:** Data can only be decrypted with correct user password
- **No Cross-User Access:** Impossible to decrypt another user's data without their password
- **Cache Isolation:** Frontend cache is cleared on logout to prevent data leakage

### 5. API Security
- **Header-Based Auth:** Simple header-based authentication (X-Username, X-Password)
- **CORS Protection:** Configurable CORS settings (allow-all in dev, restrictive in production)
- **Input Validation:** All inputs validated using Pydantic models with type checking
- **Error Handling:** Secure error messages that don't leak sensitive information
- **Request Logging:** Middleware logs API requests with timing (development mode)

### 6. File System Security
- **Protected Storage Directory:** All sensitive files stored in `backend/app/storage/`
- **System Key Protection:** `.system_key` file with restricted permissions
- **Encrypted File Naming:** User-specific naming prevents file conflicts
- **Base64 Encoding:** All encrypted data encoded for safe text storage

### 7. Best Practices
- 🔒 Always log out when finished
- 🔒 Use strong, unique passwords (minimum 8 characters recommended)
- 🔒 Don't share credentials
- 🔒 Regularly backup encrypted data files
- 🔒 Keep the application updated
- 🔒 Protect the `.system_key` file
- 🔒 Use HTTPS in production deployments

> **Important:** If you lose your password, your encrypted data cannot be recovered. The encryption is designed so that only your password can decrypt your data.

---

## 🧪 Development

### Running in Development Mode

#### Backend Development
```bash
cd backend

# Set environment variable
export NODE_ENV=development  # Linux/Mac
set NODE_ENV=development     # Windows

# Run with the provided script (recommended)
python run.py

# Or run with uvicorn directly (port 3200)
python -m uvicorn app.main:app --reload --port 3200
```

#### Frontend Development
```bash
cd frontend

# Start Vite dev server
npm run dev

# Server will start on http://localhost:12000
```

### Development Features
- **Hot Module Replacement (HMR):** Frontend changes reflect instantly
- **Auto-reload:** Backend restarts on code changes (if configured)
- **Debug Mode:** Detailed error messages and stack traces
- **Interactive API Docs:** Access Swagger UI at `/docs`

### Code Style

#### Python (Backend)
- Follow PEP 8 style guide
- Use type hints where possible
- Document functions with docstrings
- Maximum line length: 100 characters

#### TypeScript (Frontend)
- Use functional components with hooks
- Prefer TypeScript interfaces over types for objects
- Use proper typing (avoid `any`)
- Follow ESLint and Prettier configurations

### Testing

```bash
# Backend tests (to be implemented)
pytest backend/tests/

# Frontend tests
cd frontend
npm test
```

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### 1. Fork the Repository
```bash
git fork https://github.com/yourusername/staffsphere.git
```

### 2. Create a Feature Branch
```bash
git checkout -b feature/your-feature-name
```

### 3. Make Your Changes
- Write clean, documented code
- Follow the code style guidelines
- Add tests if applicable

### 4. Commit Your Changes
```bash
git add .
git commit -m "feat: add your feature description"
```

Use conventional commits:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting)
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Maintenance tasks

### 5. Push and Create Pull Request
```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

### What to Contribute
- 🐛 Bug fixes
- ✨ New features
- 📝 Documentation improvements
- 🎨 UI/UX enhancements
- 🧪 Tests
- 🌐 Translations
- ⚡ Performance improvements

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **FastAPI** - For the excellent Python web framework
- **React** - For the powerful UI library
- **Material-UI** - For the beautiful component library
- **OpenPyXL** - For Excel file manipulation
- **Cryptography** - For robust encryption implementation
- **Vietnamese Tax Laws** - 2024 personal income tax regulations

---

## 📞 Support

For support, questions, or feature requests:

- **Issues:** [GitHub Issues](https://github.com/yourusername/staffsphere/issues)
- **Discussions:** [GitHub Discussions](https://github.com/yourusername/staffsphere/discussions)
- **Email:** support@staffsphere.example.com

---

## 🗺 Roadmap

### Planned Features
- [ ] Role-based access control (Admin, Manager, Employee roles)
- [ ] Email notifications for payslip distribution
- [ ] Advanced reporting and analytics
- [ ] Multi-language support (English, Vietnamese)
- [ ] Mobile applications (iOS/Android)
- [ ] Cloud deployment guides (AWS, Azure, Google Cloud)
- [ ] Database backend option (PostgreSQL, MySQL)
- [ ] Attendance tracking integration
- [ ] Leave management system
- [ ] Performance review module

---

<div align="center">

**Made with ❤️ for HR Teams**

⭐ Star this repo if you find it helpful!

[Report Bug](https://github.com/yourusername/staffsphere/issues) • [Request Feature](https://github.com/yourusername/staffsphere/issues) • [Documentation](https://github.com/yourusername/staffsphere/wiki)

</div>

