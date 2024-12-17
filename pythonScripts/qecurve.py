#!/usr/bin/env python3
"""
CMOS Sensor Quantum Efficiency Curve Generator

This script generates and plots quantum efficiency curves for CMOS sensors from CSV data.
It can also interpolate and export QE values at specified wavelength intervals.

Usage:
    Basic usage (uses default input/output files):
        python qecurve.py

    Specify custom input/output files:
        python qecurve.py --input sensor_data.csv --output-plot custom_plot.png

    Generate interpolated CSV with custom interval:
        python qecurve.py --output-csv interpolated_qe.csv --interval 0.5

    Generate data for specific wavelength range:
        python qecurve.py --output-csv custom_range.csv --min-wavelength 400 --max-wavelength 800

Arguments:
    --input           : Input CSV file path (default: omnivisionQE.csv)
    --output-plot     : Output plot file path (default: cmos_qe_curve.png)
    --output-csv      : Output interpolated CSV file path (optional)
    --interval        : Wavelength interval in nm for CSV output (default: 1.0)
    --min-wavelength  : Minimum wavelength for CSV output (optional)
    --max-wavelength  : Maximum wavelength for CSV output (optional)

Input CSV Format:
    The input CSV should have two columns:
    - "Wavelength (nm)" : Wavelength values in nanometers
    - "Quantum Efficiency" : QE values (0-1 range)
"""

import numpy as np
import matplotlib.pyplot as plt
from scipy.interpolate import make_interp_spline
import argparse
import pandas as pd

def load_qe_data(csv_file):
    """Load QE data from CSV file"""
    df = pd.read_csv(csv_file)
    wavelengths = df['Wavelength (nm)'].values
    qe_values = df['Quantum Efficiency'].values
    return wavelengths, qe_values

def plot_qe_curve(wavelengths, qe_values, output_file='cmos_qe_curve.png'):
    """Plot QE curve with the provided data"""
    # Create figure with appropriate size
    plt.figure(figsize=(12, 8))
    
    # Plot actual data points
    plt.scatter(wavelengths, qe_values, color='red', label='Measured Points', zorder=5)
    
    # Generate points for smooth curve
    X_smooth = np.linspace(wavelengths.min(), wavelengths.max(), 1000)
    
    # Create smooth spline fit with lower degree spline
    spl = make_interp_spline(wavelengths, qe_values, k=2)
    qe_smooth = spl(X_smooth)
    
    # Ensure no negative values
    qe_smooth = np.maximum(qe_smooth, 0)
    
    # Plot the smooth curve
    plt.plot(X_smooth, qe_smooth, 'b-', label='Fitted QE Curve', zorder=1)
    
    # Customize the plot
    plt.title('CMOS Sensor Quantum Efficiency Curve', fontsize=14, pad=15)
    plt.xlabel('Wavelength (nm)', fontsize=12)
    plt.ylabel('Quantum Efficiency', fontsize=12)
    
    # Set axis ranges with some padding
    plt.xlim(wavelengths.min() - 50, wavelengths.max() + 50)
    plt.ylim(0, max(qe_values) * 1.1)
    
    # Add grid
    plt.grid(True, linestyle='--', alpha=0.7, zorder=0)
    
    # Add legend
    plt.legend(fontsize=10)
    
    # Add text box with peak QE
    peak_qe = np.max(qe_values)
    peak_wavelength = wavelengths[np.argmax(qe_values)]
    text = f'Peak QE: {peak_qe:.2f} at {peak_wavelength}nm'
    plt.text(0.02, 0.98, text, transform=plt.gca().transAxes, 
             bbox=dict(facecolor='white', alpha=0.8, edgecolor='none'),
             verticalalignment='top', fontsize=10)
    
    # Adjust layout
    plt.tight_layout()
    
    # Save the plot
    plt.savefig(output_file, dpi=300, bbox_inches='tight')
    
    # Display the plot
    plt.show()

def calculate_qe_at_wavelength(wavelength, wavelengths, qe_values):
    """Calculate QE at any given wavelength using the spline interpolation"""
    spl = make_interp_spline(wavelengths, qe_values, k=2)
    return float(spl(wavelength))

def calculate_interpolated_values(wavelengths, qe_values, interval, min_wavelength=None, max_wavelength=None):
    """Calculate QE values at specified wavelength intervals"""
    # Use data range if not specified
    min_wavelength = min_wavelength if min_wavelength is not None else wavelengths.min()
    max_wavelength = max_wavelength if max_wavelength is not None else wavelengths.max()
    
    # Create wavelength range from min to max with specified interval
    wavelength_range = np.arange(min_wavelength, max_wavelength + interval, interval)
    
    # Create spline interpolation
    spl = make_interp_spline(wavelengths, qe_values, k=2)
    
    # Calculate QE values
    qe_interpolated = spl(wavelength_range)
    
    # Ensure no negative values
    qe_interpolated = np.maximum(qe_interpolated, 0)
    
    return wavelength_range, qe_interpolated

def save_to_csv(wavelengths, qe_values, interval, output_file, wavelength_min=None, wavelength_max=None):
    """Save the wavelength and QE values to a CSV file with optional range extension"""
    # Get interpolated values
    wavelength_range, qe_interpolated = calculate_interpolated_values(
        wavelengths, qe_values, interval, wavelength_min, wavelength_max
    )
    
    # Create and save DataFrame
    df = pd.DataFrame({
        'Wavelength (nm)': wavelength_range,
        'Quantum Efficiency': qe_interpolated
    })
    df.to_csv(output_file, index=False)
    print(f"Data saved to {output_file}")

def main():
    # Set up argument parsing
    parser = argparse.ArgumentParser(description='Generate QE curve and optionally save to CSV')
    parser.add_argument('--input', type=str, default='omnivisionQE.csv',
                      help='Input CSV file with QE data (default: omnivisionQE.csv)')
    parser.add_argument('--output-plot', type=str, default='cmos_qe_curve.png',
                      help='Output plot file path (default: cmos_qe_curve.png)')
    parser.add_argument('--output-csv', type=str, help='Output interpolated CSV file path')
    parser.add_argument('--interval', type=float, default=1.0, 
                      help='Wavelength interval in nm for CSV output (default: 1.0)')
    parser.add_argument('--min-wavelength', type=float, help='Minimum wavelength for CSV output')
    parser.add_argument('--max-wavelength', type=float, help='Maximum wavelength for CSV output')
    args = parser.parse_args()

    # Load QE data from CSV
    wavelengths, qe_values = load_qe_data(args.input)

    # Plot the QE curve
    plot_qe_curve(wavelengths, qe_values, args.output_plot)
    
    # If CSV output is requested
    if args.output_csv:
        save_to_csv(wavelengths, qe_values, args.interval, args.output_csv, 
                   args.min_wavelength, args.max_wavelength)
    
    # Example: Calculate QE at specific wavelengths
    test_wavelengths = [425, 575, 725]
    print("\nQuantum Efficiency at specific wavelengths:")
    for wl in test_wavelengths:
        qe = calculate_qe_at_wavelength(wl, wavelengths, qe_values)
        print(f"QE at {wl}nm: {qe:.3f}")

if __name__ == "__main__":
    main() 