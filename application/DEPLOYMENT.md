# Deployment Guide

This guide will help you deploy EduMate to Vercel (frontend) and Render (backend) with Supabase as the database.

## Prerequisites

1. **Supabase Account**: Sign up at [supabase.com](https://supabase.com)
2. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
3. **Render Account**: Sign up at [render.com](https://render.com)
4. **Groq API Key**: Get from [console.groq.com](https://console.groq.com)

## Step 1: Set Up Supabase

### 1.1 Create a Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Fill in:
   - **Name**: `edumate` (or your preferred name)
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to your users
4. Click "Create new project"
5. Wait for project to be created (~2 minutes)

### 1.2 Enable pgvector Extension

1. In your Supabase project, go to **SQL Editor**
2. Run this SQL:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
3. Click "Run"

### 1.3 Get Database Connection String

1. Go to **Settings** > **Database**
2. Scroll to **Connection string** > **URI**
3. Copy the connection string (it looks like):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres
   ```
4. Replace `[YOUR-PASSWORD]` with your database password
5. Save this as `DATABASE_URL` (you'll need it later)

## Step 2: Deploy Backend to Render

### 2.1 Prepare Repository

1. Push your code to GitHub (if not already)
2. Make sure all changes are committed

### 2.2 Create Render Web Service

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New** > **Web Service**
3. Connect your GitHub repository
4. Select your repository
5. Configure:
   - **Name**: `edumate-backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python -c "import os; port = int(os.environ.get('PORT', '10000')); import uvicorn; uvicorn.run('backend.main:app', host='0.0.0.0', port=port)"`
   - **Plan**: **Free** (or paid if you prefer)
   - **Root Directory**: `application` (if your repo structure has it)

### 2.3 Set Environment Variables

In Render dashboard, go to **Environment** tab and add:

- `DATABASE_URL`: Your Supabase connection string from Step 1.3
- `GROQ_API_KEY`: Your Groq API key
- `PORT`: `10000` (Render's default port - optional, Render sets this automatically)

### 2.4 Deploy

1. Click **Create Web Service**
2. Wait for deployment (~5-10 minutes)
3. Once deployed, note your backend URL (e.g., `https://edumate-backend.onrender.com`)

### 2.5 Initialize Database

After first deployment, the backend will automatically:
- Create all database tables
- Create the vector table
- Populate the vector table with embeddings from `data/test.jsonl`

**Note**: The first request may take longer as it initializes the database.

## Step 3: Deploy Frontend to Vercel

### 3.1 Prepare Environment Variables

1. Create a `.env.local` file in the `application` directory:
   ```env
   NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com
   NEXT_PUBLIC_USE_MOCK=false
   ```

   Replace `https://your-backend-url.onrender.com` with your actual Render backend URL.

### 3.2 Deploy to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New** > **Project**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `application` (if your repo structure has it)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)

### 3.3 Set Environment Variables

In Vercel project settings, go to **Environment Variables** and add:

- `NEXT_PUBLIC_API_URL`: Your Render backend URL
- `NEXT_PUBLIC_USE_MOCK`: `false`

### 3.4 Deploy

1. Click **Deploy**
2. Wait for deployment (~2-5 minutes)
3. Your app will be live at `https://your-project.vercel.app`

## Step 4: Update CORS (if needed)

If you encounter CORS errors:

1. In your Render backend, the CORS is already configured to allow all origins (`allow_origins=["*"]`)
2. For production, you may want to restrict it to your Vercel domain:
   - Update `backend/main.py`:
     ```python
     allow_origins=["https://your-project.vercel.app"]
     ```
   - Redeploy to Render

## Step 5: Verify Deployment

1. **Test Backend**: Visit `https://your-backend.onrender.com/` - should return `{"status": "API is running"}`
2. **Test Frontend**: Visit your Vercel URL and try:
   - Sign up a new user
   - Login
   - Use the tutor features

## Troubleshooting

### Backend Issues

- **Database connection errors**: Verify `DATABASE_URL` is correct in Render environment variables
- **Vector table not found**: Check that pgvector extension is enabled in Supabase
- **Slow first request**: Normal - database initialization happens on first request
- **Out of memory (512MB)**: The code now uses lazy loading for ML models to reduce memory usage. If you still see this error:
  - Ensure you're using the optimized `requirements.txt` (removed heavy dependencies)
  - The embedding model loads only when first needed (lazy loading)
  - Consider upgrading to Render's paid tier for more memory
- **No open ports detected**: 
  - Ensure Start Command uses: `python -c "import os; port = int(os.environ.get('PORT', '10000')); import uvicorn; uvicorn.run('backend.main:app', host='0.0.0.0', port=port)"`
  - Render's default PORT is `10000` (not 8000)
  - Check that Root Directory is set to `application` if your repo structure requires it
  - The app must bind to `0.0.0.0` (not `127.0.0.1` or `localhost`)

### Frontend Issues

- **API calls failing**: Check `NEXT_PUBLIC_API_URL` in Vercel environment variables
- **CORS errors**: Verify backend CORS settings allow your Vercel domain

### Render Free Tier Limitations

- **Spins down after inactivity**: Free tier services spin down after 15 minutes of inactivity
- **First request after spin-down**: May take 30-60 seconds to wake up
- **Solution**: Consider upgrading to paid tier or use a service like [UptimeRobot](https://uptimerobot.com) to ping your service every 5 minutes

## Cost Estimate

- **Supabase**: Free tier includes 500MB database, 2GB bandwidth
- **Vercel**: Free tier includes unlimited deployments, 100GB bandwidth
- **Render**: Free tier includes 750 hours/month (enough for always-on if you keep it awake)
- **Groq**: Check [pricing](https://groq.com/pricing) - free tier available

## Next Steps

1. Set up custom domain (optional)
2. Configure monitoring and alerts
3. Set up database backups in Supabase
4. Consider upgrading to paid tiers as you scale

## Support

For issues, check:
- [Supabase Docs](https://supabase.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- [Render Docs](https://render.com/docs)

