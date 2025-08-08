import { AudioService } from '../AudioService';
import { Alert } from 'react-native';

jest.mock('expo-av', () => ({
  Audio: {
    Sound: {
      createAsync: jest.fn(() => Promise.resolve({
        playAsync: jest.fn(),
        unloadAsync: jest.fn(),
      })),
    },
    setAudioModeAsync: jest.fn(),
  },
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
}));

jest.mock('react-native', () => ({
  Alert: {
    alert: jest.fn(),
  },
}));

describe('AudioService', () => {
  let audioService: AudioService;

  beforeEach(() => {
    audioService = new AudioService();
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('should initialize audio mode', async () => {
      const { Audio } = require('expo-av');
      
      await audioService.initialize();

      expect(Audio.setAudioModeAsync).toHaveBeenCalledWith({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false
      });
    });

    it('should handle initialization error', async () => {
      const { Audio } = require('expo-av');
      Audio.setAudioModeAsync.mockRejectedValue(new Error('Init failed'));
      
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await audioService.initialize();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to initialize audio:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('getTrainerVoiceMessage', () => {
    it('should return correct message for energetic trainer', () => {
      const message = audioService.getTrainerVoiceMessage('energetic', 'welcome');
      expect(typeof message).toBe('string');
      expect(message.length).toBeGreaterThan(0);
    });

    it('should return correct message for different message types', () => {
      const welcomeMessage = audioService.getTrainerVoiceMessage('calm', 'welcome');
      const celebrationMessage = audioService.getTrainerVoiceMessage('calm', 'celebration');
      const encouragementMessage = audioService.getTrainerVoiceMessage('calm', 'encouragement');

      expect(welcomeMessage).not.toBe(celebrationMessage);
      expect(welcomeMessage).not.toBe(encouragementMessage);
      expect(celebrationMessage).not.toBe(encouragementMessage);
    });

    it('should handle unknown trainer type', () => {
      const message = audioService.getTrainerVoiceMessage('unknown', 'welcome');
      expect(typeof message).toBe('string');
      expect(message.length).toBeGreaterThan(0);
    });

    it('should handle unknown message type', () => {
      const message = audioService.getTrainerVoiceMessage('energetic', 'unknown');
      expect(typeof message).toBe('string');
      expect(message.length).toBeGreaterThan(0);
    });

    it('should return different messages for different trainer types', () => {
      const energeticMessage = audioService.getTrainerVoiceMessage('energetic', 'welcome');
      const calmMessage = audioService.getTrainerVoiceMessage('calm', 'welcome');
      const strictMessage = audioService.getTrainerVoiceMessage('strict', 'welcome');

      expect(energeticMessage).not.toBe(calmMessage);
      expect(energeticMessage).not.toBe(strictMessage);
      expect(calmMessage).not.toBe(strictMessage);
    });
  });

  describe('playTrainerVoice', () => {
    it('should play audio file when available', async () => {
      const { Audio } = require('expo-av');
      const mockSound = {
        playAsync: jest.fn(),
        unloadAsync: jest.fn(),
      };
      Audio.Sound.createAsync.mockResolvedValue(mockSound);

      await audioService.playTrainerVoice('test_file', 'Test message');

      expect(Audio.Sound.createAsync).toHaveBeenCalled();
      expect(mockSound.playAsync).toHaveBeenCalled();
      expect(mockSound.unloadAsync).toHaveBeenCalled();
    });

    it('should fall back to alert when audio fails', async () => {
      const { Audio } = require('expo-av');
      Audio.Sound.createAsync.mockRejectedValue(new Error('Audio failed'));

      await audioService.playTrainerVoice('test_file', 'Test message');

      expect(Alert.alert).toHaveBeenCalledWith(
        'トレーナーより',
        'Test message',
        [{ text: 'OK' }]
      );
    });

    it('should handle sound creation error gracefully', async () => {
      const { Audio } = require('expo-av');
      const mockSound = {
        playAsync: jest.fn().mockRejectedValue(new Error('Play failed')),
        unloadAsync: jest.fn(),
      };
      Audio.Sound.createAsync.mockResolvedValue(mockSound);

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await audioService.playTrainerVoice('test_file', 'Test message');

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(mockSound.unloadAsync).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should handle unload error gracefully', async () => {
      const { Audio } = require('expo-av');
      const mockSound = {
        playAsync: jest.fn(),
        unloadAsync: jest.fn().mockRejectedValue(new Error('Unload failed')),
      };
      Audio.Sound.createAsync.mockResolvedValue(mockSound);

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await audioService.playTrainerVoice('test_file', 'Test message');

      expect(mockSound.playAsync).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('AudioService existence', () => {
    it('should be instantiated', () => {
      expect(audioService).toBeDefined();
      expect(typeof audioService.getTrainerVoiceMessage).toBe('function');
      expect(typeof audioService.playTrainerVoice).toBe('function');
    });
  });
});