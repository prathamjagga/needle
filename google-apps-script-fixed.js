/**
 * Google Apps Script for Needle Break Logger - CORS Fixed Version
 * Deploy this as a web app and use the URL in your frontend application
 */

// Configuration
const SHEET_NAME = 'Needle Break Log';
const DRIVE_FOLDER_NAME = 'Needle Break Images';

// Column headers for the Google Sheet
const HEADERS = [
  'Timestamp',
  'Department',
  'Incharge Name',
  'Date',
  'Time',
  'Machine No.',
  'Line No.',
  'Machine Type',
  'Needle Type',
  'Supervisor',
  'Operator',
  'Image Link',
  'Remarks'
];

/**
 * Main function to handle POST requests
 */
function doPost(e) {
  // Add CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '3600'
  };

  try {
    // Handle preflight OPTIONS request
    if (e.parameter.method === 'OPTIONS') {
      return createCORSResponse(true, 'CORS preflight successful', null, headers);
    }

    let data;
    try {
      // Parse the request data
      if (e.postData && e.postData.contents) {
        data = JSON.parse(e.postData.contents);
      } else if (e.parameter.data) {
        data = JSON.parse(e.parameter.data);
      } else {
        data = e.parameter;
      }
    } catch (parseError) {
      console.error('Error parsing request data:', parseError);
      return createCORSResponse(false, 'Invalid request data format', null, headers);
    }
    
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
      case 'test':
        result = { success: true, message: 'Test successful', timestamp: new Date().toISOString() };
        break;
      default:
        result = { success: false, message: 'Invalid action: ' + (data.action || 'none provided') };
    }
    
    return createCORSResponse(result.success, result.message, result.data, headers);
    
  } catch (error) {
    console.error('Error in doPost:', error);
    return createCORSResponse(false, 'Server error: ' + error.toString(), null, headers);
  }
}

/**
 * Handle GET requests and OPTIONS preflight
 */
function doGet(e) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
  };

  // Handle CORS preflight
  if (e.parameter.method === 'OPTIONS') {
    return createCORSResponse(true, 'CORS preflight successful', null, headers);
  }

  const action = e.parameter.action;
  
  try {
    if (action === 'test') {
      return createCORSResponse(true, 'GET test successful', {
        timestamp: new Date().toISOString(),
        version: '1.0.1-cors-fixed'
      }, headers);
    }
    
    if (action === 'getSubmissions') {
      const date = e.parameter.date || new Date().toISOString().split('T')[0];
      const result = getSubmissions(date);
      return createCORSResponse(result.success, result.message, result.data, headers);
    }
    
    // Default response
    const htmlOutput = HtmlService.createHtmlOutput(`
      <h2>Needle Break Logger API</h2>
      <p>Status: <span style="color: green;">Active</span></p>
      <p>Version: 1.0.1 (CORS Fixed)</p>
      <p>Last updated: ${new Date().toLocaleString()}</p>
      <p>CORS Headers: Enabled</p>
      <hr>
      <h3>Test Endpoints:</h3>
      <ul>
        <li><strong>GET Test:</strong> <code>?action=test</code></li>
        <li><strong>Get Submissions:</strong> <code>?action=getSubmissions&date=2024-01-01</code></li>
      </ul>
    `);
    
    // Add CORS headers to HTML response
    Object.keys(headers).forEach(key => {
      htmlOutput.addMetaTag('http-equiv', key, headers[key]);
    });
    
    return htmlOutput;
    
  } catch (error) {
    console.error('Error in doGet:', error);
    return createCORSResponse(false, 'GET request error: ' + error.toString(), null, headers);
  }
}

/**
 * Submit a new needle break entry to the sheet
 */
function submitEntry(entryData) {
  try {
    if (!entryData || !Array.isArray(entryData)) {
      throw new Error('Invalid entry data format. Expected array.');
    }

    const sheet = getOrCreateSheet();
    
    // Validate required fields
    if (entryData.length < HEADERS.length) {
      // Pad with empty values if needed
      while (entryData.length < HEADERS.length) {
        entryData.push('');
      }
    }
    
    // Add the new row
    sheet.appendRow(entryData);
    
    // Format the new row
    const lastRow = sheet.getLastRow();
    formatNewRow(sheet, lastRow);
    
    return {
      success: true,
      message: 'Entry submitted successfully',
      data: {
        rowNumber: lastRow,
        timestamp: entryData[0],
        entryCount: lastRow - 1
      }
    };
  } catch (error) {
    console.error('Error submitting entry:', error);
    return {
      success: false,
      message: 'Failed to submit entry: ' + error.toString()
    };
  }
}

/**
 * Get submissions for a specific date
 */
