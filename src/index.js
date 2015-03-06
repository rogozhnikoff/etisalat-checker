/*
* ideas: перевести шаг в проценты
* */

var lastInternet,
    timer,
    options = {
        id: 'etisalat-internet',
        step: 100,
        timeoutSuccess: minToMl(3),
        timeoutFail: minToMl(10),
        notificationTime: 3000
    };

// first call
refresh();

chrome.browserAction.onClicked.addListener(function() {
    clearTimeout(timer);
    refresh();
});

function minToMl(min) {
    return min * (60 * 1000)
}

function isOffPeak() {
    return (new Date()).getHours() < 8
}
function getSelectorByTime() {
    return isOffPeak() ? 'remainingValOffPeak' : 'remainingValPeak'
}

function getInternet(){
    var dfd = $.Deferred();

    $.ajax({
        url: 'https://mypage.etisalat.lk/bbportal/home'
    }).done(function(html){
        dfd.resolve({
           quota: parseInt(
               html.match(
                   new RegExp('<label id="' + getSelectorByTime() + '">\\s+([0-9]+)\\s+[A-z]+\\s+</label>', 'im')
               )[1]
           )
        });
    }).fail(function(status){
        dfd.reject({
            status: status
        });
    });

    return dfd.promise();
}

function notify(data){
    chrome.notifications.create(options.id, {
        type: 'basic',
        title: 'Йо, интернета осталось ' + data.quota + ' mb.',
        message: 'fuckMessage',
        priority: 1,
        eventTime: Date.now() + 1000,
        iconUrl: "icons/etisalat-logo.png"
    }, function(id){});

    setTimeout(function(){
        chrome.notifications.clear(options.id, function(status){})
    }, options.notificationTime);
}

function isString(some) {
    return typeof some === 'string'
}

function transformToString(some) {
    return some + '';
}

function sliceMoreFour(str) {
    if (!isString(str)) str = transformToString(str);

    if (str.length <= 4) return str;

    return str.slice(0, 4)
}

function refresh(){
    getInternet().done(function(data){
        var firstCall = typeof lastInternet === 'undefined',
            step = (data.quota > 100) ? options.step : 25;


        if (firstCall || ((lastInternet - data.quota) >= step)) {
            notify({quota: data.quota});
            lastInternet = data.quota;
        }
        chrome.browserAction.setBadgeText({
            text: sliceMoreFour(data.quota)
        });

        timer = setTimeout(refresh, options.timeoutSuccess);

    }).fail(function(){
        timer = setTimeout(refresh, options.timeoutFail);
    });
}