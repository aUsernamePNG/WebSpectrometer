#!/usr/bin/env python3
import cv2
import numpy as np
import matplotlib.pyplot as plt
import argparse

def process_graph(image_path):
    """
    Processes the graph image to extract blue pixel intensities and normalize them.

    Parameters:
        image_path (str): Path to the image file.

    Returns:
        normalized_amplitude (list): List of normalized amplitudes (0-1).
        x_values (list): Corresponding x-axis values.
    """
    # Load the image
    image = cv2.imread(image_path)
    if image is None:
        raise ValueError(f"Image not found or cannot be opened at path: {image_path}")

    # Convert the image to the HSV color space for better color filtering
    hsv_image = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)

    # Define the blue color range for filtering
    lower_blue = np.array([100, 150, 50])
    upper_blue = np.array([140, 255, 255])

    # Create a mask to isolate blue regions
    mask = cv2.inRange(hsv_image, lower_blue, upper_blue)

    # Find the coordinates of the blue pixels
    blue_pixels = np.where(mask > 0)
    y_coords, x_coords = blue_pixels[0], blue_pixels[1]

    # Invert y-coordinates to match the graph's orientation
    height = image.shape[0]
    y_coords = height - y_coords

    # Combine x and y into pairs and sort by x-axis for sequential data
    data_points = sorted(zip(x_coords, y_coords))
    x_sorted, y_sorted = zip(*data_points) if data_points else ([], [])

    if not data_points:
        raise ValueError("No blue pixels found in the image")

    # Normalize the y-values based on their range (0-1)
    min_y = min(y_sorted)
    max_y = max(y_sorted)
    normalized_amplitude = [(y - min_y) / (max_y - min_y) for y in y_sorted]

    return normalized_amplitude, x_sorted

def main():
    # Set up argument parsing
    parser = argparse.ArgumentParser(description='Process a graph image and normalize the data.')
    parser.add_argument('image_path', type=str, help='Path to the graph image file')
    parser.add_argument('--output', type=str, help='Output CSV file path', default='normalized_graph_data.csv')
    parser.add_argument('--show-plot', action='store_true', help='Display the normalized plot')
    args = parser.parse_args()

    try:
        # Process the image
        normalized_amplitude, x_values = process_graph(args.image_path)

        # Save the data to a CSV file
        import pandas as pd
        data = pd.DataFrame({"X": x_values, "Normalized Amplitude": normalized_amplitude})
        data.to_csv(args.output, index=False)
        print(f"Normalized data saved to '{args.output}'")

        # Plot if requested
        if args.show_plot:
            plt.figure(figsize=(10, 6))
            plt.plot(x_values, normalized_amplitude)
            plt.title("Normalized Graph")
            plt.xlabel("X-axis")
            plt.ylabel("Normalized Amplitude (0-1)")
            plt.grid(True)
            plt.show()

    except Exception as e:
        print(f"Error: {str(e)}")
        return 1

    return 0

if __name__ == "__main__":
    exit(main())
