import * as XLSX from 'xlsx';

/**
 * Exports data to an Excel file
 * @param {Array} data - Array of objects to export
 * @param {string} fileName - Name of the file to save (without extension)
 * @param {string} sheetName - Name of the sheet in the workbook
 */
export const exportToExcel = (data, fileName = 'export', sheetName = 'Sheet1') => {
    try {
        // Create a new workbook
        const workbook = XLSX.utils.book_new();

        // Convert the data to a worksheet
        const worksheet = XLSX.utils.json_to_sheet(data);

        // Add the worksheet to the workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

        // Generate the Excel file and trigger download
        XLSX.writeFile(workbook, `${fileName}.xlsx`);
    } catch (error) {
        console.error('Error exporting to Excel:', error);
        throw error;
    }
};
