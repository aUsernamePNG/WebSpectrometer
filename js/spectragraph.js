/**
 * Spectragraph Class Specification
 * 
 * Purpose:
 * Handles the display and interaction with spectral data in a graphical format.
 * 
 * Key Features:
 * 1. Real-time spectrum visualization
 * 2. Wavelength calibration using two-point system
 * 3. Interactive zooming and panning
 * 4. Peak detection and measurement
 * 5. Data export capabilities
 * 
 * Display Specifications:
 * - Wavelength Range: 200nm to 2000nm
 * - Minimum Zoom Range: 100nm
 * - Maximum Zoom Range: 2000nm
 * - Visible Spectrum: 380nm to 700nm (colored display)
 * - UV Region: <380nm (displayed in gray)
 * - IR Region: >700nm (displayed in gray)
 * 
 * Calibration:
 * - Two-point calibration system
 * - Linear wavelength mapping
 * - Automatic sensor range calculation
 * 
 * Interactive Features:
 * - Mouse hover wavelength/intensity display
 * - Click-and-drag navigation
 * - Mousewheel zoom with cursor centering
 * - Calibration line visibility toggle
 * - Spectrum direction reversal option
 * 
 * Data Handling:
 * - 1920-pixel resolution (full camera width)
 * - Normalized intensity display (0-100%)
 * - Raw and QE-corrected data storage
 * - CSV export functionality
 * 
 * Display Elements:
 * - Main spectrum plot
 * - Wavelength scale (adaptive divisions)
 * - Intensity scale (0-100%)
 * - Grid lines (adaptive spacing)
 * - Calibration markers
 * - Hover information display
 * 
 * Zoom Behavior:
 * - Maintains minimum 100nm view range
 * - Centers on cursor position
 * - Preserves calibration accuracy
 * - Prevents display outside sensor range
 * 
 * Performance:
 * - Real-time updates at camera frame rate
 * - Efficient data processing and drawing
 * - Responsive window resizing
 * 
 * Dependencies:
 * - HTML5 Canvas
 * - QE Calibration data
 * - ImageProcessor class for data input
 */

class Spectragraph {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.data = new Array(960).fill(0);
        this.calibration = {
            point1: { x: 1623, wavelength: 405.4 },
            point2: { x: 1238, wavelength: 611.6 }
        };
        this.displayRange = {
            start: 350,
            end: 1200
        };
        this.visibleRange = {
            start: 380,
            end: 700
        };
        this.showCalibrationLines = true;
        this.isReversed = false;
        this.mousePosition = null;
        this.zoomFactor = 1.1;
        this.rawData = new Array(960).fill(0);
        
        // Set canvas size
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    setShowCalibrationLines(show) {
        this.showCalibrationLines = show;
        this.draw();
    }

    setReversed(reversed) {
        this.isReversed = reversed;
        this.draw();
    }

    updateCalibration(point1, point2) {
        this.calibration.point1 = point1;
        this.calibration.point2 = point2;
        
        // Calculate and display sensor range
        const range = this.calculateSensorRange();
        const sensorRangeElement = document.getElementById('sensorRange');
        sensorRangeElement.textContent = 
            `Sensor Range: ${range.start}nm - ${range.end}nm`;
    }

    updateDisplayRange(start, end) {
        // Ensure start is less than end
        if (start >= end) {
            console.warn('Invalid range: start must be less than end');
            return;
        }

        const sensorRange = this.calculateSensorRange();
        
        // Clamp values to sensor range
        const newStart = Math.max(sensorRange.start, Math.min(start, sensorRange.end));
        const newEnd = Math.min(sensorRange.end, Math.max(end, sensorRange.start));
        
        // Ensure minimum range of 100nm
        if (newEnd - newStart < 100) {
            console.warn('Range must be at least 100nm');
            return;
        }
        
        if (newStart < newEnd) {
            this.displayRange.start = newStart;
            this.displayRange.end = newEnd;
            this.updateDisplayRangeInputs();
            this.draw();
        }
    }

    wavelengthToX(wavelength) {
        const range = this.displayRange.end - this.displayRange.start;
        const position = (wavelength - this.displayRange.start) / range;
        
        return Math.round(position * (this.data.length - 1));
    }

    xToWavelength(x) {
        const range = this.displayRange.end - this.displayRange.start;
        return this.displayRange.start + (x / this.canvas.width) * range;
    }

