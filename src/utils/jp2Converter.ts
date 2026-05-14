/**
 * Utility to convert JP2 (JPEG 2000) images to JPG format for browser compatibility.
 * This is needed because browsers don't have native support for JP2 format.
 */

let JpxImage: any = null;

async function initJpx() {
  if (!JpxImage) {
    try {
      // Import jpx.js - it's a UMD module that works with both CommonJS and ES6
      const jpxModule = await import('jpx.js');
      // jpx.js exports as default
      JpxImage = jpxModule.default || jpxModule;
      
      console.log('[JP2] jpx.js loaded, type:', typeof JpxImage);
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
    const JpxConstructor = await initJpx();
    console.log('[JP2] Starting conversion for:', jp2Url);

    // Fetch the JP2 file with CORS
    const response = await fetch(jp2Url, {
      method: 'GET',
      mode: 'cors',
      credentials: 'omit',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch JP2 image: ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    console.log('[JP2] Fetched', uint8Array.length, 'bytes');

    // Decode JP2 using jpx.js
    let jpxImage;
    try {
      jpxImage = new JpxConstructor(uint8Array);
    } catch (decodeError) {
      console.error('[JP2] Decoding failed:', decodeError);
      throw new Error(`JP2 decode error: ${decodeError instanceof Error ? decodeError.message : String(decodeError)}`);
    }
    
    console.log('[JP2] Decoded image dimensions:', jpxImage.width, 'x', jpxImage.height);

    // Get image dimensions
    const width = jpxImage.width;
    const height = jpxImage.height;

    if (!width || !height) {
      throw new Error('Invalid JP2 image dimensions');
    }

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
    let jpxImageData;
    try {
      jpxImageData = jpxImage.getData({ width, height });
    } catch (getDataError) {
      console.error('[JP2] getData failed:', getDataError);
      throw new Error(`JP2 getData error: ${getDataError instanceof Error ? getDataError.message : String(getDataError)}`);
    }
    
    console.log('[JP2] Image data length:', jpxImageData?.length || 'null');

    // Fill the canvas image data with the JP2 image data
    if (jpxImageData && jpxImageData.length > 0) {
      // Check if data is grayscale (length = width*height) or multi-channel (length = width*height*channels)
      const pixelCount = width * height;
      const channelCount = jpxImageData.length / pixelCount;
      console.log('[JP2] Detected channels:', channelCount);
      
      if (channelCount === 1) {
        // Grayscale data - replicate to RGB, set A to 255
        for (let i = 0; i < pixelCount; i++) {
          const grayValue = jpxImageData[i];
          data[i * 4] = grayValue;     // R
          data[i * 4 + 1] = grayValue; // G
          data[i * 4 + 2] = grayValue; // B
          data[i * 4 + 3] = 255;       // A (opaque)
        }
      } else if (channelCount === 3) {
        // RGB data - set A to 255 for each pixel
        for (let i = 0; i < pixelCount; i++) {
          data[i * 4] = jpxImageData[i * 3];       // R
          data[i * 4 + 1] = jpxImageData[i * 3 + 1]; // G
          data[i * 4 + 2] = jpxImageData[i * 3 + 2]; // B
          data[i * 4 + 3] = 255;                    // A (opaque)
        }
      } else if (channelCount === 4) {
        // RGBA data - copy directly
        for (let i = 0; i < jpxImageData.length; i++) {
          data[i] = jpxImageData[i];
        }
      } else {
        // Fallback: copy directly as before
        console.log('[JP2] Using fallback channel handling for', channelCount, 'channels');
        for (let i = 0; i < Math.min(jpxImageData.length, data.length); i++) {
          data[i] = jpxImageData[i];
        }
      }
    } else {
      throw new Error('No image data returned from JP2 decoder');
    }

    try {
      ctx.putImageData(imageData, 0, 0);
    } catch (putError) {
      console.error('[JP2] putImageData failed:', putError);
      throw new Error(`putImageData error: ${putError instanceof Error ? putError.message : String(putError)}`);
    }

    // Convert canvas to JPG blob and create object URL
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            console.log('[JP2] Conversion successful, blob size:', blob.size);
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
