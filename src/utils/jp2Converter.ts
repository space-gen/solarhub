/**
 * Utility to convert JP2 (JPEG 2000) images to JPG format for browser compatibility.
 * This is needed because browsers don't have native support for JP2 format.
 */

// Using dynamic import with fallback for CommonJS module
let JpxImage: any = null;

async function initJpx() {
  if (!JpxImage) {
    try {
      // Import jpx.js - it exports a CommonJS module
      const jpxModule = await import('jpx.js');
      JpxImage = jpxModule.default;
    } catch (error) {
      console.error('Failed to load jpx.js module:', error);
      throw error;
    }
  }
  return JpxImage;
}

/**
 * Checks if a URL points to a JP2 image
 */
export function isJp2Image(url: string): boolean {
  return url.toLowerCase().endsWith('.jp2') || url.toLowerCase().includes('.jp2?');
}

/**
 * Converts a JP2 image to a JPG blob for display in the browser
 * @param jp2Url - URL to the JP2 file
 * @returns Promise that resolves to an object URL for JPG data
 */
export async function convertJp2ToJpg(jp2Url: string): Promise<string> {
  try {
    const Jpx = await initJpx();

    // Fetch the JP2 file
    const response = await fetch(jp2Url);
    if (!response.ok) {
      throw new Error(`Failed to fetch JP2 image: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Decode JP2 using jpx.js
    const jpxImage = new Jpx(uint8Array);

    // Get image dimensions
    const width = jpxImage.width;
    const height = jpxImage.height;

    // Create canvas for conversion
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    // Get image data from jpx
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    // Get the decoded image data from jpx
    const jpxImageData = jpxImage.getData({ width, height });

    // Fill the canvas image data with the JP2 image data
    if (jpxImageData && jpxImageData.length > 0) {
      for (let i = 0; i < jpxImageData.length; i++) {
        data[i] = jpxImageData[i];
      }
    }

    ctx.putImageData(imageData, 0, 0);

    // Convert canvas to JPG blob and create object URL
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(URL.createObjectURL(blob));
          } else {
            reject(new Error('Failed to create blob from canvas'));
          }
        },
        'image/jpeg',
        0.95 // Quality setting
      );
    });
  } catch (error) {
    console.error('JP2 conversion error:', error);
    throw error;
  }
}

/**
 * Gets the display URL for an image, converting JP2 to JPG if needed
 * Converts JP2 images on-the-fly for browser compatibility
 * @param imageUrl - Original image URL
 * @returns Promise that resolves to a displayable image URL
 */
export async function getDisplayUrl(imageUrl: string): Promise<string> {
  if (isJp2Image(imageUrl)) {
    try {
      return await convertJp2ToJpg(imageUrl);
    } catch (error) {
      console.error('Failed to convert JP2 image, falling back to original URL:', error);
      // Return original URL as fallback
      return imageUrl;
    }
  }

  // Return original URL for non-JP2 images
  return imageUrl;
}
