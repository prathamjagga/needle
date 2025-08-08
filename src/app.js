// Needle Break Logger Application
class NeedleLogger {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 12;
        this.formData = {};
        this.submissions = [];
        this.isSubmitting = false;

        // Google Sheets configuration (replace with your actual values)
        this.sheetsConfig = {
            scriptUrl: 'http://localhost:3000/api/submit', // Using local proxy server
            sheetId: '164fKjeFto7M3-8gSNmcQuXMGLCJtazHEK6BUwlKLqRw' // Replace with your sheet ID
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
                throw new Error(result.error || 'Submission failed');
            }
        } catch (error) {
            console.error('Submission error:', error);
            this.showErrorModal(error.message);
        } finally {
            this.isSubmitting = false;
            this.hideLoading();
        }
    }

    async prepareSubmissionData() {
        const timestamp = new Date().toISOString();
        let imageLink = '';

        // Upload image if present
        if (this.selectedFile) {
            try {
                imageLink = await this.uploadImageToDrive(this.selectedFile);
            } catch (error) {
                console.warn('Image upload failed:', error);
                imageLink = 'Upload failed - ' + this.selectedFile.name;
            }
        }

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

                    const response = await fetch(this.sheetsConfig.scriptUrl, {
                        method: 'POST',
                        mode: 'cors',
                        cache: 'no-cache',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(uploadData)
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }

                    const result = await response.json();
                    if (result.success) {
                        resolve(result.fileUrl);
                    } else {
                        throw new Error(result.error || 'Upload failed');
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

        try {
            const response = await fetch(this.sheetsConfig.scriptUrl, {
                method: 'POST',
                mode: 'cors',
                cache: 'no-cache',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(submissionData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Submit error:', error);
            return { success: false, message: error.message };
        }
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

            const response = await fetch(this.sheetsConfig.scriptUrl, {
                method: 'POST',
                mode: 'cors',
                cache: 'no-cache',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'getSubmissions',
                    date: today
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                this.displaySubmissions(result.data);
            } else {
                throw new Error(result.message || 'Failed to load submissions');
            }
        } catch (error) {
            console.error('Error loading submissions:', error);
            this.displaySubmissions([]); // Show empty state
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
        // Simple error display - you can enhance this
        alert(message);
    }

    closeModal() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
    }

    closeErrorModal() {
        document.getElementById('error-modal').classList.remove('active');
    }

    newEntry() {
        this.closeModal();
        this.showTab('log');
        this.resetForm();
    }
}

// Global functions for HTML onclick handlers
function showTab(tabName) {
    window.needleLogger.showTab(tabName);
}

function nextStep(step) {
    window.needleLogger.nextStep(step);
}

function prevStep(step) {
    window.needleLogger.prevStep(step);
}

function reviewSubmission() {
    window.needleLogger.reviewSubmission();
}

function editSubmission() {
    window.needleLogger.editSubmission();
}

function refreshSubmissions() {
    window.needleLogger.refreshSubmissions();
}

function newEntry() {
    window.needleLogger.newEntry();
}

function closeModal() {
    window.needleLogger.closeModal();
}

function closeErrorModal() {
    window.needleLogger.closeErrorModal();
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.needleLogger = new NeedleLogger();
});

// Service Worker registration for offline capability (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// PWA install prompt handling
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    deferredPrompt = e;
    // You can show an install button here if desired
});
