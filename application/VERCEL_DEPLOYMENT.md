# Vercel Deployment Guide for EduMate

This guide will help you deploy the EduMate frontend to Vercel.

## Prerequisites

- ✅ Backend deployed on Render: `https://edumate-backend-bk8t.onrender.com`
- ✅ GitHub repository with your code
- ✅ Vercel account (sign up at [vercel.com](https://vercel.com))

## Step 1: Prepare Your Repository

1. Make sure all your changes are committed and pushed to GitHub:
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

## Step 2: Deploy to Vercel

### 2.1 Create New Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New"** → **"Project"**
3. If prompted, connect your GitHub account (if not already connected)
4. Select your repository from the list

### 2.2 Configure Project Settings

When the import screen appears, configure:

1. **Project Name**: `edumate` (or your preferred name)
2. **Framework Preset**: `Next.js` (should auto-detect)
3. **Root Directory**: 
   - Click **"Edit"** next to Root Directory
   - Set to: `application`
   - This tells Vercel where your Next.js app is located
4. **Build Command**: `npm run build` (default - should be correct)
5. **Output Directory**: `.next` (default - should be correct)
6. **Install Command**: `npm install` (default - should be correct)

### 2.3 Set Environment Variables

**IMPORTANT**: Before clicking "Deploy", set environment variables:

1. Click **"Environment Variables"** section
2. Add the following variables:

   **Variable 1:**
   - Key: `NEXT_PUBLIC_API_URL`
   - Value: `https://edumate-backend-bk8t.onrender.com`
   - Environment: Select all (Production, Preview, Development)

   **Variable 2:**
   - Key: `NEXT_PUBLIC_USE_MOCK`
   - Value: `false`
   - Environment: Select all (Production, Preview, Development)

3. Click **"Add"** after each variable

### 2.4 Deploy

1. Click **"Deploy"** button
2. Wait for deployment (~2-5 minutes)
3. Vercel will show you the deployment progress
4. Once complete, you'll see: **"Congratulations! Your project has been deployed."**

## Step 3: Verify Deployment

### 3.1 Test Your Frontend

1. Visit your Vercel URL (e.g., `https://edumate.vercel.app`)
2. You should see the EduMate login page

### 3.2 Test Full Functionality

1. **Sign Up**: Create a new student or parent account
2. **Login**: Test login functionality
3. **Tutor Features**: Try asking a question in the tutor module
4. **Quiz**: Take a quiz to test the full flow

### 3.3 Check for Errors

- Open browser DevTools (F12)
- Check Console tab for any errors
- Check Network tab to verify API calls are going to your Render backend

## Step 4: Update CORS (if needed)

If you see CORS errors in the browser console:

1. The backend is currently configured to allow all origins (`allow_origins=["*"]`)
2. For production, you can restrict it to your Vercel domain:
   - Update `backend/main.py` in your Render service
   - Change CORS to: `allow_origins=["https://your-project.vercel.app"]`
   - Redeploy to Render

## Troubleshooting

### Build Fails

- **Error: "Cannot find module"**: Make sure Root Directory is set to `application`
- **Error: "Build command failed"**: Check that `package.json` has the correct build script
- **TypeScript errors**: The build is configured to ignore TypeScript errors, but check logs for critical issues

### API Calls Fail

- **404 errors**: Verify `NEXT_PUBLIC_API_URL` is set correctly in Vercel
- **CORS errors**: Check backend CORS settings in Render
- **Network errors**: Verify your Render backend is running and accessible

### Environment Variables Not Working

- Make sure variables start with `NEXT_PUBLIC_` for client-side access
- Redeploy after adding/changing environment variables
- Check that variables are set for the correct environment (Production/Preview/Development)

## Your Deployment URLs

- **Backend (Render)**: `https://edumate-backend-bk8t.onrender.com`
- **Frontend (Vercel)**: `https://your-project.vercel.app` (your actual URL will be shown after deployment)

## Next Steps

1. ✅ Test all features end-to-end
2. ✅ Set up custom domain (optional)
3. ✅ Configure monitoring and analytics
4. ✅ Set up automatic deployments from GitHub

## Quick Reference

### Environment Variables in Vercel

```
NEXT_PUBLIC_API_URL=https://edumate-backend-bk8t.onrender.com
NEXT_PUBLIC_USE_MOCK=false
```

### Important Settings

- **Root Directory**: `application`
- **Framework**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`

## Support

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- Check deployment logs in Vercel Dashboard for detailed error messages

