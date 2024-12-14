import cameraManager from './camera.js';
import { spectragraph } from './spectragraph.js';

class RecordingManager {
    constructor() {
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.spectralData = [];
        this.isRecording = false;
        this.recordInterval = 1000; // Default 1 second
        this.intervalId = null;
        this.startTime = null;
        
        // Get UI elements
        this.startButton = document.getElementById('startRecording');
        this.statusSpan = document.getElementById('recordingStatus');
        this.recordRawVideo = document.getElementById('recordRawVideo');
        this.recordIntervalInput = document.getElementById('recordInterval');
        
        // Bind methods
        this.toggleRecording = this.toggleRecording.bind(this);
        this.collectSpectralData = this.collectSpectralData.bind(this);
        
        // Setup event listeners
        this.startButton.addEventListener('click', this.toggleRecording);
        this.recordIntervalInput.addEventListener('change', () => {
            this.recordInterval = parseFloat(this.recordIntervalInput.value) * 1000;
        });
    }

    async startRecording() {
        try {
            // Check if recording is possible
            await this.checkRecordingPossible();

            this.spectralData = [];
            this.recordedChunks = [];
            this.startTime = Date.now();

            // Setup video recording if enabled
            if (this.recordRawVideo.checked) {
                try {
                    const stream = cameraManager.stream;
                    this.mediaRecorder = new MediaRecorder(stream, {
                        mimeType: 'video/webm;codecs=vp9'
                    });

                    this.mediaRecorder.ondataavailable = (event) => {
                        if (event.data.size > 0) {
                            this.recordedChunks.push(event.data);
                        }
                    };

                    this.mediaRecorder.start(1000);
                } catch (error) {
                    console.error('Error starting video recording:', error);
                    throw new Error('Failed to start video recording: ' + error.message);
                }
            }

            // Start collecting spectral data
            this.intervalId = setInterval(this.collectSpectralData, this.recordInterval);
            
            // Update UI
            this.isRecording = true;
            this.startButton.textContent = 'Stop Recording';
            this.startButton.classList.add('recording');
            this.updateStatus();
            
            return true;
        } catch (error) {
            alert(error.message);
            return false;
        }
    }

    stopRecording() {
        clearInterval(this.intervalId);
        
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }

        this.isRecording = false;
        this.startButton.textContent = 'Start Recording';
        this.startButton.classList.remove('recording');
        this.statusSpan.textContent = '';

        this.saveRecording();
    }

    async toggleRecording() {
        if (!this.isRecording) {
            const started = await this.startRecording();
            if (!started) return;
        } else {
            this.stopRecording();
        }
    }

    collectSpectralData() {
        const timestamp = Date.now() - this.startTime;
        const currentData = {
            timestamp,
            wavelengths: [],
            rawIntensities: [],
            correctedIntensities: []
        };

        // Get current spectral data
        const data = spectragraph.getCurrentData();
        const range = spectragraph.calculateSensorRange();
        
        // Check if we have valid data
        if (!data || !data.raw || !data.corrected) {
            console.warn('No valid spectral data available');
            return;
        }

        // Calculate wavelength step based on actual data length
        const dataLength = data.raw.length;
        const wavelengthStep = (range.end - range.start) / (dataLength - 1);

        // Collect data points
        for (let i = 0; i < dataLength; i++) {
            const wavelength = range.start + (i * wavelengthStep);
            currentData.wavelengths.push(wavelength.toFixed(2));
            currentData.rawIntensities.push(data.raw[i].toFixed(6));
            currentData.correctedIntensities.push(data.corrected[i].toFixed(6));
        }

        // Only add the data if we have valid points
        if (currentData.wavelengths.length > 0) {
            this.spectralData.push(currentData);
            this.updateStatus();
            console.log(`Recorded frame ${this.spectralData.length} with ${currentData.wavelengths.length} points`);
        }
    }

    updateStatus() {
        const duration = ((Date.now() - this.startTime) / 1000).toFixed(1);
        const frames = this.spectralData.length;
        this.statusSpan.textContent = `Recording: ${duration}s (${frames} frames)`;
    }

    async saveRecording() {
        // Save CSV data
        const csvContent = this.generateCSV();
        const csvBlob = new Blob([csvContent], { type: 'text/csv' });
        const csvUrl = URL.createObjectURL(csvBlob);
        
        // Save video if recorded
        let videoUrl = null;
        if (this.recordedChunks.length > 0) {
            const videoBlob = new Blob(this.recordedChunks, { type: 'video/webm' });
            videoUrl = URL.createObjectURL(videoBlob);
        }

        // Create download dialog
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const dialog = document.createElement('div');
        dialog.className = 'download-dialog';
        dialog.innerHTML = `
            <h3>Recording Complete</h3>
            <p>Download recorded files:</p>
            <div class="download-buttons">
                <a href="${csvUrl}" download="spectral_data_${timestamp}.csv" class="download-button">
                    Download CSV Data
                </a>
                ${videoUrl ? `
                    <a href="${videoUrl}" download="raw_video_${timestamp}.webm" class="download-button">
                        Download Video
                    </a>
                ` : ''}
            </div>
            <button class="close-button">Close</button>
        `;

        document.body.appendChild(dialog);

        // Handle dialog close
        dialog.querySelector('.close-button').onclick = () => {
            document.body.removeChild(dialog);
            URL.revokeObjectURL(csvUrl);
            if (videoUrl) URL.revokeObjectURL(videoUrl);
        };
    }

    generateCSV() {
        if (this.spectralData.length === 0) {
            console.warn('No spectral data recorded');
            return 'No data recorded';
        }

        let csv = 'Timestamp (ms),Wavelength (nm),Raw Intensity,Corrected Intensity\n';
        
        this.spectralData.forEach(frame => {
            const timestamp = frame.timestamp;
            frame.wavelengths.forEach((wavelength, i) => {
                csv += `${timestamp},${wavelength},${frame.rawIntensities[i]},${frame.correctedIntensities[i]}\n`;
            });
        });
        
        return csv;
    }

    async checkRecordingPossible() {
        // Check if spectragraph has valid data
        const data = spectragraph.getCurrentData();
        if (!data || !data.raw || !data.raw.length === 0) {
            throw new Error('No spectral data available. Please ensure the spectrometer is running.');
        }

        // Check if video recording is requested and possible
        if (this.recordRawVideo.checked) {
            if (!cameraManager.stream) {
                throw new Error('No camera stream available for video recording.');
            }
            
            // Check if MediaRecorder supports WebM
            if (!MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
                throw new Error('Your browser does not support WebM video recording.');
            }
        }

        return true;
    }
}

export const recordingManager = new RecordingManager();
export default RecordingManager; 