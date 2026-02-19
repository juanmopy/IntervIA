import { wordsToVisemes, estimateWordTimings } from './viseme-mapper';

describe('Viseme Mapper', () => {
  describe('wordsToVisemes()', () => {
    it('should map words to visemes', () => {
      const words = [
        { word: 'Hello', startTime: 0, endTime: 0.3 },
        { word: 'there', startTime: 0.3, endTime: 0.6 },
      ];

      const result = wordsToVisemes(words);

      expect(result).toHaveLength(2);
      expect(result[0].viseme).toBeDefined();
      expect(result[0].word).toBe('Hello');
      expect(result[1].viseme).toBeDefined();
    });

    it('should map "th" words to viseme_TH', () => {
      const words = [
        { word: 'the', startTime: 0, endTime: 0.2 },
        { word: 'think', startTime: 0.2, endTime: 0.5 },
      ];

      const result = wordsToVisemes(words);
      expect(result[0].viseme).toBe('viseme_TH');
      expect(result[1].viseme).toBe('viseme_TH');
    });

    it('should map "sh/ch" words to viseme_CH', () => {
      const words = [
        { word: 'she', startTime: 0, endTime: 0.2 },
        { word: 'check', startTime: 0.2, endTime: 0.5 },
      ];

      const result = wordsToVisemes(words);
      expect(result[0].viseme).toBe('viseme_CH');
      expect(result[1].viseme).toBe('viseme_CH');
    });

    it('should handle empty word', () => {
      const words = [{ word: '', startTime: 0, endTime: 0.1 }];
      const result = wordsToVisemes(words);
      expect(result[0].viseme).toBe('viseme_sil');
    });
  });

  describe('estimateWordTimings()', () => {
    it('should generate sequential timings', () => {
      const result = estimateWordTimings('one two three');

      expect(result).toHaveLength(3);
      expect(result[0].startTime).toBe(0);
      expect(result[0].endTime).toBeGreaterThan(result[0].startTime);
      expect(result[1].startTime).toBe(result[0].endTime);
      expect(result[2].endTime).toBeGreaterThan(result[2].startTime);
    });

    it('should use provided duration', () => {
      const result = estimateWordTimings('word1 word2', 2.0);

      expect(result).toHaveLength(2);
      expect(result[1].endTime).toBe(2.0);
    });

    it('should return empty array for empty text', () => {
      const result = estimateWordTimings('');
      expect(result).toHaveLength(0);
    });
  });
});
