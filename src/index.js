/*
 * ideas: перевести шаг в проценты
 * */

var lastInternet,
    timer,
    options = {
        id: 'etisalat-internet',
        url: 'https://mypage.etisalat.lk/bbportal/home',
        step: 100,
        timeoutSuccess: minToMl(3),
        timeoutFail: minToMl(10),
        notificationTime: 3000,
        forNotifications: {
            type: 'basic',
            message: 'checker-message',
            priority: 1,
            iconUrl: "icons/etisalat-logo.png"
        },
        selectors: {
            offpeak: 'remainingValOffPeak',
            peak: 'remainingValPeak'
        }
    };

// first call
refresh();


chrome.browserAction.onClicked.addListener(function () {
    clearTimeout(timer);
    refresh();
});

function getInternet() {
    var dfd = $.Deferred();

    $.ajax({
        url: options.url
    }).done(function (html) {
        dfd.resolve({
            quota: parseInt(
                html.match(
                    new RegExp(
                        '<label id="'
                            + isOffPeak() ? options.selectors.offpeak : options.selectors.peak
                            + '">\\s+([0-9]+)\\s+[A-z]+\\s+</label>',
                        'im'
                    )
                )[1]
            )
        });
    }).fail(function (status) {
        dfd.reject({
            status: status
        });
    });

    return dfd.promise();
}

function notify(data) {
    chrome.notifications.create(
        options.id,
        extend(
            options.forNotifications,
            {title: 'Йо, интернета осталось ' + data.quota + ' mb.'}
        ),
        noop
    );

    setTimeout(function () {
        chrome.notifications.clear(options.id, noop)
    }, options.notificationTime);
}


function refresh() {
    setBadge('...');
    getInternet().done(function (data) {
        var firstCall = typeof lastInternet === 'undefined',
            step = (data.quota > 100) ? options.step : 25;


        if (firstCall || ((lastInternet - data.quota) >= step)) {
            notify({quota: data.quota});
            lastInternet = data.quota;
        }

        setBadge(data.quota);

        timer = setTimeout(refresh, options.timeoutSuccess);

    }).fail(function () {
        setBadge('=(');
        timer = setTimeout(refresh, options.timeoutFail);
    });
}

function setBadge(text) {
    return chrome.browserAction.setBadgeText({
        text: sliceMoreFour(text)
    });
}

/*
 * Clean helpers function
 * */

function noop() {

}

function extend(x, y) {
    var ret = {};
    for (var xname in x) {
        if (x.hasOwnProperty(xname)) {
            ret[xname] = typeof y[xname] !== 'undefined' ? y[xname] : x[xname];
        }
    }
    for (var yname in y) {
        if (y.hasOwnProperty(yname)) {
            ret[yname] = y[yname]
        }
    }
    return ret;
}
function minToMl(min) {
    return min * (60 * 1000)
}

function isOffPeak() {
    return (new Date()).getHours() < 8
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