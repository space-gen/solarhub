declare module '@cornerstonejs/codec-openjpeg' {
  interface FrameInfo {
    width: number;
    height: number;
    numComps: number;
    bitsPerSample: number;
    isJP2: number;
    isSigned: number;
  }

  interface J2KDecoder {
    getEncodedBuffer(length: number): Uint8Array;
    getDecodedBuffer(): ArrayBuffer;
    readHeader(): void;
    decode(): void;
    getFrameInfo(): FrameInfo;
  }

  interface OpenJPEGModule {
    J2KDecoder: new () => J2KDecoder;
  }

  const defaultExport: Promise<OpenJPEGModule>;
  export default defaultExport;
}
