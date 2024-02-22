const fs = require('fs');
const csvParser = require('csv-parser');
const { validateEmail } = require('./index5');

const inputFilePath = 'source.csv';
const validOutputFilePath = 'valid.csv';
const invalidOutputFilePath = 'invalid.csv';
const usesCatchAllOutputFilePath = 'usesCatchAll.csv';

const emails = [];

fs.createReadStream(inputFilePath)
    .pipe(csvParser())
    .on('data', (row) => {
        const email = row['Account Owner'];
        emails.push(email);
    })
    .on('end', async () => {
        try {
            const validationPromises = emails.map(validateEmail);
            const results = await Promise.all(validationPromises);

            const validEmails = [];
            const invalidEmails = [];
            const usesCatchAllEmails = [];

            results.forEach((result, index) => {
                if (result.email_format_is_valid) {
                    if (result.usesCatchAll) {
                        usesCatchAllEmails.push(emails[index]);
                    } else {
                        validEmails.push(emails[index]);
                    }
                } else {
                    invalidEmails.push(emails[index]);
                }
            });

            fs.writeFileSync(validOutputFilePath, validEmails.join('\n'));
            fs.writeFileSync(invalidOutputFilePath, invalidEmails.join('\n'));
            fs.writeFileSync(usesCatchAllOutputFilePath, usesCatchAllEmails.join('\n'));

            console.log('Processing completed.');
        } catch (error) {
            console.error('Error occurred during processing:', error);
        }
    });
