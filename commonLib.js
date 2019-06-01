const request = require('request');

module.exports = {
    doRequest: (url, param, actionType='post', headers={}) => {
        return new Promise(resolve => {
            if (actionType === 'post') {
                request.post(url, {
                    json: param
                }, (error, response, body) => {
                    if (!error) {
                        return resolve(body);
                    }
                } );
            }
            else {
                request.get({
                    url: url,
                    headers: headers
                }, (error, response, body) => {
                    if (!error) {
                        return resolve(body);
                    }
                });
            }
        });
    }
}