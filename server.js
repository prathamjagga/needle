const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = 3000;

// Your Google Apps Script URL
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxOSLDOoo3frucILYAHuVfGyi7nzZO7D00BmWOfFLU1LX-uxZt8RASCyRYCoe4vUGRU9g/exec';

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Serve static files from current directory
app.use(express.static('.'));

// Proxy endpoint for Google Apps Script
app.post('/api/submit', async (req, res) => {
  try {
    console.log('📤 Request received:', req.body);
    console.log('🌐 Making request to:', GOOGLE_SCRIPT_URL);

    const requestBody = JSON.stringify(req.body);
    console.log('📝 Request body:', requestBody);

    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/plain, */*',
        'User-Agent': 'Mozilla/5.0 (compatible; NeedleLogger/1.0)',
        'Referer': 'http://localhost:3000'
      },
      redirect: 'follow',
      body: requestBody
    });

    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers));

    // Handle 401 Unauthorized specifically
    if (response.status === 401) {
      console.error('🚫 401 Unauthorized - Google Apps Script deployment issue');
      console.error('   Possible causes:');
      console.error('   1. Script not deployed as "Web app"');
      console.error('   2. "Execute as" should be "Me"');
      console.error('   3. "Who has access" should be "Anyone" or "Anyone with Google account"');
      console.error('   4. Script needs re-deployment with new version');

      return res.status(401).json({
        success: false,
        message: 'Google Apps Script authentication failed. Please check deployment settings.',
        debug: {
          status: response.status,
          statusText: response.statusText,
          solution: 'Re-deploy your Google Apps Script with correct permissions'
        }
      });
    }

    const responseText = await response.text();
    console.log('📥 Raw response length:', responseText.length);
    console.log('📥 Response preview:', responseText.substring(0, 300));

    if (!response.ok) {
      console.error('❌ HTTP Error:', response.status, response.statusText);
      return res.status(response.status).json({
        success: false,
        message: `Google Apps Script returned ${response.status}: ${response.statusText}`,
        debug: responseText.substring(0, 500)
      });
    }

    // Try to parse as JSON first
    try {
      const data = JSON.parse(responseText);
      console.log('✅ JSON parsed successfully:', data);
      res.json(data);
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError.message);

      // Check if it's a login/auth page
      if (responseText.includes('Sign in') || responseText.includes('authentication') || responseText.includes('login')) {
        console.error('🔐 Received authentication page');
        res.status(401).json({
          success: false,
          message: 'Google Apps Script requires authentication. Check deployment permissions.',
          debug: responseText.substring(0, 300)
        });
      } else if (responseText.includes('<html') || responseText.includes('<!DOCTYPE')) {
        console.error('📄 Received HTML instead of JSON');
        res.status(500).json({
          success: false,
          message: 'Google Apps Script returned HTML instead of JSON. Check script deployment.',
          debug: responseText.substring(0, 300)
        });
      } else {
        console.error('🔧 Other parsing error');
        res.status(500).json({
          success: false,
          message: 'Invalid response format from Google Apps Script',
          debug: responseText.substring(0, 300)
        });
      }
    }
  } catch (error) {
    console.error('💥 Fetch error:', error.message);
    res.status(500).json({
      success: false,
      message: `Network error: ${error.message}`,
      debug: {
        url: GOOGLE_SCRIPT_URL,
        errorType: error.name
      }
    });
  }
});

// Test endpoint to verify Google Apps Script directly
app.get('/api/test-script', async (req, res) => {
  try {
    console.log('🧪 Testing Google Apps Script directly...');
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NeedleLogger/1.0)'
      }
    });
    const text = await response.text();

    res.json({
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers),
      bodyPreview: text.substring(0, 500),
      isHTML: text.includes('<html') || text.includes('<!DOCTYPE'),
      isAuthPage: text.includes('Sign in') || text.includes('authentication')
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// home page
app.get("/", async (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'CORS proxy server running',
    scriptUrl: GOOGLE_SCRIPT_URL,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 CORS Proxy Server running at http://localhost:${PORT}`);
  console.log(`📝 Open your app at: http://localhost:${PORT}`);
  console.log(`✅ API endpoint: http://localhost:${PORT}/api/submit`);
  console.log(`🧪 Test script: http://localhost:${PORT}/api/test-script`);
  console.log(`🔗 Google Script URL: ${GOOGLE_SCRIPT_URL}`);
  console.log('');
  console.log('🔧 If you get 401 errors:');
  console.log('   1. Go to Google Apps Script');
  console.log('   2. Deploy → Manage deployments');
  console.log('   3. Edit deployment settings:');
  console.log('      - Execute as: Me');
  console.log('      - Who has access: Anyone');
  console.log('   4. Create new version and deploy');
});
