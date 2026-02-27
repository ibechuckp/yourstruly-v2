/**
 * PersonaPlex Opus Decoder Worker
 * 
 * Handles decoding of Opus audio from Ogg containers received from PersonaPlex server.
 * 
 * Messages:
 * - { command: 'init', bufferLength, decoderSampleRate, outputBufferSampleRate, resampleQuality }
 * - { command: 'decode', pages: Uint8Array }
 * - { command: 'reset' }
 */

// Worker state
let decoderSampleRate = 24000;
let outputSampleRate = 48000;
let isInitialized = false;

/**
 * Simple linear resampler
 */
function resample(input, fromRate, toRate) {
  if (fromRate === toRate) return input;
  
  const ratio = fromRate / toRate;
  const outputLength = Math.floor(input.length / ratio);
  const output = new Float32Array(outputLength);
  
  for (let i = 0; i < outputLength; i++) {
    const srcIdx = i * ratio;
    const srcIdxFloor = Math.floor(srcIdx);
    const srcIdxCeil = Math.min(srcIdxFloor + 1, input.length - 1);
    const t = srcIdx - srcIdxFloor;
    
    // Linear interpolation
    output[i] = input[srcIdxFloor] * (1 - t) + input[srcIdxCeil] * t;
  }
  
  return output;
}

/**
 * Parse Ogg page and extract Opus payload
 */
function parseOggPage(page) {
  // Check minimum size and OggS magic
  if (page.length < 27) return { payload: null, isHeader: false };
  if (page[0] !== 0x4F || page[1] !== 0x67 || page[2] !== 0x67 || page[3] !== 0x53) {
    return { payload: null, isHeader: false };
  }
  
  // Check for header flags (BOS = 0x02)
  const headerType = page[5];
  const isBOS = (headerType & 0x02) !== 0;
  
  // Get segment count and table
  const numSegments = page[26];
  const segmentTable = page.slice(27, 27 + numSegments);
  const dataOffset = 27 + numSegments;
  
  // Calculate total payload size
  let totalSize = 0;
  for (let i = 0; i < numSegments; i++) {
    totalSize += segmentTable[i];
  }
  
  // Extract payload
  const payload = page.slice(dataOffset, dataOffset + totalSize);
  
  // Check for OpusHead or OpusTags (header pages)
  let isOpusHead = false;
  let isOpusTags = false;
  
  if (payload.length >= 8) {
    let sig = '';
    for (let i = 0; i < 8; i++) {
      sig += String.fromCharCode(payload[i]);
    }
    isOpusHead = sig === 'OpusHead';
    isOpusTags = sig === 'OpusTags';
  }
  
  return {
    payload: (isOpusHead || isOpusTags) ? null : payload,
    isHeader: isBOS || isOpusHead || isOpusTags
  };
}

/**
 * Decode raw PCM from payload (PersonaPlex sends pre-decoded audio as float32)
 */
function decodePayload(payload) {
  if (payload.length === 0 || payload.length % 4 !== 0) return null;
  
  // PersonaPlex audio is mono float32 at 24kHz
  const float32 = new Float32Array(
    payload.buffer,
    payload.byteOffset,
    payload.length / 4
  );
  
  // Resample if needed
  if (decoderSampleRate !== outputSampleRate) {
    return resample(float32, decoderSampleRate, outputSampleRate);
  }
  
  // Return a copy to avoid detached buffer issues
  return new Float32Array(float32);
}

/**
 * Handle messages from main thread
 */
self.onmessage = function(event) {
  const message = event.data;
  
  switch (message.command) {
    case 'init': {
      decoderSampleRate = message.decoderSampleRate || 24000;
      outputSampleRate = message.outputBufferSampleRate || 48000;
      isInitialized = true;
      console.log('[Decoder Worker] Initialized', { decoderSampleRate, outputSampleRate });
      break;
    }
    
    case 'decode': {
      if (!isInitialized) {
        console.warn('[Decoder Worker] Not initialized, dropping packet');
        return;
      }
      
      const pages = message.pages;
      const { payload, isHeader } = parseOggPage(pages);
      
      if (isHeader) {
        // Skip header pages
        return;
      }
      
      if (payload) {
        const samples = decodePayload(payload);
        if (samples && samples.length > 0) {
          // Send decoded samples back (transfer ownership for performance)
          self.postMessage([samples], [samples.buffer]);
        }
      }
      break;
    }
    
    case 'reset': {
      console.log('[Decoder Worker] Reset');
      break;
    }
    
    default:
      console.warn('[Decoder Worker] Unknown command:', message.command);
  }
};

// Signal that worker is ready
console.log('[Decoder Worker] Started');
