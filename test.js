const fs = require('fs');
const { validateEmail } = require('./index5');
const { Transform } = require('stream');
const { createReadStream, createWriteStream } = require('fs');

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function validateWithEmailRetry(email) {
    const maxRetries = 3;
    const retryDelay = 1000;
    let retries = 0;

    while (retries < maxRetries) {
        try {
            const validationResult = await validateEmail(email);
            return validationResult;
        } catch (error) {
            console.error(`Error validating email (${email}). Retrying...`);
            retries++;
            await delay(retryDelay * Math.pow(2, retries));
        }
    }

    throw new Error(`Failed to validate email (${email}) after ${maxRetries} retries.`);
}


async function processCSV(inputFilePath, validOutputFilePath, invalidOutputFilePath, usesCatchAllOutputFilePath) {
    try {
        const input = createReadStream(inputFilePath, { encoding: 'utf8' });
        const validOutput = createWriteStream(validOutputFilePath, { encoding: 'utf8' });
        const invalidOutput = createWriteStream(invalidOutputFilePath, { encoding: 'utf8' });
        const usesCatchAllOutput = createWriteStream(usesCatchAllOutputFilePath, { encoding: 'utf8' });

        const transformStream = new Transform({
            writableObjectMode: true,
            transform: async (chunk, encoding, callback) => {
                const emails = chunk.trim().split('\n');
                const validEmails = [];
                const invalidEmails = [];
                const usesCatchAllEmails = [];

                for (const email of emails) {
                    try {
                        const validationResult = await validateWithEmailRetry(email.trim());
                        if (validationResult.email_format_is_valid) {
                            if (validationResult.account_exists) {
                                validEmails.push(email);
                                if (validationResult.usesCatchAll) {
                                    usesCatchAllEmails.push(email);
                                }
                            } else {
                                invalidEmails.push(email);
                            }
                        } else {
                            invalidEmails.push(email);
                        }
                    } catch (error) {
                        console.error(`Error validating email (${email}). Skipping...`);
                        invalidEmails.push(email);
                    }
                }

                validOutput.write(validEmails.join('\n') + '\n');
                invalidOutput.write(invalidEmails.join('\n') + '\n');
                usesCatchAllOutput.write(usesCatchAllEmails.join('\n') + '\n');

                callback();
            }
        });

        input.pipe(transformStream);

        transformStream.on('end', () => {
            validOutput.end();
            invalidOutput.end();
            usesCatchAllOutput.end();
            console.log('Processing complete.');
        });
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
