import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ThemeService, Theme, ThemeState } from '../services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="theme-toggle">
      <div class="theme-buttons">
        <button
          *ngFor="let theme of themes"
          [class.active]="currentTheme === theme.value"
          (click)="setTheme(theme.value)"
          [title]="theme.tooltip"
          class="theme-button"
          [attr.aria-label]="'Switch to ' + theme.label + ' mode'"
        >
          <span class="theme-icon" [innerHTML]="theme.icon"></span>
          <span class="theme-label">{{ theme.label }}</span>
        </button>
      </div>
      <div class="theme-indicator" *ngIf="currentTheme === 'auto'">
        <span class="auto-indicator">{{ isDarkMode ? 'Dark' : 'Light' }}</span>
      </div>
    </div>
  `,
  styles: [`
    .theme-toggle {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .theme-buttons {
      display: flex;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 4px;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      gap: 2px;
    }

    .theme-button {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      border: none;
      background: transparent;
      color: var(--text-color, #333);
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.875rem;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      min-width: 70px;
      justify-content: center;
    }

    .theme-button:hover {
      background: rgba(255, 255, 255, 0.1);
      transform: translateY(-1px);
    }

    .theme-button.active {
      background: var(--primary-color, #667eea);
      color: white;
      box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
    }

    .theme-icon {
      font-size: 1rem;
    }

    .theme-label {
      font-weight: 500;
    }

    .theme-indicator {
      text-align: center;
      font-size: 0.75rem;
      color: var(--text-secondary, #666);
    }

    .auto-indicator {
      padding: 2px 8px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      backdrop-filter: blur(5px);
    }

    /* Dark theme adjustments */
    :global(.dark-theme) .theme-button {
      color: var(--text-color, #fff);
    }

    :global(.dark-theme) .theme-buttons {
      background: rgba(0, 0, 0, 0.2);
      border-color: rgba(255, 255, 255, 0.1);
    }

    :global(.dark-theme) .theme-button:hover {
      background: rgba(255, 255, 255, 0.1);
    }

    :global(.dark-theme) .auto-indicator {
      background: rgba(0, 0, 0, 0.2);
    }

    /* Mobile responsive */
    @media (max-width: 640px) {
      .theme-buttons {
        gap: 1px;
      }
      
      .theme-button {
        padding: 6px 8px;
        min-width: 60px;
        font-size: 0.8rem;
      }
      
      .theme-label {
        display: none;
      }
    }
  `]
})
export class ThemeToggleComponent implements OnInit, OnDestroy {
  currentTheme: Theme = 'auto';
  isDarkMode = false;
  private subscription?: Subscription;

  themes = [
    {
      value: 'light' as Theme,
      label: 'Light',
      icon: '☀️',
      tooltip: 'Switch to light mode'
    },
    {
      value: 'dark' as Theme,
      label: 'Dark',
      icon: '🌙',
      tooltip: 'Switch to dark mode'
    },
    {
      value: 'auto' as Theme,
      label: 'Auto',
      icon: '💻',
      tooltip: 'Follow system preference'
    }
  ];

  constructor(private readonly themeService: ThemeService) {}

  ngOnInit(): void {
    this.subscription = this.themeService.theme$.subscribe((themeState: ThemeState) => {
      this.currentTheme = themeState.currentTheme;
      this.isDarkMode = themeState.isDarkMode;
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  setTheme(theme: Theme): void {
    this.themeService.setTheme(theme);
  }
}
