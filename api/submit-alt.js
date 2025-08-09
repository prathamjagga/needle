export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  // Your Google Apps Script URL
  const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxzY822yjhWMHkVeng7Fe7RV13FmbMfEC0_7xLENVseyZ430KZsjTMA0t28EJ6ML0zKeQ/exec';

  try {
    console.log('📤 Request received:', req.body);
    
    const requestBody = JSON.stringify(req.body);
    
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/plain, */*',
        'User-Agent': 'Mozilla/5.0 (compatible; NeedleLogger/1.0)',
      },
      body: requestBody
    });

    console.log('📊 Response status:', response.status);
    
    // Handle 401 Unauthorized
    if (response.status === 401) {
      return res.status(401).json({
        success: false,
        message: 'Google Apps Script authentication failed. Check deployment settings.',
        debug: {
          status: response.status,
          solution: 'Re-deploy Google Apps Script with "Execute as: Me" and "Who has access: Anyone"'
        }
      });
    }
    
    const responseText = await response.text();
    
    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        message: `Google Apps Script returned ${response.status}: ${response.statusText}`,
        debug: responseText.substring(0, 500)
      });
    }

    // Try to parse as JSON
    try {
      const data = JSON.parse(responseText);
      return res.status(200).json(data);
    } catch (parseError) {
      if (responseText.includes('Sign in') || responseText.includes('authentication')) {
        return res.status(401).json({
          success: false,
          message: 'Google Apps Script requires authentication. Check deployment permissions.',
          debug: responseText.substring(0, 300)
        });
      } else if (responseText.includes('<html')) {
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
      message: `Network error: ${error.message}`
    });
  }
}