
This script processes line data from the NIST Atomic Spectra Database (ASD) for Argon (Ar)
and generates a synthetic emission spectrum over a specified wavelength range. It also 
provides a feature to visualize the spectrum using matplotlib.

## Overview

1. **Input Data**: 
   The script expects a CSV file exported from the NIST ASD. The CSV should contain 
   columns such as:
   - `obs_wl_air(nm)`: Observed line wavelength in air (nm)
   - `intens`: Relative line intensity or a measure that can be used as intensity
   - Additional columns (Ei, Ek, terms, J values, etc.) are also included but not essential 
     for basic spectrum generation.

   Example input format (simplified):