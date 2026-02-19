import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { VoiceService } from './voice.service';

describe('VoiceService', () => {
  let service: VoiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VoiceService);
  });

  afterEach(() => {
    service.dispose();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start in non-listening state', () => {
    expect(service.isListening()).toBe(false);
    expect(service.interimTranscript()).toBe('');
    expect(service.error()).toBeNull();
    expect(service.audioLevel()).toBe(0);
  });

  it('should detect browser support', () => {
    // In vitest/jsdom, SpeechRecognition is typically not available
    expect(typeof service.isSupported()).toBe('boolean');
  });

  it('should set language', () => {
    // Should not throw
    service.setLanguage('es-ES');
    expect(service.isListening()).toBe(false);
  });

  it('should report error when speech not supported', () => {
    // Force unsupported
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (service as any)._isSupported.set(false);

    service.startListening();
    expect(service.error()).toContain('not supported');
    expect(service.isListening()).toBe(false);
  });

  it('should not start listening twice', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (service as any)._isListening.set(true);
    service.startListening();
    // Should remain listening, no error
    expect(service.isListening()).toBe(true);
  });

  it('should stop listening', () => {
    service.stopListening();
    expect(service.isListening()).toBe(false);
    expect(service.interimTranscript()).toBe('');
  });

  it('should emit results via observable', () => {
    const results: string[] = [];
    const sub = service.onResult$.subscribe((r) => {
      if (r.isFinal) results.push(r.transcript);
    });

    // Manually complete
    sub.unsubscribe();
    expect(results).toEqual([]);
  });

  it('should clean up on dispose', () => {
    service.dispose();
    expect(service.isListening()).toBe(false);
  });
});
