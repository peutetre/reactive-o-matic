(function(win) {

    function $(selector, context) { return (context || window.document.body).querySelector(selector); }
    function $$(selector, context) { return (context || window.document.body).querySelectorAll(selector); }

    var app = {
        stopped: false,
        lastPingDate: null,
        location: {
            latitude: 48.87,
            longitude: 2.33,
            interval: 5000,
            time: -1
        },
        delay: -1,
        uuid: new Date().getTime(),
        retry: {
          interval: 1000,
          count: 0
        },
        $logsContainer:null,
        lastLogTimeStamp: (new Date).getTime()
    };

    app.init = function() {
        app.me = { id: new Date().getTime() };
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
        // Clear reset timer
        clearTimeout(app.retry.timer);

        app.connection = new WebSocket("ws://" + window.location.host + "/hi?uuid=" + app.uuid);

        app.connection.onopen = function (event) {
          app.sendPing();
        };

        app.connection.onmessage = function (evt) {
          app.pong(evt.data);
        };

        app.connection.onerror = function (evt) {
          app.logs(evt, "red");
        };

        app.connection.onclose = function (evt) {
          app.logs("Connection closed. Retry:" + (!app.stopped));
          app.connection = null;
          if(app.stopped) return;

          app.retry.timer = setTimeout(function() {
            app.initWS();
          }, app.retry.interval);

        }
    }

    app.sendPing = function() {

        if(Date.now() - app.location.time > app.location.interval) {
          app.logs("Fetching geo");
          app.location.time = Date.now();
          ROM.geolocation.getPosition(function(latitude, longitude) {
              app.location.latitude = latitude;
              app.location.longitude = longitude;
              app.location.time = Date.now();
          });
        }

        app.lastPingDate = new Date();
        var ping = {
            uuid: app.uuid.toString(),
            position: app.location.latitude + "," + app.location.longitude,
            latency: app.delay
        };
        app.logs("Ping: latency ▶ " + ping.latency + " ms", "green");
        app.connection.send(JSON.stringify(ping));
    }

    app.logs = function(message, cls) {
        if ((new Date).getTime() - app.lastLogTimeStamp > 100) {
            if(!app.$logsContainer) $logsContainer = $(".logs-container");
            var i = document.createElement("p");
            if (cls) i.className = cls;
            $logsContainer.innerHTML =  "<p>[" + (new Date()).toDateString() + "] " + message + "</p>" + $logsContainer.innerHTML;
            app.lastLogTimeStamp = (new Date).getTime();
        }
    }

    app.clearLogs = function() {
        $(".logs-container").innerHTML = "";
    }

    app.pong = function(data) {
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
