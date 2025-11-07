# Quick Start: Deploy to Vercel

## Your Backend URL
**Backend (Render)**: `https://edumate-backend-bk8t.onrender.com`

## Deploy to Vercel in 5 Steps

### 1. Go to Vercel
Visit: [vercel.com/dashboard](https://vercel.com/dashboard)

### 2. Create New Project
- Click **"Add New"** → **"Project"**
- Select your GitHub repository

### 3. Configure Settings
**IMPORTANT**: Before deploying, click **"Edit"** next to **Root Directory** and set it to:
```
application
```

### 4. Add Environment Variables
Click **"Environment Variables"** and add:

**Variable 1:**
- Key: `NEXT_PUBLIC_API_URL`
- Value: `https://edumate-backend-bk8t.onrender.com`
- Environments: ✅ Production ✅ Preview ✅ Development

**Variable 2:**
- Key: `NEXT_PUBLIC_USE_MOCK`
- Value: `false`
- Environments: ✅ Production ✅ Preview ✅ Development

### 5. Deploy
- Click **"Deploy"**
- Wait 2-5 minutes
- Your app will be live! 🎉

## After Deployment

1. Visit your Vercel URL (shown after deployment)
2. Test the app:
   - Sign up a new user
   - Login
   - Use tutor features

## Troubleshooting

**Build fails?**
- Make sure Root Directory is set to `application`

**API calls fail?**
- Verify `NEXT_PUBLIC_API_URL` is set correctly
- Check that your Render backend is running

**Need more help?**
- See `VERCEL_DEPLOYMENT.md` for detailed instructions
- See `DEPLOYMENT.md` for full deployment guide

