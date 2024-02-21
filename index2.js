const { Telnet } = require('telnet-client');

async function checkEmailValidity(email) {
    const domain = email.split('@')[1];
    const host = `mx.${domain}`;

    const connection = new Telnet();
    const params = {
        host: host,
        port: 25,
        timeout: 15000
    };

    try {
        await connection.connect(params);
        await connection.send('HELO example.com\r\n');
        await connection.send(`MAIL FROM:<youremail@example.com>\r\n`);
        const response = await connection.send(`RCPT TO:<${email}>\r\n`);

        if (response.includes('250')) {
            console.log(`${email} is a valid email.`);
        } else {
            console.log(`${email} is not a valid email.`);
        }
    } catch (err) {
        console.error(`Error checking validity for ${email}:`, err);
    } finally {
        connection.end();
    }
}

// Example usage
checkEmailValidity('munib@liqueous.com');
