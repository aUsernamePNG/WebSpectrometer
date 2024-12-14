import { spectragraph } from './spectragraph.js';
import cameraManager from './camera.js';

class ImageProcessor {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 1920;
        this.canvas.height = 1080;
        
        // Get input elements
        this.startX = document.getElementById('startX');
        this.stopX = document.getElementById('stopX');
        this.startY = document.getElementById('startY');
        this.stopY = document.getElementById('stopY');
        
        // Setup file input handlers
        this.setupFileHandlers();
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
        // Get the range values
        const startX = parseInt(this.startX.value);
        const stopX = parseInt(this.stopX.value);
        const startY = parseInt(this.startY.value);
        const stopY = parseInt(this.stopY.value);

        // Get image data for the specified range
        const imageData = sourceCtx.getImageData(startX, startY, stopX - startX, stopY - startY);
        const data = imageData.data;

        // Process the data
        const width = stopX - startX;
        const height = stopY - startY;
        const spectrum = new Array(width).fill(0);
        const rawSpectrum = new Array(width).fill(0);

        // Calculate average intensity for each column
        for (let x = 0; x < width; x++) {
            let sum = 0;
            for (let y = 0; y < height; y++) {
                const i = (y * width + x) * 4;
                // Use green channel for better sensitivity
                sum += data[i + 1];
            }
            const avgIntensity = sum / (height * 255); // Normalize to 0-1
            rawSpectrum[x] = avgIntensity;
            spectrum[x] = avgIntensity;
        }

        // Update the spectragraph
        spectragraph.updateData(spectrum, rawSpectrum);
    }

    processVideoFrame(video) {
        // Draw the video frame to the canvas
        this.ctx.drawImage(video, 0, 0);
        
        // Process the frame
        this.processFrame(this.ctx);
    }
}

// Create and export instance
const imageProcessor = new ImageProcessor();
export default imageProcessor; 