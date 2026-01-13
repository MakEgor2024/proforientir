# Proforientir

A Russian-language career guidance application that helps users discover suitable professions and universities in Moscow based on the Holland occupational test (RIASEC).

## Overview

This is a frontend web application with:
- Career personality test based on Holland types
- Profession catalog with search and filtering  
- Moscow university directory with comparison features
- AI-powered career advice using Google Gemini API
- Firebase authentication and Firestore for user data

## Project Structure

```
├── index.html          # Main HTML file
├── style.css           # Styles
├── script.js           # Frontend logic
├── server.js           # Express server for static files and API proxy
├── netlify/functions/  # Original Netlify serverless function (reference)
│   └── gemini-proxy.js
└── package.json        # Node.js dependencies
```

## Running the Application

The server runs on port 5000 and serves:
- Static files (HTML, CSS, JS)
- API endpoint at `/.netlify/functions/gemini-proxy` for Gemini AI

## Configuration

### Required Secrets

- `GEMINI_API_KEY` - Google Gemini API key for AI features

### Firebase Setup

The app uses Firebase (configured in script.js) for:
- User authentication (email/password and Google sign-in)
- Firestore database for saving test results and favorites

Users need to configure their own Firebase project credentials in the frontend code.

## Development

```bash
node server.js
```

The app will be available at http://0.0.0.0:5000