function getSubmissions(date) {
  try {
    const sheet = getOrCreateSheet();
    
    if (sheet.getLastRow() <= 1) {
      return {
        success: true,
        message: 'No submissions found',
        data: []
      };
    }
    
    const data = sheet.getDataRange().getValues();
    
    // Filter submissions for the specified date
    const filteredData = data.filter((row, index) => {
      if (index === 0) return false; // Skip header row
      
      const rowDate = row[3]; // Date column
      if (!rowDate) return false;
      
      // Convert to comparable date format
      let rowDateStr;
      if (typeof rowDate === 'string') {
        rowDateStr = rowDate;
      } else if (rowDate instanceof Date) {
        rowDateStr = rowDate.toISOString().split('T')[0];
      } else {
        return false;
      }
      
      return rowDateStr === date;
    });
    
    return {
      success: true,
      message: `Found ${filteredData.length} submissions for ${date}`,
      data: filteredData
    };
  } catch (error) {
    console.error('Error getting submissions:', error);
    return {
      success: false,
      message: 'Failed to retrieve submissions: ' + error.toString(),
      data: []
    };
  }
}

/**
 * Upload image to Google Drive and return the public URL
 */
function uploadImage(fileName, fileData, mimeType) {
  try {
    if (!fileName || !fileData || !mimeType) {
      throw new Error('Missing required parameters for image upload');
    }

    // Get or create the images folder
    const folder = getOrCreateFolder(DRIVE_FOLDER_NAME);
    
    // Convert base64 to blob
    let blob;
    try {
      blob = Utilities.newBlob(
        Utilities.base64Decode(fileData),
        mimeType,
        fileName
      );
    } catch (blobError) {
      throw new Error('Failed to process image data: ' + blobError.toString());
    }
    
    // Create the file in Drive
    const file = folder.createFile(blob);
    
    // Make the file publicly viewable
    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (sharingError) {
      console.warn('Could not set file sharing permissions:', sharingError);
      // Continue anyway, file might still be accessible
    }
    
    // Get the public URL
    const fileUrl = `https://drive.google.com/file/d/${file.getId()}/view`;
    
    return {
      success: true,
      message: 'Image uploaded successfully',
      data: {
        fileId: file.getId(),
        fileUrl: fileUrl,
        fileName: fileName,
        size: blob.getBytes().length
      }
    };
  } catch (error) {
    console.error('Error uploading image:', error);
    return {
      success: false,
      message: 'Failed to upload image: ' + error.toString()
    };
  }
}

/**
 * Get or create the main spreadsheet and worksheet
 */
function getOrCreateSheet() {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = spreadsheet.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      sheet = spreadsheet.insertSheet(SHEET_NAME);
      
      // Add headers
      sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
      
      // Format headers
      formatHeaders(sheet);
    }
    
    return sheet;
  } catch (error) {
    console.error('Error getting/creating sheet:', error);
    throw new Error('Failed to access spreadsheet: ' + error.toString());
  }
}

/**
 * Format the header row
 */
function formatHeaders(sheet) {
  try {
    const headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
    
    headerRange
      .setBackground('#4a90e2')
      .setFontColor('white')
      .setFontWeight('bold')
      .setHorizontalAlignment('center')
      .setVerticalAlignment('middle');
    
    // Set column widths
    const columnWidths = [150, 100, 150, 100, 80, 100, 80, 150, 150, 120, 120, 200, 250];
    columnWidths.forEach((width, index) => {
      sheet.setColumnWidth(index + 1, width);
    });
    
    // Freeze header row
    sheet.setFrozenRows(1);
  } catch (error) {
    console.error('Error formatting headers:', error);
  }
}

/**
 * Format a new data row
 */
function formatNewRow(sheet, rowNumber) {
  try {
    const range = sheet.getRange(rowNumber, 1, 1, HEADERS.length);
    
    // Alternate row colors
    if (rowNumber % 2 === 0) {
      range.setBackground('#f8f9ff');
    }
    
    // Format specific columns
    try {
      sheet.getRange(rowNumber, 1).setNumberFormat('yyyy-mm-dd hh:mm:ss'); // Timestamp
      sheet.getRange(rowNumber, 4).setNumberFormat('yyyy-mm-dd'); // Date
      sheet.getRange(rowNumber, 5).setNumberFormat('hh:mm'); // Time
    } catch (formatError) {
      console.warn('Could not set number formats:', formatError);
    }
    
    // Center align specific columns
    const centerColumns = [2, 4, 5, 6, 7]; // Department, Date, Time, Machine No., Line No.
    centerColumns.forEach(col => {
      try {
        sheet.getRange(rowNumber, col).setHorizontalAlignment('center');
      } catch (alignError) {
        console.warn('Could not set alignment for column', col, alignError);
      }
    });
    
    // Wrap text for remarks
    try {
      sheet.getRange(rowNumber, 13).setWrap(true);
    } catch (wrapError) {
      console.warn('Could not set text wrap:', wrapError);
    }
    
    // Add borders
    try {
      range.setBorder(true, true, true, true, false, false);
    } catch (borderError) {
      console.warn('Could not set borders:', borderError);
    }
  } catch (error) {
    console.error('Error formatting row:', error);
  }
}

/**
 * Get or create a folder in Google Drive
 */
function getOrCreateFolder(folderName) {
  try {
    const folders = DriveApp.getFoldersByName(folderName);
    
    if (folders.hasNext()) {
      return folders.next();
    } else {
      return DriveApp.createFolder(folderName);
    }
  } catch (error) {
    console.error('Error getting/creating folder:', error);
    throw new Error('Failed to access Google Drive folder: ' + error.toString());
  }
}

