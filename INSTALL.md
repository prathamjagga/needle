# Quick Installation Guide - Needle Break Logger

## Overview
This guide will help you set up the Needle Break Logger application in under 15 minutes.

## Prerequisites
- Google account (for Google Sheets and Google Drive integration)
- Web browser (Chrome, Firefox, Safari, or Edge)
- Basic understanding of Google Sheets and Google Apps Script

## Step 1: Google Sheets Setup (5 minutes)

### 1.1 Create Google Sheet
1. Go to [Google Sheets](https://sheets.google.com)
2. Click "Blank" to create a new spreadsheet
3. Rename it to "Needle Break Log"
4. Copy the Sheet ID from the URL (the long string between `/d/` and `/edit`)
   - Example: `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`

### 1.2 Set up Google Apps Script
1. In your Google Sheet, click **Extensions** → **Apps Script**
2. Delete all existing code in the editor
3. Copy the entire contents from `google-apps-script.js` and paste it
4. Click **Save** (Ctrl+S or Cmd+S)
5. Name your project "Needle Break Logger API"

### 1.3 Deploy Web App
1. Click **Deploy** → **New deployment**
2. Click the gear icon ⚙️ next to "Select type"
3. Choose **Web app**
4. Set the following:
   - Description: `Needle Break Logger v1.0`
   - Execute as: `Me`
   - Who has access: `Anyone with Google account`
5. Click **Deploy**
6. Click **Authorize access** and grant all requested permissions
7. **IMPORTANT**: Copy the Web App URL - you'll need this next!

## Step 2: Configure the Application (2 minutes)

### 2.1 Update Configuration
1. Open `src/app.js` in a text editor
2. Find lines 10-13 (the `sheetsConfig` object)
3. Replace the placeholder values:

```javascript
this.sheetsConfig = {
    scriptUrl: 'PASTE_YOUR_WEB_APP_URL_HERE',
    sheetId: 'PASTE_YOUR_SHEET_ID_HERE'
};
```

**Example:**
```javascript
this.sheetsConfig = {
    scriptUrl: 'https://script.google.com/macros/s/AKfycbxXXXXXXXXXXXXXXX/exec',
    sheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms'
};
```

4. Save the file

## Step 3: Test the Setup (3 minutes)

### 3.1 Test Google Apps Script
1. Back in Apps Script editor, click the function dropdown
2. Select `testSetup`
3. Click **Run** ▶️
4. Check the execution log - you should see "Setup test completed successfully!"
5. Check your Google Sheet - it should now have proper headers and one test row

### 3.2 Test the Web Application
1. Open `index.html` in your web browser
2. Fill out the form with test data
3. Submit the form
4. Check your Google Sheet - the new entry should appear
5. Check Google Drive - a folder "Needle Break Images" should be created

## Step 4: Deploy to Production (5 minutes)

### Option A: Simple File Hosting
1. Upload all files to your web hosting service
2. Access via your domain URL

### Option B: GitHub Pages (Free)
1. Create a new GitHub repository
2. Upload all files to the repository
3. Go to **Settings** → **Pages**
4. Select source branch (usually `main`)
5. Your app will be available at `https://yourusername.github.io/repository-name`

### Option C: Netlify (Free)
1. Go to [Netlify](https://netlify.com)
2. Drag and drop your project folder onto the deploy area
3. Your app will be instantly deployed with a custom URL

## Step 5: Cleanup (Optional)
If you ran the test setup, you can clean up the test data:
1. In Apps Script, run the `cleanupTestData()` function
2. This will remove any test entries from your sheet

## Troubleshooting

### Common Issues:

**❌ "Script function not found"**
- Make sure you copied the entire `google-apps-script.js` content
- Ensure you saved the script before deploying

**❌ "Permission denied"**
- Make sure you authorized the script properly
- Try re-deploying with "Execute as: Me"

**❌ "Form submission fails"**
- Double-check your Web App URL in `app.js`
- Make sure the URL ends with `/exec`
- Verify your Google Sheet ID is correct

**❌ "Images not uploading"**
- Check file size (must be under 5MB)
- Ensure file format is PNG, JPG, or JPEG
- Verify Google Drive permissions

### Quick Tests:
1. **Sheet Connection**: Run `testSetup()` in Apps Script
2. **Web App**: Try accessing your Web App URL directly in browser
3. **Form**: Submit a test entry and check Google Sheet
4. **Images**: Upload a small test image

## Security Notes
- The Google Apps Script runs with your permissions
- Images uploaded are stored in your Google Drive
- Data is saved to your Google Sheet
- No data is stored on third-party servers

## Next Steps
- Customize machine types and needle types in the configuration
- Set up user training for your factory floor operators
- Consider creating shortcuts on factory computers/tablets
- Set up regular backups of your Google Sheet data

## Support
If you encounter issues:
1. Check the browser console for error messages (F12)
2. Verify all URLs and IDs are correct
3. Test each component individually
4. Review the full README.md for detailed troubleshooting

---
**Total Setup Time: ~15 minutes**
**Difficulty: Beginner-friendly**