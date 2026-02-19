import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ThemeToggleComponent } from './theme-toggle.component';

describe('ThemeToggleComponent', () => {
  let component: ThemeToggleComponent;
  let fixture: ComponentFixture<ThemeToggleComponent>;

  beforeEach(async () => {
    // Clear localStorage and class before each test
    localStorage.removeItem('theme');
    document.documentElement.classList.remove('dark');

    await TestBed.configureTestingModule({
      imports: [ThemeToggleComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ThemeToggleComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    localStorage.removeItem('theme');
    document.documentElement.classList.remove('dark');
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should default to light theme', () => {
    fixture.detectChanges();
    expect(component.theme()).toBe('light');
  });

  it('should toggle to dark', () => {
    fixture.detectChanges();
    component.toggle();
    expect(component.theme()).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('should toggle back to light', () => {
    fixture.detectChanges();
    component.toggle();
    component.toggle();
    expect(component.theme()).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('should restore theme from localStorage', () => {
    localStorage.setItem('theme', 'dark');
    fixture.detectChanges();
    expect(component.theme()).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('should render a button', () => {
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('button');
    expect(btn).toBeTruthy();
  });
});
