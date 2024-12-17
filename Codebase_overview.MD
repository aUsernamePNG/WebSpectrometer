# Spectrometer Codebase Overview

## Core Architecture

### Module Structure
```
Core Modules
├── Input (camera.js)
├── Processing (imageProcessor.js)
├── Visualization (spectragraph.js)
├── Control (main.js)
└── Export (recordingManager.js)

Extension Points
├── Input Handlers
├── Processing Pipelines
├── Visualization Layers
└── Export Formats
```

## Core Modules

### 1. Input Module (`camera.js`)
```
Base Functionality
├── Device Management
│   ├── Device enumeration
│   └── Stream control
├── Frame Capture
│   ├── Raw frame acquisition
│   └── Format conversion
└── Extension Points
    ├── Custom input sources
    └── Pre-processing filters
```

### 2. Processing Module (`imageProcessor.js`)
```
Base Functionality
├── Region Processing
│   ├── ROI extraction
│   └── Intensity calculation
├── Wavelength Mapping
│   ├── Calibration
│   └── Conversion
└── Extension Points
    ├── Custom processing pipelines
    ├── Additional corrections
    └── Analysis algorithms
```

### 3. Visualization Module (`spectragraph.js`)
```
Base Functionality
├── Display Engine
│   ├── Grid system
│   └── Spectrum plotting
├── Interaction Handler
│   ├── Zoom/Pan
│   └── Data inspection
└── Extension Points
    ├── Custom overlays
    ├── Additional visualizations
    └── Interactive tools
```

### 4. Control Module (`main.js`)
```
Base Functionality
├── Module Coordination
│   ├── Initialization
│   └── Communication
├── Event Management
│   ├── UI events
│   └── Data flow
└── Extension Points
    ├── Custom workflows
    ├── Additional controls
    └── State management
```

### 5. Export Module (`recordingManager.js`)
```
Base Functionality
├── Data Export
│   ├── CSV generation
│   └── Frame capture
├── Recording
│   ├── Video recording
│   └── Data logging
└── Extension Points
    ├── Custom formats
    ├── Export processors
    └── Metadata handlers
```

## Data Flow Interfaces

### Input Interface
```javascript
/**
 * @interface InputSource
 * Base interface for all input sources
 * 
 * @method initialize - Initializes the input source
 * @method getFrame - Returns the current frame as ImageData
 * @method getMetadata - Returns metadata about the current frame
 */
class InputSource {
    async initialize() {}
    getFrame() { return new ImageData(1920, 1080); }
    getMetadata() { return {}; }
}
```

### Processing Interface
```javascript
/**
 * @interface ProcessingPipeline
 * Base interface for all processing pipelines
 * 
 * @method processFrame - Processes a single frame
 * @method applyCorrections - Applies corrections to spectral data
 */
class ProcessingPipeline {
    processFrame(frame) { return { wavelengths: [], intensities: [] }; }
    applyCorrections(data) { return data; }
}
```

### Visualization Interface
```javascript
/**
 * @interface VisualizationLayer
 * Base interface for all visualization layers
 * 
 * @method draw - Renders the layer to the canvas context
 * @method handleInteraction - Handles user interaction events
 */
class VisualizationLayer {
    draw(context) {}
    handleInteraction(event) {}
}
```

### Export Interface
```javascript
/**
 * @interface ExportHandler
 * Base interface for all export handlers
 * 
 * @method formatData - Formats spectral data for export
 * @method generateOutput - Generates the output file
 */
class ExportHandler {
    formatData(data) { return data; }
    generateOutput(format) {}
}
```

## Extension Guidelines

### Adding New Input Sources
1. Implement `InputSource` interface
2. Register with Input Module
3. Add necessary UI controls
4. Handle source-specific metadata

### Creating Processing Pipelines
1. Implement `ProcessingPipeline` interface
2. Define correction algorithms
3. Add pipeline configuration
4. Register with Processing Module

### Developing Visualization Features
1. Implement `VisualizationLayer` interface
2. Define rendering methods
3. Add interaction handlers
4. Register with Visualization Module

### Adding Export Formats
1. Implement `ExportHandler` interface
2. Define format conversion
3. Add export controls
4. Register with Export Module

## State Management

### Core State
```javascript
/**
 * Core application state structure
 * @typedef {Object} CoreState
 * @property {Object} inputConfig - Input device configuration
 * @property {Object} processingConfig - Processing pipeline settings
 * @property {Object} displayConfig - Display and visualization settings
 * @property {Object} exportConfig - Export format configuration
 */
const coreState = {
    inputConfig: {},
    processingConfig: {},
    displayConfig: {},
    exportConfig: {}
};
```

### Module State
- Each module maintains its internal state
- State changes propagate through event system
- Modules can subscribe to relevant state updates

### Event System
```javascript
/**
 * Event types enumeration
 * @enum {string}
 */
const EventType = {
    INPUT_CHANGED: 'input_changed',
    PROCESSING_UPDATED: 'processing_updated',
    DISPLAY_CHANGED: 'display_changed',
    EXPORT_REQUESTED: 'export_requested'
    // Extensible for new features
};
```

### Event Handling
- Centralized event bus in Control Module
- Modular event subscription
- Async event processing support

## Performance Optimization Points

### Input Optimization
- Frame rate control
- Resolution adaptation
- Buffer management

### Processing Optimization
- Worker thread processing
- Batch processing
- Memory pooling

### Display Optimization
- Canvas layer management
- Render throttling
- WebGL acceleration

### Export Optimization
- Streaming export
- Compression
- Background processing

## Development Workflow

### Adding New Features
1. Identify target module
2. Implement required interfaces
3. Add necessary UI elements
4. Register with core system
5. Add documentation
6. Update tests

### Module Integration
1. Define module interface
2. Implement state management
3. Add event handlers
4. Register extension points
5. Update documentation

## Testing Framework

### Test Categories
```
Tests
├── Unit Tests
│   ├── Module functions
│   └── Interface compliance
├── Integration Tests
│   ├── Module interaction
│   └── Data flow
└── Extension Tests
    ├── Plugin compatibility
    └── Performance impact
```