    updateData(newData, rawData) {
        this.data = newData;
        this.rawData = rawData;
        this.draw();
    }

    draw() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height - 25;

        // Clear canvas
        ctx.clearRect(0, 0, width, this.canvas.height);

        // Draw grid
        this.drawGrid();

        // Draw spectrum
        ctx.beginPath();
        ctx.moveTo(0, height);

        // Calculate wavelength range for current view
        const range = this.displayRange.end - this.displayRange.start;
        const wavelengthStep = (this.calibration.point2.wavelength - this.calibration.point1.wavelength) / 
                              (this.calibration.point2.x - this.calibration.point1.x);
        const startWavelength = this.calibration.point1.wavelength - 
                                 (this.calibration.point1.x * wavelengthStep);

        // Draw data points
        for (let x = 0; x < width; x++) {
            // Convert canvas x to wavelength
            const wavelength = this.isReversed ?
                this.displayRange.end - (x / width) * range :
                this.displayRange.start + (x / width) * range;
            
            // Convert wavelength to data index
            const pixelPos = Math.round((wavelength - startWavelength) / wavelengthStep);
            
            if (pixelPos >= 0 && pixelPos < this.data.length) {
                const y = height - (this.data[pixelPos] * height);
                ctx.lineTo(x, y);
            }
        }

        ctx.lineTo(width, height);
        ctx.closePath();

