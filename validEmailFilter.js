const fs = require('fs');
const { validateEmail } = require('./index5');

async function processCSV(inputFilePath, validOutputFilePath, invalidOutputFilePath, usesCatchAllOutputFilePath) {
    try {
        const inputData = fs.readFileSync(inputFilePath, 'utf8');
        const rows = inputData.trim().split('\n').map(row => row.split(','));
        let validCount = 0;
        let invalidCount = 0;
        let usesCatchAllCount = 0;
        let validEmails = [];
        let invalidEmails = [];
        let usesCatchAllEmails = [];

        for (const row of rows) {
            const email = row[0].trim();
            const validationResult = await validateEmail(email);
            if (validationResult.email_format_is_valid) {
                if (validationResult.account_exists) {
                    validCount++;
                    validEmails.push(email);
                    if (validationResult.usesCatchAll) {
                        usesCatchAllCount++;
                        usesCatchAllEmails.push(email);
                    }
                } else {
                    invalidCount++;
                    invalidEmails.push(email);
                }
            } else {
                invalidCount++;
                invalidEmails.push(email);
            }
            console.log(`Processed ${validCount + invalidCount} records...`);
        }

        fs.writeFileSync(validOutputFilePath, validEmails.join('\n'));
        console.log(`Valid emails (${validCount} records) written to valid.csv`);

        fs.writeFileSync(invalidOutputFilePath, invalidEmails.join('\n'));
        console.log(`Invalid emails (${invalidCount} records) written to invalid.csv`);

        fs.writeFileSync(usesCatchAllOutputFilePath, usesCatchAllEmails.join('\n'));
        console.log(`Uses Catch-All emails (${usesCatchAllCount} records) written to usesCatchAll.csv`);
    } catch (error) {
        console.error('Error processing CSV:', error);
    }
}

async function main() {
    const inputFilePath = 'source.csv';
    const validOutputFilePath = 'valid.csv';
    const invalidOutputFilePath = 'invalid.csv';
    const usesCatchAllOutputFilePath = 'usesCatchAll.csv';
    await processCSV(inputFilePath, validOutputFilePath, invalidOutputFilePath, usesCatchAllOutputFilePath);
}

main();
