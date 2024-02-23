const { randomBytes } = require('crypto');
const { promises } = require('dns');
const { SMTPClient } = require('smtp-client');

const resolveMXRecords = async (domain) => {
    console.log('Resolving MX records for domain:', domain);
    try {
        return await promises.resolveMx(domain);
    } catch (error) {
        return [];
    }
};

const verifyEmailFormat = (email) => {
    const regex = new RegExp({ pattern: '^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+.[a-zA-Z]{2,4}$', flags: 'i' });
    return regex.test(email);
};

const testInboxOnSMTPServer = async (inboxAddress, smtpAddress) => {
    const result = {
        connection_established: false,
        account_exists: false
    };

    const client = new SMTPClient({
        host: smtpAddress,
        port: 25
    });

    try {
        await client.connect();
        await client.greet({ hostname: smtpAddress });
        await client.mail({ from: 'kennedyviolet563@gmail.com' });
        await client.rcpt({ to: inboxAddress });
        await client.data('mail source')
        await client.quit();
        result.account_exists = true;
        result.connection_established = true;
    } catch (error) {
        console.error('Error testing inbox on SMTP server:', error);
    } finally {
        client.close();
    }

    return result;
};

const validateEmail = async (email) => {
    const emailFormatValid = verifyEmailFormat(email);
    if (!emailFormatValid) {
        return 'Invalid email format';
    }

    const [, domain] = email.split('@');
    const mxRecords = await resolveMXRecords(domain);
    const sortedMxRecords = mxRecords.sort((a, b) => a.priority - b.priority);
    console.log('Sorted MX records:', sortedMxRecords);

    let smtpResult = { connection_established: false, account_exists: false };
    let hostIndex = 0;

    while (hostIndex < sortedMxRecords.length) {
        try {
            console.log('Testing inbox on SMTP server:', sortedMxRecords[hostIndex].exchange);
            smtpResult = await testInboxOnSMTPServer(email, sortedMxRecords[hostIndex].exchange);
            if (!smtpResult.connection_established) {
                console.log('Connection not established');
                hostIndex++;
            } else {
                break;
            }
        } catch (error) {
            console.error('Error while testing inbox on SMTP server:', error);
            hostIndex++;
        }
    }

    let usesCatchAll = false;
    try {
        const testCatchEmail = `${randomBytes(20).toString('hex')}@${domain}`;
        const testCatchAll = await testInboxOnSMTPServer(testCatchEmail, sortedMxRecords[hostIndex].exchange);
        usesCatchAll = testCatchAll.account_exists;
    } catch (error) {
        console.error(error);
    }

    return {
        email_format_is_valid: emailFormatValid,
        usesCatchAll: usesCatchAll,
        ...smtpResult
    };
};

async function main() {
    let email = 'saimarshadsaim31@gmail.com';
    const result = await validateEmail(email);
    console.log('Result:', result);
}

main();

module.exports = {
    validateEmail
};