        // Fill with gradient
        const gradient = ctx.createLinearGradient(0, 0, width, 0);
        this.createSpectrumGradient(gradient);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Draw the line
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Draw scales and other elements
        this.drawWavelengthScale();
        if (this.showCalibrationLines) {
            this.drawCalibrationLines();
        }
        if (this.mousePosition && this.mousePosition.y < height) {
            this.drawHoverInfo(this.mousePosition.x, this.mousePosition.y);
        }
    }

    drawGrid() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height - 25; // Adjust for wavelength scale

        ctx.strokeStyle = 'rgba(128, 128, 128, 0.2)';
        ctx.lineWidth = 1;

        // Calculate step size based on range
        const range = this.displayRange.end - this.displayRange.start;
        let step = 50; // Default step

        // Adjust step size based on zoom level
        if (range <= 100) step = 10;
        else if (range <= 200) step = 20;
        else if (range <= 500) step = 50;
        else step = 100;

        // Draw vertical lines at wavelength intervals
        const firstWavelength = Math.ceil(this.displayRange.start / step) * step;
        for (let wavelength = firstWavelength; wavelength <= this.displayRange.end; wavelength += step) {
            let x;
            if (this.isReversed) {
                x = ((this.displayRange.end - wavelength) / range) * width;
            } else {
                x = ((wavelength - this.displayRange.start) / range) * width;
            }
            
            if (x >= 0 && x <= width) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, height);
                ctx.stroke();
            }
        }

        // Draw horizontal lines (intensity scale)
        const intensityStep = 0.2; // 20% steps
        for (let i = 0; i <= 1; i += intensityStep) {
            const y = height - (i * height);
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();

            // Add intensity scale labels
            ctx.fillStyle = 'rgba(128, 128, 128, 0.8)';
            ctx.font = '10px Arial';
            ctx.textAlign = 'right';
            ctx.fillText(`${Math.round(i * 100)}%`, width - 5, y - 2);
        }
    }

    drawWavelengthScale() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height - 25;

        // Add background for scale area
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(0, height, width, 25);

        // Calculate step size based on range
        const range = this.displayRange.end - this.displayRange.start;
        let step = 50;

        // Adjust step size based on zoom level
        if (range <= 50) step = 5;
        else if (range <= 100) step = 10;
        else if (range <= 200) step = 20;
        else if (range <= 500) step = 50;
        else step = 100;

        // Draw wavelength markers
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        const firstWavelength = Math.ceil(this.displayRange.start / step) * step;
        for (let wavelength = firstWavelength; wavelength <= this.displayRange.end; wavelength += step) {
            let x;
            if (this.isReversed) {
                x = ((this.displayRange.end - wavelength) / range) * width;
            } else {
                x = ((wavelength - this.displayRange.start) / range) * width;
            }
            
            if (x >= 0 && x <= width) {
                // Draw tick mark
                ctx.beginPath();
                ctx.moveTo(x, height);
                ctx.lineTo(x, height + 6);
                ctx.stroke();
                
                // Draw label
                ctx.fillText(`${wavelength}`, x, height + 8);
            }
        }
    }

    drawCalibrationLines() {
        const ctx = this.ctx;
        const height = this.canvas.height - 25; // Use adjusted height
        const range = this.displayRange.end - this.displayRange.start;

        // Draw lines for both calibration points
        const points = [this.calibration.point1, this.calibration.point2];
        
        points.forEach((point, index) => {
            if (point.wavelength >= this.displayRange.start && 
                point.wavelength <= this.displayRange.end) {
                
                const x = (point.wavelength - this.displayRange.start) * this.canvas.width / range;
                
                // Draw vertical line
                ctx.beginPath();
                ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);
                ctx.moveTo(x, 0);
                ctx.lineTo(x, height - 20);
                ctx.stroke();
                ctx.setLineDash([]);

                // Draw label with 2 decimal places
                ctx.fillStyle = 'red';
                ctx.font = 'bold 12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(`Cal ${index + 1}: ${point.wavelength.toFixed(2)}nm`, x, 15);
            }
        });
    }

    // Add new method to find nearest peak
    findNearestPeak(mouseX) {
        const width = this.canvas.width;
        const searchRadius = 10; // Reduced from 20 to 10 pixels
        let peakX = mouseX;
        let peakValue = this.data[Math.floor((mouseX / width) * this.data.length)];
        
        // Search around mouse position
        for (let offset = -searchRadius; offset <= searchRadius; offset++) {
            const x = mouseX + offset;
            if (x >= 0 && x < width) {
                const dataIndex = Math.floor((x / width) * this.data.length);
                const value = this.data[dataIndex];
                
                // More strict peak detection
                if (dataIndex > 1 && dataIndex < this.data.length - 2) {
                    // Check if it's a true local maximum (higher than 2 points on each side)
                    if (value > this.data[dataIndex - 2] &&
                        value > this.data[dataIndex - 1] &&
                        value > this.data[dataIndex + 1] &&
                        value > this.data[dataIndex + 2] &&
                        value > peakValue &&
                        value > 0.05) { // Minimum height threshold
                        peakX = x;
                        peakValue = value;
                    }
                }
            }
        }
        
        return { x: peakX, value: peakValue };
    }

    drawHoverInfo(mouseX, mouseY) {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height - 25;

        // Draw vertical line at cursor position
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.setLineDash([5, 5]);
        ctx.moveTo(mouseX, 0);
        ctx.lineTo(mouseX, height);
        ctx.stroke();
        ctx.setLineDash([]);

        // Calculate wavelength at cursor
        const wavelength = this.isReversed ? 
            this.displayRange.end - (mouseX / width) * (this.displayRange.end - this.displayRange.start) :
            this.displayRange.start + (mouseX / width) * (this.displayRange.end - this.displayRange.start);

        // Convert wavelength to data index
        const wavelengthStep = (this.calibration.point2.wavelength - this.calibration.point1.wavelength) / 
                              (this.calibration.point2.x - this.calibration.point1.x);
        const startWavelength = this.calibration.point1.wavelength - 
                               (this.calibration.point1.x * wavelengthStep);
        const dataIndex = Math.round((wavelength - startWavelength) / wavelengthStep);

        // Get intensity values
        const intensity = (dataIndex >= 0 && dataIndex < this.data.length) ? this.data[dataIndex] : 0;
        const rawIntensity = (dataIndex >= 0 && dataIndex < this.rawData.length) ? this.rawData[dataIndex] : 0;

        // Draw dot at data point
        const dotY = height - (intensity * height);
        ctx.beginPath();
        ctx.fillStyle = 'red';  // Changed to red
        ctx.arc(mouseX, dotY, 3, 0, Math.PI * 2);
        ctx.fill();

        // Draw info box
        const text = [
            `λ: ${wavelength.toFixed(2)} nm`,
            `I: ${(intensity * 100).toFixed(1)}%`,
            `Raw: ${(rawIntensity * 100).toFixed(1)}%`
        ];
        
        // Calculate box dimensions
        ctx.font = '11px Arial';
        const lineHeight = 14;
        const padding = 5;
        const boxWidth = Math.max(...text.map(line => ctx.measureText(line).width)) + (padding * 2);
        const boxHeight = (text.length * lineHeight) + (padding * 2);
        
        // Position box to avoid canvas edges
        let boxX = mouseX + 10;
        let boxY = mouseY - boxHeight - 10;
        
        if (boxX + boxWidth > width) boxX = mouseX - boxWidth - 10;
        if (boxY < 0) boxY = mouseY + 10;

        // Draw box background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

        // Draw text
        ctx.fillStyle = 'white';
        ctx.textBaseline = 'top';
        ctx.textAlign = 'left';
        text.forEach((line, i) => {
            ctx.fillText(line, boxX + padding, boxY + padding + (i * lineHeight));
        });
    }

    // Add new method to find multiple peaks
    findPeaksInRange(mouseX, range) {
        const width = this.canvas.width;
        const peaks = [];
        const minPeakHeight = 0.1; // Minimum peak height threshold
        
        for (let x = mouseX - range; x <= mouseX + range; x++) {
            if (x < 0 || x >= width) continue;
            
            const dataIndex = Math.floor((x / width) * this.data.length);
            if (dataIndex < 2 || dataIndex >= this.data.length - 2) continue;

            const value = this.data[dataIndex];
            
            // Check if it's a local maximum
            if (value > minPeakHeight && 
                value > this.data[dataIndex - 1] &&
                value > this.data[dataIndex - 2] &&
                value > this.data[dataIndex + 1] &&
                value > this.data[dataIndex + 2]) {
                
                peaks.push({ x, value });
            }
        }
        
        return peaks;
    }

    // Add new method for drawing info box
    drawInfoBox(mouseX, mouseY, wavelength, intensity, rawIntensity) {
        const ctx = this.ctx;
        const text = [
            `λ: ${wavelength.toFixed(2)} nm`,
            `I: ${(intensity * 100).toFixed(1)}%`,
            `Raw: ${(rawIntensity * 100).toFixed(1)}%`
        ];
        
        // Calculate box dimensions
        ctx.font = '11px Arial';
        const lineHeight = 14;
        const padding = 5;
        const boxWidth = Math.max(...text.map(line => ctx.measureText(line).width)) + (padding * 2);
        const boxHeight = (text.length * lineHeight) + (padding * 2);
        
        // Position box to avoid canvas edges
        let boxX = mouseX + 10;
        let boxY = mouseY - boxHeight - 10;
        
        if (boxX + boxWidth > this.canvas.width) boxX = mouseX - boxWidth - 10;
        if (boxY < 0) boxY = mouseY + 10;

        // Draw box background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

        // Draw text
        ctx.fillStyle = 'white';
        ctx.textBaseline = 'top';
        ctx.textAlign = 'left';
        text.forEach((line, i) => {
            ctx.fillText(line, boxX + padding, boxY + padding + (i * lineHeight));
        });
    }

    setMousePosition(x, y) {
        this.mousePosition = { x, y };
        this.draw();
    }

    clearMousePosition() {
        this.mousePosition = null;
        this.draw();
    }

    handleZoom(mouseX, deltaY) {
        const width = this.canvas.width;
        
        // Convert mouse position to wavelength
        const wavelengthAtCursor = this.isReversed ? 
            this.displayRange.end - (mouseX / width) * (this.displayRange.end - this.displayRange.start) :
            this.displayRange.start + (mouseX / width) * (this.displayRange.end - this.displayRange.start);
        
        // Calculate current range
        const currentRange = this.displayRange.end - this.displayRange.start;
        
        // Calculate new range based on zoom direction
        const newRange = deltaY > 0 ? 
            currentRange * this.zoomFactor : // Zoom out
            currentRange / this.zoomFactor;  // Zoom in
        
        // Set minimum and maximum zoom ranges
        const minRange = 100;   // Minimum 100nm range
        const maxRange = 2000; // Maximum 2000nm range
        
        if (newRange >= minRange && newRange <= maxRange) {
            // Calculate the percentage position of the cursor
            const cursorPercent = (wavelengthAtCursor - this.displayRange.start) / currentRange;
            
            // Calculate new start and end keeping cursor position stable
            let newStart = wavelengthAtCursor - (newRange * cursorPercent);
            let newEnd = newStart + newRange;
            
            // Enforce absolute limits
            if (newStart < 200) {
                newStart = 200;
                newEnd = newStart + newRange;
            }
            if (newEnd > 2000) {
                newEnd = 2000;
                newStart = newEnd - newRange;
            }
            
            this.displayRange.start = newStart;
            this.displayRange.end = newEnd;
            
            // Update the input fields
            this.updateDisplayRangeInputs();
            
            this.draw();
        }
    }

    updateDisplayRangeInputs() {
        const startInput = document.getElementById('rangeStart');
        const endInput = document.getElementById('rangeEnd');
        
        startInput.value = Math.round(this.displayRange.start);
        endInput.value = Math.round(this.displayRange.end);
    }

    calculateSensorRange() {
        const { point1, point2 } = this.calibration;
        
        // Calculate wavelength per pixel
        const wavelengthPerPixel = (point2.wavelength - point1.wavelength) / 
                                 (point2.x - point1.x);
        
        // Calculate wavelength at x=0 and x=1920
        const startWavelength = point1.wavelength - (point1.x * wavelengthPerPixel);
        const endWavelength = startWavelength + (1920 * wavelengthPerPixel);
        
        return {
            start: Math.round(startWavelength * 100) / 100,
            end: Math.round(endWavelength * 100) / 100
        };
    }

    exportToCSV() {
        // Check if we're paused and have data to export
        if (this.data.length === 0) {
            alert('No data available to export');
            return;
        }

        // Create CSV header
        let csvContent = "Pixel Position,Wavelength (nm),Raw Intensity (0-1),QE Corrected Intensity (0-1)\n";

        // Calculate wavelength per pixel
        const wavelengthStep = (this.calibration.point2.wavelength - this.calibration.point1.wavelength) / 
                             (this.calibration.point2.x - this.calibration.point1.x);
        const startWavelength = this.calibration.point1.wavelength - 
                              (this.calibration.point1.x * wavelengthStep);

        // Generate data rows using current data (which will be from the paused frame if paused)
        for (let i = 0; i < this.data.length; i++) {
            const pixelPos = Math.round((i / this.data.length) * 1920);
            const wavelength = startWavelength + (pixelPos * wavelengthStep);
            
            csvContent += `${pixelPos},${wavelength.toFixed(2)},${this.rawData[i].toFixed(6)},${this.data[i].toFixed(6)}\n`;
        }

        // Create filename with timestamp and paused indicator
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `spectrum_${timestamp}.csv`;

        // Create and trigger download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    // Add new method to handle canvas resizing
    resizeCanvas() {
        const container = this.canvas.parentElement;
        const containerWidth = container.clientWidth - 20; // Account for padding
        this.canvas.width = containerWidth;
        this.draw();
    }

    // Add helper method for creating spectrum gradient
    createSpectrumGradient(gradient) {
        const totalRange = this.displayRange.end - this.displayRange.start;
        
        // Add UV region (gray)
        gradient.addColorStop(0, '#808080');
        const visibleStartPos = (this.visibleRange.start - this.displayRange.start) / totalRange;
        gradient.addColorStop(Math.max(0, visibleStartPos), '#808080');

        // Add visible spectrum
        if (visibleStartPos < 1 && (this.visibleRange.end - this.displayRange.start) / totalRange > 0) {
            gradient.addColorStop(Math.max(0, visibleStartPos), 'violet');
            gradient.addColorStop(Math.min(1, (450 - this.displayRange.start) / totalRange), 'blue');
            gradient.addColorStop(Math.min(1, (500 - this.displayRange.start) / totalRange), 'cyan');
            gradient.addColorStop(Math.min(1, (550 - this.displayRange.start) / totalRange), 'green');
            gradient.addColorStop(Math.min(1, (600 - this.displayRange.start) / totalRange), 'yellow');
            gradient.addColorStop(Math.min(1, (650 - this.displayRange.start) / totalRange), 'orange');
            gradient.addColorStop(Math.min(1, (this.visibleRange.end - this.displayRange.start) / totalRange), 'red');
        }

        // Add IR region (gray)
        const visibleEndPos = (this.visibleRange.end - this.displayRange.start) / totalRange;
        gradient.addColorStop(Math.min(1, visibleEndPos), '#808080');
        gradient.addColorStop(1, '#808080');
    }

    // Add this method to the Spectragraph class
    getCurrentData() {
        // Ensure we have valid data arrays
        if (!this.data || !this.rawData) {
            console.warn('Spectragraph: No data available');
            return null;
        }

        // Make sure arrays are the same length
        const length = Math.min(this.data.length, this.rawData.length);
        
        return {
            raw: Array.from({ length }, (_, i) => this.rawData[i] || 0),
            corrected: Array.from({ length }, (_, i) => this.data[i] || 0),
            length: length
        };
    }
}

export const spectragraph = new Spectragraph(document.getElementById('spectragraph'));
export default Spectragraph; 