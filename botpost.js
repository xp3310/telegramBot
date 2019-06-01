const commonLib = require('commonLib');
const config = require('config.json');
const pttParser = require('pttParser');

const URL = {
    TELEGRAM: {
        SEND: config.TELEGRAM_API_BASE_URL + 'sendMessage',
        GET_UPDATE: config.TELEGRAM_API_BASE_URL + 'getUpdates'
    },
    GOOGLE: {
        GET_MESSAGE_SHEET: config.GET_MESSAGE_SHEET
    }
};
const FORCE_SKIP = false;
const HOUR_OFFSET = 8;
const AVAILIABLE_HOURS = [9, 10, 11, 13, 14, 15, 16, 17, 18, 19];
const AVAILIABLE_DAY = [1, 2, 3, 4, 5];
const DURATION_THRESHOLD = 30 ;

exports.handler = async (event) => {

    async function isLongTimeNoChat() {
        let now = new Date();
        // JZ:這是手動幫UTC時間+8嗎
        now.setUTCHours(now.getHours() + HOUR_OFFSET);

        let nowHour = now.getHours(),
            nowDay = now.getDay(),
            updatedMsg = await commonLib.doRequest(URL.TELEGRAM.GET_UPDATE, {
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
        let messagePoolFromGoogleSheet = await commonLib.doRequest(URL.GOOGLE.GET_MESSAGE_SHEET, {}, 'get'),
            messageJsonData = JSON.parse(messagePoolFromGoogleSheet),
            messageData = messageJsonData.feed.entry,
            randMessage = messageData[Math.floor(Math.random() * messageData.length)].content['$t'];

        return randMessage;

    }

    function sendMessageToTelegram(message) {
        commonLib.doRequest(URL.TELEGRAM.SEND, {
            chat_id: config.CHAT_ID,
            text: message
        });
    }


    return new Promise(async (resolve)=> {

        if(FORCE_SKIP) {
            return;
        }
        
        if ( await isLongTimeNoChat() ) {

            let randMessage = await getRandMessageFromGoogleSheet(),
                pttArticle = await pttParser.getArticle(),
                selecteMessage = Math.floor( Math.random() * 2 ) === 0 ? randMessage
                                                                      : pttArticle.url;

            sendMessageToTelegram(selecteMessage);
        }

    });

};

