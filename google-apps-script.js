/**
 * Google Apps Script for Needle Break Logger
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
  try {
    const data = JSON.parse(e.postData.contents);
    
    switch (data.action) {
      case 'submitEntry':
        return submitEntry(data.data);
      case 'getSubmissions':
        return getSubmissions(data.date);
      case 'uploadImage':
        return uploadImage(data.fileName, data.fileData, data.mimeType);
      default:
        return createResponse(false, 'Invalid action');
    }
  } catch (error) {
    console.error('Error in doPost:', error);
    return createResponse(false, error.toString());
  }
}

/**
 * Handle GET requests for testing
 */
function doGet(e) {
  return HtmlService.createHtmlOutput(`
    <h2>Needle Break Logger API</h2>
    <p>This is the Google Apps Script endpoint for the Needle Break Logger application.</p>
    <p>Status: <span style="color: green;">Active</span></p>
    <p>Last updated: ${new Date().toLocaleString()}</p>
  `);
}

/**
 * Submit a new needle break entry to the sheet
 */
function submitEntry(entryData) {
  try {
    const sheet = getOrCreateSheet();
    
    // Add the new row
    sheet.appendRow(entryData);
    
    // Format the new row
    const lastRow = sheet.getLastRow();
    formatNewRow(sheet, lastRow);
    
    return createResponse(true, 'Entry submitted successfully', {
      rowNumber: lastRow,
      timestamp: entryData[0]
    });
  } catch (error) {
    console.error('Error submitting entry:', error);
    return createResponse(false, error.toString());
  }
}

/**
 * Get submissions for a specific date
 */
function getSubmissions(date) {
  try {
    const sheet = getOrCreateSheet();
    const data = sheet.getDataRange().getValues();
    
    // Filter submissions for the specified date
    const filteredData = data.filter((row, index) => {
      if (index === 0) return false; // Skip header row
      
      const rowDate = row[3]; // Date column
      if (!rowDate) return false;
      
      // Convert to comparable date format
      const rowDateStr = typeof rowDate === 'string' ? rowDate : rowDate.toISOString().split('T')[0];
      return rowDateStr === date;
    });
    
    return createResponse(true, 'Submissions retrieved successfully', filteredData);
  } catch (error) {
    console.error('Error getting submissions:', error);
    return createResponse(false, error.toString());
  }
}

/**
 * Upload image to Google Drive and return the public URL
 */
