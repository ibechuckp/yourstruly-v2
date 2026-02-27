/**
 * PersonaPlex Audio Processor - Moshi-style buffered playback
 * 
 * This AudioWorklet processor handles real-time audio playback from PersonaPlex
 * with adaptive buffering to handle network jitter while maintaining low latency.
 * 
 * Based on NVIDIA's PersonaPlex client implementation.
 */

// Helper functions
function asMs(samples, sampleRate) {
  return (samples * 1000 / sampleRate).toFixed(1);
}

function asSamples(ms, sampleRate) {
  return Math.round(ms * sampleRate / 1000);
}

class PersonaPlexProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    
    console.log('PersonaPlex processor initialized', currentFrame, sampleRate);
    
    // Buffer length definitions (in samples)
    const frameSize = asSamples(80, sampleRate); // 80ms frames
    
    // initialBufferSamples: we wait to have at least that many samples before starting to play
    this.initialBufferSamples = 1 * frameSize;
    
    // once we have enough samples, we further wait that long before starting to play.
    // This allows to have buffer lengths that are not a multiple of frameSize.
    this.partialBufferSamples = asSamples(10, sampleRate);
    
    // If the buffer length goes over that many, we will drop the oldest packets until
    // we reach back initialBufferSamples + partialBufferSamples.
    this.maxBufferSamples = asSamples(10, sampleRate);
    
    // Increments for adaptive buffering
    this.partialBufferIncrement = asSamples(5, sampleRate);
    this.maxPartialWithIncrements = asSamples(80, sampleRate);
    this.maxBufferSamplesIncrement = asSamples(5, sampleRate);
    this.maxMaxBufferWithIncrements = asSamples(80, sampleRate);
    
    // Initialize state
    this.initState();
    
    // Handle messages from main thread
    this.port.onmessage = (event) => {
      if (event.data.type === 'reset') {
        console.log('Reset audio processor state');
        this.initState();
        return;
      }
      
      const frame = event.data.frame;
      if (!frame || !(frame instanceof Float32Array)) {
        console.warn('Invalid frame received');
        return;
      }
      
      this.frames.push(frame);
      
      if (this.currentSamples() >= this.initialBufferSamples && !this.started) {
        this.start();
      }
      
      // Debug logging for first few packets
      if (this.packetIndex < 20) {
        console.log(
          this.timestamp(),
          'Got packet',
          this.packetIndex++,
          asMs(this.currentSamples(), sampleRate),
          asMs(frame.length, sampleRate)
        );
      }
      
      // Handle buffer overflow - drop oldest packets
      if (this.currentSamples() >= this.totalMaxBufferSamples()) {
        console.log(
          this.timestamp(),
          'Dropping packets',
          asMs(this.currentSamples(), sampleRate),
          asMs(this.totalMaxBufferSamples(), sampleRate)
        );
        
        const target = this.initialBufferSamples + this.partialBufferSamples;
        while (this.currentSamples() > target) {
          const first = this.frames[0];
          const toRemove = Math.min(
            first.length - this.offsetInFirstBuffer,
            this.currentSamples() - target
          );
          this.offsetInFirstBuffer += toRemove;
          this.timeInStream += toRemove / sampleRate;
          
          if (this.offsetInFirstBuffer === first.length) {
            this.frames.shift();
            this.offsetInFirstBuffer = 0;
          }
        }
        
        console.log(
          this.timestamp(),
          'Packets dropped',
          asMs(this.currentSamples(), sampleRate)
        );
        
        // Increase max buffer to handle future jitter
        this.maxBufferSamples = Math.min(
          this.maxBufferSamples + this.maxBufferSamplesIncrement,
          this.maxMaxBufferWithIncrements
        );
        console.log('Increased maxBuffer to', asMs(this.maxBufferSamples, sampleRate));
      }
      
      // Calculate and report delay
      const delay = this.currentSamples() / sampleRate;
      this.port.postMessage({
        totalAudioPlayed: this.totalAudioPlayed,
        actualAudioPlayed: this.actualAudioPlayed,
        delay: (event.data.micDuration || 0) - this.timeInStream,
        minDelay: this.minDelay,
        maxDelay: this.maxDelay,
        bufferSamples: this.currentSamples(),
        bufferMs: asMs(this.currentSamples(), sampleRate),
      });
    };
  }
  
  initState() {
    this.frames = [];
    this.offsetInFirstBuffer = 0;
    this.firstOut = false;
    this.remainingPartialBufferSamples = 0;
    this.timeInStream = 0;
    this.started = false;
    
    // Metrics
    this.totalAudioPlayed = 0;
    this.actualAudioPlayed = 0;
    this.maxDelay = 0;
    this.minDelay = 2000;
    
    // Debug
    this.packetIndex = 0;
    
    // Reset buffer params
    this.partialBufferSamples = asSamples(10, sampleRate);
    this.maxBufferSamples = asSamples(10, sampleRate);
  }
  
  totalMaxBufferSamples() {
    return this.maxBufferSamples + this.partialBufferSamples + this.initialBufferSamples;
  }
  
  timestamp() {
    return Date.now() % 1000;
  }
  
  currentSamples() {
    let samples = 0;
    for (let i = 0; i < this.frames.length; i++) {
      samples += this.frames[i].length;
    }
    samples -= this.offsetInFirstBuffer;
    return samples;
  }
  
  start() {
    this.started = true;
    this.remainingPartialBufferSamples = this.partialBufferSamples;
    this.firstOut = true;
  }
  
  canPlay() {
    return this.started && this.frames.length > 0 && this.remainingPartialBufferSamples <= 0;
  }
  
  process(inputs, outputs, parameters) {
    const output = outputs[0]?.[0];
    if (!output) return true;
    
    // Track delay statistics when playing
    const delay = this.currentSamples() / sampleRate;
    if (this.canPlay()) {
      this.maxDelay = Math.max(this.maxDelay, delay);
      this.minDelay = Math.min(this.minDelay, delay);
    }
    
    // If we can't play, just track time and wait
    if (!this.canPlay()) {
      if (this.actualAudioPlayed > 0) {
        this.totalAudioPlayed += output.length / sampleRate;
      }
      this.remainingPartialBufferSamples -= output.length;
      return true;
    }
    
    // Log first output
    if (this.firstOut) {
      console.log(
        this.timestamp(),
        'Audio resumed',
        asMs(this.currentSamples(), sampleRate),
        this.remainingPartialBufferSamples
      );
    }
    
    // Copy audio from buffer to output
    let outIdx = 0;
    while (outIdx < output.length && this.frames.length > 0) {
      const first = this.frames[0];
      const toCopy = Math.min(
        first.length - this.offsetInFirstBuffer,
        output.length - outIdx
      );
      
      output.set(
        first.subarray(this.offsetInFirstBuffer, this.offsetInFirstBuffer + toCopy),
        outIdx
      );
      
      this.offsetInFirstBuffer += toCopy;
      outIdx += toCopy;
      
      if (this.offsetInFirstBuffer === first.length) {
        this.offsetInFirstBuffer = 0;
        this.frames.shift();
      }
    }
    
    // Apply fade-in on first output to avoid clicks
    if (this.firstOut) {
      this.firstOut = false;
      for (let i = 0; i < outIdx; i++) {
        output[i] *= i / outIdx;
      }
    }
    
    // Handle buffer underrun
    if (outIdx < output.length) {
      console.log(this.timestamp(), 'Missed some audio', output.length - outIdx);
      
      // Increase partial buffer for next time
      this.partialBufferSamples = Math.min(
        this.partialBufferSamples + this.partialBufferIncrement,
        this.maxPartialWithIncrements
      );
      console.log('Increased partial buffer to', asMs(this.partialBufferSamples, sampleRate));
      
      // Revert to waiting state to replenish buffer
      this.started = false;
      
      // Apply fade-out to avoid clicks
      for (let i = 0; i < outIdx; i++) {
        output[i] *= (outIdx - i) / outIdx;
      }
    }
    
    // Update metrics
    this.totalAudioPlayed += output.length / sampleRate;
    this.actualAudioPlayed += outIdx / sampleRate;
    this.timeInStream += outIdx / sampleRate;
    
    return true;
  }
}

registerProcessor('personaplex-processor', PersonaPlexProcessor);
