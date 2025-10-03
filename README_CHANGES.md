# README.md Update Summary

## Key Corrections Made to Match Actual Implementation

### 1. **Password Security**
- ❌ **Was:** "Bcrypt hashing with cost factor 12"
- ✅ **Now:** "PBKDF2-HMAC-SHA256 with 100,000 iterations"
- **Reason:** The code uses `hashlib.pbkdf2_hmac('sha256', ...)` not bcrypt

### 2. **Data Encryption Algorithm**
- ❌ **Was:** "AES-256-GCM encryption"
- ✅ **Now:** "Fernet encryption (AES-128-CBC with HMAC)"
- **Reason:** The code uses `cryptography.fernet.Fernet` which implements AES-128-CBC + HMAC authentication

### 3. **PII Encryption (New Section)**
- ✅ **Added:** Documentation about username and email encryption
- **Details:** 
  - Usernames and emails are encrypted using Fernet with a system-level key
  - System key stored in `.system_key` file with 0o400 permissions
  - PII never stored in plain text in `user_accounts.json`

### 4. **Server Port**
- ❌ **Was:** "http://localhost:8000"
- ✅ **Now:** "http://localhost:3200"
- **Reason:** The `run.py` script uses port 3200 by default

### 5. **Installation Instructions**
- ✅ **Updated:** Now references `requirements.txt` file
- **Added:** Clear distinction between production and development modes

### 6. **User Registration**
- ❌ **Was:** "with email verification"
- ✅ **Now:** "with email and full name"
- **Reason:** No email verification is implemented in the code

### 7. **Password Recovery**
- ❌ **Was:** "Email-based password reset"
- ✅ **Now:** "Username and email verification for password recovery"
- **Reason:** Recovery requires both username AND email, not just email

### 8. **Security Details**
- ✅ **Added:** Detailed breakdown of:
  - Key derivation process (PBKDF2, 100k iterations)
  - Salt generation (32-byte for passwords, 16-byte for data encryption)
  - File naming conventions (`nhan_vien_{username}.encrypted`, `payroll_{username}.encrypted`)
  - System key management
  - Important warning about password loss

### 9. **Data Storage**
- ✅ **Updated:** Accurate description of:
  - Password hashing + PII encryption in user accounts
  - Fernet encryption (not AES-256) for employee/payroll data
  - System key for PII protection

### 10. **Technology Stack**
- ✅ **Added:** httpx (for development proxy)
- ✅ **Corrected:** Cryptography library description to match actual usage

### 11. **Development Mode**
- ✅ **Updated:** Correct port numbers and startup commands
- ✅ **Added:** Note about API docs being disabled in production

## Implementation Accuracy Checklist

✅ Password hashing algorithm correctly documented
✅ Encryption algorithm correctly documented  
✅ PII encryption properly explained
✅ Port numbers corrected throughout
✅ Installation instructions reference requirements.txt
✅ Security features accurately described
✅ File naming conventions documented
✅ Multi-user isolation properly explained
✅ Key derivation process detailed
✅ Important warnings added about password loss

## Files Modified

- `README.md` - Comprehensive updates to match actual implementation
- `requirements.txt` - Already created in previous step

## Testing Recommendations

1. Verify port 3200 works correctly
2. Test user registration creates encrypted PII in user_accounts.json
3. Verify `.system_key` file is created on first run
4. Confirm encrypted files use correct naming convention
5. Test password recovery with username + email

---

**Last Updated:** October 3, 2025
**Changes Made By:** Documentation accuracy review

