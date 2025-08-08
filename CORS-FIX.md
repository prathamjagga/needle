# CORS Error Fix Guide - Needle Break Logger

## Quick Fix Steps (5 minutes)

### Step 1: Replace Your Google Apps Script Code
1. **Open your Google Apps Script** (from your Google Sheet: Extensions → Apps Script)
2. **Delete all existing code** in the editor
3. **Copy and paste** the entire content from `google-apps-script-fixed.js`
4. **Save** the project (Ctrl+S or Cmd+S)

### Step 2: Re-deploy the Web App
1. Click **Deploy** → **Manage deployments**
2. Click the **Edit** icon (pencil) next to your existing deployment
3. Under **Version**, select **New version**
4. Click **Deploy**
5. **Copy the new Web App URL** (it should be the same, but click "Copy" to be sure)

### Step 3: Test the Fixed Script
1. In the Apps Script editor, select **testSetup** from the function dropdown
2. Click **Run** ▶️
3. Check the execution log - you should see "✓ Setup test completed successfully!"

### Step 4: Update Frontend (Optional)
Replace your current `src/app.js` with `src/app-cors-fixed.js` for better error handling.

## Why CORS Errors Happen

CORS (Cross-Origin Resource Sharing) errors occur when:
- The Google Apps Script doesn't have proper headers
- The web app deployment settings are incorrect
- The script URL is wrong or outdated
- Browser security policies block the request

## Common CORS Error Messages

### "Access to fetch... has been blocked by CORS policy"
**Solution:** Use the fixed Google Apps Script code above.

### "No 'Access-Control-Allow-Origin' header is present"
**Solution:** Ensure your Google Apps Script is deployed as:
- Execute as: **Me**
- Who has access: **Anyone** (or **Anyone with Google account**)

### "Network error" or "Failed to fetch"
**Solution:** Check your script URL and ensure it ends with `/exec`

## Advanced Troubleshooting

### Check Your Script URL
Your URL should look like:
```
https://script.google.com/macros/s/AKfycbx...../exec
```

**Important:** It MUST end with `/exec`, not `/dev`

### Test Your Script Directly
1. **Open your script URL** directly in a browser
2. **You should see:** A webpage saying "Needle Break Logger API" with status "Active"
3. **If you see an error:** Your deployment has issues

### Test with curl (Advanced)
```bash
curl -X POST "YOUR_SCRIPT_URL" \
  -H "Content-Type: application/json" \
  -d '{"action":"test"}'
```

Should return: `{"success":true,"message":"Test successful",...}`

### Check Browser Console
1. **Open browser dev tools** (F12)
2. **Go to Console tab**
3. **Look for detailed error messages**
4. **Common issues:**
   - 403 Forbidden → Permission issue
   - 404 Not Found → Wrong URL
   - 500 Internal Error → Script error

## Deployment Settings Checklist

When deploying your Google Apps Script:

✅ **Type:** Web app
✅ **Execute as:** Me (your email)
✅ **Who has access:** Anyone (for public access) or Anyone with Google account
✅ **Version:** Always create "New version" when updating
✅ **Permissions:** Grant all requested permissions

## Alternative Solutions

### Solution A: Use GET Requests
If POST requests fail, the fixed script supports GET requests for simple operations:
```javascript
// Instead of POST, use GET for testing
fetch('YOUR_SCRIPT_URL?action=test')
  .then(response => response.json())
  .then(data => console.log(data));
```

### Solution B: Use Form Data
The fixed script also accepts form data:
```javascript
const formData = new FormData();
formData.append('data', JSON.stringify({action: 'test'}));

fetch('YOUR_SCRIPT_URL', {
  method: 'POST',
  body: formData
});
```

### Solution C: Use JSONP (Last Resort)
If all else fails, modify the script to support JSONP callbacks.

## Verify Everything Works

### Test 1: Basic Connection
```javascript
fetch('YOUR_SCRIPT_URL?action=test')
  .then(response => response.json())
  .then(data => console.log('✓ Test passed:', data))
  .catch(error => console.error('✗ Test failed:', error));
```

### Test 2: Submit Test Entry
Use the web app to submit a test entry and verify it appears in your Google Sheet.

### Test 3: Load Submissions
Click "Today's Submissions" tab and verify it loads without errors.

## Still Having Issues?

### Double-Check These:
1. **Script URL** is correct and ends with `/exec`
2. **Google Apps Script** code is the fixed version
3. **Deployment settings** are correct (Execute as: Me, Access: Anyone)
4. **Permissions** were granted when deploying
5. **Browser cache** is cleared (try incognito mode)

### Get Help:
1. **Share your exact error message** from browser console
2. **Share your script URL** (remove sensitive parts)
3. **Test your script URL** directly in browser
4. **Check Google Apps Script execution log** for server-side errors

### Emergency Workaround:
If nothing works, you can manually enter data into your Google Sheet while troubleshooting the technical issue.

## Security Notes

- The CORS fix allows requests from any origin (*)
- For production, you may want to restrict origins
- Always keep your Google Apps Script URL private
- Regularly check your Google Drive for uploaded images

## Success Indicators

When everything works correctly:
- ✅ No CORS errors in browser console
- ✅ Form submissions save to Google Sheet
- ✅ Images upload to Google Drive
- ✅ Today's submissions load properly
- ✅ Success modal appears after submission

---

**Most CORS issues are solved by using the fixed Google Apps Script code and proper deployment settings.**