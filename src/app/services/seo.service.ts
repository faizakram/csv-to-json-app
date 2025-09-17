import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { isPlatformBrowser, DOCUMENT } from '@angular/common';

export interface SEOData {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SEOService {

  constructor(
    private readonly meta: Meta,
    private readonly title: Title,
    @Inject(PLATFORM_ID) private readonly platformId: Object
  ) {}

  updateSEO(data: SEOData): void {
    // Update title
    if (data.title) {
      this.title.setTitle(data.title);
      this.meta.updateTag({ property: 'og:title', content: data.title });
      this.meta.updateTag({ name: 'twitter:title', content: data.title });
    }

    // Update description
    if (data.description) {
      this.meta.updateTag({ name: 'description', content: data.description });
      this.meta.updateTag({ property: 'og:description', content: data.description });
      this.meta.updateTag({ name: 'twitter:description', content: data.description });
    }

    // Update keywords
    if (data.keywords) {
      this.meta.updateTag({ name: 'keywords', content: data.keywords });
    }

    // Update Open Graph image
    if (data.image) {
      this.meta.updateTag({ property: 'og:image', content: data.image });
      this.meta.updateTag({ name: 'twitter:image', content: data.image });
    }

    // Update URL
    if (data.url) {
      this.meta.updateTag({ property: 'og:url', content: data.url });
      this.meta.updateTag({ name: 'twitter:url', content: data.url });
    }

    // Update type
    if (data.type) {
      this.meta.updateTag({ property: 'og:type', content: data.type });
    }

    // Update author
    if (data.author) {
      this.meta.updateTag({ name: 'author', content: data.author });
    }

    // Update published time
    if (data.publishedTime) {
      this.meta.updateTag({ property: 'article:published_time', content: data.publishedTime });
    }

    // Update modified time
    if (data.modifiedTime) {
      this.meta.updateTag({ property: 'article:modified_time', content: data.modifiedTime });
    }
  }

  updateCanonicalUrl(url: string): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    
    // Remove existing canonical link if exists
    const existingCanonical = document.querySelector('link[rel="canonical"]');
    if (existingCanonical) {
      existingCanonical.remove();
    }

    // Add new canonical link
    const link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    link.setAttribute('href', url);
    document.head.appendChild(link);
  }

  addStructuredData(data: any): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(data);
    document.head.appendChild(script);
  }

  removeStructuredData(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    scripts.forEach(script => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    });
  }

  setDefaultSEO(): void {
    this.updateSEO({
      title: 'CSV to JSON Converter | Free Online Excel & CSV File Converter Tool',
      description: 'Convert CSV and Excel files to JSON format instantly. Free online tool with drag & drop support, multi-sheet Excel processing, and automatic data normalization. No registration required.',
      keywords: 'CSV to JSON, Excel to JSON, file converter, data converter, CSV parser, Excel parser, JSON converter, online tool, free converter, data transformation, spreadsheet converter',
      url: 'https://csv-to-json-converter.app/',
      type: 'website',
      author: 'CSV to JSON App',
      image: 'https://csv-to-json-converter.app/assets/og-image.jpg'
    });
  }

  updateForFileProcessing(): void {
    this.updateSEO({
      title: 'Processing File - CSV to JSON Converter',
      description: 'Converting your CSV or Excel file to JSON format. Our advanced parser handles multiple sheets and data normalization automatically.',
      keywords: 'CSV processing, Excel processing, JSON conversion, file upload, data transformation'
    });
  }

  updateForFileProcessed(): void {
    this.updateSEO({
      title: 'File Converted Successfully - CSV to JSON Converter',
      description: 'Your CSV or Excel file has been successfully converted to JSON format. Download your converted data or process another file.',
      keywords: 'JSON download, converted file, CSV to JSON complete, Excel to JSON complete'
    });
  }

  addBreadcrumbStructuredData(): void {
    const breadcrumbData = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://csv-to-json-converter.app/"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "CSV to JSON Converter",
          "item": "https://csv-to-json-converter.app/"
        }
      ]
    };
    
    this.addStructuredData(breadcrumbData);
  }

  addHowToStructuredData(): void {
    const howToData = {
      "@context": "https://schema.org",
      "@type": "HowTo",
      "name": "How to Convert CSV or Excel Files to JSON",
      "description": "Step-by-step guide to convert CSV and Excel files to JSON format using our free online tool",
      "image": "https://csv-to-json-converter.app/assets/howto-image.jpg",
      "totalTime": "PT2M",
      "estimatedCost": {
        "@type": "MonetaryAmount",
        "currency": "USD",
        "value": "0"
      },
      "supply": [
        {
          "@type": "HowToSupply",
          "name": "CSV or Excel file"
        },
        {
          "@type": "HowToSupply",
          "name": "Web browser with JavaScript enabled"
        }
      ],
      "tool": [
        {
          "@type": "HowToTool",
          "name": "CSV to JSON Converter"
        }
      ],
      "step": [
        {
          "@type": "HowToStep",
          "name": "Upload File",
          "text": "Drag and drop your CSV or Excel file into the upload area, or click to browse and select your file.",
          "url": "https://csv-to-json-converter.app/#step1",
          "image": "https://csv-to-json-converter.app/assets/step1.jpg"
        },
        {
          "@type": "HowToStep",
          "name": "Select Sheet (Excel only)",
          "text": "If you uploaded an Excel file with multiple sheets, select the specific sheet you want to convert.",
          "url": "https://csv-to-json-converter.app/#step2",
          "image": "https://csv-to-json-converter.app/assets/step2.jpg"
        },
        {
          "@type": "HowToStep",
          "name": "Download JSON",
          "text": "Click the download button to save your converted JSON file to your device.",
          "url": "https://csv-to-json-converter.app/#step3",
          "image": "https://csv-to-json-converter.app/assets/step3.jpg"
        }
      ]
    };
    
    this.addStructuredData(howToData);
  }

  addFAQStructuredData(): void {
    const faqData = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Is this CSV to JSON converter free to use?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes, our CSV to JSON converter is completely free to use. No registration, no hidden fees, and no limitations on file size or usage."
          }
        },
        {
          "@type": "Question",
          "name": "What file formats are supported?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "We support CSV files (.csv) and Excel files (.xlsx, .xls). For Excel files, you can convert individual sheets or multiple sheets to separate JSON files."
          }
        },
        {
          "@type": "Question",
          "name": "Is my data secure when using this tool?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes, all file processing happens locally in your browser. Your files are never uploaded to our servers, ensuring complete privacy and security of your data."
          }
        },
        {
          "@type": "Question",
          "name": "What is the maximum file size supported?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Since processing happens in your browser, the file size limit depends on your device's available memory. Most standard CSV and Excel files up to 50MB work without issues."
          }
        },
        {
          "@type": "Question",
          "name": "Can I convert multiple Excel sheets at once?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes, when you upload an Excel file with multiple sheets, you can select which sheet to convert or process all sheets individually."
          }
        }
      ]
    };
    
    this.addStructuredData(faqData);
  }
}
