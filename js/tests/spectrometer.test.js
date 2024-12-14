class SpectrometerTest {
    constructor() {
        this.testFrame = null;
        this.imageProcessor = null;
        this.spectragraph = null;
    }

    async setup() {
        // Create test canvas and context
        const testCanvas = document.createElement('canvas');
        testCanvas.width = 960;
        testCanvas.height = 300;
        
        // Initialize components
        this.spectragraph = new Spectragraph(testCanvas);
        this.imageProcessor = new ImageProcessor(testCanvas);
        this.imageProcessor.setSpectragraph(this.spectragraph);
        
        // Load test frame
        await this.loadTestFrame('test_frame.png');
    }

    async loadTestFrame(filename) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                this.testFrame = ctx.getImageData(0, 0, img.width, img.height);
                resolve();
            };
            img.onerror = reject;
            img.src = filename;
        });
    }

    runTests() {
        this.testQEProfiles();
        this.testCalibration();
        this.testPeakDetection();
        this.testWavelengthMapping();
        this.testIntensityNormalization();
    }

    testQEProfiles() {
        console.log('Testing QE Profiles...');
        
        // Test no QE correction
        this.imageProcessor.setQEProfile('none');
        const qe1 = this.imageProcessor.getQuantumEfficiency(500);
        console.assert(qe1 === 1, 'No QE correction should return 1');

        // Test generated profile
        this.imageProcessor.setQEProfile('generated');
        const qe2 = this.imageProcessor.getQuantumEfficiency(500);
        console.assert(qe2 > 0 && qe2 <= 100, 'Generated QE should be between 0-100');
    }

    testCalibration() {
        console.log('Testing Calibration...');
        
        // Test with known calibration points
        this.spectragraph.updateCalibration(
            {x: 1623, wavelength: 405.4},
            {x: 1238, wavelength: 611.6}
        );

        // Process test frame
        this.imageProcessor.processImageData(this.testFrame);

        // Check wavelength mapping
        const range = this.spectragraph.calculateSensorRange();
        console.assert(range.start > 200 && range.end < 1500, 
            'Sensor range should be reasonable');
    }

    testPeakDetection() {
        console.log('Testing Peak Detection...');
        
        // Process frame and check for known Argon peaks
        this.imageProcessor.processImageData(this.testFrame);
        
        const knownPeaks = [696.54, 706.72, 750.38, 763.51, 800.61, 810.36, 912.29];
        knownPeaks.forEach(wavelength => {
            const peak = this.spectragraph.findNearestPeak(
                this.spectragraph.wavelengthToX(wavelength)
            );
            console.assert(peak !== null, `Should detect peak near ${wavelength}nm`);
        });
    }

    testWavelengthMapping() {
        console.log('Testing Wavelength Mapping...');
        
        // Test wavelength to pixel conversion
        const testWavelength = 500;
        const x = this.spectragraph.wavelengthToX(testWavelength);
        const mappedWavelength = this.spectragraph.xToWavelength(x);
        console.assert(Math.abs(testWavelength - mappedWavelength) < 1, 
            'Wavelength mapping should be reversible');
    }

    testIntensityNormalization() {
        console.log('Testing Intensity Normalization...');
        
        this.imageProcessor.processImageData(this.testFrame);
        
        // Check if intensities are properly normalized
        const maxIntensity = Math.max(...this.spectragraph.data);
        console.assert(maxIntensity <= 1.0, 'Intensities should be normalized to 1');
    }
} 