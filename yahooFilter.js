const fs = require('fs');

fs.readFile('source.csv', 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading the file:', err);
        return;
    }

    const rows = data.trim().split('\n').map(row => row.split(','));

    const yahooRows = rows.filter(row => row[0].includes('@yahoo.com'));

    const filteredRows = rows.filter(row => !row[0].includes('@yahoo.com'));

    fs.writeFile('source.csv', filteredRows.map(row => row.join(',')).join('\n'), err => {
        if (err) {
            console.error('Error writing filtered data to file:', err);
            return;
        }
        console.log('Filtered data written to input.csv');
    });

    fs.writeFile('yahoo.csv', yahooRows.map(row => row.join(',')).join('\n'), err => {
        if (err) {
            console.error('Error writing Yahoo data to file:', err);
            return;
        }
        console.log('Yahoo data written to yahoo.csv');
    });
});
