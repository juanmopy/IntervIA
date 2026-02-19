import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AvatarService } from './avatar.service';

// Mock TalkingHead
function createMockHead() {
  return {
    showAvatar: vi.fn().mockResolvedValue(undefined),
    speakText: vi.fn(),
    speakAudio: vi.fn(),
    stopSpeaking: vi.fn(),
    setMood: vi.fn(),
    setView: vi.fn(),
    playGesture: vi.fn(),
    dispose: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    isSpeaking: false,
  };
}

// We'll mock the dynamic import at the module level
vi.mock('@met4citizen/talkinghead/modules/talkinghead.mjs', () => {
  const MockTalkingHead = vi.fn().mockImplementation(function (this: Record<string, unknown>) {
    const mock = createMockHead();
    Object.assign(this, mock);
  });
  return { TalkingHead: MockTalkingHead };
});

describe('AvatarService', () => {
  let service: AvatarService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AvatarService);
    vi.clearAllMocks();
  });

  afterEach(() => {
    service.dispose();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start in idle state', () => {
    expect(service.state()).toBe('idle');
    expect(service.progress()).toBe(0);
    expect(service.error()).toBeNull();
    expect(service.isReady()).toBe(false);
  });

  it('should transition to ready state after init', async () => {
    const container = document.createElement('div');
    await service.init(container);

    expect(service.state()).toBe('ready');
    expect(service.progress()).toBe(100);
    expect(service.isReady()).toBe(true);
  });

  it('should set error state when init fails', async () => {
    const { TalkingHead } = await import(
      '@met4citizen/talkinghead/modules/talkinghead.mjs'
    );
    (TalkingHead as unknown as ReturnType<typeof vi.fn>).mockImplementationOnce(
      function (this: Record<string, unknown>) {
        const mock = createMockHead();
        mock.showAvatar = vi
          .fn()
          .mockRejectedValue(new Error('WebGL not supported'));
        Object.assign(this, mock);
      },
    );

    const container = document.createElement('div');
    await expect(service.init(container)).rejects.toThrow(
      'WebGL not supported',
    );
    expect(service.state()).toBe('error');
    expect(service.error()).toBe('WebGL not supported');
  });

  it('should dispose previous head before reinit', async () => {
    const container = document.createElement('div');
    await service.init(container);
    await service.init(container);
    expect(service.state()).toBe('ready');
  });

  it('should set mood on ready avatar', async () => {
    const container = document.createElement('div');
    await service.init(container);
    service.setMood('happy');
    expect(service.state()).toBe('ready');
  });

  it('should handle unknown mood gracefully', async () => {
    const { TalkingHead } = await import(
      '@met4citizen/talkinghead/modules/talkinghead.mjs'
    );
    (TalkingHead as unknown as ReturnType<typeof vi.fn>).mockImplementationOnce(
      function (this: Record<string, unknown>) {
        const mock = createMockHead();
        mock.setMood = vi.fn().mockImplementation(() => {
          throw new Error('Unknown mood');
        });
        Object.assign(this, mock);
      },
    );

    const container = document.createElement('div');
    await service.init(container);

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    service.setMood('nonexistent');
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Unknown mood'),
    );
    consoleSpy.mockRestore();
  });

  it('should set view on ready avatar', async () => {
    const container = document.createElement('div');
    await service.init(container);
    service.setView('head');
    expect(service.state()).toBe('ready');
  });

  it('should play gesture on ready avatar', async () => {
    const container = document.createElement('div');
    await service.init(container);
    service.playGesture('handup', 3);
    expect(service.state()).toBe('ready');
  });

  it('should stop speaking', async () => {
    const container = document.createElement('div');
    await service.init(container);
    service.stopSpeaking();
    expect(service.state()).toBe('ready');
  });

  it('should clean up on dispose', async () => {
    const container = document.createElement('div');
    await service.init(container);
    service.dispose();
    expect(service.state()).toBe('idle');
    expect(service.progress()).toBe(0);
    expect(service.error()).toBeNull();
  });

  it('should not throw when calling methods without init', () => {
    service.setMood('happy');
    service.setView('upper');
    service.playGesture('handup');
    service.stopSpeaking();
    service.dispose();
    expect(service.state()).toBe('idle');
  });
});
