// src/components/audio/BinauralBeatPlayer.tsx (Enhanced Version)
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

const TARGET_BINAURAL_FREQ = 40; // 40 Hz beat (Gamma range)
// Lowered base frequency for a potentially more relaxing tone
const BASE_FREQUENCY = 120;      // Changed from 160Hz - Experiment with values like 100, 120, 140
const INITIAL_VOLUME_LEVEL = 0.05; // Initial low volume
const RAMP_TIME_SECONDS = 0.2;   // Slightly longer fade for smoother start/stop

// Filter settings - adjust these to taste
const FILTER_FREQUENCY = 800;    // Cutoff frequency in Hz (e.g., 600-1000 Hz)
const FILTER_Q = 1;              // Quality factor (resonance), 1 is typically neutral

export function BinauralBeatPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  // State for master volume (0 to 1)
  const [masterVolume, setMasterVolume] = useState(INITIAL_VOLUME_LEVEL);

  // Refs for Web Audio API objects
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorLeftRef = useRef<OscillatorNode | null>(null);
  const oscillatorRightRef = useRef<OscillatorNode | null>(null);
  const gainLeftRef = useRef<GainNode | null>(null); // Individual gain for fades
  const gainRightRef = useRef<GainNode | null>(null);// Individual gain for fades
  const filterLeftRef = useRef<BiquadFilterNode | null>(null);
  const filterRightRef = useRef<BiquadFilterNode | null>(null);
  const pannerLeftRef = useRef<StereoPannerNode | null>(null);
  const pannerRightRef = useRef<StereoPannerNode | null>(null);
  const masterGainRef = useRef<GainNode | null>(null); // Master volume control

  // Function to create and start the audio nodes
  const startAudio = useCallback(() => {
    // Initialize AudioContext if it doesn't exist
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      // Create the master gain node only once with the context
      masterGainRef.current = audioContextRef.current.createGain();
      masterGainRef.current.gain.setValueAtTime(masterVolume, audioContextRef.current.currentTime);
      masterGainRef.current.connect(audioContextRef.current.destination);
    }
    const audioCtx = audioContextRef.current;
    const masterGain = masterGainRef.current; // Use the persistent master gain

    if (!masterGain) { // Should not happen, but safety check
      console.error("Master Gain Node not initialized");
      return;
    }

    // Resume context if suspended
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const freqLeft = BASE_FREQUENCY - TARGET_BINAURAL_FREQ / 2;
    const freqRight = BASE_FREQUENCY + TARGET_BINAURAL_FREQ / 2;
    const now = audioCtx.currentTime;

    // --- Left Channel ---
    oscillatorLeftRef.current = audioCtx.createOscillator();
    filterLeftRef.current = audioCtx.createBiquadFilter();
    gainLeftRef.current = audioCtx.createGain();
    pannerLeftRef.current = audioCtx.createStereoPanner();

    const oscLeft = oscillatorLeftRef.current;
    const filterLeft = filterLeftRef.current;
    const gainLeft = gainLeftRef.current;
    const pannerLeft = pannerLeftRef.current;

    oscLeft.frequency.setValueAtTime(freqLeft, now);
    oscLeft.type = 'sine';
    filterLeft.type = 'lowpass';
    filterLeft.frequency.setValueAtTime(FILTER_FREQUENCY, now);
    filterLeft.Q.setValueAtTime(FILTER_Q, now);
    pannerLeft.pan.setValueAtTime(-1, now); // Pan left
    gainLeft.gain.setValueAtTime(0.0001, now); // Start silent
    gainLeft.gain.exponentialRampToValueAtTime(1.0, now + RAMP_TIME_SECONDS); // Ramp gain to 1 (master controls volume)

    // Chain: Oscillator -> Filter -> Gain (for fade) -> Panner -> Master Gain -> Destination
    oscLeft.connect(filterLeft).connect(gainLeft).connect(pannerLeft).connect(masterGain);
    oscLeft.start(now);

    // --- Right Channel ---
    oscillatorRightRef.current = audioCtx.createOscillator();
    filterRightRef.current = audioCtx.createBiquadFilter();
    gainRightRef.current = audioCtx.createGain();
    pannerRightRef.current = audioCtx.createStereoPanner();

    const oscRight = oscillatorRightRef.current;
    const filterRight = filterRightRef.current;
    const gainRight = gainRightRef.current;
    const pannerRight = pannerRightRef.current;

    oscRight.frequency.setValueAtTime(freqRight, now);
    oscRight.type = 'sine';
    filterRight.type = 'lowpass';
    filterRight.frequency.setValueAtTime(FILTER_FREQUENCY, now);
    filterRight.Q.setValueAtTime(FILTER_Q, now);
    pannerRight.pan.setValueAtTime(1, now); // Pan right
    gainRight.gain.setValueAtTime(0.0001, now); // Start silent
    gainRight.gain.exponentialRampToValueAtTime(1.0, now + RAMP_TIME_SECONDS); // Ramp gain to 1

    // Chain: Oscillator -> Filter -> Gain (for fade) -> Panner -> Master Gain -> Destination
    oscRight.connect(filterRight).connect(gainRight).connect(pannerRight).connect(masterGain);
    oscRight.start(now);

  }, [masterVolume]); // Depend on masterVolume to set initial gain correctly

  // Function to stop audio nodes smoothly
  const stopAudio = useCallback(() => {
    const audioCtx = audioContextRef.current;
    const gainLeft = gainLeftRef.current;
    const gainRight = gainRightRef.current;
    const oscLeft = oscillatorLeftRef.current;
    const oscRight = oscillatorRightRef.current;

    if (audioCtx && gainLeft && gainRight && oscLeft && oscRight) {
      const now = audioCtx.currentTime;
      const stopTime = now + RAMP_TIME_SECONDS;

      // Ramp down individual gains to prevent clicks
      gainLeft.gain.setValueAtTime(gainLeft.gain.value, now);
      gainLeft.gain.exponentialRampToValueAtTime(0.0001, stopTime);
      gainRight.gain.setValueAtTime(gainRight.gain.value, now);
      gainRight.gain.exponentialRampToValueAtTime(0.0001, stopTime);

      // Schedule oscillators to stop after the fade
      oscLeft.stop(stopTime);
      oscRight.stop(stopTime);

      // Disconnect nodes after they've stopped to clean up
      setTimeout(() => {
        oscLeft.disconnect();
        filterLeftRef.current?.disconnect();
        gainLeft.disconnect();
        pannerLeftRef.current?.disconnect();

        oscRight.disconnect();
        filterRightRef.current?.disconnect();
        gainRight.disconnect();
        pannerRightRef.current?.disconnect();

         // Nullify refs after disconnection
         oscillatorLeftRef.current = null;
         filterLeftRef.current = null;
         gainLeftRef.current = null;
         pannerLeftRef.current = null;
         oscillatorRightRef.current = null;
         filterRightRef.current = null;
         gainRightRef.current = null;
         pannerRightRef.current = null;

      }, (RAMP_TIME_SECONDS + 0.1) * 1000); // Slight delay after stop time
    }
  }, []); // No dependencies needed

  // Toggle play/pause state
  const togglePlay = useCallback(() => {
    setIsPlaying(currentIsPlaying => {
      const nextIsPlaying = !currentIsPlaying;
      if (nextIsPlaying) {
        startAudio();
      } else {
        stopAudio();
      }
      return nextIsPlaying;
    });
  }, [startAudio, stopAudio]);

  // Handle volume changes from the slider
  const handleVolumeChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(event.target.value);
    setMasterVolume(newVolume);
    if (masterGainRef.current && audioContextRef.current) {
      // Use setTargetAtTime for slightly smoother volume changes, though direct setValueAtTime is often fine too
      masterGainRef.current.gain.setTargetAtTime(newVolume, audioContextRef.current.currentTime, 0.01);
    }
  }, []);

  // Cleanup effect for component unmount
  useEffect(() => {
    // Capture refs in local variables for the cleanup function's closure
    const audioCtx = audioContextRef.current;
    const masterGain = masterGainRef.current;

    return () => {
      // Ensure audio stops cleanly if component unmounts while playing
      stopAudio(); // stopAudio handles oscillator stopping and disconnection

      // Close the AudioContext to free resources
      if (audioCtx && audioCtx.state !== 'closed') {
        // Disconnect master gain before closing context
         masterGain?.disconnect();
         audioCtx.close();
      }
      // Clear refs
      audioContextRef.current = null;
      masterGainRef.current = null;
      // Other refs are nulled within stopAudio's setTimeout
    };
  }, [stopAudio]); // Include stopAudio in dependency array

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={togglePlay}
        className="p-1 text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent)] rounded"
        aria-label={isPlaying ? 'Stop binaural beat' : 'Play 40Hz binaural beat'}
        title={isPlaying ? 'Stop binaural beat' : 'Play 40Hz binaural beat'}
      >
        {isPlaying ? <Volume2 size={20} /> : <VolumeX size={20} />}
      </button>
      <input
        type="range"
        min="0"
        max="0.2" // Set a sensible max volume (e.g., 0.2 is 20%) - adjust as needed
        step="0.01"
        value={masterVolume}
        onChange={handleVolumeChange}
        className="w-20 h-1 bg-[var(--border-color)] rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--accent)]"
        aria-label="Binaural beat volume"
        title="Volume"
        disabled={!isPlaying} // Optionally disable slider when not playing
      />
    </div>
  );
}