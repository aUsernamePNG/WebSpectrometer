class SpectrometerDevice {
    constructor() {
        this.device = null;
        this.info = {};
    }

    async connect() {
        try {
            // Request USB device with appropriate filters
            this.device = await navigator.usb.requestDevice({
                filters: [
                    { vendorId: 0x0000 }  // Replace with actual vendor ID
                ]
            });

            await this.device.open();
            await this.getDeviceInfo();
            return true;
        } catch (error) {
            console.error('USB Connection error:', error);
            return false;
        }
    }

    async getDeviceInfo() {
        if (!this.device) return null;

        this.info = {
            manufacturer: this.device.manufacturerName,
            product: this.device.productName,
            serialNumber: this.device.serialNumber,
            vendorId: this.device.vendorId,
            productId: this.device.productId,
            version: this.device.deviceVersionMajor + '.' + 
                    this.device.deviceVersionMinor + '.' + 
                    this.device.deviceVersionSubminor
        };

        return this.info;
    }

    displayInfo() {
        const infoDiv = document.getElementById('deviceInfo');
        if (!infoDiv) return;

        infoDiv.innerHTML = `
            <h3>Device Information</h3>
            <p>Manufacturer: ${this.info.manufacturer || 'Unknown'}</p>
            <p>Product: ${this.info.product || 'Unknown'}</p>
            <p>Serial Number: ${this.info.serialNumber || 'Unknown'}</p>
            <p>Version: ${this.info.version || 'Unknown'}</p>
        `;
    }
} 