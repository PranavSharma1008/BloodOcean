# Blood Donation Finder - Deployment Guide

This guide covers deploying the Blood Donation Finder application to production using Vercel (frontend) and Render (backend) with MongoDB Atlas as the database.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Database Setup (MongoDB Atlas)](#database-setup-mongodb-atlas)
3. [Backend Deployment (Render)](#backend-deployment-render)
4. [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
5. [Environment Variables](#environment-variables)
6. [API Testing](#api-testing)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying, ensure you have:

- [ ] GitHub account with repository access
- [ ] MongoDB Atlas account (free tier available)
- [ ] Render account (free tier available)
- [ ] Vercel account (free tier available)
- [ ] Node.js installed locally (v14 or higher)
- [ ] Git installed locally

---

## Database Setup (MongoDB Atlas)

### 1. Create MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up for a free account
3. Create a new project

### 2. Create Database Cluster

1. Click "Build a Database"
2. Select "M0" (Free tier) - 512MB storage
3. Choose a region closest to your users
4. Name your cluster (e.g., "blood-donation-finder")
5. Click "Create"

### 3. Create Database User

1. Go to "Database Access" in the left sidebar
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Enter username and password (save these securely!)
5. Click "Create User"

### 4. Configure Network Access

1. Go to "Network Access" in the left sidebar
2. Click "Add IP Address"
3. Select "Allow Access from Anywhere" (0.0.0.0/0) for Render deployment
4. Click "Confirm"

### 5. Get Connection String

1. Go to "Database" in the left sidebar
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Select Node.js version
5. Copy the connection string

**Connection String Format:**
```
mongodb+srv://<username>:<password>@cluster.mongodb.net/blood-donation-finder?retryWrites=true&w=majority
```

Replace `<username>` and `<password>` with your actual credentials.

---

## Backend Deployment (Render)

### 1. Prepare Backend Code

Ensure your backend is production-ready:

```bash
cd server
npm install
```

### 2. Deploy to Render

#### Option A: Using Render Dashboard (Recommended)

1. Go to [Render](https://render.com)
2. Sign up/login
3. Click "New" → "Web Service"
4. Connect your GitHub repository
5. Configure the service:

**Build & Deploy Settings:**
- **Root Directory**: `server`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

**Environment Variables:**
Add the following environment variables:

| Variable | Value | Description |
|----------|-------|-------------|
| `PORT` | `5000` | Server port |
| `NODE_ENV` | `production` | Environment |
| `MONGODB_URI` | Your MongoDB connection string | Database connection |
| `JWT_SECRET` | Strong random string (32+ chars) | JWT signing key |
| `JWT_EXPIRE` | `7d` | Token expiration |
| `FRONTEND_URL` | Your Vercel URL | CORS allowed origin |

6. Click "Create Web Service"
7. Wait for deployment to complete
8. Copy your Render URL (e.g., `https://blood-donation-finder-api.onrender.com`)

#### Option B: Using render.yaml

1. The `render.yaml` file is already in your project root
2. Connect your GitHub repository to Render
3. Render will automatically detect and use the configuration

### 3. Verify Backend Deployment

1. Open your Render URL in a browser
2. You should see: `{"message": "Blood Donation Finder API"}`
3. Test the health endpoint: `https://your-api.onrender.com/`

---

## Frontend Deployment (Vercel)

### 1. Prepare Frontend Code

Update the frontend API URL for production:

```bash
cd client
```

Create `.env.production` in the `client` folder (or set in Vercel dashboard):
```
VITE_API_URL=https://your-api.onrender.com
```

For local development, leave `VITE_API_URL` empty — the Vite dev proxy forwards `/api` to `http://localhost:5000`.

### 2. Deploy to Vercel

#### Option A: Using Vercel Dashboard (Recommended)

1. Go to [Vercel](https://vercel.com)
2. Sign up/login
3. Click "Add New Project"
4. Import your GitHub repository
5. Configure the project:

**Framework Preset:** Vite

**Build & Output Settings:**
- **Root Directory**: `client`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

**Environment Variables:**
| Variable | Value |
|----------|-------|
| `VITE_API_URL` | Your Render API URL (e.g. `https://blood-donation-finder-api.onrender.com`) |

6. Click "Deploy"
7. Wait for deployment to complete
8. Copy your Vercel URL (e.g., `https://blood-donation-finder.vercel.app`)

#### Option B: Using Vercel CLI

```bash
npm install -g vercel
vercel
```

Follow the prompts to deploy.

### 3. Update Backend CORS

After deploying to Vercel, update your backend CORS:

1. Go to Render dashboard
2. Open your web service
3. Go to "Environment" section
4. Update `FRONTEND_URL` to your Vercel URL
5. Save and redeploy

### 4. Verify Frontend Deployment

1. Open your Vercel URL in a browser
2. You should see the login page
3. Test registration and login functionality

---

## Environment Variables

### Backend (.env)

```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/blood-donation-finder?retryWrites=true&w=majority
JWT_SECRET=your_strong_random_secret_key_minimum_32_characters
JWT_EXPIRE=7d
NODE_ENV=production
FRONTEND_URL=https://your-frontend.vercel.app
```

### Frontend (.env)

**Development:**
```env
VITE_API_URL=
```

**Production:**
```env
VITE_API_URL=https://your-api.onrender.com
```

### Security Notes

- **JWT_SECRET**: Use a strong, random string (minimum 32 characters)
- **MONGODB_URI**: Never commit this to version control
- **FRONTEND_URL**: Must match your deployed frontend URL for CORS

---

## API Testing

### Manual Testing with Postman/cURL

#### Test Authentication

**Register:**
```bash
POST https://your-api.onrender.com/api/auth/register
Content-Type: application/json

{
  "name": "Test User",
  "email": "test@example.com",
  "password": "password123"
}
```

**Login:**
```bash
POST https://your-api.onrender.com/api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123"
}
```

#### Test Protected Routes

```bash
GET https://your-api.onrender.com/api/profile
Authorization: Bearer <your_jwt_token>
```

### Automated Testing

Create a test script `test-api.sh`:

```bash
#!/bin/bash

API_URL="https://your-api.onrender.com"

echo "Testing API at $API_URL"

# Test root
curl -X GET "$API_URL/"

# Test register
curl -X POST "$API_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'

# Test login
TOKEN=$(curl -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  | jq -r '.token')

echo "Token: $TOKEN"

# Test protected route
curl -X GET "$API_URL/api/profile" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Troubleshooting

### Common Issues

#### 1. CORS Errors

**Problem:** Frontend cannot connect to backend

**Solution:**
- Ensure `FRONTEND_URL` in backend matches your Vercel URL
- Check CORS configuration in `server.js`
- Verify environment variables are set correctly in Render

#### 2. MongoDB Connection Failed

**Problem:** Backend cannot connect to MongoDB Atlas

**Solution:**
- Verify MongoDB connection string is correct
- Check IP whitelist in MongoDB Atlas (0.0.0.0/0)
- Ensure database user has correct permissions
- Check MongoDB Atlas cluster is running

#### 3. JWT Errors

**Problem:** Token invalid or expired

**Solution:**
- Ensure `JWT_SECRET` is set and consistent
- Check token expiration time (`JWT_EXPIRE`)
- Verify token is being sent in Authorization header

#### 4. Build Failures

**Problem:** Deployment fails during build

**Solution:**
- Check build logs in Render/Vercel
- Ensure all dependencies are in `package.json`
- Verify Node.js version compatibility
- Check for syntax errors in code

#### 5. 404 Errors on API Calls

**Problem:** API endpoints return 404

**Solution:**
- Verify `VITE_API_URL` is set in Vercel environment variables
- Check backend routes are properly registered
- Ensure API path matches exactly (case-sensitive)

### Debug Mode

To enable debug logging in production:

```bash
# In Render, add environment variable:
DEBUG=*
```

### Monitoring

**Render:**
- View logs in Render dashboard
- Monitor metrics (CPU, memory, response time)
- Set up alerts for errors

**Vercel:**
- View deployment logs
- Monitor build times
- Check analytics

---

## Post-Deployment Checklist

- [ ] Backend deployed successfully on Render
- [ ] Frontend deployed successfully on Vercel
- [ ] MongoDB Atlas connected and accessible
- [ ] Environment variables configured correctly
- [ ] CORS configured properly
- [ ] Authentication working (register/login)
- [ ] Protected routes accessible with valid token
- [ ] Database operations working (create, read, update, delete)
- [ ] Geolocation functionality working
- [ ] Emergency requests creating notifications
- [ ] Admin dashboard accessible for admin users
- [ ] Security headers (Helmet) active
- [ ] Error handling working correctly

---

## Security Best Practices

1. **Environment Variables**: Never commit `.env` files to version control
2. **Strong Secrets**: Use strong, random strings for JWT_SECRET
3. **HTTPS**: Both Render and Vercel provide HTTPS by default
4. **Rate Limiting**: Consider implementing rate limiting for API endpoints
5. **Input Validation**: All inputs are validated on both frontend and backend
6. **Password Hashing**: Passwords are hashed using bcrypt
7. **JWT Tokens**: Tokens expire after 7 days by default
8. **CORS**: Restricted to specific frontend URL
9. **Security Headers**: Helmet middleware adds security headers
10. **Database Access**: MongoDB Atlas IP whitelist configured
11. **Admin Role**: Cannot be self-assigned at registration; set manually in MongoDB Atlas

### Creating an Admin User

After registering a normal account, promote it in MongoDB Atlas:

1. Open your cluster → **Browse Collections** → `users`
2. Find the user document by email
3. Change `role` from `"user"` to `"admin"`
4. Log out and log back in to refresh the JWT session

---

## Cost Summary

| Service | Tier | Cost |
|---------|-------|------|
| MongoDB Atlas | M0 (Free) | $0/month |
| Render | Free | $0/month |
| Vercel | Hobby (Free) | $0/month |
| **Total** | | **$0/month** |

**Note:** Free tiers have limitations. Upgrade as needed for production.

---

## Support

For issues related to:
- **MongoDB Atlas**: [MongoDB Support](https://www.mongodb.com/docs/atlas/support/)
- **Render**: [Render Support](https://render.com/docs/support)
- **Vercel**: [Vercel Support](https://vercel.com/docs/support)

---

## Next Steps

After successful deployment:

1. Set up custom domains (optional)
2. Configure SSL certificates (automatic on Vercel/Render)
3. Set up monitoring and alerting
4. Implement automated backups (MongoDB Atlas provides this)
5. Add analytics (Google Analytics, etc.)
6. Set up CI/CD pipeline
7. Implement automated testing
8. Configure logging service (e.g., LogRocket, Sentry)

---

## Rollback Procedure

If deployment fails:

### Backend Rollback
1. Go to Render dashboard
2. Click "Manual Deploy"
3. Select previous commit
4. Deploy

### Frontend Rollback
1. Go to Vercel dashboard
2. Click "Deployments"
3. Find previous successful deployment
4. Click "Promote to Production"

---

## Maintenance

### Regular Tasks

- **Weekly**: Check logs for errors
- **Monthly**: Review MongoDB storage usage
- **Quarterly**: Update dependencies
- **As needed**: Scale resources based on traffic

### Updates

To update the application:

1. Make changes locally
2. Test thoroughly
3. Commit and push to GitHub
4. Render and Vercel will auto-deploy
5. Verify deployment in production

---

## Additional Resources

- [MongoDB Atlas Documentation](https://www.mongodb.com/docs/atlas/)
- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)
- [React + Vite Deployment](https://vitejs.dev/guide/static-deploy.html)
