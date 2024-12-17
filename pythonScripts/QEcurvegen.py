import numpy as np
from scipy.optimize import curve_fit
import matplotlib.pyplot as plt

def fit_qe_curve(wavelength, qe_data):
    """
    Fits quantum efficiency curve for monochrome CMOS sensor
    
    Parameters:
    wavelength: array of wavelengths in nm
    qe_data: array of QE values in percentage
    
    Returns:
    popt: optimal parameters [amplitude, peak_wavelength, width]
    fitted_curve: fitted QE values
    """
    def qe_model(x, amplitude, peak_wavelength, width):
        return amplitude * np.exp(-((x - peak_wavelength) ** 2) / (2 * width ** 2))
    
    # Initial parameter guesses
    p0 = [np.max(qe_data), 550, 100]
    
    # Fit the curve
    popt, _ = curve_fit(qe_model, wavelength, qe_data, p0=p0)
    
    # Generate fitted curve
    fitted_curve = qe_model(wavelength, *popt)
    
    # Plot results
    plt.figure(figsize=(10, 6))
    plt.scatter(wavelength, qe_data, label='Measured Data')
    plt.plot(wavelength, fitted_curve, 'r-', label='Fitted Curve')
    plt.xlabel('Wavelength (nm)')
    plt.ylabel('Quantum Efficiency (%)')
    plt.title('CMOS Sensor QE Curve Fit')
    plt.legend()
    plt.grid(True)
    plt.show()
    
    return popt, fitted_curve