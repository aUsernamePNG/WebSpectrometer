#!/usr/bin/env python3
import csv
import numpy as np
import matplotlib.pyplot as plt
import pandas as pd
import argparse
import os

# Set up argument parsing
parser = argparse.ArgumentParser(description='Process a CSV file for synthetic spectrum generation.')
parser.add_argument('filename', type=str, help='The CSV file containing the data')
args = parser.parse_args()

# Use the provided filename
filename = args.filename

# Parameters for the synthetic spectrum
start_nm = 200.0
end_nm = 1500.0
step_nm = 0.1
wavelengths = np.arange(start_nm, end_nm + step_nm, step_nm)

# Define a Gaussian broadening function
fwhm = 1.0  # nm, adjust as needed
sigma = fwhm / (2.0 * np.sqrt(2.0 * np.log(2.0)))

# Using pandas for convenience
df = pd.read_csv(filename)

# Extract observed wavelength and intensities
# If intens is stored as string with quotes, we may need to clean it.
df['intens'] = df['intens'].astype(str).str.replace('="','').str.replace('"','')
df['intens'] = pd.to_numeric(df['intens'], errors='coerce').fillna(1.0)  # If no intensity, assume 1.0 or skip

df['obs_wl_air(nm)'] = df['obs_wl_air(nm)'].astype(str).str.replace('="','').str.replace('"','')
df['obs_wl_air(nm)'] = pd.to_numeric(df['obs_wl_air(nm)'], errors='coerce')

line_data = df[['obs_wl_air(nm)', 'intens']].dropna().values.tolist()

# Build the spectrum by adding each line with a Gaussian profile
spectrum = np.zeros_like(wavelengths)

for wl_line, intensity in line_data:
    # Gaussian line shape centered at wl_line
    gauss = intensity * np.exp(-0.5 * ((wavelengths - wl_line) / sigma)**2)
    spectrum += gauss

# Normalize spectrum
max_intensity = np.max(spectrum)
if max_intensity > 0:
    spectrum /= max_intensity

# Plot the spectrum
plt.figure(figsize=(10,6))
plt.plot(wavelengths, spectrum, color='blue', linewidth=1)
plt.title("Synthetic Argon Spectrum from NIST Data")
plt.xlabel("Wavelength (nm)")
plt.ylabel("Normalized Intensity (0-1)")
plt.xlim([200,1500])
plt.grid(True)
plt.show()

# If desired, write the final spectrum to a CSV
output_filename = "argon_synth_spectrum.csv"
with open(output_filename, mode='w', newline='') as f:
    writer = csv.writer(f)
    writer.writerow(["Wavelength (nm)", "Normalized Intensity"])
    for wl, intens in zip(wavelengths, spectrum):
        writer.writerow([wl, intens])

print(f"Synthetic spectrum saved to {output_filename}")
