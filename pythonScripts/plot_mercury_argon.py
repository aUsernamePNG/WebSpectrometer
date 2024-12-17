import matplotlib.pyplot as plt
import numpy as np

def read_spectrum_data(filename):
    wavelengths = []
    intensities = []
    data_section = False
    
    with open(filename, 'r') as file:
        for line in file:
            if '>>>>>Begin Spectral Data<<<<<' in line:
                data_section = True
                continue
            if data_section:
                try:
                    wavelength, intensity = map(float, line.strip().split('\t'))
                    wavelengths.append(wavelength)
                    intensities.append(intensity)
                except ValueError:
                    continue
    
    return np.array(wavelengths), np.array(intensities)

def plot_spectrum(wavelengths, intensities):
    plt.figure(figsize=(12, 6))
    
    # Plot the spectrum
    plt.plot(wavelengths, intensities, 'b-', linewidth=1, label='Mercury-Argon Spectrum')
    
    # Customize the plot
    plt.title('Mercury-Argon Emission Spectrum', fontsize=14, pad=15)
    plt.xlabel('Wavelength (nm)', fontsize=12)
    plt.ylabel('Intensity (counts)', fontsize=12)
    
    # Add grid
    plt.grid(True, linestyle='--', alpha=0.7)
    
    # Add legend
    plt.legend(fontsize=10)
    
    # Adjust layout
    plt.tight_layout()
    
    # Save the plot
    plt.savefig('mercury_argon_spectrum.png', dpi=300, bbox_inches='tight')
    
    # Display the plot
    plt.show()

def main():
    # Read data from file
    filename = 'Mercury-Argog_Spectrum.txt'
    wavelengths, intensities = read_spectrum_data(filename)
    
    # Plot the spectrum
    plot_spectrum(wavelengths, intensities)

if __name__ == "__main__":
    main() 