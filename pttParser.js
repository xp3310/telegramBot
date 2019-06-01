const commonLib = require('commonLib');
const baseUrl = 'https://www.ptt.cc';
const filterBlackList = ['公告'];
const totalPage = 2;
let HTMLParser = require('node-html-parser');


module.exports = (function(){
    function getPreviousPageUrl (pageRoot) {
        let actionBtnGroupList = pageRoot.querySelectorAll('#action-bar-container .btn-group-paging a'),
            previousUrl = '';

        for(let i in actionBtnGroupList) {

            if (actionBtnGroupList[i].text === '‹ 上頁') {
                previousUrl = baseUrl + actionBtnGroupList[i].attributes['href'];

                break;
            }
        }

        return previousUrl;
    }

    async function getPttArticleList(url) {
        let ret = await commonLib.doRequest(url, {}, 'get', {Cookie: "over18='1'"}),
            pageRoot = HTMLParser.parse(ret),
            listHtmlNode = pageRoot.querySelectorAll('.r-ent'),
            articleInfo = [],
            previousUrl = getPreviousPageUrl(pageRoot),
            success = false;


        for(let i in listHtmlNode) {
            articleInfo.push({
                title: listHtmlNode[i].querySelector('.title a')  === null ? ''
                                                                           : listHtmlNode[i].querySelector('.title a').text,
                url: listHtmlNode[i].querySelector('.title a')  === null ? ''
                                                                         : baseUrl + listHtmlNode[i].querySelector('.title a').attributes['href'],
                cnt: ( listHtmlNode[i].querySelector('.nrec span') ) === null ? 0
                                                                              : parseInt(listHtmlNode[i].querySelector('.nrec span').text, 10)
            })
        };
        if (articleInfo.length > 0 && previousUrl !== '') {
            success = true;
        }

        return {
            list: articleInfo,
            success: success,
            previousUrl: previousUrl
        };
    }

    function filterArticle(articleList) {
        let ret = articleList.filter((article) => {
            for(let i in filterBlackList) {
                let banWord = filterBlackList[i],
                    haveBanWord = article.title.indexOf(banWord) !== -1;

                if (haveBanWord) {
                    return false;
                }
            }

            return true;
        });

        return ret;
    }


    function getMostPopularArticle(articleList) {
        let ret = {
            cnt: 0
        };

        for(let i in articleList) {
            if (articleList[i].cnt >= ret.cnt) {
                ret = articleList[i];
            }
        }

        return ret;
    }


    return {
        getArticle: async function(){
            return new Promise(async (resolve)=> {
                let url = 'https://www.ptt.cc/bbs/Gossiping/index.html',
                    articleInfo = [],
                    articleLisAfterFilter;

                for(let i=0; i<totalPage; i++) {
                    let articleListInfo = await getPttArticleList(url);
                    if (!articleListInfo.success) {
                        break;
                    }

                    articleInfo.push(...articleListInfo.list);
                    url = articleListInfo.previousUrl;

                }
                
                articleLisAfterFilter = filterArticle(articleInfo);

                let mostPopularArticle = getMostPopularArticle(articleLisAfterFilter);
                return resolve(mostPopularArticle);
            });
        }
    }
})();

