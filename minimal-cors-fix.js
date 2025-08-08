/**
 * Minimal CORS Fix for Google Apps Script
 * Replace your existing doPost and doGet functions with these
 */

function doPost(e) {
  // Add CORS headers to all responses
  const response = ContentService.createTextOutput();
  
  try {
    const data = JSON.parse(e.postData.contents);
    let result;
    
    switch (data.action) {
      case 'submitEntry':
        result = submitEntry(data.data);
        break;
      case 'getSubmissions':
        result = getSubmissions(data.date);
        break;
      case 'uploadImage':
        result = uploadImage(data.fileName, data.fileData, data.mimeType);
        break;
      default:
        result = { success: false, message: 'Invalid action' };
    }
    
    return response
      .setContent(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return response
      .setContent(JSON.stringify({
        success: false,
        message: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return HtmlService.createHtmlOutput(`
    <h2>Needle Break Logger API</h2>
    <p>Status: <span style="color: green;">Active</span></p>
    <p>CORS: Fixed</p>
    <p>Time: ${new Date().toLocaleString()}</p>
  `);
}

// Keep all your existing functions (submitEntry, getSubmissions, uploadImage, etc.)
// Just add this at the top and replace doPost/doGet