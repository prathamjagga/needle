// Needle Break Logger Application - CORS Fixed Version
class NeedleLogger {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 12;
        this.formData = {};
        this.submissions = [];
        this.isSubmitting = false;
        
        // Google Sheets configuration (replace with your actual values)
        this.sheetsConfig = {
            scriptUrl: 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE', // Replace with your deployed script URL
            sheetId: 'YOUR_GOOGLE_SHEETS_ID_HERE' // Replace with your sheet ID
        };
        
        // CORS handling configuration
        this.corsConfig = {
            maxRetries: 3,
            retryDelay: 1000,
            useAlternativeMethod: true
        };
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.setupDateTime();
        this.setupFileUpload();
        this.generateMachineOptions();
        this.loadTodaysSubmissions();
        this.updateProgress();
        this.testConnection();
    }
    
    async testConnection() {
        try {
            console.log('Testing connection to Google Apps Script...');
            const testResult = await this.makeRequest({
                action: 'test'
            });
            
            if (testResult.success) {
                console.log('✓ Connection test successful:', testResult);
            } else {
                console.warn('⚠️ Connection test failed:', testResult);
            }
        } catch (error) {
            console.error('❌ Connection test error:', error);
        }
    }
    
    async makeRequest(data, retries = 0) {
        try {
            // Method 1: Standard fetch with CORS handling
            const response = await fetch(this.sheetsConfig.scriptUrl, {
                method: 'POST',
                mode: 'cors',
                cache: 'no-cache',
                credentials: 'omit',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                redirect: 'follow',
                referrerPolicy: 'no-referrer',
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const textResponse = await response.text();
            
            // Try to parse as JSON
            try {
                return JSON.parse(textResponse);
            } catch (parseError) {
                // If it's not JSON, it might be HTML (redirect or error page)
                console.warn('Response is not JSON:', textResponse.substring(0, 200));
                
                if (textResponse.includes('Google Apps Script')) {
                    throw new Error('Received HTML instead of JSON. Check your script deployment.');
                }
                
                throw new Error('Invalid response format');
            }
        } catch (error) {
            console.error(`Request attempt ${retries + 1} failed:`, error);
            
            // Retry with exponential backoff
            if (retries < this.corsConfig.maxRetries) {
                const delay = this.corsConfig.retryDelay * Math.pow(2, retries);
                console.log(`Retrying in ${delay}ms...`);
                
                await new Promise(resolve => setTimeout(resolve, delay));
                return this.makeRequest(data, retries + 1);
            }
            
            // If all retries failed and alternative method is enabled, try it
            if (this.corsConfig.useAlternativeMethod && retries >= this.corsConfig.maxRetries) {
                console.log('Trying alternative request method...');
                return this.makeAlternativeRequest(data);
            }
            
            throw error;
        }
    }
    
    async makeAlternativeRequest(data) {
        try {
            // Method 2: Use GET with parameters for simple requests
            if (data.action === 'test' || data.action === 'getSubmissions') {
                const params = new URLSearchParams({
                    action: data.action,
                    ...(data.date && { date: data.date })
                });
                
                const response = await fetch(`${this.sheetsConfig.scriptUrl}?${params}`, {
                    method: 'GET',
                    mode: 'cors',
                    cache: 'no-cache',
                    credentials: 'omit'
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const textResponse = await response.text();
                return JSON.parse(textResponse);
            }
            
            // Method 3: Use form data for POST requests
            const formData = new FormData();
            formData.append('data', JSON.stringify(data));
            
            const response = await fetch(this.sheetsConfig.scriptUrl, {
                method: 'POST',
                mode: 'cors',
                cache: 'no-cache',
                credentials: 'omit',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const textResponse = await response.text();
            return JSON.parse(textResponse);
            
        } catch (error) {
            console.error('Alternative request method also failed:', error);
            throw error;
        }
    }
    
    setupEventListeners() {
        // Form submission
        document.getElementById('needle-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitForm();
        });
        
        // Navigation
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabId = e.currentTarget.id.replace('-tab', '');
                this.showTab(tabId);
            });
        });
        
        // Form validation on input change
        this.setupFormValidation();
        
        // Modal close events
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal();
            }
        });
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                const activeStep = document.querySelector('.form-step.active');
                if (activeStep && !e.target.matches('textarea')) {
                    e.preventDefault();
                    const nextBtn = activeStep.querySelector('.btn-primary');
                    if (nextBtn && nextBtn.onclick) {
                        nextBtn.click();
                    }
                }
            }
        });
    }
    
    setupDateTime() {
        const now = new Date();
        
        // Set current date and time in header
        document.getElementById('current-date').textContent = now.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        // Update time every second
        this.updateCurrentTime();
        setInterval(() => this.updateCurrentTime(), 1000);
        
        // Set default values for date and time inputs
        document.getElementById('event-date').value = now.toISOString().split('T')[0];
        document.getElementById('event-time').value = now.toTimeString().slice(0, 5);
    }
    
    updateCurrentTime() {
        const now = new Date();
        document.getElementById('current-time').textContent = now.toLocaleTimeString('en-US');
    }
    
    setupFileUpload() {
        const fileInput = document.getElementById('needle-image');
        const uploadArea = document.getElementById('file-upload-area');
        const preview = document.getElementById('image-preview');
        
        // Click to upload
        uploadArea.addEventListener('click', () => {
            fileInput.click();
        });
        
        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFileSelect(files[0]);
            }
        });
        
        // File input change
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFileSelect(e.target.files[0]);
            }
        });
    }
    
    handleFileSelect(file) {
        // Validate file
        if (!file.type.startsWith('image/')) {
            this.showError('Please select a valid image file (PNG, JPG, JPEG)');
            return;
        }
        
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            this.showError('File size must be less than 5MB');
            return;
        }
        
        // Preview image
        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.getElementById('image-preview');
            preview.innerHTML = `
                <img src="${e.target.result}" alt="Needle Image Preview" class="review-image">
                <div class="image-info">
                    <strong>File:</strong> ${file.name}<br>
                    <strong>Size:</strong> ${(file.size / 1024).toFixed(1)} KB<br>
                    <strong>Type:</strong> ${file.type}
                </div>
            `;
        };
        reader.readAsDataURL(file);
        
        // Store file for later upload
        this.selectedFile = file;
    }
    
    generateMachineOptions() {
        const machineTypeSelect = document.getElementById('machine-type');
        const snGroup = machineTypeSelect.querySelector('optgroup[label="SN Series"]');
        const ol5Group = machineTypeSelect.querySelector('optgroup[label="O/L Series (5 Thread)"]');
        const ol4Group = machineTypeSelect.querySelector('optgroup[label="O/L Series (4 Thread)"]');
        const flGroup = machineTypeSelect.querySelector('optgroup[label="F/L Series"]');
        
        // Generate SN-01 to SN-274
        for (let i = 1; i <= 274; i++) {
            const option = document.createElement('option');
            option.value = `SN-${i.toString().padStart(2, '0')}`;
            option.textContent = `SN-${i.toString().padStart(2, '0')}`;
            snGroup.appendChild(option);
        }
        
        // Generate O/L-01 to O/L-19 (5 thread)
        for (let i = 1; i <= 19; i++) {
            const option = document.createElement('option');
            option.value = `O/L-${i.toString().padStart(2, '0')} (5 Thread)`;
            option.textContent = `O/L-${i.toString().padStart(2, '0')} (5 Thread)`;
            ol5Group.appendChild(option);
        }
        
        // Generate O/L-01 to O/L-34 (4 thread)
        for (let i = 1; i <= 34; i++) {
            const option = document.createElement('option');
            option.value = `O/L-${i.toString().padStart(2, '0')} (4 Thread)`;
            option.textContent = `O/L-${i.toString().padStart(2, '0')} (4 Thread)`;
            ol4Group.appendChild(option);
        }
        
        // Generate F/L-01 to F/L-08
        for (let i = 1; i <= 8; i++) {
            const option = document.createElement('option');
            option.value = `F/L-${i.toString().padStart(2, '0')}`;
            option.textContent = `F/L-${i.toString().padStart(2, '0')}`;
            flGroup.appendChild(option);
        }
    }
    
    setupFormValidation() {
        const inputs = document.querySelectorAll('input[required], select[required]');
        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                this.validateField(input);
            });
            
            input.addEventListener('input', () => {
                this.clearFieldError(input);
            });
        });
    }
    
    validateField(field) {
        const fieldGroup = field.closest('.field-group');
        const existingError = fieldGroup.querySelector('.error-message');
        
        if (existingError) {
            existingError.remove();
        }
        
        if (field.hasAttribute('required') && !field.value.trim()) {
            this.showFieldError(fieldGroup, 'This field is required');
            return false;
        }
        
        fieldGroup.classList.remove('error');
        return true;
    }
    
    showFieldError(fieldGroup, message) {
        fieldGroup.classList.add('error');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
        fieldGroup.appendChild(errorDiv);
    }
    
    clearFieldError(field) {
        const fieldGroup = field.closest('.field-group');
        const existingError = fieldGroup.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        fieldGroup.classList.remove('error');
    }
    
    nextStep(step) {
        if (!this.validateCurrentStep(step)) {
            return;
        }
        
        this.saveCurrentStepData(step);
        
        if (step < this.totalSteps) {
            this.currentStep = step + 1;
            this.showStep(this.currentStep);
            this.updateProgress();
        }
    }
    
    prevStep(step) {
        if (step > 1) {
            this.currentStep = step - 1;
            this.showStep(this.currentStep);
            this.updateProgress();
        }
    }
    
    validateCurrentStep(step) {
        const currentStepElement = document.getElementById(`step-${step}`);
        const requiredFields = currentStepElement.querySelectorAll('input[required], select[required]');
        let isValid = true;
        
        requiredFields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });
        
        return isValid;
    }
    
    saveCurrentStepData(step) {
        const stepElement = document.getElementById(`step-${step}`);
        const inputs = stepElement.querySelectorAll('input, select, textarea');
        
        inputs.forEach(input => {
            if (input.type === 'file') {
                this.formData[input.name] = this.selectedFile || null;
            } else {
                this.formData[input.name] = input.value;
            }
        });
    }
    
    showStep(step) {
        // Hide all steps
        document.querySelectorAll('.form-step').forEach(stepEl => {
            stepEl.classList.remove('active');
        });
        
        // Show current step
        document.getElementById(`step-${step}`).classList.add('active');
        
        // Focus first input in step
        setTimeout(() => {
            const firstInput = document.querySelector(`#step-${step} input:not([type="hidden"]), #step-${step} select`);
            if (firstInput) {
                firstInput.focus();
            }
        }, 100);
    }
    
    updateProgress() {
        const progressFill = document.getElementById('progress-fill');
        const currentStepSpan = document.getElementById('current-step');
        const percentage = (this.currentStep / this.totalSteps) * 100;
        
        progressFill.style.width = `${percentage}%`;
        currentStepSpan.textContent = this.currentStep;
    }
    
    reviewSubmission() {
        // Save current step data
        this.saveCurrentStepData(12);
        
        // Generate review content
        const reviewContent = document.getElementById('review-content');
        reviewContent.innerHTML = this.generateReviewHTML();
        
        // Hide current step and show review
        document.querySelectorAll('.form-step').forEach(step => {
            step.classList.remove('active');
        });
        document.getElementById('step-review').classList.add('active');
        
        // Update progress to 100%
        document.getElementById('progress-fill').style.width = '100%';
        document.getElementById('current-step').textContent = this.totalSteps;
    }
    
    generateReviewHTML() {
        const fieldLabels = {
            'department': { label: 'Department', icon: 'fas fa-building' },
            'incharge-name': { label: 'Incharge Name', icon: 'fas fa-user-tie' },
            'event-date': { label: 'Date', icon: 'fas fa-calendar' },
            'event-time': { label: 'Time', icon: 'fas fa-clock' },
            'machine-no': { label: 'Machine No.', icon: 'fas fa-cogs' },
            'line-no': { label: 'Line Number', icon: 'fas fa-stream' },
            'machine-type': { label: 'Machine Type', icon: 'fas fa-wrench' },
            'needle-type': { label: 'Needle Type', icon: 'fas fa-syringe' },
            'supervisor-name': { label: 'Supervisor', icon: 'fas fa-user-check' },
            'operator-name': { label: 'Operator', icon: 'fas fa-user' },
            'needle-image': { label: 'Image', icon: 'fas fa-camera' },
            'remarks': { label: 'Remarks', icon: 'fas fa-comment-alt' }
        };
        
        let html = '';
        
        Object.keys(fieldLabels).forEach(fieldName => {
            const fieldInfo = fieldLabels[fieldName];
            let value = this.formData[fieldName];
            
            if (fieldName === 'needle-image') {
                if (this.selectedFile) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        document.querySelector(`[data-field="${fieldName}"] .review-value`).innerHTML = 
                            `<img src="${e.target.result}" alt="Needle Image" class="review-image"><br>
                             <small>${this.selectedFile.name} (${(this.selectedFile.size / 1024).toFixed(1)} KB)</small>`;
                    };
                    reader.readAsDataURL(this.selectedFile);
                    value = 'Loading image...';
                } else {
                    value = 'No image uploaded';
                }
            } else if (!value) {
                value = 'Not specified';
            }
            
            html += `
                <div class="review-item" data-field="${fieldName}">
                    <div class="review-label">
                        <i class="${fieldInfo.icon}"></i>
                        ${fieldInfo.label}:
                    </div>
                    <div class="review-value">${value}</div>
                </div>
            `;
        });
        
        return html;
    }
    
    editSubmission() {
        // Go back to first step
        this.currentStep = 1;
        this.showStep(1);
        this.updateProgress();
    }
    
    async submitForm() {
        if (this.isSubmitting) return;
        
        this.isSubmitting = true;
        this.showLoading('Submitting your entry...');
        
        try {
            // Prepare submission data
            const submissionData = await this.prepareSubmissionData();
            
            // Submit to Google Sheets
            const result = await this.submitToGoogleSheets(submissionData);
            
            if (result.success) {
                this.showSuccessModal(submissionData);
                this.resetForm();
                this.loadTodaysSubmissions(); // Refresh submissions list
            } else {
                throw new Error(result.message || 'Submission failed');
            }
        } catch (error) {
            console.error('Submission error:', error);
            this.showErrorModal(this.getFriendlyErrorMessage(error));
        } finally {
            this.isSubmitting = false;
            this.hideLoading();
        }
    }
    
    getFriendlyErrorMessage(error) {
        const message = error.message || error.toString();
        
        if (message.includes('CORS')) {
            return 'Network connection issue. Please check your internet connection and try again.';
        }
        
        if (message.includes('403') || message.includes('Authorization')) {
            return 'Permission denied. Please ensure the Google Apps Script is properly deployed and has the correct permissions.';
        }
        
        if (message.includes('404') || message.includes('Not Found')) {
            return 'Service not found. Please check that the Google Apps Script URL is correct.';
        }
        
        if (message.includes('fetch')) {
            return 'Network error. Please check your internet connection and try again.';
        }
        
        if (message.includes('JSON')) {
            return 'Data format error. There may be an issue with the service configuration.';
        }
        
        return `Submission failed: ${message}`;
    }
    
    async prepareSubmissionData() {
        const timestamp = new Date().toISOString();
        let imageLink = '';
        
        // Upload image if present
        if (this.selectedFile) {
            try {
                this.showLoading('Uploading image...');
                imageLink = await this.uploadImageToDrive(this.selectedFile);
            } catch (error) {
                console.warn('Image upload failed:', error);
                imageLink = 'Upload failed - ' + this.selectedFile.name;
            }
        }
        
        this.showLoading('Saving to database...');
        
        return {
            timestamp,
            department: this.formData['department'],
            inchargeName: this.formData['incharge-name'],
            date: this.formData['event-date'],
            time: this.formData['event-time'],
            machineNo: this.formData['machine-no'],
            lineNo: this.formData['line-no'],
            machineType: this.formData['machine-type'],
            needleType: this.formData['needle-type'],
            supervisor: this.formData['supervisor-name'],
            operator: this.formData['operator-name'],
            imageLink: imageLink,
            remarks: this.formData['remarks'] || ''
        };
    }
    
    async uploadImageToDrive(file) {
        // Convert file to base64
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async () => {
                try {
                    const base64Data = reader.result.split(',')[1];
                    
                    const uploadData = {
                        action: 'uploadImage',
                        fileName: `needle_break_${Date.now()}_${file.name}`,
                        fileData: base64Data,
                        mimeType: file.type
                    };
                    
                    const result = await this.makeRequest(uploadData);
                    
                    if (result.success) {
                        resolve(result.data.fileUrl);
                    } else {
                        throw new Error(result.message || 'Upload failed');
                    }
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    }
    
    async submitToGoogleSheets(data) {
        const submissionData = {
            action: 'submitEntry',
            data: [
                data.timestamp,
                data.department,
                data.inchargeName,
                data.date,
                data.time,
                data.machineNo,
                data.lineNo,
                data.machineType,
                data.needleType,
                data.supervisor,
                data.operator,
                data.imageLink,
                data.remarks
            ]
        };
        
        return await this.makeRequest(submissionData);
    }
    
    resetForm() {
        // Reset form data
        this.formData = {};
        this.selectedFile = null;
        this.currentStep = 1;
        
        // Reset form elements
        document.getElementById('needle-form').reset();
        document.getElementById('image-preview').innerHTML = '';
        
        // Reset date and time to current
        const now = new Date();
        document.getElementById('event-date').value = now.toISOString().split('T')[0];
        document.getElementById('event-time').value = now.toTimeString().slice(0, 5);
        
        // Show first step
        this.showStep(1);
        this.updateProgress();
        
        // Clear any validation errors
        document.querySelectorAll('.field-group.error').forEach(group => {
            group.classList.remove('error');
            const errorMsg = group.querySelector('.error-message');
            if (errorMsg) {
                errorMsg.remove();
            }
        });
    }
    
    showTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');
        
        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-section`).classList.add('active');
        
        if (tabName === 'view') {
            this.loadTodaysSubmissions();
        }
    }
    
    async loadTodaysSubmissions() {
        try {
            const today = new Date().toISOString().split('T')[0];
            
            const result = await this.makeRequest({
                action: 'getSubmissions',
                date: today
            });
            
            if (result.success) {
                this.displaySubmissions(result.data);
            } else {
                throw new Error(result.message || 'Failed to load submissions');
            }
        } catch (error) {
            console.error('Error loading submissions:', error);
            this.displaySubmissions([]); // Show empty state
            
            // Show a non-intrusive error message
            const submissionsList = document.getElementById('submissions-list');
            submissionsList.innerHTML = `
                <div class="no-submissions">
                    <i class="fas fa-exclamation-triangle" style="color: #f39c12;"></i>
                    <p>Unable to load submissions</p>
                    <small style="color: #666;">${this.getFriendlyErrorMessage(error)}</small>
                    <button class="btn btn-primary" onclick="needleLogger.loadTodaysSubmissions()" style="margin-top: 15px;">
                        <i class="fas fa-retry"></i> Try Again
                    </button>
                </div>
            `;
        }
    }
    
    displaySubmissions(submissions) {
        const submissionsList = document.getElementById('submissions-list');
        const submissionsCount = document.getElementById('submissions-count');
        
        submissionsCount.textContent = submissions.length;
        
        if (submissions.length === 0) {
            submissionsList.innerHTML = `
                <div class="no-submissions">
                    <i class="fas fa-clipboard"></i>
                    <p>No submissions recorded today</p>
                </div>
            `;
            return;
        }
        
        submissionsList.innerHTML = submissions.map((submission, index) => `
            <div class="submission-card">
                <div class="submission-header">
                    <div class="submission-id">Entry #${index + 1}</div>
                    <div class="submission-time">${new Date(submission[0]).toLocaleTimeString()}</div>
                </div>
                <div class="submission-details">
                    <div class="submission-field">
                        <div class="label">Department:</div>
                        <div class="value">${submission[1] || 'N/A'}</div>
                    </div>
                    <div class="submission-field">
                        <div class="label">Machine:</div>
                        <div class="value">${submission[5] || 'N/A'}</div>
                    </div>
                    <div class="submission-field">
                        <div class="label">Line:</div>
                        <div class="value">${submission[6] || 'N/A'}</div>
                    </div>
                    <div class="submission-field">
                        <div class="label">Needle Type:</div>
                        <div class="value">${submission[8] || 'N/A'}</div>
                    </div>
                    <div class="submission-field">
                        <div class="label">Operator:</div>
                        <div class="value">${submission[10] || 'N/A'}</div>
                    </div>
                    <div class="submission-field">
                        <div class="label">Supervisor:</div>
                        <div class="value">${submission[9] || 'N/A'}</div>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    refreshSubmissions() {
        this.loadTodaysSubmissions();
    }
    
    showLoading(text = 'Loading...') {
        document.getElementById('loading-text').textContent = text;
        document.getElementById('loading-overlay').classList.add('active');
    }
    
    hideLoading() {
        document.getElementById('loading-overlay').classList.remove('active');
    }
    
    showSuccessModal(data) {
        const summaryDiv = document.getElementById('submission-summary');
        summaryDiv.innerHTML = `
            <div class="summary-item">
                <div class="summary-label">Department:</div>
                <div class="summary-value">${data.department}</div>
            </div>
            <div class="summary-item">
                <div class="summary-label">Machine No.:</div>
                <div class="summary-value">${data.machineNo}</div>
            </div>
            <div class="summary-item">
                <div class="summary-label">Line No.:</div>
                <div class="summary-value">${data.lineNo}</div>
            </div>
            <div class="summary-item">
                <div class="summary-label">Date & Time:</div>
                <div class="summary-value">${data.date} at ${data.time}</div>
            </div>
            <div class="summary-item">
                <div class="summary-label">Submitted:</div>
                <div class="summary-value">${new Date(data.timestamp).toLocaleString()}</div>
            </div>
        `;
        
        document.getElementById('success-modal').classList.add('active');
    }
    
    showErrorModal(message) {
        document.getElementById('error-message').textContent = message;
        document.getElementById('error-modal').classList.add('active');
    }
    
    showError(message) {
        // Create a temporary notification
        const notification = document.createElement('div');
        notification.className = 'error-notification';
        notification.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
        `;
        notification.style.cssText =