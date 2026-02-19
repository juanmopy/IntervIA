import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { StorageService, type StoredInterview } from './storage.service';

const STORAGE_KEY = 'intervia-history';

const mockInterview: StoredInterview = {
  id: 'test-1',
  date: '2026-01-15T10:00:00.000Z',
  role: 'Frontend Dev',
  type: 'technical',
  difficulty: 'mid',
  overallScore: 80,
  report: {
    overallScore: 80,
    strengths: ['Good'],
    improvements: ['More examples'],
    questionScores: [{ question: 'Q1', answer: 'A1', score: 8, feedback: 'Nice' }],
    suggestedResources: ['Book'],
  },
};

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY);
    TestBed.configureTestingModule({ providers: [StorageService] });
    service = TestBed.inject(StorageService);
  });

  afterEach(() => {
    localStorage.removeItem(STORAGE_KEY);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with empty history', () => {
    expect(service.history()).toEqual([]);
  });

  it('should save an interview', () => {
    service.save(mockInterview);
    expect(service.history().length).toBe(1);
    expect(service.history()[0].id).toBe('test-1');
  });

  it('should persist to localStorage', () => {
    service.save(mockInterview);
    const raw = localStorage.getItem(STORAGE_KEY);
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed.length).toBe(1);
  });

  it('should get by id', () => {
    service.save(mockInterview);
    expect(service.getById('test-1')?.role).toBe('Frontend Dev');
    expect(service.getById('nonexistent')).toBeUndefined();
  });

  it('should delete by id', () => {
    service.save(mockInterview);
    service.delete('test-1');
    expect(service.history().length).toBe(0);
  });

  it('should clear all', () => {
    service.save(mockInterview);
    service.save({ ...mockInterview, id: 'test-2' });
    service.clearAll();
    expect(service.history().length).toBe(0);
  });

  it('should load from localStorage on init', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([mockInterview]));
    // Re-create service to trigger load
    const newService = new StorageService();
    expect(newService.history().length).toBe(1);
  });

  it('should sort newest first', () => {
    const older = { ...mockInterview, id: 'old', date: '2025-01-01T00:00:00Z' };
    const newer = { ...mockInterview, id: 'new', date: '2026-06-01T00:00:00Z' };
    service.save(older);
    service.save(newer);
    expect(service.history()[0].id).toBe('new');
  });
});
