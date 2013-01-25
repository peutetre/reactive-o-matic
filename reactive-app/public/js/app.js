(function(win) {

    function $(selector, context) { return (context || window.document.body).querySelectorAll(selector); }

    var app = {
        stopped: false
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
            app.stopped;
        });

        $(".reset")[0].addEventListener("click", function() {
            app.clearLogs();
            app.logs("User triggered Reset button");
        });
    }

    app.initConnection = function() {
        var req = new XMLHttpRequest();
        req.open("GET", "/hi?me=" + app.me.id, true);
        req.send(null);

        req.onreadystatechange = function() {
            if (req.readyState === 4) {
                if(req.status === 200) {
                    ROM.geolocation.init();
                    app.initWS();
                } else {
                    console.log("Identification refused : " + app.me.id);
                }
            }
        };
    }

    app.initWS = function() {
        app.connection = new WebSocket("/ping");
        app.connection.onopen = function (event) {
          app.connectionOpened();
        };
        app.connection.onmessage = function (event) {
          console.log("Received event from WS : " + event.data);

        }
    }

    app.connectionOpened = function() {
        app.sendPing();
    }

    app.sendPing = function() {
        console.log("Sending ping")
        ROM.geolocation.getPosition(function(latitude, longitude) {
            var ping = { latitude: latitude, longitude: longitude };
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

    app.pong = function() {
        if(!app.stopped) {
            app.sendPing();
        }
        else {
            console.log("Applciation stopped do break ping-pong loop")
        }
    }

    win.document.addEventListener("DOMContentLoaded", app.init, false);
    window.app = app;
})(window);