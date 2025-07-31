"use client";
import { Howl } from 'howler';
import { useCallback } from 'react';

// Siapkan file audio di public/sounds/
const sounds = {
  click: new Howl({ src: ['/sounds/click.wav'], volume: 0.5 }),
  success: new Howl({ src: ['/sounds/success.wav'], volume: 0.3 }),
  typing: new Howl({ src: ['/sounds/typing.wav'], volume: 0.1, loop: true }),
  engage: new Howl({ src: ['/sounds/engage.wav'], volume: 0.7 }),
};

export const useSound = () => {
  const playSound = useCallback((soundName: keyof typeof sounds) => {
    if (sounds[soundName]) {
      sounds[soundName].play();
    }
  }, []);

  const startTypingSound = useCallback(() => {
    if (!sounds.typing.playing()) {
      sounds.typing.play();
    }
  }, []);

  const stopTypingSound = useCallback(() => {
    sounds.typing.stop();
  }, []);

  return { playSound, startTypingSound, stopTypingSound };
};

// Anda bisa mencari file audio .wav gratis di situs seperti freesound.org