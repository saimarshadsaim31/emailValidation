var emailCheck = require('email-check');

emailCheck('munib@liqueous.com')
    .then(function (res) {
        console.log(res)
    })
    .catch(function (err) {
        if (err.message === 'refuse') {
            console.log('refused connection', err)
        } else {
            console.log('Error checking validity', err)
        }
    });