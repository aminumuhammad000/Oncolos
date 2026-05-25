# 🚀 Oncolos Deployment Guide

Follow these steps to successfully deploy the Oncolos platform to your live server.

## 1. Backend Deployment (api.oncolos.com.ng)
1. **Pull Code**: `git pull origin main`
2. **Install Dependencies**: `cd backend && npm install`
3. **Environment Setup**: 
   - Rename `.env.example` to `.env` (or update existing `.env`).
   - Add your **VTStack** keys, **JWT_SECRET**, and **MONGO_URI**.
4. **Start Server**: `node server.js` (or use PM2: `pm2 start server.js --name oncolos-api`)

---

## 2. Admin Panel Deployment (admin.oncolos.com.ng)
**CRITICAL**: You cannot serve the source code directly. You must build it.
1. **Navigate**: `cd admin-panel`
2. **Install**: `npm install`
3. **Build**: `npm run build`
4. **Serve**: The build command creates a **`dist`** folder. 
   - Use your web server (Nginx/Apache) to show the contents of the `admin-panel/dist` folder.
   - **MIME Error Fix**: If you see "Failed to load module script", it usually means you are not serving from the `dist` folder.

---

## 3. User Dashboard Deployment (oncolos.com.ng)
1. **Navigate**: `cd ..` (Back to root folder)
2. **Install**: `npm install`
3. **Build**: `npm run build`
4. **Serve**: The build command creates a **`dist`** folder.
   - Point your main domain to show the contents of the root `dist` folder.

---

## 🛠️ Troubleshooting
- **404 on API**: Ensure your Nginx configuration forwards requests to the backend port (5000).
- **MIME Type Error**: Always ensure you have run `npm run build` and you are serving the `dist` folder, not `src`.
