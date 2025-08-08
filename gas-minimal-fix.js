/**
 * Minimal Google Apps Script Fix for JSON Responses
 * Copy and paste this ENTIRE file to replace your existing Google Apps Script code
 */

// Configuration
const SHEET_NAME = 'Needle Break Log';
const DRIVE_FOLDER_NAME = 'Needle Break Images';

// Column headers
const HEADERS = [
  'Timestamp', 'Department', 'Incharge Name', 'Date', 'Time', 
  'Machine No.', 'Line No.', 'Machine Type', 'Needle Type', 
  'Supervisor', 'Operator', 'Image Link', 'Remarks'
];

function doPost(e) {
  try {
    if (!e.postData || !e.postData.contents) {
      return createJsonResponse(false, 'No data received');
    }

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
        result = { success: false, message: 'Invalid action: ' + data.action };
    }

    return createJsonResponse(result.success, result.message, result.data);

  } catch (error) {
    console.error('doPost error:', error);
    return createJsonResponse(false, 'Server error: ' + error.toString());
  }
}

function doGet(e) {
  const html = `
    <h2>Needle Break Logger API</h2>
    <p>Status: <span style="color: green;">Active</span></p>
    <p>Time: ${new Date().toLocaleString()}</p>
    <p>Version: Minimal Fix</p>
  `;
  return HtmlService.createHtmlOutput(html);
}

function createJsonResponse(success, message, data = null) {
  const response = {
    success: success,
    message: message,
    timestamp: new Date().toISOString()
  };
  
  if (data !== null) {
    response.data = data;
  }

  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

function submitEntry(entryData) {
  try {
    const sheet = getOrCreateSheet();
    sheet.appendRow(entryData);
    
    return {
      success: true,
      message: 'Entry submitted successfully',
      data: { rowNumber: sheet.getLastRow() }
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to submit: ' + error.toString()
    };
  }
}

function getSubmissions(date) {
  try {
    const sheet = getOrCreateSheet();
    const data = sheet.getDataRange().getValues();
    
    const filteredData = data.filter((row, index) => {
      if (index === 0) return false; // Skip header
      const rowDate = row[3]; // Date column
      return rowDate && rowDate.toString().includes(date);
    });

    return {
      success: true,
      message: `Found ${filteredData.length} submissions`,
      data: filteredData
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to get submissions: ' + error.toString(),
      data: []
    };
  }
}

function uploadImage(fileName, fileData, mimeType) {
  try {
    const folder = getOrCreateFolder(DRIVE_FOLDER_NAME);
    const blob = Utilities.newBlob(
      Utilities.base64Decode(fileData),
      mimeType,
      fileName
    );
    
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    return {
      success: true,
      message: 'Image uploaded successfully',
      data: {
        fileId: file.getId(),
        fileUrl: `https://drive.google.com/file/d/${file.getId()}/view`
      }
    };
  } catch (error) {
    return {
      success: false,
      message: 'Upload failed: ' + error.toString()
    };
  }
}

function getOrCreateSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    
    // Format headers
    const headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
    headerRange.setBackground('#4a90e2').setFontColor('white').setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  
  return sheet;
}

function getOrCreateFolder(folderName) {
  const folders = DriveApp.getFoldersByName(folderName);
  return folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);
}

function testSetup() {
  try {
    const sheet = getOrCreateSheet();
    const folder = getOrCreateFolder(DRIVE_FOLDER_NAME);
    
    const testData = [
      new Date().toISOString(), 'Production', 'Test Incharge', 
      new Date().toISOString().split('T')[0], '10:30', 'M001', 'L001', 
      'SN-01', 'DBX1-75/11', 'Test Supervisor', 'Test Operator', 
      'No image', 'Test entry - please ignore'
    ];
    
    const result = submitEntry(testData);
    console.log('Test result:', result);
    
    return 'Setup test completed - check logs for details';
  } catch (error) {
    console.error('Test failed:', error);
    return 'Test failed: ' + error.toString();
  }
}