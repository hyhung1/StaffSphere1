# Password Reset Guide

## How to Change User Passwords

Since passwords are now securely hashed, you **cannot** simply edit the `user_accounts.json` file. Instead, use one of these methods:

---

## Method 1: Interactive Script (Recommended for Admin)

### Run the interactive password reset tool:

```bash
cd StaffSphere1/backend
python reset_password.py
```

### Example Session:

```
============================================================
PASSWORD RESET TOOL
============================================================

============================================================
AVAILABLE USERS
============================================================
  Username: admin
  Full Name: Mrs. Nhung
  Email: nhung@company.com
  Role: Administrator
  --------------------------------------------------------
  Username: hung12
  Full Name: Hung Nguyen
  Email: hung12@gmail.com
  Role: User
  --------------------------------------------------------
============================================================

Enter the username of the user whose password you want to reset:
> hung12

Enter new password for 'hung12':
> mynewpassword

Confirm new password:
> mynewpassword

[WARNING] You are about to reset password for user 'hung12'.
Are you sure? (yes/no):
> yes

[PROCESSING] Resetting password...

============================================================
[SUCCESS] Password successfully reset for user 'hung12'

User 'hung12' can now login with the new password.
============================================================
```

---

## Method 2: Quick Command-Line (Fastest)

### One-line password reset:

```bash
cd StaffSphere1/backend
python quick_reset_password.py hung12 mynewpassword
```

### Output:
```
Resetting password for user: hung12
[SUCCESS] Password successfully reset for user 'hung12'
User 'hung12' can now login with the new password.
```

---

## Method 3: API Endpoint (For Applications)

### Reset Password (Admin Function)

**Endpoint**: `POST /api/auth/reset-password`

**Request**:
```json
{
  "username": "hung12",
  "new_password": "mynewpassword"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Password successfully reset for user 'hung12'",
  "username": "hung12"
}
```

**Example with curl**:
```bash
curl -X POST http://localhost:3200/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"username":"hung12","new_password":"mynewpassword"}'
```

---

## Method 4: Change Own Password (User Function)

### For users to change their own password (requires current password)

**Endpoint**: `POST /api/auth/change-password`

**Request**:
```json
{
  "username": "hung12",
  "old_password": "babykute",
  "new_password": "mynewpassword"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Password successfully reset for user 'hung12'",
  "username": "hung12"
}
```

**Example with curl**:
```bash
curl -X POST http://localhost:3200/api/auth/change-password \
  -H "Content-Type: application/json" \
  -d '{
    "username":"hung12",
    "old_password":"babykute",
    "new_password":"mynewpassword"
  }'
```

---

## Quick Reference

### For Hung Nguyen's Password:

**Current Info**:
- Username: `hung12`
- Full Name: `Hung Nguyen`
- Current Password: `babykute`

**To Change Password to "newpass123"**:

```bash
# Option A: Interactive
cd StaffSphere1/backend
python reset_password.py
# Then follow prompts: hung12 → newpass123

# Option B: Quick
cd StaffSphere1/backend
python quick_reset_password.py hung12 newpass123

# Option C: API
curl -X POST http://localhost:3200/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"username":"hung12","new_password":"newpass123"}'
```

---

## Important Notes

### ⚠️ Security Considerations

1. **Admin Reset** (`/auth/reset-password`):
   - No authentication required currently
   - Use carefully - anyone who can call this API can reset passwords
   - **Recommendation**: Add admin authentication in production

2. **User Change** (`/auth/change-password`):
   - Requires current password
   - Safe for users to change their own passwords
   - Cannot change other users' passwords

3. **Password Requirements**:
   - Minimum 4 characters (enforced in script)
   - No maximum length
   - **Recommendation**: Add stronger requirements in production

### 🔐 **After Password Reset**

1. ✅ Password is immediately hashed and stored
2. ✅ User can login with new password
3. ✅ Old password no longer works
4. ✅ No manual file editing needed
5. ✅ Encrypted data remains accessible (uses same password for both auth and data encryption)

### ⚠️ **Important for Encrypted Data**

**If you reset a user's password, they may lose access to their encrypted employee/payroll data!**

Why? Because:
- Employee data is encrypted with **user's password**
- If password changes, old encrypted data cannot be decrypted
- **Data will be lost** unless re-encrypted

**Solution**: Before resetting password, you might want to:
1. Export user's data (while they can still login)
2. Reset password
3. Re-import data with new password

Or implement a proper password change flow that re-encrypts data.

---

## Example Usage

### Change Hung Nguyen's Password from "babykute" to "SecurePass2024"

```bash
cd StaffSphere1/backend
python quick_reset_password.py hung12 SecurePass2024
```

**Output**:
```
Resetting password for user: hung12
[OK] Password reset for user: hung12
[SUCCESS] Password successfully reset for user 'hung12'
User 'hung12' can now login with the new password.
```

**Verification**:
```bash
# Try to login with new password via API
curl -X POST http://localhost:3200/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"hung12","password":"SecurePass2024"}'
```

---

## Files Created

1. ✅ `backend/reset_password.py` - Interactive password reset tool
2. ✅ `backend/quick_reset_password.py` - Quick command-line tool

## API Endpoints Added

1. ✅ `POST /api/auth/reset-password` - Admin reset (no auth required)
2. ✅ `POST /api/auth/change-password` - User self-change (requires old password)

---

## Summary

| Method | Best For | Authentication | Notes |
|--------|---------|----------------|-------|
| Interactive Script | Admin, careful changes | None | Lists all users, confirms action |
| Quick Script | Admin, fast changes | None | One command, instant reset |
| API Reset | Automation, scripts | None (⚠️ secure this!) | No verification needed |
| API Change | User self-service | Requires old password | Secure, user can change own |

---

**Choose the method that works best for your situation!**

For **Hung Nguyen**, the fastest way is:
```bash
python StaffSphere1/backend/quick_reset_password.py hung12 YourNewPassword
```

