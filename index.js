const net = require('net');
const dns = require('dns');

function validateEmail(email, callback) {
    const domain = email.split('@')[1];
    dns.resolveMx(domain, (err, addresses) => {
        if (err || addresses.length === 0) {
            callback(new Error('No MX records found for the domain'));
            return;
        }

        const mxRecord = addresses[0].exchange;
        const port = 25;
        const client = net.createConnection(port, mxRecord);

        client.setEncoding('utf8');

        client.on('connect', () => {
            // Start SMTP conversation
            client.write('EHLO example.com\r\n');
            client.write('MAIL FROM: <sender@example.com>\r\n');
            client.write(`RCPT TO: <${email}>\r\n`);
            client.write('QUIT\r\n');
        });

        let isValid = false;

        client.on('data', (data) => {
            // Analyze server response
            if (data.includes('250 2.1.5')) {
                isValid = true;
            }
        });

        client.on('end', () => {
            // Close connection and invoke callback
            client.destroy();
            callback(null, isValid);
        });

        client.on('error', (err) => {
            // Handle connection errors
            callback(err);
        });
    });
}

const email = 'munib@liqueous.com';
validateEmail(email, (err, isValid) => {
    if (err) {
        console.error('An error occurred:', err);
    } else {
        console.log(`Email address ${email} is ${isValid ? 'valid' : 'invalid'}`);
    }
});