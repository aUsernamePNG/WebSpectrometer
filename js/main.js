import cameraManager from './camera.js';
import imageProcessor from './imageProcessor.js';
import { spectragraph } from './spectragraph.js';
import { recordingManager } from './recordingManager.js';

document.addEventListener('DOMContentLoaded', () => {
    // Initialize dependencies
    imageProcessor.setSpectragraph(spectragraph);

    // Setup animation loop for video processing
    function processVideoFrame() {
        if (!cameraManager.isPaused) {
            imageProcessor.processVideoFrame(cameraManager.video);
        }
        requestAnimationFrame(processVideoFrame);
    }

    // Start the animation loop
    processVideoFrame();

    // Setup download frame button
    document.getElementById('downloadFrame').addEventListener('click', () => {
        imageProcessor.downloadCurrentFrame();
    });

    // Setup export CSV button
    document.getElementById('exportCSV').addEventListener('click', () => {
        spectragraph.exportToCSV();
    });

    // Setup pause button
    const pauseButton = document.getElementById('pauseButton');
    pauseButton.addEventListener('click', () => {
        const isPaused = !cameraManager.isPaused;
        cameraManager.setPaused(isPaused);
        pauseButton.textContent = isPaused ? 'Resume' : 'Pause';
    });

    // Setup capture button
    const captureButton = document.getElementById('captureFrame');
    captureButton.addEventListener('click', () => {
        cameraManager.setPaused(true);
        pauseButton.textContent = 'Resume';
    });

    // Setup range update button
    const updateRangeButton = document.getElementById('updateRange');
    updateRangeButton.addEventListener('click', () => {
        const start = parseFloat(document.getElementById('rangeStart').value);
        const end = parseFloat(document.getElementById('rangeEnd').value);
        spectragraph.updateDisplayRange(start, end);
    });

    // Setup calibration button
    const calibrateButton = document.getElementById('calibrate');
    calibrateButton.addEventListener('click', () => {
        const point1 = {
            x: parseInt(document.getElementById('cal1X').value),
            wavelength: parseFloat(document.getElementById('cal1Wave').value)
        };
        const point2 = {
            x: parseInt(document.getElementById('cal2X').value),
            wavelength: parseFloat(document.getElementById('cal2Wave').value)
        };
        spectragraph.updateCalibration(point1, point2);
    });

    // Setup other UI controls
    document.getElementById('showCalibrationLines').addEventListener('change', (e) => {
        spectragraph.setShowCalibrationLines(e.target.checked);
    });

    document.getElementById('reverseSpectrum').addEventListener('change', (e) => {
        spectragraph.setReversed(e.target.checked);
    });

    // Setup camera selection change handler
    document.getElementById('cameraSelect').addEventListener('change', (event) => {
        cameraManager.startCamera(event.target.value);
    });

    // Setup pause button handler
    let isPaused = false;
    pauseButton.addEventListener('click', () => {
        isPaused = !isPaused;
        pauseButton.textContent = isPaused ? 'Resume' : 'Pause';
        pauseButton.classList.toggle('paused', isPaused);
        imageProcessor.setPaused(isPaused);
        cameraManager.setPaused(isPaused);
    });

    // Setup calibration handler
    document.getElementById('calibrate').addEventListener('click', () => {
        const point1 = {
            x: parseInt(document.getElementById('cal1X').value),
            wavelength: parseFloat(document.getElementById('cal1Wave').value)
        };
        const point2 = {
            x: parseInt(document.getElementById('cal2X').value),
            wavelength: parseFloat(document.getElementById('cal2Wave').value)
        };
        
        if (!isNaN(point1.x) && !isNaN(point1.wavelength) && 
            !isNaN(point2.x) && !isNaN(point2.wavelength)) {
            spectragraph.updateCalibration(point1, point2);
            
            // Calculate and display the sensor range immediately
            const range = spectragraph.calculateSensorRange();
            document.getElementById('sensorRange').textContent = 
                `Sensor Range: ${range.start}nm - ${range.end}nm`;
            
            spectragraph.draw();
            if (imageProcessor.isPaused) {
                imageProcessor.updateOverlay({
                    startX: parseInt(document.getElementById('startX').value),
                    stopX: parseInt(document.getElementById('stopX').value),
                    startY: parseInt(document.getElementById('startY').value),
                    stopY: parseInt(document.getElementById('stopY').value)
                });
            }
        } else {
            alert('Please enter valid numbers for both calibration points');
        }
    });

    // Setup range update handler
    document.getElementById('updateRange').addEventListener('click', () => {
        const start = parseFloat(document.getElementById('rangeStart').value);
        const end = parseFloat(document.getElementById('rangeEnd').value);
        
        if (!isNaN(start) && !isNaN(end)) {
            console.log(`Updating range to: ${start} - ${end}`);
            spectragraph.updateDisplayRange(start, end);
        }
    });

    // Add input validation for range inputs
    ['rangeStart', 'rangeEnd'].forEach(id => {
        document.getElementById(id).addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            if (isNaN(value)) {
                e.target.value = e.target.value.replace(/[^\d.-]/g, '');
            }
        });
    });

    function updateRegion() {
        const region = {
            startX: parseInt(document.getElementById('startX').value),
            stopX: parseInt(document.getElementById('stopX').value),
            startY: parseInt(document.getElementById('startY').value),
            stopY: parseInt(document.getElementById('stopY').value)
        };
        
        imageProcessor.updateOverlay(region);
    }

    // Initial setup
    updateRegion();
    imageProcessor.startProcessing();
    
    // Calculate and display initial sensor range
    const range = spectragraph.calculateSensorRange();
    document.getElementById('sensorRange').textContent = 
        `Sensor Range: ${range.start}nm - ${range.end}nm`;

    // Update handler for calibration line toggle
    document.getElementById('showCalibrationLines').addEventListener('change', (event) => {
        spectragraph.setShowCalibrationLines(event.target.checked);
        if (imageProcessor.isPaused) {
            imageProcessor.updateOverlay({
                startX: parseInt(document.getElementById('startX').value),
                stopX: parseInt(document.getElementById('stopX').value),
                startY: parseInt(document.getElementById('startY').value),
                stopY: parseInt(document.getElementById('stopY').value)
            });
        }
    });

    // Add this to your existing event listeners in main.js
    document.getElementById('reverseSpectrum').addEventListener('change', (event) => {
        spectragraph.setReversed(event.target.checked);
    });

    // Update mouse move handler
    spectragraph.addEventListener('mousemove', (event) => {
        const rect = spectragraph.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        spectragraph.setMousePosition(x, y);
    });

    spectragraph.addEventListener('mouseleave', () => {
        spectragraph.clearMousePosition();
    });

    // Add wheel event handler for zooming
    spectragraph.addEventListener('wheel', (event) => {
        event.preventDefault(); // Prevent page scrolling
        
        const rect = spectragraph.getBoundingClientRect();
        const x = event.clientX - rect.left;
        
        spectragraph.handleZoom(x, event.deltaY);
    });

    // Add export handler
    document.getElementById('exportCSV').addEventListener('click', () => {
        spectragraph.exportToCSV();
    });

    // Add this with the other event listeners
    document.getElementById('qeProfile').addEventListener('change', (event) => {
        imageProcessor.setQEProfile(event.target.value);
        
        // Force a redraw if we're paused
        if (imageProcessor.isPaused && imageProcessor.lastFrame) {
            imageProcessor.processImageData(imageProcessor.lastFrame);
        }
    });

    // Update the image upload handlers
    document.getElementById('imageUpload').addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (file) {
            try {
                // Disable the process button while processing
                document.getElementById('processImage').disabled = true;
                await imageProcessor.processUploadedImage(file);
                document.getElementById('processImage').disabled = false;
            } catch (error) {
                console.error('Error processing image:', error);
                alert('Error processing image. Please try another file.');
                document.getElementById('processImage').disabled = false;
            }
        }
    });

    document.getElementById('processImage').addEventListener('click', () => {
        document.getElementById('imageUpload').click();
    });

    document.getElementById('returnToLive').addEventListener('click', () => {
        imageProcessor.returnToLive();
    });

    // Add with other event listeners
    document.getElementById('captureFrame').addEventListener('click', () => {
        imageProcessor.captureFrame();
    });

    // Setup download frame button
    document.getElementById('downloadFrame').addEventListener('click', () => {
        imageProcessor.downloadCurrentFrame();
    });
}); 