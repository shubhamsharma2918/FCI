import React, { useState, useEffect } from 'react';
import { Container, Button, Table, TableHead, TableRow, TableCell, TableBody, Select, MenuItem, TextField } from '@mui/material';
import axios from 'axios';

function App() {
    const [file, setFile] = useState(null);
    const [sheets, setSheets] = useState([]);
    const [data, setData] = useState({});
    const [selectedSheet, setSelectedSheet] = useState('');
    const [filterSlipNumbers, setFilterSlipNumbers] = useState('');
    const [filteredData, setFilteredData] = useState([]);
    // const [editableHeaders, setEditableHeaders] = useState({});
    const [missingSlipNumbers, setMissingSlipNumbers] = useState([]);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleUpload = async () => {
        if (!file) {
            alert('Please select a file');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post('http://localhost:5000/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setSheets(response.data.sheets);
            setData(response.data.data);
            setSelectedSheet(response.data.sheets[0]); // Select the first sheet by default
        } catch (err) {
            console.error('Error uploading file:', err);
            alert('Failed to upload file.');
        }
    };

    const handleFilterChange = (e) => {
        setFilterSlipNumbers(e.target.value);
    };
    const applyFilter = () => {
        if (!selectedSheet || !data[selectedSheet]) return;

        const rows = data[selectedSheet];

        const headerRows = rows.slice(0, 2); // Assuming the first two rows are headers
        const slipNumbers = filterSlipNumbers.split(',').map(slip => slip.trim());

        // Filter the data rows, excluding the header rows
        let filteredRows = rows.filter(e => Number.isInteger(e[0])).filter(row => slipNumbers.includes(row[2])); // Assuming 'SLIP NO' is at index 2

        // Calculate missing slip numbers
        const foundSlipNumbers = filteredRows.map(row => row[2]); // Assuming 'SLIP NO' is at index 2
        const missingSlipNumbers = slipNumbers.filter(slip => !foundSlipNumbers.includes(slip));

        // Update the SNO column to start from 1
        filteredRows = filteredRows.map((row, index) => {
            const updatedRow = [...row];
            updatedRow[0] = index + 1; // Set SNO to 1-based index
            return updatedRow;
        });

        if (filteredRows.length > 0) {
            rows[3][3] = filteredRows.reduce((sum, row) => sum + parseFloat(row[3] || 0), 0);
            rows[3][4] = filteredRows.reduce((sum, row) => sum + parseFloat(row[4] || 0), 0).toFixed(4);
            rows[3][5] = filteredRows.reduce((sum, row) => sum + parseFloat(row[5] || 0), 0).toFixed(4);
            rows[3][6] = filteredRows.reduce((sum, row) => sum + parseFloat(row[6] || 0), 0).toFixed(4);

        } else {
            rows[3][3] = rows.filter(e => Number.isInteger(e[0])).reduce((sum, row) => sum + parseFloat(row[3] || 0), 0);
            rows[3][4] = rows.filter(e => Number.isInteger(e[0])).reduce((sum, row) => sum + parseFloat(row[4] || 0), 0).toFixed(4);
            rows[3][5] = rows.filter(e => Number.isInteger(e[0])).reduce((sum, row) => sum + parseFloat(row[5] || 0), 0).toFixed(4);
            rows[3][6] = rows.filter(e => Number.isInteger(e[0])).reduce((sum, row) => sum + parseFloat(row[6] || 0), 0).toFixed(4);
        }

        const outputRows = filteredRows.length > 0
            ? [...headerRows, ...[rows[3]], ...filteredRows]
            : [...headerRows, ...[rows[3]], ...rows.filter(e => Number.isInteger(e[0]))];

        const totalFamilies = outputRows.filter(e => (Number.isInteger(e[0]))).length;

        outputRows.push(['', 'TOTAL NO OF FAMILIES', totalFamilies]);
        outputRows.push(['', 'TOTAL NO OF SOULS', rows[3][3] > 0 ? rows[3][3] : 'NIL']);
        outputRows.push(['', 'TOTAL RICE ISSUED', rows[3][4] > 0 ? `${rows[3][4]} QTLS` : 'NIL']);
        outputRows.push(['', 'TOTAL ATTA ISSUED', rows[3][5] > 0 ? `${rows[3][5]} QTLS`: 'NIL']);
        outputRows.push(['', 'TOTAL SUGAR ISSUED', rows[3][6] > 0 ? `${rows[3][6]} QTLS`: 'NIL']);

        setFilteredData(outputRows);
        setMissingSlipNumbers(missingSlipNumbers); // Set missing slip numbers in state
    };



    useEffect(() => {
        applyFilter(); // Apply filter dynamically whenever filterSlipNumbers changes
    }, [filterSlipNumbers, selectedSheet]);

    const copyToClipboard = () => {
        const table = document.getElementById('data-table');
        const range = document.createRange();
        range.selectNodeContents(table);
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);
        document.execCommand('copy');
    };

    const handleCellEdit = (e, rowIndex, colIndex) => {
        const updatedData = { ...data };
        updatedData[selectedSheet][rowIndex][colIndex] = e.target.innerText;
        setData(updatedData);
    };

    const renderTable = () => {
        if (!selectedSheet || !data[selectedSheet]) return null;

        const rows = filteredData.length > 0 ? filteredData : data[selectedSheet];

        // Identify the footer rows (e.g., Total and others)
        const footerRows = rows.slice(2).filter(e => !(Number.isInteger(e[0]))).filter(e => e.length > 0 && e.length != 7)

        // Ensure footerRows contains only valid arrays
        const validFooterRows = footerRows.filter(row => Array.isArray(row) && row.length > 0);
        // Main rows excluding the footer rows
        // const mainRows = rows
        const mainRows = rows.filter(row => !footerRows.includes(row));

        return (
            <div>
                {missingSlipNumbers.length > 0 && (
                    <div style={{ marginTop: '20px', color: 'red' }}>
                        <strong>Missing Slip Numbers:</strong> {missingSlipNumbers.join(', ')}
                    </div>
                )}
                <Table id="data-table" style={{ marginTop: '20px', border: '1px solid #ccc', borderRadius: '10px' }}>
                    <TableHead>
                        <TableRow>
                            {mainRows[0]?.map((header, colIndex) => (
                                <TableCell
                                    colSpan={7}
                                    key={colIndex}
                                    contentEditable
                                    suppressContentEditableWarning
                                    onBlur={(e) => handleCellEdit(e, 0, colIndex)}
                                    style={{
                                        border: '1px solid #ccc',
                                        padding: '12px',
                                        fontFamily: 'Calibri, sans-serif',
                                        fontSize: '18px',
                                        textAlign: 'center',
                                        fontWeight: 'bold',
                                    }}
                                >
                                    {header}
                                </TableCell>
                            ))}
                        </TableRow>
                        <TableRow>
                            {mainRows[1]?.map((header, colIndex) => (
                                <TableCell
                                    colSpan={7}
                                    key={colIndex}
                                    contentEditable
                                    suppressContentEditableWarning
                                    onBlur={(e) => handleCellEdit(e, 0, colIndex)}
                                    style={{
                                        border: '1px solid #ccc',
                                        padding: '12px',
                                        fontFamily: 'Calibri, sans-serif',
                                        fontSize: '18px',
                                        textAlign: 'center',
                                        fontWeight: 'bold',
                                    }}
                                >
                                    {header}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {/* Render main data rows */}
                        {mainRows
                            .slice(2) // Start from the third row
                            .filter(row => Array.isArray(row) && row.length > 0) // Validate rows
                            .map((row, rowIndex) => (
                                <TableRow key={rowIndex + 1}>
                                    {row.map((cell, cellIndex) => (
                                        <TableCell
                                            key={cellIndex}
                                            contentEditable
                                            suppressContentEditableWarning
                                            onBlur={(e) => handleCellEdit(e, rowIndex + 1, cellIndex)}
                                            style={{
                                                border: '1px solid #ccc',
                                                padding: '8px',
                                                fontFamily: 'Calibri, sans-serif',
                                                fontSize: '11px',
                                            }}
                                        >
                                            {cell}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}

                        {/* Render footer rows */}
                        {validFooterRows.map((row, rowIndex) => (
                            <TableRow key={`footer-${rowIndex}`} style={{ backgroundColor: '#f9f9f9', fontWeight: 'bold' }}>
                                {row.map((cell, cellIndex) => (
                                    <TableCell
                                        key={cellIndex}
                                        style={{
                                            border: '1px solid #ccc',
                                            padding: '10px',
                                            fontFamily: 'Calibri, sans-serif',
                                            fontSize: '12px',
                                            fontWeight: 'bold',
                                        }}
                                    >
                                        {cell}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                

            </div>
        );
    };


    return (
        <Container>
            <input type="file" onChange={handleFileChange} />
            <Button variant="contained" color="primary" onClick={handleUpload} style={{ marginLeft: 10 }}>
                Upload
            </Button>

            {sheets.length > 0 && (
                <div style={{ marginTop: 20 }}>
                    <Select value={selectedSheet} onChange={(e) => setSelectedSheet(e.target.value)}>
                        {sheets.map((sheet, index) => (
                            <MenuItem key={index} value={sheet}>
                                {sheet}
                            </MenuItem>
                        ))}
                    </Select>
                </div>
            )}

            {selectedSheet && (
                <div style={{ marginTop: 20 }}>
                    <TextField
                        label="Filter by Slip Numbers"
                        variant="outlined"
                        fullWidth
                        value={filterSlipNumbers}
                        onChange={handleFilterChange}
                        helperText="Enter comma-separated slip numbers"
                    />
                    <Button
                        variant="contained"
                        color="success"
                        onClick={copyToClipboard}
                        style={{ marginTop: '10px', display: 'block' }}
                    >
                        Copy Table Data
                    </Button>
                </div>
            )}

            <div style={{ marginTop: 20 }}>
                {renderTable()}
            </div>
        </Container>
    );
}

export default App;
