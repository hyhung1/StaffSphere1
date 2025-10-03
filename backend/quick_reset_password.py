#!/usr/bin/env python3
"""
Quick Password Reset Script
Usage: python quick_reset_password.py <username> <new_password>
Example: python quick_reset_password.py hung12 newpassword123
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from app.services.user_service import user_service


def main():
    if len(sys.argv) != 3:
        print("Usage: python quick_reset_password.py <username> <new_password>")
        print("Example: python quick_reset_password.py hung12 newpassword123")
        sys.exit(1)
    
    username = sys.argv[1]
    new_password = sys.argv[2]
    
    print(f"Resetting password for user: {username}")
    
    result = user_service.reset_user_password(username, new_password)
    
    if result['success']:
        print(f"[SUCCESS] {result['message']}")
        print(f"User '{username}' can now login with the new password.")
    else:
        print(f"[FAILED] {result['message']}")
        sys.exit(1)


if __name__ == "__main__":
    main()

