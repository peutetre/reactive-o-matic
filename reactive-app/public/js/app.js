(function(win) {

    function $(selector, context) { return (context || window.document.body).querySelectorAll(selector); }

    var app = {
        stopped: false,
        lastPingDate: null,
        delay: -1
    };

    app.init = function() {
        app.me = { id: new Date().getTime() };
        console.log("Init application");

        // bind view events
        app.bindViewEvents();
    };

    app.bindViewEvents = function() {
        $(".play")[0].addEventListener("click", function() {
            app.logs("User triggered Play button");
            app.initConnection();
        });

        $(".stop")[0].addEventListener("click", function() {
            app.logs("User triggered Stop button");
            app.stopped = true;
        });

        $(".reset")[0].addEventListener("click", function() {
            app.clearLogs();
            app.logs("User triggered Reset button");
        });
    }

    app.initConnection = function() {
        ROM.geolocation.init();
        app.initWS();
    }

    app.initWS = function() {
        app.connection = new WebSocket("ws://localhost:9000/hi?uuid=" + new Date().getTime());
        app.connection.onopen = function (event) {
          app.connectionOpened();
        };
        app.connection.onmessage = function (event) {
          console.log("Received event from WS : " + event.data);
          app.pong(event.data);
        }
    }

    app.connectionOpened = function() {
        app.sendPing();
    }

    app.sendPing = function() {
        console.log("Sending ping")
        ROM.geolocation.getPosition(function(latitude, longitude) {
            console.log("Current location : " + latitude + " - " + longitude);
            app.lastPingDate = new Date();
            var ping = { latitude: latitude, longitude: longitude, delay: app.delay };
            app.logs("Ping " + JSON.stringify(ping) + " ...");
            app.connection.send(JSON.stringify(ping));
            console.log("Ping sent")
        })
    }

    app.logs = function(message) {
        console.log(message)
        var $logsContainer = $(".logs-container")[0];
        $logsContainer.innerHTML = "<p>[" + (new Date()).toISOString() + "] " + message + "</p>" + $logsContainer.innerHTML;
    }

    app.clearLogs = function() {
        $(".logs-container")[0].innerHTML = "";
    }

    app.pong = function(data) {
        app.logs("Pong : " + data);
        if(!app.stopped) {
            app.delay = Math.abs((new Date()).getTime() - app.lastPingDate.getTime());
            app.sendPing();
        }
        else {
            console.log("Application stopped do break ping-pong loop")
        }
    }

    win.document.addEventListener("DOMContentLoaded", app.init, false);
    window.app = app;
})(window);