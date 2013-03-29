(function(win) {

    function $(selector, context) { return (context || window.document.body).querySelector(selector); }
    function $$(selector, context) { return (context || window.document.body).querySelectorAll(selector); }

    var app = {
        uuid: Date.now(),
        stopped: false,
        lastPingDate: null,
        location: {
            latitude: 48.87,
            longitude: 2.33,
            interval: 5000,
            time: -1
        },
        delay: -1,
        history: {
          pongs: [],
          maxPoints: 500
        },
        retry: {
          interval: 1000,
          timer: null
        },
        $logsContainer:null,
        lastLogTimeStamp: (new Date).getTime()
    };

    app.init = function() {
        // bind view events
        app.bindViewEvents();
        $('.to-chart').setAttribute('href',window.location.protocol+'//'+window.location.host +'/chart/'+app.uuid);
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
            app.speedoColor(null);
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
        app.history.pongs = [];

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
        // Update Geolocation, if it's time
        if(Date.now() - app.location.time > app.location.interval) {
          app.logs("Fetching geo location");
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
            var formattedTime = new Date().toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, "$1");
            $logsContainer.innerHTML =  "<p>[" + formattedTime + "] " + message + "</p>" + $logsContainer.innerHTML;
            app.lastLogTimeStamp = (new Date).getTime();
        }
    }

    app.clearLogs = function() {
        $(".logs-container").innerHTML = "";
    }

    app.pong = function(data) {
        if(!app.stopped) {
            app.delay = Math.abs((new Date()).getTime() - app.lastPingDate.getTime());
            app.speedometer(app.delay);
            app.sendPing();
        }
        else {
            console.log("Application stopped do break ping-pong loop")
        }
    };

    app.speedometer = function(delay) {
      // Make some stats
      var history = this.history;
      history.pongs = history.pongs.slice(-history.maxPoints);
      history.pongs.push(delay);

      var max = Math.max.apply(Math, history.pongs),
          min = Math.min.apply(Math, history.pongs),
          range = max - min,
          total = history.pongs.reduce(function(ac, e){
            return ac + e;
          }, 0),
          avg = total / history.pongs.length,
          perc = range == 0 ? 1 : (avg - min) / range;
  
      // Change the speedometer color
      var hue = (120 * perc) >> 0;
      this.speedoColor(hue);

      this.updateStats(avg, max, min);
    };

    app.speedoColor = function(col) {
      $("#oh").style.color = col ? "hsl(" + col + ", 100%, 35%)" : "inherit";
    };

    app.updateStats = function(avg, max, min){
      $(".mean").innerHTML  = avg.toFixed(3);
      $(".max").innerHTML   = max;
      $(".min").innerHTML   = min;
    }

    win.document.addEventListener("DOMContentLoaded", app.init, false);
    window.app = app;
})(window);
