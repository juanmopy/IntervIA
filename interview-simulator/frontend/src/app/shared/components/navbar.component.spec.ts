import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideTranslateService } from '@ngx-translate/core';
import { NavbarComponent } from './navbar.component';

describe('NavbarComponent', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;

  beforeEach(async () => {
    localStorage.removeItem('theme');
    document.documentElement.classList.remove('dark');

    await TestBed.configureTestingModule({
      imports: [NavbarComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideTranslateService(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render logo text', () => {
    const logo = fixture.nativeElement.querySelector('a span');
    expect(logo?.textContent?.trim()).toBe('IntervIA');
  });

  it('should render nav links', () => {
    const links = fixture.nativeElement.querySelectorAll('a[routerLink]');
    expect(links.length).toBeGreaterThanOrEqual(3); // logo + 2 nav links (desktop)
  });

  it('should render theme toggle', () => {
    const toggle = fixture.nativeElement.querySelector('app-theme-toggle');
    expect(toggle).toBeTruthy();
  });

  it('should toggle mobile menu', () => {
    expect(component.mobileMenuOpen()).toBe(false);
    component.mobileMenuOpen.set(true);
    fixture.detectChanges();
    // Mobile menu should be visible
    const mobileLinks = fixture.nativeElement.querySelectorAll('.md\\:hidden a');
    expect(mobileLinks.length).toBeGreaterThan(0);
  });
});
