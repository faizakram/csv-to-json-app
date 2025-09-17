import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SEOService } from '../services/seo.service';

interface ParsedData {
  [key: string]: any;
}

interface ExcelSheet {
  name: string;
  data: ParsedData[];
}

interface ExcelData {
  sheets: ExcelSheet[];
  totalRecords: number;
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
  
  // Excel-specific signals
  excelData = signal<ExcelData | null>(null);
  fileType = signal<'csv' | 'excel' | null>(null);
  selectedSheets = signal<string[]>([]);
  showSheetSelector = signal<boolean>(false);

  // Computed properties for sheet selection state
  get selectionPercentage(): number {
    const excelData = this.excelData();
    if (!excelData || excelData.sheets.length === 0) return 0;
    return (this.selectedSheets().length / excelData.sheets.length) * 100;
  }

  get isAllSelected(): boolean {
    return this.selectionPercentage === 100;
  }

  get isPartiallySelected(): boolean {
    const percentage = this.selectionPercentage;
    return percentage > 0 && percentage < 100;
  }

  constructor(private readonly seoService: SEOService) {}

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

  onUploadAreaClick(event: Event): void {
    // Only trigger file input if click wasn't on the label or input itself
    const target = event.target as HTMLElement;
    if (target.tagName !== 'LABEL' && target.tagName !== 'INPUT') {
      // Check if we're in browser environment (SSR-safe)
      if (typeof document !== 'undefined') {
        const fileInput = document.getElementById('dataFile') as HTMLInputElement;
        if (fileInput) {
          fileInput.click();
        }
      }
    }
  }

  onUploadAreaKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      // Create a synthetic event for file input trigger
      if (typeof document !== 'undefined') {
        const fileInput = document.getElementById('dataFile') as HTMLInputElement;
        if (fileInput) {
          fileInput.click();
        }
      }
    }
  }

  private processFile(file: File): void {
    const fileName = file.name.toLowerCase();
    const isCSV = fileName.endsWith('.csv');
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
    
    // Check if file is supported
    if (!isCSV && !isExcel) {
      this.error.set('Please select a CSV or Excel file (.csv, .xlsx, .xls)');
      return;
    }

    this.fileName.set(file.name);
    this.error.set('');
    this.isLoading.set(true);
    this.resetData();
    
    // Update SEO for file processing
    this.seoService.updateForFileProcessing();

    if (isCSV) {
      this.fileType.set('csv');
      this.processCSVFile(file);
    } else if (isExcel) {
      this.fileType.set('excel');
      this.processExcelFile(file);
    }
  }

  private resetData(): void {
    this.jsonData.set('');
    this.excelData.set(null);
    this.selectedSheets.set([]);
    this.showSheetSelector.set(false);
    this.copySuccess.set(false);
  }

  private async processCSVFile(file: File): Promise<void> {
    try {
      // Dynamically import papaparse only when needed
      const Papa = await import('papaparse');

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results: any) => {
          this.processCSVData(results.data as ParsedData[]);
          this.isLoading.set(false);
        },
        error: (error: any) => {
          this.error.set(`Error parsing CSV: ${error.message}`);
          this.isLoading.set(false);
        }
      });
    } catch (error) {
      this.error.set(`Error loading CSV parser: ${error instanceof Error ? error.message : 'Unknown error'}`);
      this.isLoading.set(false);
    }
  }

  private async processExcelFile(file: File): Promise<void> {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        // Dynamically import xlsx only when needed
        const XLSX = await import('xlsx');
        
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const excelData: ExcelData = {
          sheets: [],
          totalRecords: 0
        };

        // Process all sheets
        workbook.SheetNames.forEach((sheetName: string) => {
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          if (jsonData.length > 0) {
            // Convert to objects with headers
            const headers = jsonData[0] as string[];
            const rows = jsonData.slice(1) as any[][];
            
            const sheetData = this.processExcelRows(headers, rows);

            if (sheetData.length > 0) {
              excelData.sheets.push({
                name: sheetName,
                data: this.convertCSVToTalentHubFormat(sheetData)
              });
              excelData.totalRecords += sheetData.length;
            }
          }
        });

        if (excelData.sheets.length === 0) {
          this.error.set('No valid data found in Excel file');
          this.isLoading.set(false);
          return;
        }

        this.excelData.set(excelData);
        this.selectedSheets.set(excelData.sheets.map(sheet => sheet.name));
        this.showSheetSelector.set(excelData.sheets.length > 1);
        this.generateExcelJSON();
        this.isLoading.set(false);
        
      } catch (error) {
        this.error.set(`Error processing Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        this.isLoading.set(false);
      }
    };

    reader.onerror = () => {
      this.error.set('Error reading file');
      this.isLoading.set(false);
    };

    reader.readAsArrayBuffer(file);
  }

  private processExcelRows(headers: string[], rows: any[][]): ParsedData[] {
    return rows.map(row => {
      const obj: ParsedData = {};
      headers.forEach((header, index) => {
        if (header && row[index] !== undefined) {
          obj[header] = row[index];
        }
      });
      return obj;
    }).filter(obj => Object.keys(obj).length > 0);
  }

  generateExcelJSON(): void {
    const excelData = this.excelData();
    if (!excelData) return;

    const selectedSheets = this.selectedSheets();
    const filteredSheets = excelData.sheets.filter(sheet => selectedSheets.includes(sheet.name));
    
    if (filteredSheets.length === 1) {
      // Single sheet - export as array
      this.jsonData.set(JSON.stringify(filteredSheets[0].data, null, 2));
    } else {
      // Multiple sheets - export as object with sheet names as keys
      const result: { [sheetName: string]: ParsedData[] } = {};
      filteredSheets.forEach(sheet => {
        result[sheet.name] = sheet.data;
      });
      this.jsonData.set(JSON.stringify(result, null, 2));
    }
  }

  onSheetSelectionChange(sheetName: string, selected: boolean): void {
    const currentSelection = this.selectedSheets();
    if (selected) {
      if (!currentSelection.includes(sheetName)) {
        this.selectedSheets.set([...currentSelection, sheetName]);
      }
    } else {
      this.selectedSheets.set(currentSelection.filter(name => name !== sheetName));
    }
    this.generateExcelJSON();
  }

  isSheetSelected(sheetName: string): boolean {
    return this.selectedSheets().includes(sheetName);
  }

  selectAllSheets(): void {
    const excelData = this.excelData();
    if (excelData) {
      if (this.isAllSelected) {
        // If all sheets are selected, deselect all
        this.selectedSheets.set([]);
      } else {
        // If not all sheets are selected, select all
        this.selectedSheets.set(excelData.sheets.map(sheet => sheet.name));
      }
      this.generateExcelJSON();
    }
  }

  convertSelectedSheets(): void {
    // This method is called when user wants to convert selected sheets
    // The conversion already happens in generateExcelJSON which is called
    // whenever sheet selection changes, so we just need to ensure it's called
    this.generateExcelJSON();
  }

  deselectAllSheets(): void {
    this.selectedSheets.set([]);
    this.generateExcelJSON();
  }

  private processCSVData(data: ParsedData[]): void {
    try {
      // Convert CSV data to JSON using the same logic as the Python script
      const processedData = this.convertCSVToTalentHubFormat(data);
      this.jsonData.set(JSON.stringify(processedData, null, 2));
      
      // Update SEO for successful processing
      this.seoService.updateForFileProcessed();
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
    
    // Get the original filename without extension and add .json
    const originalFileName = this.fileName();
    const fileNameWithoutExtension = originalFileName.replace(/\.(csv|xlsx?|xls)$/i, '');
    link.download = `${fileNameWithoutExtension}.json`;
    
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

  clearResults(): void {
    this.jsonData.set('');
    this.error.set('');
    this.copySuccess.set(false);
    this.excelData.set(null);
    this.selectedSheets.set([]);
    this.showSheetSelector.set(false);
  }

  clearData(): void {
    this.jsonData.set('');
    this.fileName.set('');
    this.error.set('');
    this.copySuccess.set(false);
    this.excelData.set(null);
    this.fileType.set(null);
    this.selectedSheets.set([]);
    this.showSheetSelector.set(false);
  }
}