function uploadImage(fileName, fileData, mimeType) {
  try {
    // Get or create the images folder
    const folder = getOrCreateFolder(DRIVE_FOLDER_NAME);
    
    // Convert base64 to blob
    const blob = Utilities.newBlob(
      Utilities.base64Decode(fileData),
      mimeType,
      fileName
    );
    
    // Create the file in Drive
    const file = folder.createFile(blob);
    
    // Make the file publicly viewable
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    // Get the public URL
    const fileUrl = `https://drive.google.com/file/d/${file.getId()}/view`;
    
    return createResponse(true, 'Image uploaded successfully', {
      fileId: file.getId(),
      fileUrl: fileUrl,
      fileName: fileName
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    return createResponse(false, error.toString());
  }
}

/**
 * Get or create the main spreadsheet and worksheet
 */
function getOrCreateSheet() {
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
}

/**
 * Format the header row
 */
function formatHeaders(sheet) {
  const headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
  
  headerRange
    .setBackground('#4a90e2')
    .setFontColor('white')
    .setFontWeight('bold')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');
  
  // Set column widths
  sheet.setColumnWidth(1, 150); // Timestamp
  sheet.setColumnWidth(2, 100); // Department
  sheet.setColumnWidth(3, 150); // Incharge Name
  sheet.setColumnWidth(4, 100); // Date
  sheet.setColumnWidth(5, 80);  // Time
  sheet.setColumnWidth(6, 100); // Machine No.
  sheet.setColumnWidth(7, 80);  // Line No.
  sheet.setColumnWidth(8, 150); // Machine Type
  sheet.setColumnWidth(9, 150); // Needle Type
  sheet.setColumnWidth(10, 120); // Supervisor
  sheet.setColumnWidth(11, 120); // Operator
  sheet.setColumnWidth(12, 200); // Image Link
  sheet.setColumnWidth(13, 250); // Remarks
  
  // Freeze header row
  sheet.setFrozenRows(1);
}

/**
 * Format a new data row
 */
function formatNewRow(sheet, rowNumber) {
  const range = sheet.getRange(rowNumber, 1, 1, HEADERS.length);
  
  // Alternate row colors
  if (rowNumber % 2 === 0) {
    range.setBackground('#f8f9ff');
  }
  
  // Format timestamp column
  sheet.getRange(rowNumber, 1).setNumberFormat('yyyy-mm-dd hh:mm:ss');
  
  // Format date column
  sheet.getRange(rowNumber, 4).setNumberFormat('yyyy-mm-dd');
  
  // Format time column
  sheet.getRange(rowNumber, 5).setNumberFormat('hh:mm');
  
  // Center align specific columns
  sheet.getRange(rowNumber, 2).setHorizontalAlignment('center'); // Department
  sheet.getRange(rowNumber, 4).setHorizontalAlignment('center'); // Date
  sheet.getRange(rowNumber, 5).setHorizontalAlignment('center'); // Time
  sheet.getRange(rowNumber, 6).setHorizontalAlignment('center'); // Machine No.
  sheet.getRange(rowNumber, 7).setHorizontalAlignment('center'); // Line No.
  
  // Wrap text for remarks
  sheet.getRange(rowNumber, 13).setWrap(true);
  
  // Add borders
  range.setBorder(true, true, true, true, false, false);
}

/**
 * Get or create a folder in Google Drive
 */
function getOrCreateFolder(folderName) {
  const folders = DriveApp.getFoldersByName(folderName);
  
  if (folders.hasNext()) {
    return folders.next();
  } else {
    return DriveApp.createFolder(folderName);
  }
}

/**
 * Create a standardized response object
 */
function createResponse(success, message, data = null) {
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

/**
 * Test function to verify the setup
 */
function testSetup() {
  try {
    console.log('Testing Google Apps Script setup...');
    
    // Test sheet creation
    const sheet = getOrCreateSheet();
    console.log('Sheet created/found:', sheet.getName());
    
    // Test folder creation
    const folder = getOrCreateFolder(DRIVE_FOLDER_NAME);
    console.log('Folder created/found:', folder.getName());
    
    // Test sample entry
    const testData = [
      new Date().toISOString(),
      'Production',
      'Test Incharge',
      '2024-01-01',
      '10:30',
      'M001',
      'L001',
      'SN-01',
      'DBX1-75/11',
      'Test Supervisor',
      'Test Operator',
      'No image',
      'Test entry - please ignore'
    ];
    
    const result = submitEntry(testData);
    console.log('Test submission result:', result.getContent());
    
    console.log('Setup test completed successfully!');
    return 'Setup test passed';
  } catch (error) {
    console.error('Setup test failed:', error);
    return 'Setup test failed: ' + error.toString();
  }
}

/**
 * Clean up test data (use cautiously)
 */
function cleanupTestData() {
  try {
    const sheet = getOrCreateSheet();
    const data = sheet.getDataRange().getValues();
    
    // Find rows with test data and delete them
    for (let i = data.length - 1; i > 0; i--) { // Start from bottom, skip header
      if (data[i][12] && data[i][12].includes('Test entry - please ignore')) {
        sheet.deleteRow(i + 1);
      }
    }
    
    console.log('Test data cleaned up');
    return 'Test data cleaned up successfully';
  } catch (error) {
    console.error('Cleanup failed:', error);
    return 'Cleanup failed: ' + error.toString();
  }
}

/**
 * Get summary statistics
 */
function getStatistics() {
  try {
    const sheet = getOrCreateSheet();
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      return createResponse(true, 'No data available', {
        totalEntries: 0,
        todayEntries: 0,
        departments: {},
        machineTypes: {}
      });
    }
    
    const today = new Date().toISOString().split('T')[0];
    let todayCount = 0;
    const departments = {};
    const machineTypes = {};
    
    // Analyze data (skip header row)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const rowDate = typeof row[3] === 'string' ? row[3] : row[3].toISOString().split('T')[0];
      
      if (rowDate === today) {
        todayCount++;
      }
      
      // Count departments
      const dept = row[1];
      departments[dept] = (departments[dept] || 0) + 1;
      
      // Count machine types
      const machineType = row[7];
      machineTypes[machineType] = (machineTypes[machineType] || 0) + 1;
    }
    
    return createResponse(true, 'Statistics retrieved', {
      totalEntries: data.length - 1,
      todayEntries: todayCount,
      departments: departments,
      machineTypes: machineTypes
    });
  } catch (error) {
    console.error('Error getting statistics:', error);
    return createResponse(false, error.toString());
  }
}

/**
 * Initialize the spreadsheet with proper formatting and validation
 */
function initializeSpreadsheet() {
  try {
    const sheet = getOrCreateSheet();
    
    // Add data validation for Department column (column B)
    const deptRange = sheet.getRange('B2:B1000');
    const deptValidation = SpreadsheetApp.newDataValidation()
      .requireValueInList(['Production', 'Finishing', 'Sampling'])
      .setAllowInvalid(false)
      .build();
    deptRange.setDataValidation(deptValidation);
    
    // Add conditional formatting for different departments
    const conditionalFormatRules = sheet.getConditionalFormatRules();
    
    // Production - Light Blue
    conditionalFormatRules.push(
      SpreadsheetApp.newConditionalFormatRule()
        .setRanges([sheet.getRange('A2:M1000')])
        .whenFormulaSatisfied('=$B2="Production"')
        .setBackground('#e3f2fd')
        .build()
    );
    
    // Finishing - Light Green
    conditionalFormatRules.push(
      SpreadsheetApp.newConditionalFormatRule()
        .setRanges([sheet.getRange('A2:M1000')])
        .whenFormulaSatisfied('=$B2="Finishing"')
        .setBackground('#e8f5e8')
        .build()
    );
    
    // Sampling - Light Orange
    conditionalFormatRules.push(
      SpreadsheetApp.newConditionalFormatRule()
        .setRanges([sheet.getRange('A2:M1000')])
        .whenFormulaSatisfied('=$B2="Sampling"')
        .setBackground('#fff3e0')
        .build()
    );
    
    sheet.setConditionalFormatRules(conditionalFormatRules);
    
    console.log('Spreadsheet initialized successfully');
    return 'Spreadsheet initialized with formatting and validation';
  } catch (error) {
    console.error('Error initializing spreadsheet:', error);
    return 'Initialization failed: ' + error.toString();
  }
}