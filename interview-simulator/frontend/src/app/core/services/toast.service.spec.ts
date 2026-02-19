import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should add a toast', () => {
    service.show('Test message', 'info', 0);
    expect(service.toasts().length).toBe(1);
    expect(service.toasts()[0].message).toBe('Test message');
    expect(service.toasts()[0].type).toBe('info');
  });

  it('should add error toast', () => {
    service.error('Error!', 0);
    expect(service.toasts()[0].type).toBe('error');
  });

  it('should add success toast', () => {
    service.success('Done!', 0);
    expect(service.toasts()[0].type).toBe('success');
  });

  it('should dismiss a toast by id', () => {
    service.show('A', 'info', 0);
    service.show('B', 'info', 0);
    const id = service.toasts()[0].id;
    service.dismiss(id);
    expect(service.toasts().length).toBe(1);
    expect(service.toasts()[0].message).toBe('B');
  });

  it('should dismiss all toasts', () => {
    service.show('A', 'info', 0);
    service.show('B', 'info', 0);
    service.dismissAll();
    expect(service.toasts().length).toBe(0);
  });

  it('should auto-dismiss after duration', () => {
    vi.useFakeTimers();
    service.show('Temp', 'info', 3000);
    expect(service.toasts().length).toBe(1);
    vi.advanceTimersByTime(3000);
    expect(service.toasts().length).toBe(0);
    vi.useRealTimers();
  });
});
