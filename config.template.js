// Configuration Template for Needle Break Logger
// Copy this file to config.js and fill in your actual values

const CONFIG = {
    // Google Apps Script Configuration
    googleAppsScript: {
        // Your deployed Google Apps Script Web App URL
        // Example: 'https://script.google.com/macros/s/AKfycbxXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/exec'
        scriptUrl: 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE',
        
        // Your Google Sheets ID (found in the URL)
        // Example: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms'
        sheetId: 'YOUR_GOOGLE_SHEETS_ID_HERE',
        
        // Optional: Sheet name (defaults to 'Needle Break Log')
        sheetName: 'Needle Break Log'
    },
    
    // Application Settings
    app: {
        // Maximum file size for image uploads (in bytes)
        maxImageSize: 5 * 1024 * 1024, // 5MB
        
        // Allowed image file types
        allowedImageTypes: ['image/png', 'image/jpeg', 'image/jpg'],
        
        // Auto-refresh interval for submissions (in milliseconds)
        refreshInterval: 30000, // 30 seconds
        
        // Enable debug mode for development
        debugMode: false,
        
        // Company/Factory name (displayed in header)
        companyName: 'Garment Manufacturing Unit',
        
        // Time zone for timestamp display
        timeZone: 'Asia/Kolkata' // Change to your local timezone
    },
    
    // Form Configuration
    form: {
        // Auto-fill current date and time
        autoFillDateTime: true,
        
        // Require image upload
        requireImage: false,
        
        // Enable form validation
        enableValidation: true,
        
        // Show progress indicator
        showProgress: true
    },
    
    // Machine Types Configuration
    machineTypes: {
        snSeries: {
            prefix: 'SN',
            count: 274, // SN-01 to SN-274
            padZeros: 2
        },
        olSeries5Thread: {
            prefix: 'O/L',
            suffix: '(5 Thread)',
            count: 19, // O/L-01 to O/L-19
            padZeros: 2
        },
        olSeries4Thread: {
            prefix: 'O/L',
            suffix: '(4 Thread)', 
            count: 34, // O/L-01 to O/L-34
            padZeros: 2
        },
        flSeries: {
            prefix: 'F/L',
            count: 8, // F/L-01 to F/L-08
            padZeros: 2
        }
    },
    
    // Needle Types (customize as needed for your facility)
    needleTypes: [
        'DBX1-75/11',
        'DBX1-65/9',
        'DCX1-75/11',
        'UYX128-75/11',
        'DBX1-55/7',
        'DCX1-65/9',
        'DCX1-90/14',
        'DPX5-75/11',
        'DPX5-90/14',
        'DBX1-90/14',
        'DPX17-90/14',
        'UYX128-90/14',
        '(B-64)-TVX64-130/21',
        'TVX64-90/14',
        'TVX64-110/18',
        'TVX64-100/16',
        'UYX128-65/9'
    ],
    
    // Department Configuration
    departments: [
        'Production',
        'Finishing',
        'Sampling'
    ],
    
    // UI Configuration
    ui: {
        // Theme colors
        primaryColor: '#4a90e2',
        secondaryColor: '#357abd',
        successColor: '#27ae60',
        errorColor: '#e74c3c',
        warningColor: '#f39c12',
        
        // Animation settings
        enableAnimations: true,
        transitionDuration: '0.3s',
        
        // Mobile responsiveness
        mobileBreakpoint: '768px',
        
        // Auto-save form data
        autoSave: true,
        autoSaveInterval: 10000 // 10 seconds
    },
    
    // Offline Configuration
    offline: {
        // Enable service worker for offline capability
        enableServiceWorker: true,
        
        // Cache strategy
        cacheStrategy: 'networkFirst',
        
        // Maximum offline entries to store
        maxOfflineEntries: 100
    },
    
    // Notification Settings
    notifications: {
        // Show success notifications
        showSuccess: true,
        
        // Show error notifications
        showErrors: true,
        
        // Auto-hide notifications after (milliseconds)
        autoHideDuration: 5000,
        
        // Enable browser notifications (requires permission)
        enableBrowserNotifications: false
    },
    
    // Analytics (optional)
    analytics: {
        // Enable usage analytics
        enabled: false,
        
        // Google Analytics ID
        gaTrackingId: '',
        
        // Track form completion time
        trackCompletionTime: true
    }
};

// Export configuration for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}

// Make available globally for browser use
if (typeof window !== 'undefined') {
    window.NEEDLE_LOGGER_CONFIG = CONFIG;
}