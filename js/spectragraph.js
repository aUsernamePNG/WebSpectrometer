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
        if (!canvas) {
            console.error('Spectragraph: Canvas element is required');
            return;
        }
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.data = [];
        this.rawData = [];
        this.calibration = {
            point1: { x: 1623, wavelength: 405.4 },
            point2: { x: 1238, wavelength: 611.6 }
        };
        this.displayRange = {
            start: 350,
            end: 1200
        };
        this.showCalibrationLines = true;
        this.isReversed = false;
        this.mousePosition = null;
        
        // Initialize the graph
        this.draw();
        
        // Add event listeners
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
        this.canvas.addEventListener('wheel', this.handleWheel.bind(this));
    }

    updateSpectralData(spectralData) {
        if (!spectralData || !Array.isArray(spectralData)) {
            console.warn('Invalid spectral data provided');
            return;
        }

        // Store the data
        this.data = spectralData.map(d => ({
            wavelength: d.wavelength,
            intensity: d.intensity
        }));

        this.rawData = spectralData.map(d => ({
            wavelength: d.wavelength,
            intensity: d.rawIntensity
        }));

        // Redraw the graph
        this.draw();
    }

    draw() {
        if (!this.ctx || !this.canvas) return;

        // Clear the canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid
        this.drawGrid();

        // Draw data if available
        if (this.data && this.data.length > 0) {
            this.drawSpectrum();
        }

        // Draw calibration lines if enabled
        if (this.showCalibrationLines) {
            this.drawCalibrationLines();
        }
    }

    drawSpectrum() {
        const { width, height } = this.canvas;
        
        if (!this.data || this.data.length === 0) {
            console.warn('No data to draw spectrum');
            return;
        }

        // Filter data to visible range and sort by wavelength
        const visibleData = this.data
            .filter(d => d.wavelength >= this.displayRange.start && 
                        d.wavelength <= this.displayRange.end)
            .sort((a, b) => a.wavelength - b.wavelength);

        if (visibleData.length < 2) {
            console.warn('Not enough visible data points to draw spectrum');
            return;
        }

        // Draw the spectrum line
        this.ctx.beginPath();
        this.ctx.strokeStyle = '#00ff00';
        this.ctx.lineWidth = 1;

        visibleData.forEach((point, i) => {
            const x = this.wavelengthToX(point.wavelength);
            const y = height * (1 - point.intensity);
            
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        });

        this.ctx.stroke();
    }

    wavelengthToX(wavelength) {
        const { width } = this.canvas;
        const range = this.displayRange.end - this.displayRange.start;
        const position = (wavelength - this.displayRange.start) / range;
        return this.isReversed ? width * (1 - position) : width * position;
    }

    exportToCSV() {
        if (!this.data || !this.data.length === 0 || !this.rawData) {
            console.warn('No data available to export');
            return;
        }

        try {
            // Create CSV content
            const csvRows = [
                'Wavelength (nm),Intensity (%),Raw Intensity (%)'
            ];

            // Add data rows
            for (let i = 0; i < this.data.length; i++) {
                const wavelength = this.data[i].wavelength.toFixed(2);
                const intensity = (this.data[i].intensity * 100).toFixed(2);
                const rawIntensity = (this.rawData[i].intensity * 100).toFixed(2);
                csvRows.push(`${wavelength},${intensity},${rawIntensity}`);
            }

            // Create and download the file
            const csvContent = csvRows.join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            link.href = URL.createObjectURL(blob);
            link.download = `spectrum-${timestamp}.csv`;
            link.click();
            URL.revokeObjectURL(link.href);
        } catch (error) {
            console.error('Error exporting CSV:', error);
        }
    }

    drawGrid() {
        const { width, height } = this.canvas;
        this.ctx.strokeStyle = '#444';
        this.ctx.lineWidth = 0.5;

        // Draw vertical grid lines (wavelength)
        const wavelengthStep = 50;
        const firstWavelength = Math.ceil(this.displayRange.start / wavelengthStep) * wavelengthStep;
        for (let wavelength = firstWavelength; wavelength <= this.displayRange.end; wavelength += wavelengthStep) {
            const x = this.wavelengthToX(wavelength);
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, height);
            this.ctx.stroke();

            // Draw wavelength labels
            this.ctx.fillStyle = '#888';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`${wavelength}`, x, height - 5);
        }

        // Draw horizontal grid lines (intensity)
        for (let i = 0; i <= 1; i += 0.2) {
            const y = height * (1 - i);
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(width, y);
            this.ctx.stroke();

            // Draw intensity labels
            this.ctx.fillStyle = '#888';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'right';
            this.ctx.fillText(`${Math.round(i * 100)}%`, 25, y + 5);
        }
    }

    drawCalibrationLines() {
        if (!this.showCalibrationLines) return;

        const { height } = this.canvas;
        const points = [this.calibration.point1, this.calibration.point2];

        this.ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([5, 5]);

        points.forEach((point, index) => {
            if (point.wavelength >= this.displayRange.start && 
                point.wavelength <= this.displayRange.end) {
                
                const x = this.wavelengthToX(point.wavelength);
                
                // Draw vertical line
                this.ctx.beginPath();
                this.ctx.moveTo(x, 0);
                this.ctx.lineTo(x, height);
                this.ctx.stroke();

                // Draw label
                this.ctx.fillStyle = 'red';
                this.ctx.font = 'bold 12px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(`Cal ${index + 1}: ${point.wavelength.toFixed(1)}nm`, x, 20);
            }
        });

        this.ctx.setLineDash([]); // Reset dash pattern
    }

    handleMouseMove(event) {
        const rect = this.canvas.getBoundingClientRect();
        this.mousePosition = {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
        this.draw();
    }

    handleMouseLeave() {
        this.mousePosition = null;
        this.draw();
    }

    handleWheel(event) {
        event.preventDefault();
        const zoomFactor = 1.1;
        const direction = event.deltaY > 0 ? 1 : -1;
        const range = this.displayRange.end - this.displayRange.start;
        const mouseX = event.offsetX;
        const wavelengthAtMouse = this.displayRange.start + (mouseX / this.canvas.width) * range;

        // Calculate new range
        const newRange = direction > 0 ? range * zoomFactor : range / zoomFactor;
        if (newRange < 50 || newRange > 2000) return; // Limit zoom range

        // Calculate new start and end wavelengths
        const mouseRatio = mouseX / this.canvas.width;
        const newStart = wavelengthAtMouse - (mouseRatio * newRange);
        const newEnd = newStart + newRange;

        // Update display range
        this.displayRange = {
            start: Math.max(200, newStart),
            end: Math.min(2000, newEnd)
        };

        this.draw();
    }

    // ... rest of existing methods ...
}

export const spectragraph = new Spectragraph(document.getElementById('spectragraph'));
export default Spectragraph; 