window.latitude = 48.87;
window.longitude = 2.33;

(function(win) {

    function $(selector, context) { return (context || window.document.body).querySelector(selector); }
    function $$(selector, context) { return (context || window.document.body).querySelectorAll(selector); }

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
        $(".play").addEventListener("click", function() {
            app.logs("User triggered Play button");
            app.stopped = false;
            app.initConnection();
        });

        $(".stop").addEventListener("click", function() {
            app.logs("User triggered Stop button");
            app.stopped = true;
        });

        $(".reset").addEventListener("click", function() {
            app.clearLogs();
            app.logs("User triggered Reset button");
        });
    }

    app.initConnection = function() {
        ROM.geolocation.init();
        app.initWS();
    }

    app.initWS = function() {
        app.connection = new WebSocket("ws://" + window.location.host + "/hi?uuid=" + new Date().getTime());
        app.connection.onopen = function (event) {
          app.connectionOpened();
        };
        app.connection.onmessage = function (event) {
          console.log("Received event from WS : " + event.data);
          app.pong(event.data);
        }
        app.connection.onerror = function (event) {
          console.log("Received error from WS : " + event.data);
        }

    }

    app.connectionOpened = function() {
        app.sendPing();
    }

    app.sendPing = function() {
        console.log("Sending ping")
        ROM.geolocation.getPosition(function(latitude, longitude) {
            window.latitude = latitude;
            window.longitude = longitude;
        });
            console.log("Current location : " + latitude + " - " + longitude);
            app.lastPingDate = new Date();
            var ping = { uuid: app.me.id.toString(), position: latitude + "," + longitude, latency: app.delay};
            app.logs("Ping " + JSON.stringify(ping) + " ...");
            app.connection.send(JSON.stringify(ping));
            console.log("Ping sent")
       // })
    }

    app.logs = function(message) {
        console.log(message)    
        var $logsContainer = $(".logs-container");
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
