const XLSX = require('xlsx');

// Create workbook
const workbook = XLSX.utils.book_new();

// Sheet 1: Employees
const employeesData = [
  ['Name', 'Email', 'Age', 'Department', 'Salary'],
  ['John Doe', 'john@company.com', 30, 'Engineering', 75000],
  ['Jane Smith', 'jane@company.com', 25, 'Marketing', 65000],
  ['Bob Johnson', 'bob@company.com', 35, 'Sales', 70000],
  ['Alice Brown', 'alice@company.com', 28, 'Engineering', 80000],
  ['Charlie Wilson', 'charlie@company.com', 32, 'HR', 60000]
];

const employeesWS = XLSX.utils.aoa_to_sheet(employeesData);
XLSX.utils.book_append_sheet(workbook, employeesWS, 'Employees');

// Sheet 2: Products
const productsData = [
  ['Product ID', 'Name', 'Category', 'Price', 'Stock'],
  ['P001', 'Laptop Pro', 'Electronics', 1299.99, 50],
  ['P002', 'Wireless Mouse', 'Electronics', 29.99, 200],
  ['P003', 'Office Chair', 'Furniture', 249.99, 75],
  ['P004', 'Desk Lamp', 'Furniture', 89.99, 100],
  ['P005', 'Keyboard Mechanical', 'Electronics', 129.99, 85]
];

const productsWS = XLSX.utils.aoa_to_sheet(productsData);
XLSX.utils.book_append_sheet(workbook, productsWS, 'Products');

// Sheet 3: Sales
const salesData = [
  ['Order ID', 'Customer', 'Product ID', 'Quantity', 'Total', 'Date'],
  ['ORD001', 'John Doe', 'P001', 1, 1299.99, '2024-01-15'],
  ['ORD002', 'Jane Smith', 'P002', 2, 59.98, '2024-01-16'],
  ['ORD003', 'Bob Johnson', 'P003', 1, 249.99, '2024-01-17'],
  ['ORD004', 'Alice Brown', 'P004', 3, 269.97, '2024-01-18'],
  ['ORD005', 'Charlie Wilson', 'P005', 1, 129.99, '2024-01-19']
];

const salesWS = XLSX.utils.aoa_to_sheet(salesData);
XLSX.utils.book_append_sheet(workbook, salesWS, 'Sales Data');

// Write file
XLSX.writeFile(workbook, 'sample-excel-data.xlsx');

console.log('Sample Excel file created: sample-excel-data.xlsx');
console.log('Sheets created:');
console.log('- Employees (' + (employeesData.length - 1) + ' records)');
console.log('- Products (' + (productsData.length - 1) + ' records)');
console.log('- Sales Data (' + (salesData.length - 1) + ' records)');
