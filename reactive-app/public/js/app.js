(function(win) {

    function $(selector, context) { return (context || window.document.body).querySelectorAll(selector); }

    var app = {};

    app.init = function() {
        app.me = { id: new Date().getTime() };
        console.log("Init application");
    };

    app.initConnection = function() {
        var req = new XMLHttpRequest();
        req.open("POST", "/hi", true);
        req.send("me=" + app.me.id);

        req.onreadystatechange = function() {
            if (req.readyState === 4 && req.status === 200) {
                app.initWS();
            } else {
                console.log("Identification refused : " + app.me.id);
            }
        };
    }

    app.initWS = function() {
        app.connection = new WebSocket("/ping");
        app.connection.onopen = function (event) {
          app.connectionOpened();
        };
    }

    app.connectionOpened = function() {
        app.sendPing({ latitude: 2.0, longitude: 45.0 });
    }

    app.sendPing = function(ping) {
        app.logs("Sending " + JSON.stringify(ping));
        app.connection.send(JSON.stringify(ping));
    }

    app.logs = function(message) {
        var $logsContainer = $(".logs-container")[0];
        $logsContainer.innerHTML = "<p>" + message + "</p>" + $logsContainer.innerHTML;
    }

    win.document.addEventListener("DOMContentLoaded", app.init, false);
    window.app = app;
})(window);