# CSV & Excel to JSON Converter

A modern Angular application that converts CSV and Excel files to JSON format with advanced processing capabilities.

## ✨ Features

- 📊 **Multi-format Support**: CSV (.csv) and Excel (.xlsx, .xls) files
- 📋 **Excel Tab Processing**: Handle multiple worksheets with individual selection
- 🔧 **Advanced Processing**: Array-style columns, data normalization, type conversion
- 🎨 **Modern UI**: Glassmorphism design with drag & drop interface
- 📱 **Responsive**: Works perfectly on desktop, tablet, and mobile

## 🚀 Quick Start

### Development server

To start a local development server, run:

```bash
npm install
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## 📋 Usage

### CSV Files
1. Drag and drop or select a CSV file
2. File is automatically processed and converted to JSON
3. Download or copy the result

### Excel Files
1. Select an Excel file (.xlsx or .xls)
2. View all detected worksheets with record counts
3. Select which sheets to include in the conversion
4. Choose individual sheets or use "Select All"/"Deselect All"
5. Download or copy the generated JSON

### Output Formats
- **Single sheet**: Exports as JSON array
- **Multiple sheets**: Exports as JSON object with sheet names as keys

## 🛠️ Technical Stack

- **Angular 20.3.1** - Modern web framework
- **TypeScript** - Type-safe development
- **Papa Parse** - CSV parsing library
- **xlsx** - Excel file processing
- **Advanced CSS** - Glassmorphism design with animations

## 📁 Project Structure

```
src/
├── app/
│   ├── file-upload/          # Main file processing component
│   └── app.component.*       # Root component
├── assets/                   # Static assets
└── styles.css               # Global styles
```

## 🎨 Features Demo

- **Drag & Drop Interface**: Modern file upload with hover effects
- **Real-time Processing**: Live conversion with loading indicators  
- **Sheet Selection**: Interactive checkboxes for Excel worksheets
- **Responsive Design**: Mobile-first approach with breakpoints
- **Advanced CSS**: Glassmorphism, animations, and particle effects

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

### sudo -u www-data pm2 start ecosystem.config.js --env production
