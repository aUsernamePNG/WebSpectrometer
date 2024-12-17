import cameraManager from './camera.js';

class ImageProcessor {
    constructor(overlay) {
        if (!overlay) {
            console.warn('ImageProcessor: No overlay canvas provided, creating a new canvas');
            overlay = document.createElement('canvas');
            overlay.width = 1920;
            overlay.height = 1080;
        }
        this.overlay = overlay;
        this.ctx = overlay.getContext('2d', { willReadFrequently: true });
        this.spectragraph = null;
        this.isPaused = false;
        this.lastFrame = null;
        this.region = {
            startX: 0,
            stopX: 1920,
            startY: 0,
            stopY: 1080
        };
        this.qeProfile = 'none';
        this.qeData = null;
        
        // Initialize the region from input elements
        this.updateRegionFromInputs();
    }

    updateRegionFromInputs() {
        const startX = document.getElementById('startX');
        const stopX = document.getElementById('stopX');
        const startY = document.getElementById('startY');
        const stopY = document.getElementById('stopY');
        
        if (startX && stopX && startY && stopY) {
            this.region = {
                startX: parseInt(startX.value) || 0,
                stopX: parseInt(stopX.value) || 1920,
                startY: parseInt(startY.value) || 0,
                stopY: parseInt(stopY.value) || 1080
            };
        }
    }

    updateOverlay(region) {
        if (region) {
            this.region = region;
        }
        if (this.ctx && this.lastFrame) {
            this.processFrame(this.ctx);
        }
    }

    setPaused(paused) {
        this.isPaused = paused;
    }

    setQEProfile(profile) {
        this.qeProfile = profile;
    }

    setSpectragraph(spectragraph) {
        this.spectragraph = spectragraph;
    }

    calculateWavelengths(calibration) {
        const { point1, point2 } = calibration;
        const wavelengthPerPixel = (point2.wavelength - point1.wavelength) / (point2.x - point1.x);
        
        // Calculate wavelengths for all pixels (0-1919)
        const wavelengths = new Array(1920);
        for (let pixel = 0; pixel < 1920; pixel++) {
            wavelengths[pixel] = point1.wavelength + ((pixel - point1.x) * wavelengthPerPixel);
        }
        return wavelengths;
    }

    processImageData(imageData) {
        if (!this.spectragraph) {
            console.warn('No spectragraph instance available');
            return;
        }

        const width = imageData.width;
        const height = imageData.height;
        const data = imageData.data;
        
        // Calculate wavelengths for each pixel
        const wavelengths = this.calculateWavelengths(this.spectragraph.calibration);
        
        // Initialize arrays for intensities
        const intensities = new Array(width).fill(0);
        const rawIntensities = new Array(width).fill(0);

        // Process each column in the region
        for (let x = 0; x < width; x++) {
            let sum = 0;
            let count = 0;

            // Average the intensity over the Y range
            for (let y = 0; y < height; y++) {
                const idx = (y * width + x) * 4;
                // Use green channel for better sensitivity
                const intensity = data[idx + 1] / 255;
                sum += intensity;
                count++;
            }

            // Calculate average intensity for this column
            const avgIntensity = count > 0 ? sum / count : 0;
            rawIntensities[x] = avgIntensity;

            // Apply QE correction if needed
            if (this.qeProfile !== 'none' && this.qeData) {
                const wavelength = wavelengths[x + this.region.startX];
                const qeCorrection = this.getQECorrection(wavelength);
                intensities[x] = avgIntensity * qeCorrection;
            } else {
                intensities[x] = avgIntensity;
            }
        }

        // Create wavelength-intensity pairs for the processed region
        const spectralData = [];
        for (let x = 0; x < width; x++) {
            const wavelength = wavelengths[x + this.region.startX];
            spectralData.push({
                wavelength: wavelength,
                intensity: intensities[x],
                rawIntensity: rawIntensities[x]
            });
        }

        // Update spectragraph with the processed data
        this.spectragraph.updateSpectralData(spectralData);
    }

    getQECorrection(wavelength) {
        // Implement QE correction lookup/calculation
        // Return 1.0 if no correction available
        return 1.0;
    }

    setupFileHandlers() {
        const fileInput = document.getElementById('imageUpload');
        const processButton = document.getElementById('processImage');
        const returnButton = document.getElementById('returnToLive');
        
        processButton.addEventListener('click', () => {
            const file = fileInput.files[0];
            if (file) {
                this.processImageFile(file);
            }
        });

        returnButton.addEventListener('click', () => {
            // Switch back to live view
            document.querySelector('.video-container').style.display = 'block';
            cameraManager.setPaused(false);
        });
    }

    async processImageFile(file) {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        
        img.onload = () => {
            // Set canvas size to match image
            this.canvas.width = img.width;
            this.canvas.height = img.height;
            
            // Draw image to canvas
            this.ctx.drawImage(img, 0, 0);
            
            // Process the image data
            this.processFrame(this.ctx);
            
            // Pause live view
            cameraManager.setPaused(true);
            document.querySelector('.video-container').style.display = 'none';
            
            // Clean up
            URL.revokeObjectURL(img.src);
        };
    }

    processFrame(sourceCtx) {
        if (!sourceCtx || !this.spectragraph) {
            console.warn('No source context or spectragraph available');
            return;
        }

        // Update region from inputs before processing
        this.updateRegionFromInputs();

        try {
            // Store the frame for later use first
            this.lastFrame = sourceCtx.getImageData(0, 0, this.overlay.width, this.overlay.height);

            // Get image data for the specified range
            const imageData = sourceCtx.getImageData(
                this.region.startX,
                this.region.startY,
                this.region.stopX - this.region.startX,
                this.region.stopY - this.region.startY
            );
            
            // Process the data and update spectragraph
            this.processImageData(imageData);
        } catch (error) {
            console.error('Error in processFrame:', error);
        }
    }

    processVideoFrame(video) {
        if (!this.ctx || !video) return;
        
        try {
            // Clear the canvas first
            this.ctx.clearRect(0, 0, this.overlay.width, this.overlay.height);
            
            // Draw the video frame to the canvas
            this.ctx.drawImage(video, 0, 0, this.overlay.width, this.overlay.height);
            
            // Process the frame
            this.processFrame(this.ctx);
        } catch (error) {
            console.error('Error in processVideoFrame:', error);
        }
    }

    downloadCurrentFrame() {
        if (!this.lastFrame || !this.ctx) {
            console.warn('No frame available to download');
            return;
        }

        try {
            // Create a temporary canvas for the download
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = this.overlay.width;
            tempCanvas.height = this.overlay.height;
            const tempCtx = tempCanvas.getContext('2d');

            // Put the last frame on the temporary canvas
            tempCtx.putImageData(this.lastFrame, 0, 0);

            // Create download link
            const link = document.createElement('a');
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            link.download = `spectrometer-frame-${timestamp}.png`;
            
            // Convert canvas to blob
            tempCanvas.toBlob((blob) => {
                link.href = URL.createObjectURL(blob);
                link.click();
                // Clean up
                URL.revokeObjectURL(link.href);
            }, 'image/png');
        } catch (error) {
            console.error('Error downloading frame:', error);
        }
    }
}

// Create and export a singleton instance
const imageProcessor = new ImageProcessor(document.getElementById('overlay'));
export default imageProcessor; 