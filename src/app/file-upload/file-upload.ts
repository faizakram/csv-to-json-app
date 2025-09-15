import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as Papa from 'papaparse';

interface ParsedData {
  [key: string]: any;
}

@Component({
  selector: 'app-file-upload',
  imports: [CommonModule],
  templateUrl: './file-upload.html',
  styleUrl: './file-upload.css'
})
export class FileUploadComponent {
  jsonData = signal<string>('');
  fileName = signal<string>('');
  isLoading = signal<boolean>(false);
  error = signal<string>('');
  isDragOver = signal<boolean>(false);
  copySuccess = signal<boolean>(false);

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    this.processFile(input.files[0]);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);

    const files = event.dataTransfer?.files;
    if (!files || files.length === 0) {
      return;
    }

    this.processFile(files[0]);
  }

  private processFile(file: File): void {
    // Check if file is CSV
    if (!file.name.toLowerCase().endsWith('.csv')) {
      this.error.set('Please select a CSV file');
      return;
    }

    this.fileName.set(file.name);
    this.error.set('');
    this.isLoading.set(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        this.processCSVData(results.data as ParsedData[]);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.error.set(`Error parsing CSV: ${error.message}`);
        this.isLoading.set(false);
      }
    });
  }

  private processCSVData(data: ParsedData[]): void {
    try {
      // Convert CSV data to JSON using the same logic as the Python script
      const processedData = this.convertCSVToTalentHubFormat(data);
      this.jsonData.set(JSON.stringify(processedData, null, 2));
    } catch (error) {
      this.error.set(`Error processing data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private convertCSVToTalentHubFormat(data: ParsedData[]): ParsedData[] {
    if (!data || data.length === 0) return [];

    // Get column names from the first row
    const columns = Object.keys(data[0]);
    
    // Identify array-style columns and group them
    const arrayGroups = this.collectArrayFields(columns);

    // Convert each row
    return data.map(row => this.rowToRecord(row, arrayGroups));
  }

  private collectArrayFields(columns: string[]): { [base: string]: string[] } {
    const arrayColPattern = /^([^[]+)\[(\d+)\]$/;
    const groups: { [base: string]: Array<{idx: number, col: string}> } = {};

    // Find columns that match the array pattern
    for (const col of columns) {
      const match = arrayColPattern.exec(col);
      if (match) {
        const base = match[1];
        const idx = parseInt(match[2], 10);
        
        if (!groups[base]) {
          groups[base] = [];
        }
        groups[base].push({ idx, col });
      }
    }

    // Sort by index and return only column names
    const sortedGroups: { [base: string]: string[] } = {};
    for (const [base, pairs] of Object.entries(groups)) {
      pairs.sort((a, b) => a.idx - b.idx);
      sortedGroups[base] = pairs.map(p => p.col);
    }

    return sortedGroups;
  }

  private rowToRecord(row: ParsedData, arrayGroups: { [base: string]: string[] }): ParsedData {
    const record: ParsedData = {};
    
    // Get all array column names for exclusion from regular processing
    const arrayColumns = this.getArrayColumnSet(arrayGroups);

    // Process non-array columns first
    this.processRegularColumns(row, record, arrayColumns);

    // Special handling for yearsExperience
    this.convertYearsExperienceToInt(record);

    // Build arrays for each grouped base
    this.processArrayColumns(row, record, arrayGroups);

    // Handle comma-separated values in remaining string fields (fallback)
    this.processCommaSeparatedFields(record, arrayGroups);

    return record;
  }

  private getArrayColumnSet(arrayGroups: { [base: string]: string[] }): Set<string> {
    const arrayColumns = new Set<string>();
    for (const cols of Object.values(arrayGroups)) {
      for (const col of cols) {
        arrayColumns.add(col);
      }
    }
    return arrayColumns;
  }

  private processRegularColumns(row: ParsedData, record: ParsedData, arrayColumns: Set<string>): void {
    for (const [col, value] of Object.entries(row)) {
      if (!arrayColumns.has(col)) {
        record[col] = this.normalizeValue(value);
      }
    }
  }

  private convertYearsExperienceToInt(record: ParsedData): void {
    if ('yearsExperience' in record && record['yearsExperience'] != null) {
      try {
        const numValue = parseFloat(String(record['yearsExperience']));
        if (!isNaN(numValue)) {
          record['yearsExperience'] = Math.floor(numValue);
        }
      } catch {
        // Leave as-is if not convertible
      }
    }
  }

  private processArrayColumns(row: ParsedData, record: ParsedData, arrayGroups: { [base: string]: string[] }): void {
    for (const [base, cols] of Object.entries(arrayGroups)) {
      const arr: any[] = [];
      for (const col of cols) {
        const value = this.normalizeValue(row[col]);
        if (value != null) {
          arr.push(value);
        }
      }
      record[base] = arr;
    }
  }

  private processCommaSeparatedFields(record: ParsedData, arrayGroups: { [base: string]: string[] }): void {
    for (const [key, value] of Object.entries(record)) {
      if (this.shouldConvertToArray(value, key, arrayGroups)) {
        const arrayValue = (value as string)
          .split(',')
          .map(item => item.trim())
          .filter(item => item.length > 0);
        
        if (arrayValue.length > 1) {
          record[key] = arrayValue;
        }
      }
    }
  }

  private shouldConvertToArray(value: any, key: string, arrayGroups: { [base: string]: string[] }): boolean {
    return typeof value === 'string' && 
           value.includes(',') && 
           !arrayGroups[key];
  }

  private normalizeValue(value: any): any {
    // Handle null, undefined, NaN, and empty string values
    if (value === null || value === undefined) {
      return null;
    }
    
    if (typeof value === 'number' && isNaN(value)) {
      return null;
    }
    
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed === '' ? null : trimmed;
    }
    
    return value;
  }

  downloadJSON(): void {
    if (!this.jsonData()) {
      return;
    }

    const blob = new Blob([this.jsonData()], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = this.fileName().replace('.csv', '.json');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  async copyToClipboard(): Promise<void> {
    if (!this.jsonData()) {
      return;
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(this.jsonData());
        this.copySuccess.set(true);
        
        // Reset the success message after 2 seconds
        setTimeout(() => {
          this.copySuccess.set(false);
        }, 2000);
      } else {
        // For browsers without Clipboard API support
        this.showClipboardUnsupported();
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      this.showClipboardUnsupported();
    }
  }

  private showClipboardUnsupported(): void {
    alert('Clipboard not supported. Please select and copy the JSON manually from the output area.');
  }

  clearData(): void {
    this.jsonData.set('');
    this.fileName.set('');
    this.error.set('');
    this.copySuccess.set(false);
  }
}
