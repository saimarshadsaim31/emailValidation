const { randomBytes } = require('crypto');
const promises = require('dns').promises;
const net = require('net');


const resolveMXRecords = async (domain) => {
    try {
        return await promises.resolveMx(domain)
    } catch (error) {
        return []
    }
}

const verifyEmailFormat = (email) => {
    const regex = new RegExp({ pattern: '^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+.[a-zA-Z]{2,4}$', flags: 'i' });
    return regex.test(email);
};

const SMTPStages = {
    CHECK_CONNECTION_ESTABLISHED: 'CHECK_CONNECTION_ESTABLISHED',
    SEND_EHLO: 'SEND_EHLO',
    SEND_MAIL_FROM: 'SEND_MAIL_FROM',
    SEND_RECIPIENT_TO: 'SEND_RECIPIENT_TO',
    SEND_QUIT: 'SEND_QUIT'
}

const testInboxOnSMTPServer = async (inboxAddress, smtpAddress) => {
    return new Promise((resolve, reject) => {
        const result = {
            connection_established: false,
            account_exists: false
        }

        const socket = net.createConnection(25, smtpAddress)
        const stages = {
            [SMTPStages.CHECK_CONNECTION_ESTABLISHED]: {
                expected_reply_code: '220'
            },
            [SMTPStages.SEND_EHLO]: {
                command: `EHLO mail.example.org\r\n`,
                expected_reply_code: '250'
            },
            [SMTPStages.SEND_MAIL_FROM]: {
                command: `MAIL FROM:<name@example.org>\r\n`,
                expected_reply_code: '250'
            },
            [SMTPStages.SEND_RECIPIENT_TO]: {
                command: `RCPT TO:<${inboxAddress}>\r\n`,
                expected_reply_code: '250'
            },
            [SMTPStages.SEND_QUIT]: {
                command: `QUIT\r\n`,
                expected_reply_code: '221'
            }
        }

        let response = ""
        let currentStageName = SMTPStages.CHECK_CONNECTION_ESTABLISHED

        socket.on("data", (data) => {
            const reply = data.toString()
            response += reply

            console.log('<-- ' + reply)
            const currentStage = stages[currentStageName]

            switch (currentStageName) {
                case SMTPStages.CHECK_CONNECTION_ESTABLISHED: {
                    if (!reply.startsWith(currentStage.expected_reply_code)) {
                        socket.end()
                        break
                    }

                    result.connection_established = true
                    currentStageName = SMTPStages.SEND_EHLO
                    const command = stages[currentStageName].command
                    socket.write(command, () => {
                        console.log('--> ' + command)
                    })

                    break
                }

                case SMTPStages.SEND_EHLO: {
                    if (!reply.startsWith(currentStage.expected_reply_code)) {
                        socket.end()
                        break
                    }

                    currentStageName = SMTPStages.SEND_MAIL_FROM
                    const command = stages[currentStageName].command
                    socket.write(command, () => {
                        console.log('--> ' + command)
                    })

                    break
                }

                case SMTPStages.SEND_MAIL_FROM: {
                    if (!reply.startsWith(currentStage.expected_reply_code)) {
                        socket.end()
                        break
                    }

                    currentStageName = SMTPStages.SEND_RECIPIENT_TO
                    const command = stages[currentStageName].command
                    socket.write(command, () => {
                        console.log('--> ' + command)
                    })

                    break
                }

                case SMTPStages.SEND_RECIPIENT_TO: {
                    if (!reply.startsWith(currentStage.expected_reply_code)) {
                        socket.end()
                        break
                    }

                    result.account_exists = true
                    currentStageName = SMTPStages.SEND_QUIT
                    const command = stages[currentStageName].command
                    socket.write(command, () => {
                        console.log('--> ' + command)
                    })

                    break
                }
            }
        })

        socket.on("connect", () => {
            console.log("Connected to SMTP " + smtpAddress)
            console.log('Local address: ' + socket.localAddress + ' Local port: ' + socket.localPort);
            console.log('Remote address: ' + socket.remoteAddress + ' Remote port: ' + socket.remotePort);
        })

        socket.on("error", (error) => {
            // clearInterval(timeoutTimer)
            reject(error)
        })

        socket.on("close", () => {
            // clearInterval(timeoutTimer)
            resolve(result)
        })
    })
}

const validateEmail = async (email) => {
    const emailFormatValid = verifyEmailFormat(email)
    if (!emailFormatValid) {
        return 'invalid email format'
    }

    const [, domain] = email.split('@')
    const mxRecords = await resolveMXRecords(domain)
    const sortedMxRecords = mxRecords.sort((a, b) => a.priority - b.priority)

    let smtpResult = { connection_established: false, account_exists: false }
    let hostIndex = 0

    while (hostIndex < sortedMxRecords.length) {
        try {
            smtpResult = await testInboxOnSMTPServer(email, sortedMxRecords[hostIndex].exchange)
            if (!smtpResult.connection_established) {
                hostIndex++
            }
            else {
                break
            }
        } catch (error) {
            console.error(error)
        }
    }
    let usesCatchAll = false
    try {
        const testCatchEmail = `${randomBytes(20).toString('hex')}@${domain}`
        const testCatchAll = await testInboxOnSMTPServer(testCatchEmail, sortedMxRecords[hostIndex].exchange)
        usesCatchAll = testCatchAll.account_exists
    } catch (error) {
        console.error(error)
    }

    return {
        email_format_is_valid: emailFormatValid,
        usesCatchAll: usesCatchAll,
        ...smtpResult
    }

}

async function main() {
    let email = 'uzerahmed151@gmail.com'
    const result = await validateEmail(email)
    console.log('result', result)
}
main()

module.exports = {
    validateEmail
}