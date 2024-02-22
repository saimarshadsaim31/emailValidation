const fs = require('fs');

function isEmailValid(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

fs.readFile('source.csv', 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading the file:', err);
        return;
    }

    const rows = data.trim().split('\n').map(row => row.split(','));

    const validRows = [];
    const invalidRows = [];

    rows.forEach(row => {
        const email = row[0].trim();
        if (isEmailValid(email)) {
            validRows.push(row);
        } else {
            invalidRows.push(row);
        }
    });

    // Write the rows with invalid email addresses to a separate file
    fs.writeFile('empty.csv', invalidRows.map(row => row.join(',')).join('\n'), err => {
        if (err) {
            console.error('Error writing rows with invalid email addresses to empty.csv:', err);
            return;
        }
        console.log('Rows with invalid email addresses written to empty.csv');
    });

    // Write the rows with valid email addresses back to the original file
    fs.writeFile('source.csv', validRows.map(row => row.join(',')).join('\n'), err => {
        if (err) {
            console.error('Error writing valid rows to input.csv:', err);
            return;
        }
        console.log('Valid rows written to input.csv');
    });
});