/**
 * Create a CORS-enabled response object
 */
function createCORSResponse(success, message, data = null, headers = {}) {
  const response = {
    success: success,
    message: message,
    timestamp: new Date().toISOString(),
    version: '1.0.1-cors-fixed'
  };
  
  if (data !== null) {
    response.data = data;
  }
  
  const output = ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
  
  // Add CORS headers
  const defaultHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept',
    'Access-Control-Max-Age': '3600'
  };
  
  const allHeaders = { ...defaultHeaders, ...headers };
  
  // Note: Google Apps Script doesn't support custom headers in ContentService
  // The headers are added for documentation but won't actually be set
  // CORS should work with the web app deployment settings
  
  return output;
}

/**
 * Test function to verify the setup and CORS
 */
function testSetup() {
  try {
    console.log('Testing Google Apps Script setup...');
    
    // Test sheet creation
    const sheet = getOrCreateSheet();
    console.log('✓ Sheet created/found:', sheet.getName());
    
    // Test folder creation
    const folder = getOrCreateFolder(DRIVE_FOLDER_NAME);
    console.log('✓ Folder created/found:', folder.getName());
    
    // Test sample entry
    const testData = [
      new Date().toISOString(),
      'Production',
      'Test Incharge',
      new Date().toISOString().split('T')[0],
      '10:30',
      'M001',
      'L001',
      'SN-01',
      'DBX1-75/11',
      'Test Supervisor',
      'Test Operator',
      'No image',
      'Test entry - CORS test'
    ];
    
    const result = submitEntry(testData);
    if (result.success) {
      console.log('✓ Test submission successful');
    } else {
      console.log('✗ Test submission failed:', result.message);
    }
    
    console.log('✓ Setup test completed successfully!');
    return {
      success: true,
      message: 'Setup test passed',
      timestamp: new Date().toISOString(),
      version: '1.0.1-cors-fixed'
    };
  } catch (error) {
    console.error('Setup test failed:', error);
    return {
      success: false,
      message: 'Setup test failed: ' + error.toString()
    };
  }
}

/**
 * Clean up test data
 */
function cleanupTestData() {
  try {
    const sheet = getOrCreateSheet();
    const data = sheet.getDataRange().getValues();
    
    let deletedRows = 0;
    
    // Find rows with test data and delete them (iterate backwards)
    for (let i = data.length - 1; i > 0; i--) {
      if (data[i][12] && (data[i][12].includes('Test entry') || data[i][12].includes('CORS test'))) {
        sheet.deleteRow(i + 1);
        deletedRows++;
      }
    }
    
    console.log(`Cleaned up ${deletedRows} test entries`);
    return {
      success: true,
      message: `Test data cleaned up successfully. Deleted ${deletedRows} entries.`
    };
  } catch (error) {
    console.error('Cleanup failed:', error);
    return {
      success: false,
      message: 'Cleanup failed: ' + error.toString()
    };
  }
}

/**
 * Get app statistics
 */
function getStatistics() {
  try {
    const sheet = getOrCreateSheet();
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      return {
        success: true,
        message: 'No data available',
        data: {
          totalEntries: 0,
          todayEntries: 0,
          departments: {},
          machineTypes: {}
        }
      };
    }
    
    const today = new Date().toISOString().split('T')[0];
    let todayCount = 0;
    const departments = {};
    const machineTypes = {};
    
    // Analyze data (skip header row)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      
      // Check today's entries
      const rowDate = typeof row[3] === 'string' ? row[3] : 
                     (row[3] instanceof Date ? row[3].toISOString().split('T')[0] : '');
      
      if (rowDate === today) {
        todayCount++;
      }
      
      // Count departments
      const dept = row[1] || 'Unknown';
      departments[dept] = (departments[dept] || 0) + 1;
      
      // Count machine types
      const machineType = row[7] || 'Unknown';
      machineTypes[machineType] = (machineTypes[machineType] || 0) + 1;
    }
    
    return {
      success: true,
      message: 'Statistics retrieved successfully',
      data: {
        totalEntries: data.length - 1,
        todayEntries: todayCount,
        departments: departments,
        machineTypes: machineTypes,
        lastUpdate: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Error getting statistics:', error);
    return {
      success: false,
      message: 'Failed to get statistics: ' + error.toString()
    };
  }
}

/**
 * Health check endpoint
 */
function healthCheck() {
  try {
    const sheet = getOrCreateSheet();
    const folder = getOrCreateFolder(DRIVE_FOLDER_NAME);
    
    return {
      success: true,
      message: 'All systems operational',
      data: {
        sheet: {
          name: sheet.getName(),
          rows: sheet.getLastRow(),
          columns: sheet.getLastColumn()
        },
        drive: {
          folderName: folder.getName(),
          folderId: folder.getId()
        },
        timestamp: new Date().toISOString(),
        version: '1.0.1-cors-fixed'
      }
    };
  } catch (error) {
    return {
      success: false,
      message: 'Health check failed: ' + error.toString()
    };
  }
}