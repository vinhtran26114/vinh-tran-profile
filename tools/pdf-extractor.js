const fs = require('fs');
const pdf = require('pdf-parse');
const path = require('path');

// Get the absolute path to the CV.pdf file
const pdfPath = path.join(__dirname, '..', 'CV.pdf');
const jsonOutputDir = path.join(__dirname, '..', 'json');

// Helper function to write JSON files
const writeJsonFile = (filename, data) => {
    const filePath = path.join(jsonOutputDir, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

// Read the PDF file
try {
    const dataBuffer = fs.readFileSync(pdfPath);
    
    pdf(dataBuffer).then(function(data) {
        const text = data.text;
        console.log('PDF content extracted successfully');
        
        // First save the raw content
        writeJsonFile('raw-content.json', { content: text });
        
        // TODO: Parse the content and organize into different sections
        // This is where we'll add the parsing logic once we see the PDF structure
        
        console.log('Content has been saved to raw-content.json');
    }).catch(error => {
        console.error('Error parsing PDF:', error);
    });
} catch (error) {
    console.error('Error reading PDF file:', error);
} 