import { Injectable, signal } from '@angular/core';

/**
 * Stored interview record for history.
 */
export interface StoredInterview {
  id: string;
  date: string;        // ISO string
  role: string;
  type: string;
  difficulty: string;
  overallScore: number;
  duration?: number;   // in seconds
  report: {
    overallScore: number;
    strengths: string[];
    improvements: string[];
    questionScores: {
      question: string;
      answer?: string;
      score: number;
      feedback: string;
    }[];
    suggestedResources: string[];
  };
}

const STORAGE_KEY = 'intervia-history';

/**
 * StorageService — Persists interview history in localStorage.
 */
@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly _history = signal<StoredInterview[]>([]);
  readonly history = this._history.asReadonly();

  constructor() {
    this.load();
  }

  /**
   * Save a completed interview to history.
   */
  save(interview: StoredInterview): void {
    const current = this._history();
    const updated = [interview, ...current];
    this._history.set(updated);
    this.persist(updated);
  }

  /**
   * Get a single interview by ID.
   */
  getById(id: string): StoredInterview | undefined {
    return this._history().find(i => i.id === id);
  }

  /**
   * Delete a single interview by ID.
   */
  delete(id: string): void {
    const updated = this._history().filter(i => i.id !== id);
    this._history.set(updated);
    this.persist(updated);
  }

  /**
   * Clear all history.
   */
  clearAll(): void {
    this._history.set([]);
    this.persist([]);
  }

  private load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as StoredInterview[];
        // Sort newest first
        parsed.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        this._history.set(parsed);
      }
    } catch {
      // Corrupted data — reset
      this._history.set([]);
    }
  }

  private persist(data: StoredInterview[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // localStorage full or unavailable — silently fail
    }
  }
}
