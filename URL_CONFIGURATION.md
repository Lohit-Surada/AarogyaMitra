# URL Configuration Guide

## Overview
This document outlines the URL structure and routing configuration for the AarogyaMitra application.

## URL Routes

### Authentication Routes
- **`/login`** - Login page
  - User can enter email and password
  - Links to registration page
  - Redirects to `/(tabs)` on successful login

- **`/register`** - Registration page
  - User can create a new account with full name, email, and password
  - Links to login page
  - Redirects to login page after successful registration

### Main App Routes
- **`/` (index)** - Entry point
  - Currently redirects to `/login`
  - Can be configured to check authentication state
  - If authenticated, redirects to `/(tabs)`
  - If not authenticated, redirects to `/login`

### Authenticated Routes (Tabs)
- **`/(tabs)`** - Main tab navigation container
  - Base route for authenticated users
  
- **`/(tabs)/index`** - Home page
  - Main home page with welcome message
  - Displays user content
  - Includes logout button
  
- **`/(tabs)/explore`** - Explore page
  - Secondary tab for additional features

### Modal Routes
- **`/modal`** - Modal screen
  - Can be accessed from any screen
  - Displayed as a modal overlay

## Navigation Flow

### Unauthenticated User
```
/ (entry) → /login → /register → /login → /(tabs) (on success)
```

### Authenticated User
```
/ (entry) → /(tabs)/index → /(tabs)/explore
                          ↓
                        /modal
                          ↓
                        /login (on logout)
```

## Implementation Details

### Entry Point (`/app/index.tsx`)
- Acts as the initial route
- Currently redirects to `/login`
- TODO: Implement authentication state check

### Root Layout (`/app/_layout.tsx`)
- Configures all stack screens
- Defines transitions and header options
- Organizes routes into logical groups:
  - Auth Screens: `/login`, `/register`
  - Main App: `/(tabs)`
  - Modal: `/modal`

### Login Page (`/app/login.tsx`)
- User authentication form
- Email and password input
- Links to registration page (`/register`)
- Navigates to `/(tabs)` on successful login

### Registration Page (`/app/register.tsx`)
- User account creation form
- Full name, email, password, and password confirmation
- Links to login page (`/login`)
- Redirects to `/login` after successful registration

### Home Page (`/app/(tabs)/index.tsx`)
- Welcome screen for authenticated users
- Displays user information
- Includes logout button
- Logout redirects to `/login`

## How to Integrate Real Authentication

1. **Create Authentication Context**
   ```typescript
   // contexts/AuthContext.tsx
   - Manage login state
   - Store user information
   - Provide authentication methods
   ```

2. **Update Entry Point**
   ```typescript
   // app/index.tsx
   - Check auth context
   - Redirect based on authentication state
   ```

3. **Update Login and Registration**
   - Connect to your backend API
   - Store authentication tokens
   - Update auth context on success

4. **Update Logout**
   - Clear stored tokens
   - Update auth context
   - Clear user session

## Deep Linking

The app is configured for deep linking with the scheme: `aarogyamitra://`

Example deep links:
- `aarogyamitra://login`
- `aarogyamitra://register`
- `aarogyamitra://tabs`
- `aarogyamitra://modal`

## Notes

- All screens use the theme system with light/dark mode support
- Navigation animations are configured per route
- The app uses Expo Router for navigation
- Tab navigation is available only when authenticated
