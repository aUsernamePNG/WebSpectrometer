# Spectrometer Technical Documentation

## Overview
The spectrometer application processes live video feed or static images to analyze spectral data. It works by analyzing a selected region of the image/video and converting pixel intensities to spectral information based on calibration points.

## Core Components

### 1. Video Capture System
- Captures live video feed at 1920x1080 resolution
- Uses `MediaDevices` API to access camera
- Supports both webcam for testing and external USB cameras
- Video feed is displayed in a 960x540 viewport while maintaining aspect ratio

### 2. Region Selection
- User defines a rectangular region of interest (ROI)
- ROI is defined by four parameters:
  - startX: left edge (0-1920)
  - stopX: right edge (0-1920)
  - startY: top edge (0-1080)
  - stopY: bottom edge (0-1080)
- Default ROI is a horizontal strip suitable for spectral analysis

### 3. Spectral Processing
- For each frame:
  1. Extract ROI from video frame
  2. Average pixel intensities vertically for each column
  3. Convert to normalized values (0-1)
  4. Apply wavelength calibration
  5. Apply QE (Quantum Efficiency) correction if enabled

### 4. Wavelength Calibration
- Uses two-point calibration system
- Each point consists of:
  - x: pixel position (0-1920)
  - wavelength: corresponding wavelength in nanometers
- Linear interpolation between points:  ```
  wavelength = startWavelength + (x * wavelengthPerPixel)
  wavelengthPerPixel = (point2.wavelength - point1.wavelength) / (point2.x - point1.x)  ```

### 5. Display System
- Real-time graph showing:
  - X-axis: wavelength (nm)
  - Y-axis: normalized intensity (0-1)
- Interactive features:
  - Mouse wheel zoom
  - Hover information (wavelength and intensity)
  - Adjustable display range
  - Visual spectrum overlay

### 6. Data Export
- CSV format with columns:
  - Wavelength (nm)
  - Raw Intensity
  - Corrected Intensity (with QE)
- PNG capture with:
  - Current frame
  - ROI overlay
  - Timestamp
  - Calibration info

### 7. QE Correction
- Optional intensity correction based on sensor response
- Supports multiple QE profiles:
  - Default profile
  - Custom calibration profiles
- Linear interpolation between calibration points

## Data Flow
1. Video Frame → ROI Selection
2. ROI → Column Averaging
3. Averaged Data → Wavelength Mapping
4. Mapped Data → QE Correction
5. Corrected Data → Display/Export

## Performance Considerations
- Frame processing should complete within 16ms (60 FPS)
- Use requestAnimationFrame for smooth updates
- Canvas operations optimized for real-time display
- Efficient data structures for spectral processing

## Error Handling
- Camera access failures
- Invalid calibration points
- Out-of-range display values
- File I/O errors
- Invalid ROI selections

## Future Improvements
- Dark frame subtraction
- Multiple ROI support
- Non-linear wavelength calibration
- Advanced filtering options
- Reference spectrum overlay

## Aditional features:
- Recording spectrometer data to CSV with aditional option to record raw video along with csv 
-add backend with support for saving spectra csv data and frame data
-add automatic calibration using reference spectra for a calibration source with inital support of an Argon spectrum tube
-Build spectroradiometeric calibration tool what uses monochrometer with known intensites at each wavelenth to perfrom quantum efficentcy curve calcual;tion 