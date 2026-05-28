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
- **Invite Links return 404**: Make sure your Nginx config has the SPA fallback (see below).

---

## ⚙️ Required Nginx Configuration (CRITICAL for invite links)

Without this config, invite links like `https://oncolos.com.ng/?ref=XXXX` will return a 404.

```nginx
server {
    listen 80;
    server_name oncolos.com.ng www.oncolos.com.ng;

    root /var/www/oncolos/dist;        # <-- point to your dist folder
    index index.html;

    # SPA fallback: serve index.html for ALL requests
    # This makes /?ref=XXX and any other paths work correctly
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy: forward /api requests to the backend
    location /api/ {
        proxy_pass http://localhost:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

> **After updating Nginx config**: Run `sudo nginx -t && sudo systemctl reload nginx`

