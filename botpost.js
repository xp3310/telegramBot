const request = require('request');
const config = require('config.json');

const URL = {
    TELEGRAM: {
        SEND: config.TELEGRAM_API_BASE_URL + 'sendMessage',
        GET_UPDATE: config.TELEGRAM_API_BASE_URL + 'getUpdates'
    },
    GOOGLE: {
        GET_MESSAGE_SHEET: config.GET_MESSAGE_SHEET
    }
};
const HOUR_OFFSET = 8;
const AVAILIABLE_HOURS = [9, 10, 11, 13, 14, 15, 16, 17, 18, 19];
const AVAILIABLE_DAY = [1, 2, 3, 4, 5];
const DURATION_THRESHOLD = 30;

exports.handler = async (event) => {
    function doRequest(url, param, actionType='post') {
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
                request.get(url, (error, response, body) => {
                    if (!error) {
                        return resolve(body);
                    }
                });
            }
        });
    };

    async function isLongTimeNoChat() {
        let now = new Date();
        now.setUTCHours(now.getHours() + HOUR_OFFSET);

        let nowHour = now.getHours(),
            nowDay = now.getDay(),
            updatedMsg = await doRequest(URL.TELEGRAM.GET_UPDATE, {
                chat_id: config.CHAT_ID,
                offset: -1,
                limit: 1
            }, 'post'),
            lastMessageUnitTime = updatedMsg.result[0].message.date,
            latestDuration = new Date( now - lastMessageUnitTime*1000 ).getMinutes(),
            longTimeNoChat = (AVAILIABLE_HOURS.indexOf(nowHour) !== -1 &&
                              AVAILIABLE_DAY.indexOf(nowDay) !== -1 &&
                              latestDuration > DURATION_THRESHOLD);

        return longTimeNoChat;
    }

    async function getRandMessageFromGoogleSheet() {
        let messagePoolFromGoogleSheet = await doRequest(URL.GOOGLE.GET_MESSAGE_SHEET, {}, 'get'),
            messageJsonData = JSON.parse(messagePoolFromGoogleSheet),
            messageData = messageJsonData.feed.entry,
            randMessage = messageData[Math.floor(Math.random() * messageData.length)].content['$t'];

        return randMessage;

    }

    function sendMessageToTelegram(message) {
        doRequest(URL.TELEGRAM.SEND, {
            chat_id: config.CHAT_ID,
            text: message
        });
    }


    return new Promise(async (resolve)=> {
        if ( await isLongTimeNoChat() ) {
            let randMessage = await getRandMessageFromGoogleSheet();
            sendMessageToTelegram(randMessage);
        }

    });

};

