import { Component, OnInit } from '@angular/core';
import { FileUploadComponent } from './file-upload/file-upload';
import { ThemeToggleComponent } from './theme-toggle/theme-toggle.component';
import { SEOService } from './services/seo.service';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  imports: [FileUploadComponent, ThemeToggleComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComponent implements OnInit {
  title = 'csv-to-json-app';

  constructor(
    private readonly seoService: SEOService,
    private readonly themeService: ThemeService
  ) {}

  ngOnInit(): void {
    // Set default SEO data
    this.seoService.setDefaultSEO();
    
    // Add structured data
    this.seoService.addBreadcrumbStructuredData();
    this.seoService.addHowToStructuredData();
    this.seoService.addFAQStructuredData();
    
    // Initialize theme service (will load saved theme or default to auto)
    // The theme service is already initialized in its constructor
  }
}
