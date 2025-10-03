#!/usr/bin/env python3
"""
Password Reset Script
Allows admin to reset any user's password
"""
import sys
import os

# Add the parent directory to path to import app modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.user_service import user_service


def list_users():
    """List all users with their full names"""
    users = user_service._load_users(decrypt_pii=True)
    
    if not users:
        print("No users found.")
        return []
    
    print("\n" + "=" * 60)
    print("AVAILABLE USERS")
    print("=" * 60)
    for user in users:
        print(f"  Username: {user.get('username', 'N/A')}")
        print(f"  Full Name: {user.get('fullName', 'N/A')}")
        print(f"  Email: {user.get('email', 'N/A')}")
        print(f"  Role: {user.get('role', 'User')}")
        print("  " + "-" * 56)
    print("=" * 60 + "\n")
    
    return users


def main():
    print("\n" + "=" * 60)
    print("PASSWORD RESET TOOL")
    print("=" * 60)
    
    # List all users
    users = list_users()
    
    if not users:
        return
    
    # Get username to reset
    print("Enter the username of the user whose password you want to reset:")
    username = input("> ").strip()
    
    if not username:
        print("\n[ERROR] Username cannot be empty.")
        return
    
    # Check if user exists
    user_exists = any(u.get('username') == username for u in users)
    if not user_exists:
        print(f"\n[ERROR] User '{username}' not found.")
        return
    
    # Get new password
    print(f"\nEnter new password for '{username}':")
    new_password = input("> ").strip()
    
    if not new_password:
        print("\n[ERROR] Password cannot be empty.")
        return
    
    if len(new_password) < 4:
        print("\n[ERROR] Password must be at least 4 characters.")
        return
    
    # Confirm password
    print("\nConfirm new password:")
    confirm_password = input("> ").strip()
    
    if new_password != confirm_password:
        print("\n[ERROR] Passwords do not match.")
        return
    
    # Final confirmation
    print(f"\n[WARNING] You are about to reset password for user '{username}'.")
    print("Are you sure? (yes/no):")
    confirm = input("> ").strip().lower()
    
    if confirm not in ['yes', 'y']:
        print("\n[CANCELLED] Password reset cancelled.")
        return
    
    # Reset password
    print("\n[PROCESSING] Resetting password...")
    result = user_service.reset_user_password(username, new_password)
    
    print("\n" + "=" * 60)
    if result['success']:
        print(f"[SUCCESS] {result['message']}")
        print(f"\nUser '{username}' can now login with the new password.")
    else:
        print(f"[FAILED] {result['message']}")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n[CANCELLED] Password reset cancelled by user.")
    except Exception as e:
        print(f"\n[ERROR] An error occurred: {e}")

