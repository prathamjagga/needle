// Test endpoint for Vercel deployment
const fetch = require('node-fetch');

// Your Google Apps Script URL
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxzY822yjhWMHkVeng7Fe7RV13FmbMfEC0_7xLENVseyZ430KZsjTMA0t28EJ6ML0zKeQ/exec';

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('🧪 Testing Google Apps Script connection...');
    
    const response = await fetch(GOOGLE_SCRIPT_URL, { 
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NeedleLogger/1.0)',
        'Accept': 'text/html,application/json,*/*'
      }
    });
    
    const text = await response.text();
    
    const result = {
      timestamp: new Date().toISOString(),
      scriptUrl: GOOGLE_SCRIPT_URL,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers),
      bodyPreview: text.substring(0, 500),
      isHTML: text.includes('<html') || text.includes('<!DOCTYPE'),
      isAuthPage: text.includes('Sign in') || text.includes('authentication'),
      deployment: 'Vercel',
      apiVersion: '1.0'
    };

    // Add diagnosis
    if (response.status === 401) {
      result.diagnosis = 'Authentication error - check Google Apps Script deployment settings';
    } else if (response.status === 404) {
      result.diagnosis = 'Script not found - check URL or deployment status';
    } else if (response.status === 200 && result.isHTML) {
      result.diagnosis = 'Script responding but may need JSON response setup';
    } else if (response.status === 200) {
      result.diagnosis = 'Connection successful';
    } else {
      result.diagnosis = `Unexpected status: ${response.status}`;
    }

    return res.json(result);
    
  } catch (error) {
    console.error('Test error:', error.message);
    return res.status(500).json({ 
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      deployment: 'Vercel'
    });
  }
};