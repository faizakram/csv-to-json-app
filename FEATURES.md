# CSV & Excel to JSON Converter

## Features

### 📊 File Format Support
- **CSV Files** (.csv) - Traditional comma-separated values
- **Excel Files** (.xlsx, .xls) - Microsoft Excel workbooks with multiple sheets

### 🔧 Advanced Processing
- **Array-style columns** - Handles columns like `field[0]`, `item[1]`
- **Multi-tab Excel processing** - Process individual sheets or combine multiple sheets
- **Automatic data normalization** - Cleans and structures data automatically
- **Numeric field conversion** - Converts numeric strings to proper numbers

### 📋 Excel-Specific Features
- **Sheet Selection** - Choose which sheets to include in the conversion
- **Tab-wise Processing** - Each Excel tab becomes a separate data array
- **Flexible Output** - Single sheet exports as array, multiple sheets as object
- **Sheet Statistics** - Shows record count per sheet

### 🎨 User Interface
- **Drag & Drop** - Simply drag files onto the interface
- **File Type Detection** - Automatically detects CSV vs Excel files  
- **Real-time Processing** - Live conversion with progress indicators
- **Advanced Styling** - Modern glassmorphism design with animations

### 📱 Responsive Design
- **Mobile Optimized** - Works seamlessly on all device sizes
- **Touch Friendly** - Optimized for touch interactions
- **Accessibility** - Supports screen readers and keyboard navigation

## Usage Examples

### CSV File Processing
1. Select or drag a CSV file
2. File is automatically processed
3. Download or copy the generated JSON

### Excel File Processing  
1. Select or drag an Excel file (.xlsx or .xls)
2. View detected sheets with record counts
3. Select which sheets to include
4. Choose "Select All" or individual sheets
5. Download or copy the generated JSON

### Output Formats

**Single Sheet:**
```json
[
  {"name": "John", "email": "john@example.com"},
  {"name": "Jane", "email": "jane@example.com"}
]
```

**Multiple Sheets:**
```json
{
  "Employees": [
    {"name": "John", "department": "Engineering"}
  ],
  "Products": [
    {"id": "P001", "name": "Laptop Pro"}  
  ]
}
```

## Technical Details

### Supported Array Formats
- `field[0]`, `field[1]` → `field: [value0, value1]`
- `items[0]`, `items[1]` → `items: [item0, item1]`
- Mixed data types are preserved

### Excel Processing
- Uses xlsx library for robust Excel file parsing
- Processes all worksheets automatically
- Handles merged cells and formatted data
- Preserves data types (strings, numbers, dates)

### Error Handling
- Validates file types before processing
- Provides clear error messages
- Handles corrupted or empty files gracefully
- Shows processing progress for large files

## Browser Compatibility
- Chrome/Chromium 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Sample Files
- `sample-data.csv` - Basic CSV example
- `sample-excel-data.xlsx` - Multi-sheet Excel example with:
  - Employees sheet (5 records)
  - Products sheet (5 records)
  - Sales Data sheet (5 records)

## Performance
- Handles files up to 10MB efficiently
- Processes thousands of records per second
- Memory-optimized for large datasets
- Background processing prevents UI blocking
