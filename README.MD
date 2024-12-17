# Browser-Based Spectrometer Data Acquisition Tool

A real-time data processing tool for USB CMOS detector-based spectrometers that runs entirely in the browser. This tool provides live spectrum visualization, data analysis, and export capabilities.

## Features

- Real-time spectrum visualization from USB camera input
- Two-point wavelength calibration system
- Interactive spectrum display with zoom and pan
- Data export in CSV format
- Frame capture and download capabilities
- QE (Quantum Efficiency) correction support
- Support for both live video and static image analysis

## System Requirements

- Modern web browser with WebRTC support
- USB CMOS camera/spectrometer
- Recommended resolution: 1920x1080 pixels

## Quick Start

1. Connect your USB spectrometer/camera
2. Open index.html in a modern web browser
3. Select your camera from the dropdown
4. Perform wavelength calibration using known spectral lines
5. Start analyzing your spectrum

## Core Components

- **Camera Interface**: Handles USB camera input and frame capture
- **Image Processor**: Converts raw frame data to spectral information
- **Spectragraph**: Manages spectrum visualization and interaction
- **Recording Manager**: Handles data recording and export functions

## Usage

### Basic Operation
1. Select camera source
2. Set region of interest (ROI)
3. Perform wavelength calibration
4. View real-time spectrum

### Calibration
1. Input known wavelength points (e.g., 405.4nm and 611.6nm)
2. Mark corresponding pixel positions
3. Apply calibration

### Data Export
- Export spectrum data as CSV
- Download individual frames as PNG
- Record video with spectral data

## Development

The project is structured in modules:
- `camera.js`: Camera input handling
- `imageProcessor.js`: Frame processing and analysis
- `spectragraph.js`: Spectrum visualization
- `main.js`: Application coordination
- `recordingManager.js`: Data recording and export

## License

MIT