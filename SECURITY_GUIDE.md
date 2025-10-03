# 🔐 StaffSphere Security & Encryption Guide

## Overview

StaffSphere now includes **AES-256 encryption** to protect sensitive employee data. Only users with the correct password can decrypt and view the data.

---

## 🎯 Key Features

### 1. **Password-Based Encryption**
- Employee data (`nhan_vien.json`) is encrypted using AES-256
- Encrypted file: `nhan_vien.encrypted`
- Only the user's login password can decrypt the data

### 2. **User Account Management**
- Create account with username, password, and email
- Secure authentication system
- Password recovery via email + username verification

### 3. **Data Privacy**
- **Developers cannot read encrypted data**
- Data is only decrypted in memory during user session
- Automatic encryption on logout

---

## 🚀 Getting Started

### First Time Setup

#### 1. **Install Dependencies**
```bash
cd StaffSphere1
pip install -r requirements.txt
# or
uv pip install -e .
```

#### 2. **Start the Application**
```bash
# Backend
cd backend
python run.py

# Frontend (in another terminal)
cd frontend
npm install
npm start
```

#### 3. **Create Your Account**
1. Click "Create Account" on the login page
2. Fill in:
   - Full Name (e.g., "Mrs. Nhung")
   - Username (e.g., "nhung")
   - Email (e.g., "nhung@company.com")
   - Password (min 6 characters)
3. Click "Create Account"

#### 4. **First Login**
1. Log in with your new credentials
2. System will automatically encrypt employee data with your password
3. From now on, only YOUR password can decrypt this data

---

## 📖 How to Use

### **Login**
- Enter your username and password
- Data is automatically decrypted and loaded
- You can now view Company Overview, Dashboard, and Payroll

### **Register New User**
- Click "Create Account" from login page
- Each user can have their own encrypted dataset
- Users cannot access each other's data

### **Forgot Password**
1. Click "Forgot Password?" on login page
2. Enter your **email** and **username**
3. If correct, your credentials will be displayed
4. ⚠️ **Save this information securely!**

---

## 🔒 Security Details

### Encryption Specifications
- **Algorithm**: AES-256 (Fernet symmetric encryption)
- **Key Derivation**: PBKDF2-HMAC-SHA256
- **Iterations**: 100,000
- **Salt**: Random 16 bytes per encryption

### What is Encrypted
```
nhan_vien.json (Plain Text)
       ↓ (Encryption with password)
nhan_vien.encrypted (Encrypted)
```

**Example of encrypted file**:
```
gAAAAABmxK3J5fK2H8... (unreadable gibberish)
kJ4h5kjH3k4Jh5kJhw...
```

### Data Flow

```
┌─────────────────┐
│  User Logs In   │
│  (Password)     │
└────────┬────────┘
         │
         ↓
┌─────────────────────────┐
│  Password Used as Key   │
│  to Decrypt Data        │
└────────┬────────────────┘
         │
         ↓
┌─────────────────────────┐
│  Data Available         │
│  in Memory Only         │
└────────┬────────────────┘
         │
         ↓
┌─────────────────────────┐
│  User Logs Out          │
│  Data Re-encrypted      │
└─────────────────────────┘
```

---

## ⚠️ Important Warnings

### 1. **Password Loss = Data Loss**
- If you forget your password, **encrypted data cannot be recovered**
- Use the Forgot Password feature to retrieve credentials
- Consider storing password securely (password manager, safe place)

### 2. **Email is Critical**
- Your email is used for password recovery
- Use a valid email you have access to
- Keep it up to date

### 3. **Developer Access**
- Developers **cannot** read encrypted data
- The file `nhan_vien.encrypted` is unreadable without password
- This protects Mrs. Nhung's confidential employee information

---

## 🛡️ For Developers

### Viewing Encrypted File
```bash
cat backend/app/storage/nhan_vien.encrypted
```
**You will see:** Random characters, completely unreadable

### How Encryption Works

**Encryption Process:**
```python
from backend.app.services.encryption_service import encryption_service

# Encrypt data
success = encryption_service.encrypt_data(user_password)

# Result: nhan_vien.encrypted created
```

**Decryption Process:**
```python
# Decrypt data (requires correct password)
data = encryption_service.decrypt_data(user_password)

# Returns: Employee list if password correct
#          None if password incorrect
```

### API Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "nhung",
  "password": "securepass123",
  "email": "nhung@company.com",
  "fullName": "Mrs. Nhung"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "nhung",
  "password": "securepass123"
}
```

#### Recover Password
```http
POST /api/auth/recover-password
Content-Type: application/json

{
  "email": "nhung@company.com",
  "username": "nhung"
}
```

---

## 🔧 Troubleshooting

### "Failed to decrypt data"
- **Cause**: Wrong password
- **Solution**: Use Forgot Password to retrieve correct credentials

### "No encrypted data found"
- **Cause**: Data hasn't been encrypted yet
- **Solution**: Log in once, system will auto-encrypt

### "Registration failed"
- **Cause**: Username or email already exists
- **Solution**: Use different credentials

---

## 📝 Best Practices

1. **Strong Passwords**: Use at least 8 characters with mix of letters, numbers, symbols
2. **Secure Email**: Use work email you regularly check
3. **Backup Strategy**: Keep password in secure location (password manager, locked safe)
4. **Regular Access**: Log in regularly to ensure credentials work
5. **Update Contact Info**: Keep email current for password recovery

---

## 🎓 For Mrs. Nhung

### Quick Start Checklist
- [ ] Create your account with email you have access to
- [ ] Log in successfully
- [ ] Verify you can see your employee data
- [ ] Write down your password securely
- [ ] Test "Forgot Password" feature to ensure email works
- [ ] Confirm data is encrypted (ask developer to check file)

### Your Data is Protected Because:
1. ✅ File is encrypted with your password
2. ✅ Developer cannot read encrypted file
3. ✅ Only you can decrypt with your password
4. ✅ Data never stored in plain text after first encryption
5. ✅ Password recovery available via email

---

## 📞 Support

If you encounter issues:
1. Try Forgot Password feature first
2. Check email for recovery
3. Contact system administrator if needed

**Remember**: Your password is the key to your data. Keep it safe! 🔐

