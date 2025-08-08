// Vercel Serverless API endpoint for Google Apps Script proxy
const fetch = require('node-fetch');

// Your Google Apps Script URL
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxzY822yjhWMHkVeng7Fe7RV13FmbMfEC0_7xLENVseyZ430KZsjTMA0t28EJ6ML0zKeQ/exec';

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

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
        'Referer': req.headers.referer || 'https://your-vercel-app.vercel.app'
      },
      redirect: 'follow',
      body: requestBody
    });

    console.log('📊 Response status:', response.status);
    
    // Handle 401 Unauthorized specifically
    if (response.status === 401) {
      console.error('🚫 401 Unauthorized - Google Apps Script deployment issue');
      return res.status(401).json({
        success: false,
        message: 'Google Apps Script authentication failed. Please check deployment settings.',
        debug: {
          status: response.status,
          statusText: response.statusText,
          solution: 'Re-deploy your Google Apps Script with "Execute as: Me" and "Who has access: Anyone"'
        }
      });
    }
    
    const responseText = await response.text();
    console.log('📥 Response preview:', responseText.substring(0, 300));
    
    if (!response.ok) {
      console.error('❌ HTTP Error:', response.status, response.statusText);
      return res.status(response.status).json({
        success: false,
        message: `Google Apps Script returned ${response.status}: ${response.statusText}`,
        debug: responseText.substring(0, 500)
      });
    }

    // Try to parse as JSON
    try {
      const data = JSON.parse(responseText);
      console.log('✅ JSON parsed successfully');
      return res.json(data);
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError.message);
      
      // Check if it's an auth page
      if (responseText.includes('Sign in') || responseText.includes('authentication') || responseText.includes('login')) {
        return res.status(401).json({
          success: false,
          message: 'Google Apps Script requires authentication. Check deployment permissions.',
          debug: responseText.substring(0, 300)
        });
      } else if (responseText.includes('<html') || responseText.includes('<!DOCTYPE')) {
        return res.status(500).json({
          success: false,
          message: 'Google Apps Script returned HTML instead of JSON. Check script deployment.',
          debug: responseText.substring(0, 300)
        });
      } else {
        return res.status(500).json({
          success: false,
          message: 'Invalid response format from Google Apps Script',
          debug: responseText.substring(0, 300)
        });
      }
    }
  } catch (error) {
    console.error('💥 Fetch error:', error.message);
    return res.status(500).json({ 
      success: false, 
      message: `Network error: ${error.message}`,
      debug: {
        url: GOOGLE_SCRIPT_URL,
        errorType: error.name
      }
    });
  }
};