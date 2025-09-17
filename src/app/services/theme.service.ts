import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type Theme = 'light' | 'dark' | 'auto';

export interface ThemeState {
  currentTheme: Theme;
  isDarkMode: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_KEY = 'csv-json-theme';
  private readonly themeSubject = new BehaviorSubject<ThemeState>({
    currentTheme: 'auto',
    isDarkMode: false
  });

  public theme$ = this.themeSubject.asObservable();

  constructor() {
    this.initializeTheme();
  }

  private initializeTheme(): void {
    if (typeof window === 'undefined') return; // SSR safety

    // Get saved theme or default to auto
    const savedTheme = (localStorage.getItem(this.THEME_KEY) as Theme) || 'auto';
    
    // Set up media query listener for system preference
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', () => {
        if (this.themeSubject.value.currentTheme === 'auto') {
          this.updateThemeState('auto');
        }
      });
    }

    this.setTheme(savedTheme);
  }

  public setTheme(theme: Theme): void {
    if (typeof window === 'undefined') return; // SSR safety

    const isDarkMode = this.calculateDarkMode(theme);
    
    // Update DOM
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.classList.toggle('dark-theme', isDarkMode);
    
    // Save to localStorage
    localStorage.setItem(this.THEME_KEY, theme);
    
    // Update state
    this.updateThemeState(theme);
  }

  private calculateDarkMode(theme: Theme): boolean {
    if (theme === 'dark') return true;
    if (theme === 'light') return false;
    
    // Auto mode - check system preference
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    
    return false; // Default to light if can't determine
  }

  private updateThemeState(theme: Theme): void {
    const isDarkMode = this.calculateDarkMode(theme);
    this.themeSubject.next({
      currentTheme: theme,
      isDarkMode
    });
  }

  public getCurrentTheme(): Theme {
    return this.themeSubject.value.currentTheme;
  }

  public isDarkMode(): boolean {
    return this.themeSubject.value.isDarkMode;
  }

  public toggleTheme(): void {
    const currentTheme = this.getCurrentTheme();
    let nextTheme: Theme;

    switch (currentTheme) {
      case 'light':
        nextTheme = 'dark';
        break;
      case 'dark':
        nextTheme = 'auto';
        break;
      case 'auto':
      default:
        nextTheme = 'light';
        break;
    }

    this.setTheme(nextTheme);
  }
}
