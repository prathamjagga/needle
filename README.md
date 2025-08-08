# Needle Break Logger - Garment Manufacturing Unit

A comprehensive web application for logging broken needle events in garment manufacturing units. This app provides a structured data entry process with real-time Google Sheets integration and image upload capabilities.

## Features

- **Step-by-step Form Interface**: Guided data entry with progress tracking
- **Real-time Google Sheets Integration**: Automatic data synchronization
- **Image Upload**: Upload broken needle photos to Google Drive
- **Today's Submissions View**: View all entries logged today
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Offline Capability**: Can work offline and sync when connection is restored
- **Form Validation**: Ensures all required fields are properly filled

## Data Fields Collected

1. **Department** (Dropdown: Production, Finishing, Sampling)
2. **Needle Room Incharge Name** (Text input)
3. **Date** (Auto-capture or Date Picker)
4. **Time** (Auto-capture or Time input)
5. **Machine No.** (Text/Number input)
6. **Line Number** (Text/Number input)
7. **Type of Machine** (Dropdown with extensive options)
8. **Type of Needle** (Dropdown with 17 needle types)
9. **Supervisor Name or Signature** (Text input)
10. **Machine Operator Name** (Text input)
11. **Upload Broken Needle Image** (File upload)
12. **Remarks** (Paragraph input)

## Setup Instructions

### 1. Google Sheets Setup

1. **Create a new Google Spreadsheet**
   - Go to [Google Sheets](https://sheets.google.com)
   - Create a new blank spreadsheet
   - Name it "Needle Break Log" or similar
   - Copy the spreadsheet ID from the URL (the long string between `/d/` and `/edit`)

2. **Set up Google Apps Script**
   - In your Google Sheet, go to `Extensions > Apps Script`
   - Delete the default `Code.gs` content
   - Copy and paste the entire content from `google-apps-script.js`
   - Save the project (Ctrl+S or Cmd+S)
   - Name your project "Needle Break Logger API"

3. **Deploy the Web App**
   - Click on "Deploy" > "New deployment"
   - Choose type: "Web app"
   - Description: "Needle Break Logger API v1.0"
   - Execute as: "Me"
   - Who has access: "Anyone" (for public access) or "Anyone with Google account"
   - Click "Deploy"
   - Copy the Web App URL (you'll need this for the frontend)
   - Click "Authorize access" and grant necessary permissions

4. **Test the Setup**
   - In Apps Script, run the `testSetup()` function
   - Check the execution log to ensure everything works
   - Your Google Sheet should now have proper headers and formatting

### 2. Google Drive Setup (for Image Storage)

The script will automatically create a folder called "Needle Break Images" in your Google Drive. No additional setup is required.

### 3. Frontend Configuration

1. **Update the Configuration**
   - Open `src/app.js`
   - Find the `sheetsConfig` object around line 10
   - Replace `YOUR_GOOGLE_APPS_SCRIPT_URL_HERE` with your deployed web app URL
   - Replace `YOUR_GOOGLE_SHEETS_ID_HERE` with your spreadsheet ID

```javascript
this.sheetsConfig = {
    scriptUrl: 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec',
    sheetId: 'YOUR_GOOGLE_SHEETS_ID_HERE'
};
```

### 4. Hosting the Application

#### Option A: Local Development
1. Simply open `index.html` in your web browser
2. For full functionality (including image uploads), serve via a local server:
   ```bash
   # Using Python
   python -m http.server 8000
   # Then visit http://localhost:8000
   
   # Using Node.js
   npx serve .
   # Then visit the provided URL
   ```

#### Option B: GitHub Pages
1. Push your code to a GitHub repository
2. Go to repository Settings > Pages
3. Select source branch (usually `main`)
4. Your app will be available at `https://yourusername.github.io/repository-name`

#### Option C: Netlify/Vercel
1. Connect your GitHub repository to Netlify or Vercel
2. Deploy with default settings
3. Your app will be automatically deployed

### 5. Testing the Complete Setup

1. **Open the Application**
   - Navigate to your hosted URL
   - You should see the Needle Break Logger interface

2. **Test Form Submission**
   - Fill out all required fields
   - Upload a test image
   - Submit the form
   - Check your Google Sheet for the new entry
   - Verify the image appears in your Google Drive

3. **Test Today's Submissions**
   - Click on the "Today's Submissions" tab
   - You should see your test entry listed

## Machine Types Available

- **SN Series**: SN-01 through SN-274
- **O/L Series (5 Thread)**: O/L-01 through O/L-19
- **O/L Series (4 Thread)**: O/L-01 through O/L-34
- **F/L Series**: F/L-01 through F/L-08

## Needle Types Available

- DBX1-75/11
- DBX1-65/9
- DCX1-75/11
- UYX128-75/11
- DBX1-55/7
- DCX1-65/9
- DCX1-90/14
- DPX5-75/11
- DPX5-90/14
- DBX1-90/14
- DPX17-90/14
- UYX128-90/14
- (B-64)-TVX64-130/21
- TVX64-90/14
- TVX64-110/18
- TVX64-100/16
- UYX128-65/9

## File Structure

```
needle/
├── index.html              # Main application interface
├── src/
│   ├── styles.css         # Application styling
│   └── app.js             # Application logic
├── assets/                # Static assets (images, icons)
├── google-apps-script.js  # Google Apps Script code
└── README.md              # This file
```

## Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Security Features

- Input validation and sanitization
- File type and size restrictions for uploads
- HTTPS enforcement for production deployments
- Google Apps Script handles authentication automatically

## Troubleshooting

### Common Issues

1. **Form submission fails**
   - Check if the Google Apps Script URL is correct
   - Ensure the script has proper permissions
   - Check the browser console for error messages

2. **Images not uploading**
   - Verify file size is under 5MB
   - Check file format (PNG, JPG, JPEG only)
   - Ensure Google Drive API access is enabled

3. **Today's submissions not loading**
   - Check internet connection
   - Verify Google Sheets permissions
   - Look for JavaScript errors in browser console

4. **Styling issues**
   - Clear browser cache
   - Check if CSS file is loading properly
   - Ensure all font resources are accessible

### Debug Mode

To enable debug mode:
1. Open browser developer tools (F12)
2. Go to Console tab
3. Type: `localStorage.setItem('debug', 'true')`
4. Refresh the page

## Advanced Configuration

### Custom Validation Rules

You can add custom validation in `src/app.js` by modifying the `validateField()` method.

### Additional Fields

To add new fields:
1. Update the HTML form structure
2. Modify the JavaScript form handling
3. Update the Google Apps Script to handle new columns
4. Adjust the Google Sheet headers accordingly

### Styling Customization

The app uses CSS custom properties for easy theming. Main color variables are defined at the top of `styles.css`.

## Support

For technical support or feature requests, please:
1. Check the troubleshooting section above
2. Review the browser console for error messages
3. Verify all setup steps were completed correctly

## License

This project is provided as-is for educational and commercial use in garment manufacturing facilities.

## Version History

- **v1.0.0** - Initial release with complete functionality
  - Step-by-step form interface
  - Google Sheets integration
  - Image upload to Google Drive
  - Today's submissions view
  - Responsive design
  - Form validation