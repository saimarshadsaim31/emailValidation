const emailCheck = require('email-check');

function checkEmailValidity(email) {
    emailCheck(email)
        .then((res) => {
            console.log(`${email} is ${res ? 'valid' : 'invalid'}`);
        })
        .catch((err) => {
            console.error(`Error checking validity for ${email}:`, err);
        });
}

checkEmailValidity('munib@liqueous.com');
