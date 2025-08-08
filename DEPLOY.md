# Deploy Needle Break Logger to Vercel

## 🚀 **One-Click Deploy to Vercel**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/needle-break-logger)

## 📋 **Prerequisites**

1. **Google Apps Script** properly deployed with:
   - Execute as: **Me**
   - Who has access: **Anyone**
   - URL ending with `/exec`

2. **Vercel Account** (free at [vercel.com](https://vercel.com))

3. **GitHub Account** (to store your code)

## 🔧 **Step-by-Step Deployment**

### **Step 1: Prepare Your Code**

1. **Update your Google Apps Script URL** in `api/submit.js`:
   ```javascript
   const GOOGLE_SCRIPT_URL = 'YOUR_ACTUAL_GOOGLE_APPS_SCRIPT_URL_HERE';
   ```

2. **Test locally** (optional):
   ```bash
   npm install
   npm start
   # Test at http://localhost:3000
   ```

### **Step 2: Deploy to Vercel**

#### **Option A: Deploy via GitHub**

1. **Push your code to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/needle-break-logger.git
   git push -u origin main
   ```

2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click **"New Project"**
   - Import your GitHub repository
   - Click **"Deploy"**

#### **Option B: Deploy via Vercel CLI**

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Deploy**:
   ```bash
   cd needle
   vercel
   ```

3. **Follow the prompts**:
   - Set up and deploy? **Y**
   - Which scope? **Your account**
   - Link to existing project? **N**
   - Project name? **needle-break-logger**
   - Directory? **./needle** (or current directory)

### **Step 3: Configure Environment (if needed)**

If you need to hide your Google Apps Script URL:

1. **Add environment variable** in Vercel dashboard:
   - Go to your project settings
   - Add `GOOGLE_SCRIPT_URL` variable
   - Value: Your full Google Apps Script URL

2. **Update `api/submit.js`**:
   ```javascript
   const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL || 'your-fallback-url';
   ```

### **Step 4: Test Your Deployment**

1. **Visit your Vercel URL**: `https://your-project-name.vercel.app`

2. **Test the API**: `https://your-project-name.vercel.app/api/test`

3. **Submit a test entry** through the web form

## 📁 **Project Structure for Vercel**

```
needle/
├── api/
│   ├── submit.js          # Main API endpoint (serverless function)
│   └── test.js           # Test endpoint
├── src/
│   ├── app.js            # Frontend JavaScript
│   └── styles.css        # Styling
├── index.html            # Main page
├── package.json          # Dependencies
├── vercel.json          # Vercel configuration
└── README.md            # Documentation
```

## 🔧 **Vercel Configuration**

The `vercel.json` file configures:
- **Serverless functions** in `/api` directory
- **Static file serving** for HTML, CSS, JS
- **Proper routing** for both API and static files

## 🌐 **API Endpoints**

Once deployed, your API endpoints will be:

- **Submit Entry**: `https://your-app.vercel.app/api/submit` (POST)
- **Test Connection**: `https://your-app.vercel.app/api/test` (GET)
- **Main App**: `https://your-app.vercel.app/` (GET)

## 🐛 **Troubleshooting**

### **Deployment Fails**
- Check `package.json` dependencies
- Ensure `node-fetch` version is `^2.7.0` (not v3)
- Verify `vercel.json` configuration

### **API Returns 500 Error**
- Check Vercel function logs in dashboard
- Verify Google Apps Script URL is correct
- Test Google Apps Script independently

### **CORS Issues**
- CORS headers are set in API functions
- Make sure frontend uses relative URLs (`/api/submit`)

### **Google Apps Script 401/404**
- Redeploy Google Apps Script with correct permissions
- Verify URL ends with `/exec`
- Check "Who has access" is set to "Anyone"

## 📊 **Monitoring & Logs**

1. **Vercel Dashboard**: View deployment status and function logs
2. **Google Apps Script**: Check execution transcript for errors
3. **Browser Console**: Monitor frontend JavaScript errors

## 🔄 **Updates & Redeployment**

### **Auto-deploy (GitHub)**
- Push changes to your GitHub repository
- Vercel automatically rebuilds and deploys

### **Manual deploy (CLI)**
```bash
vercel --prod
```

## 🔒 **Security Considerations**

- ✅ **CORS properly configured** for your domain
- ✅ **Google Apps Script** runs with your permissions only
- ✅ **No API keys** exposed in frontend code
- ✅ **Images stored** in your Google Drive
- ⚠️ **Consider restricting** Google Apps Script access if needed

## 💡 **Pro Tips**

1. **Custom Domain**: Add your own domain in Vercel settings
2. **Analytics**: Enable Vercel Analytics for usage insights
3. **Environment Variables**: Use for sensitive configuration
4. **Preview Deployments**: Test changes before going live

## 🆘 **Support**

If deployment fails:

1. **Check Vercel build logs** in the dashboard
2. **Test Google Apps Script** URL directly in browser
3. **Verify all files** are committed to repository
4. **Check Node.js version** compatibility (>=14.x)

---

**Your Needle Break Logger will be live at**: `https://your-project-name.vercel.app` 🎉