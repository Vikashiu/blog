
export const playPcmAudio = (
  base64Audio: string, 
  onEnded?: () => void,
  sampleRate: number = 24000
): { ctx: AudioContext, source: AudioBufferSourceNode } => {
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  const ctx = new AudioContextClass({ sampleRate });
  
  // Base64 decoding
  const binaryString = atob(base64Audio);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  // PCM decoding (Int16 -> Float32)
  // Gemini 2.5 Flash TTS returns raw PCM 16-bit
  const pcm16 = new Int16Array(bytes.buffer);
  const audioBuffer = ctx.createBuffer(1, pcm16.length, sampleRate);
  const channelData = audioBuffer.getChannelData(0);
  
  for (let i = 0; i < pcm16.length; i++) {
    // Normalize 16-bit integer to float [-1.0, 1.0]
    channelData[i] = pcm16[i] / 32768.0;
  }
  
  const source = ctx.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(ctx.destination);
  
  source.onended = () => {
    if (onEnded) onEnded();
    // Close context to release hardware resources when done
    if (ctx.state !== 'closed') {
        ctx.close().catch(console.error);
    }
  };
  
  source.start(0);
  
  return { ctx, source };
};
