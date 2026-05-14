declare module '@cornerstonejs/codec-openjpeg' {
  interface ImageFrame {
    rows: number;
    columns: number;
    samplesPerPixel: number;
    bitsAllocated: number;
    pixelData: Uint8Array | Uint16Array | Uint32Array;
  }

  export function decode(arrayBuffer: ArrayBuffer): ImageFrame;
}
