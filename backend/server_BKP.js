const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const cors = require('cors');

const app = express();
const PORT = 5000;

// Enable CORS for cross-origin requests
app.use(cors());
app.use(express.json());

// Multer configuration for file uploads
const upload = multer({ storage: multer.memoryStorage() });

app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    try {
        // Parse the Excel file
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheets = workbook.SheetNames;
        const data = {};

        // Extract data from each sheet
        sheets.forEach((sheetName) => {
            const sheet = workbook.Sheets[sheetName];
            data[sheetName] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        });

        res.status(200).json({ sheets, data });
    } catch (err) {
        res.status(500).json({ message: 'Error processing file', error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
