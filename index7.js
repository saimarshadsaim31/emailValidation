const fs = require('fs');
const csv = require('csv-parser');
const fastCsv = require('fast-csv');
const emailValidator = require('deep-email-validator');

const inputFilePath = 'input.csv';
const validOutputFilePath = 'valid.csv';
const invalidOutputFilePath = 'invalid.csv';

async function validateEmail(email) {
    try {
        const { valid } = await emailValidator.validate(email);
        return valid;
    } catch (error) {
        console.error('Error validating email:', email, error);
        return false;
    }
}

async function processCSV() {
    let totalRecords = 0;
    let validRecords = 0;
    let invalidRecords = 0;

    const validStream = fs.createWriteStream(validOutputFilePath);
    const invalidStream = fs.createWriteStream(invalidOutputFilePath);

    const validCsvStream = fastCsv.format({ headers: true });
    const invalidCsvStream = fastCsv.format({ headers: true });

    validCsvStream.pipe(validStream);
    invalidCsvStream.pipe(invalidStream);

    fs.createReadStream(inputFilePath)
        .pipe(csv())
        .on('data', async (row) => {
            totalRecords++;
            const email = row['Account Owner'];

            const isValid = await validateEmail(email);
            if (isValid) {
                validCsvStream.write(row);
                validRecords++;
            } else {
                invalidCsvStream.write(row);
                invalidRecords++;
            }

            console.log(`Processed: ${totalRecords}, Valid: ${validRecords}, Invalid: ${invalidRecords}`);
        })
        .on('end', () => {
            validCsvStream.end();
            invalidCsvStream.end();
            console.log('CSV processing completed.');
        });
}

processCSV();
