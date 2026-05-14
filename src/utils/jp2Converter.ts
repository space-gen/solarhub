/**
 * Utility to convert JP2 (JPEG 2000) images to JPG format for browser compatibility.
 * This is needed because browsers don't have native support for JP2 format.
 * Uses @cornerstonejs/codec-openjpeg for better browser compatibility.
 */

let openJpegModule: any = null;

async function initOpenJpeg() {
  if (!openJpegModule) {
    try {
      // Import the Cornerstone OpenJPEG codec
      const module = await import('@cornerstonejs/codec-openjpeg');
      openJpegModule = module;
      console.log('[JP2] OpenJPEG codec loaded');
    } catch (error) {
      console.error('Failed to load OpenJPEG codec:', error);
      throw error;
    }
  }
  return openJpegModule;
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
    const codec = await initOpenJpeg();
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
    console.log('[JP2] Fetched', arrayBuffer.byteLength, 'bytes');

    // Decode JP2 using Cornerstone OpenJPEG
    let imageFrame;
    try {
      // Cornerstone codec expects the data as the only argument
      const decoder = codec.decode(arrayBuffer);
      imageFrame = decoder;
    } catch (decodeError) {
      console.error('[JP2] Decoding failed:', decodeError);
      throw new Error(`JP2 decode error: ${decodeError instanceof Error ? decodeError.message : String(decodeError)}`);
    }
    
    console.log('[JP2] Decoded image, size:', {
      rows: imageFrame.rows,
      columns: imageFrame.columns,
      samplesPerPixel: imageFrame.samplesPerPixel,
      bitsAllocated: imageFrame.bitsAllocated,
      pixelData: imageFrame.pixelData?.length
    });

    // Create canvas for conversion
    const canvas = document.createElement('canvas');
    canvas.width = imageFrame.columns;
    canvas.height = imageFrame.rows;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    // Get image data from frame
    const imageData = ctx.createImageData(imageFrame.columns, imageFrame.rows);
    const data = imageData.data;
    const pixelData = imageFrame.pixelData;

    // Fill the canvas image data with the pixel data
    if (pixelData && pixelData.length > 0) {
      const pixelCount = imageFrame.columns * imageFrame.rows;
      const channels = pixelData.length / pixelCount;
      console.log('[JP2] Detected channels:', channels);
      
      if (channels === 1) {
        // Grayscale data - replicate to RGB, set A to 255
        for (let i = 0; i < pixelCount; i++) {
          const grayValue = pixelData[i];
          data[i * 4] = grayValue;     // R
          data[i * 4 + 1] = grayValue; // G
          data[i * 4 + 2] = grayValue; // B
          data[i * 4 + 3] = 255;       // A (opaque)
        }
      } else if (channels === 3) {
        // RGB data - set A to 255 for each pixel
        for (let i = 0; i < pixelCount; i++) {
          data[i * 4] = pixelData[i * 3];           // R
          data[i * 4 + 1] = pixelData[i * 3 + 1];   // G
          data[i * 4 + 2] = pixelData[i * 3 + 2];   // B
          data[i * 4 + 3] = 255;                    // A (opaque)
        }
      } else if (channels === 4) {
        // RGBA data - copy directly
        for (let i = 0; i < pixelData.length; i++) {
          data[i] = pixelData[i];
        }
      } else {
        // Fallback: copy directly as before
        console.log('[JP2] Using fallback channel handling for', channels, 'channels');
        for (let i = 0; i < Math.min(pixelData.length, data.length); i++) {
          data[i] = pixelData[i];
        }
      }
    } else {
      throw new Error('No pixel data returned from JP2 decoder');
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
