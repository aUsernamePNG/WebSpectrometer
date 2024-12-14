class CameraManager {
    constructor() {
        this.video = document.getElementById('video');
        this.cameraSelect = document.getElementById('cameraSelect');
        this.cameraStatus = document.getElementById('cameraStatus');
        this.cameraInfo = document.getElementById('cameraInfo');
        this.stream = null;
        this.currentResolution = { width: 1920, height: 1080 }; // default
        this.isPaused = false;
        
        // Bind methods
        this.initializeCamera = this.initializeCamera.bind(this);
        this.updateCameraList = this.updateCameraList.bind(this);
        this.switchCamera = this.switchCamera.bind(this);
        
        // Add event listener for camera selection
        this.cameraSelect.addEventListener('change', this.switchCamera);
        
        // Initialize camera
        this.initializeCamera();
    }

    setPaused(paused) {
        this.isPaused = paused;
        if (paused) {
            this.video.pause();
        } else {
            this.video.play();
        }
    }

    async initializeCamera() {
        try {
            // First, check if we have permission
            const permission = await navigator.permissions.query({ name: 'camera' });
            
            if (permission.state === 'denied') {
                this.cameraStatus.textContent = 'Camera permission denied. Please enable camera access.';
                return;
            }

            // Request initial camera access
            await navigator.mediaDevices.getUserMedia({ video: true });
            
            // Get list of cameras
            await this.updateCameraList();
            
            // Start stream with first available camera
            if (this.cameraSelect.options.length > 0) {
                await this.switchCamera();
            }
        } catch (error) {
            console.error('Error initializing camera:', error);
            this.cameraStatus.textContent = `Camera error: ${error.message}`;
        }
    }

    async updateCameraList() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            
            // Clear existing options
            this.cameraSelect.innerHTML = '';
            
            // Add cameras to select
            videoDevices.forEach(device => {
                const option = document.createElement('option');
                option.value = device.deviceId;
                option.text = device.label || `Camera ${this.cameraSelect.options.length + 1}`;
                this.cameraSelect.appendChild(option);
            });

            // Update status
            this.cameraStatus.textContent = videoDevices.length > 0 
                ? `Found ${videoDevices.length} camera(s)` 
                : 'No cameras found';
        } catch (error) {
            console.error('Error getting camera list:', error);
            this.cameraStatus.textContent = `Error listing cameras: ${error.message}`;
        }
    }

    async switchCamera() {
        try {
            const deviceId = this.cameraSelect.value;
            
            // Stop current stream if it exists
            if (this.stream) {
                this.stream.getTracks().forEach(track => track.stop());
            }
            
            // Start new stream
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    deviceId: deviceId ? { exact: deviceId } : undefined,
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                }
            });
            
            this.video.srcObject = this.stream;
            
            // Get video track settings
            const videoTrack = this.stream.getVideoTracks()[0];
            const settings = videoTrack.getSettings();
            const capabilities = videoTrack.getCapabilities();
            
            // Update current resolution
            this.currentResolution = {
                width: settings.width,
                height: settings.height
            };

            this.displayCameraInfo(capabilities);
            this.updateInputRanges();
            
            this.cameraStatus.textContent = 'Camera connected successfully';
        } catch (error) {
            console.error('Error switching camera:', error);
            this.cameraStatus.textContent = `Error switching camera: ${error.message}`;
        }
    }

    updateInputRanges() {
        const startX = document.getElementById('startX');
        const stopX = document.getElementById('stopX');
        const startY = document.getElementById('startY');
        const stopY = document.getElementById('stopY');

        // Update X range
        startX.max = this.currentResolution.width;
        stopX.max = this.currentResolution.width;
        
        // Set default values if they're at initial state
        if (startX.value === "0") startX.value = 0;
        if (stopX.value === "1920") stopX.value = this.currentResolution.width;
        if (startY.value === "540") startY.value = Math.floor(this.currentResolution.height / 2);
        if (stopY.value === "590") stopY.value = Math.floor(this.currentResolution.height / 2) + 50;

        // Ensure values don't exceed new resolution
        startX.value = Math.min(startX.value, this.currentResolution.width);
        stopX.value = Math.min(stopX.value, this.currentResolution.width);
        startY.value = Math.min(startY.value, this.currentResolution.height);
        stopY.value = Math.min(stopY.value, this.currentResolution.height);

        // Update Y range
        startY.max = this.currentResolution.height;
        stopY.max = this.currentResolution.height;
    }

    displayCameraInfo(capabilities) {
        if (this.cameraInfo) {
            if (capabilities.width && capabilities.height) {
                this.cameraInfo.innerHTML = `
                    <strong>Camera Resolution:</strong> 
                    ${this.currentResolution.width} x ${this.currentResolution.height} px
                    (Maximum: ${capabilities.width.max} x ${capabilities.height.max} px)
                `;
            } else {
                this.cameraInfo.innerHTML = '<strong>Camera Resolution:</strong> Not available';
            }
        }
    }

    // Method to stop the camera stream
    stopStream() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
            this.video.srcObject = null;
        }
    }

    // Getter for current resolution
    getCurrentResolution() {
        return this.currentResolution;
    }
}

// Create and export camera manager instance
const cameraManager = new CameraManager();
export default cameraManager; 