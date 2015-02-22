/*
* ideas: перевести шаг в проценты
* */

var lastInternet,
    options = {
        id: 'etisalat-internet',
        step: 100,
        timeoutSuccess: minToMl(3),
        timeoutFail: minToMl(10),
        notificationTime: 3000
    };

// first call
refresh();

function minToMl(min) {
    return min * (60 * 1000)
}

function getInternet(){
    var dfd = $.Deferred();
    $.ajax({
        url: 'https://mypage.etisalat.lk/bbportal/home'
    }).done(function(html){
        var found = html.match(/\<label id=\"remainingValPeak\"\>\s+([0-9]+)/)[1];

        dfd.resolve({
           quota: parseInt(found)
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
        iconUrl: "icons/etisalat-logo.jpg"
    }, function(id){});

    setTimeout(function(){
        chrome.notifications.clear(options.id, function(status){})
    }, options.notificationTime);
}

function refresh(){
    getInternet().done(function(data){
        var firstCall = typeof lastInternet === 'undefined',
            step = (data.quota > 100) ? options.step : 25;

        if (firstCall || ((lastInternet - data.quota) >= step)) {
            notify({quota: data.quota});
            lastInternet = data.quota;
        }
        setTimeout(refresh, options.timeoutSuccess);
    }).fail(function(){
        setTimeout(refresh, options.timeoutFail);
    });
}