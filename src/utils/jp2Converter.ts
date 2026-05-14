/**
 * Utility to convert JP2 (JPEG 2000) images to JPG format for browser compatibility.
 * Uses @cornerstonejs/codec-openjpeg (Emscripten-compiled OpenJPEG WASM).
 */

let openJpegModule: any = null;

async function initOpenJpeg() {
  if (!openJpegModule) {
    try {
      // Import the Cornerstone OpenJPEG codec - it exports a promise
      const OpenJPEGJS = await import('@cornerstonejs/codec-openjpeg');
      // The default export is the WASM module promise
      openJpegModule = await OpenJPEGJS.default;
      console.log('[JP2] OpenJPEG WASM module loaded');
    } catch (error) {
      console.error('Failed to load OpenJPEG WASM:', error);
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
    const openjpeg = await initOpenJpeg();
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
    const encodedData = new Uint8Array(arrayBuffer);
    console.log('[JP2] Fetched', encodedData.length, 'bytes');

    // Create decoder and set up encoded buffer
    let decoder;
    try {
      decoder = new openjpeg.J2KDecoder();
    } catch (error) {
      console.error('[JP2] Failed to create decoder:', error);
      throw new Error(`Could not create J2K decoder: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Set the encoded data
    const encodedBuffer = decoder.getEncodedBuffer(encodedData.length);
    encodedBuffer.set(encodedData);

    // Read header to get image info
    try {
      decoder.readHeader();
    } catch (error) {
      console.error('[JP2] Failed to read header:', error);
      throw new Error(`Could not read JP2 header: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Get frame info (width, height, channels)
    let frameInfo;
    try {
      frameInfo = decoder.getFrameInfo();
    } catch (error) {
      console.error('[JP2] Failed to get frame info:', error);
      throw new Error(`Could not get frame info: ${error instanceof Error ? error.message : String(error)}`);
    }

    console.log('[JP2] Image info:', {
      width: frameInfo.width,
      height: frameInfo.height,
      numComps: frameInfo.numComps,
      bitsPerSample: frameInfo.bitsPerSample
    });

    // Decode the image
    try {
      decoder.decode();
    } catch (error) {
      console.error('[JP2] Failed to decode:', error);
      throw new Error(`Could not decode JP2: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Get decoded buffer
    const decodedBuffer = decoder.getDecodedBuffer();
    console.log('[JP2] Decoded buffer size:', decodedBuffer.byteLength, 'bytes');

    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.width = frameInfo.width;
    canvas.height = frameInfo.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    // Create image data
    const imageData = ctx.createImageData(frameInfo.width, frameInfo.height);
    const data = imageData.data;

    // Convert decoded data to RGBA
    // Decoded data is typically in the format determined by numComps and bitsPerSample
    const pixelCount = frameInfo.width * frameInfo.height;
    const decodedView = new Uint8Array(decodedBuffer);

    console.log('[JP2] Converting pixel data, components:', frameInfo.numComps);

    if (frameInfo.numComps === 1) {
      // Grayscale - expand to RGB
      for (let i = 0; i < pixelCount; i++) {
        const grayValue = decodedView[i];
        data[i * 4] = grayValue;     // R
        data[i * 4 + 1] = grayValue; // G
        data[i * 4 + 2] = grayValue; // B
        data[i * 4 + 3] = 255;       // A
      }
    } else if (frameInfo.numComps === 3) {
      // RGB - add alpha
      for (let i = 0; i < pixelCount; i++) {
        data[i * 4] = decodedView[i * 3];         // R
        data[i * 4 + 1] = decodedView[i * 3 + 1]; // G
        data[i * 4 + 2] = decodedView[i * 3 + 2]; // B
        data[i * 4 + 3] = 255;                    // A
      }
    } else if (frameInfo.numComps === 4) {
      // RGBA - copy directly
      for (let i = 0; i < pixelCount && i * 4 + 3 < decodedView.length; i++) {
        data[i * 4] = decodedView[i * 4];     // R
        data[i * 4 + 1] = decodedView[i * 4 + 1]; // G
        data[i * 4 + 2] = decodedView[i * 4 + 2]; // B
        data[i * 4 + 3] = decodedView[i * 4 + 3]; // A
      }
    } else {
      throw new Error(`Unsupported number of components: ${frameInfo.numComps}`);
    }

    // Put image data on canvas
    try {
      ctx.putImageData(imageData, 0, 0);
    } catch (error) {
      console.error('[JP2] putImageData failed:', error);
      throw new Error(`putImageData failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Convert canvas to JPG
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
        0.95
      );
    });
  } catch (error) {
    console.error('[JP2] Conversion failed:', error);
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
