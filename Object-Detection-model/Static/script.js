document.addEventListener('DOMContentLoaded', function() {
    const uploadBox = document.getElementById('uploadBox');
    const fileInput = document.getElementById('fileInput');
    const detectBtn = document.getElementById('detectBtn');
    const loading = document.getElementById('loading');
    const resultsSection = document.getElementById('resultsSection');
    const errorDiv = document.getElementById('error');
    const errorMessage = document.getElementById('errorMessage');
    
    let selectedFile = null;
    
    // Load available classes on page load
    loadAvailableClasses();
    
    // Upload box click handler
    uploadBox.addEventListener('click', () => {
        fileInput.click();
    });
    
    // File input change handler
    fileInput.addEventListener('change', handleFileSelect);
    
    // Drag and drop handlers
    uploadBox.addEventListener('dragover', handleDragOver);
    uploadBox.addEventListener('dragleave', handleDragLeave);
    uploadBox.addEventListener('drop', handleDrop);
    
    // Detect button handler
    detectBtn.addEventListener('click', detectObjects);
    
    function handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
            selectedFile = file;
            updateUploadBox(file.name);
            detectBtn.disabled = false;
        }
    }
    
    function handleDragOver(event) {
        event.preventDefault();
        uploadBox.classList.add('dragover');
    }
    
    function handleDragLeave(event) {
        event.preventDefault();
        uploadBox.classList.remove('dragover');
    }
    
    function handleDrop(event) {
        event.preventDefault();
        uploadBox.classList.remove('dragover');
        
        const files = event.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            if (isValidImageFile(file)) {
                selectedFile = file;
                fileInput.files = files;
                updateUploadBox(file.name);
                detectBtn.disabled = false;
            } else {
                showError('Please select a valid image file (PNG, JPG, JPEG, GIF, BMP)');
            }
        }
    }
    
    function updateUploadBox(filename) {
        const uploadContent = uploadBox.querySelector('.upload-content');
        uploadContent.innerHTML = `
            <div class="upload-icon">✓</div>
            <p><strong>${filename}</strong> selected</p>
            <p>Click to change or drag another file</p>
        `;
    }
    
    function isValidImageFile(file) {
        const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/bmp'];
        return validTypes.includes(file.type);
    }
    
    async function detectObjects() {
        if (!selectedFile) {
            showError('Please select an image first');
            return;
        }
        
        const formData = new FormData();
        formData.append('file', selectedFile);
        
        // Show loading
        hideError();
        hideResults();
        showLoading();
        detectBtn.disabled = true;
        
        try {
            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.success) {
                displayResults(result);
            } else {
                showError(result.error || 'An error occurred during detection');
            }
        } catch (error) {
            showError('Network error: ' + error.message);
        } finally {
            hideLoading();
            detectBtn.disabled = false;
        }
    }
    
    function displayResults(result) {
        // Update images
        document.getElementById('originalImage').src = result.original_image;
        document.getElementById('annotatedImage').src = result.annotated_image;
        
        // Update stats
        document.getElementById('totalObjects').textContent = result.total_objects;
        
        // Update objects list
        const objectsList = document.getElementById('objectsList');
        if (result.detected_objects.length > 0) {
            objectsList.innerHTML = result.detected_objects.map(obj => `
                <div class="object-item">
                    <span class="object-name">${obj.class}</span>
                    <span class="object-confidence">${(obj.confidence * 100).toFixed(1)}%</span>
                </div>
            `).join('');
        } else {
            objectsList.innerHTML = '<p>No objects detected in the image.</p>';
        }
        
        showResults();
    }
    
    async function loadAvailableClasses() {
        try {
            const response = await fetch('/classes');
            const result = await response.json();
            
            if (result.classes && result.classes.length > 0) {
                const objectTags = document.getElementById('objectTags');
                // Show first 15 classes as examples
                const sampleClasses = result.classes.slice(0, 15);
                objectTags.innerHTML = sampleClasses.map(className => 
                    `<span class="tag">${className}</span>`
                ).join('');
            }
        } catch (error) {
            console.error('Error loading classes:', error);
        }
    }
    
    function showLoading() {
        loading.style.display = 'block';
    }
    
    function hideLoading() {
        loading.style.display = 'none';
    }
    
    function showResults() {
        resultsSection.style.display = 'block';
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }
    
    function hideResults() {
        resultsSection.style.display = 'none';
    }
    
    function showError(message) {
        errorMessage.textContent = message;
        errorDiv.style.display = 'block';
        errorDiv.scrollIntoView({ behavior: 'smooth' });
    }
    
    function hideError() {
        errorDiv.style.display = 'none';
    }
});