(function(win) {
    var geolocation = {};

    geolocation.init = function() {
        if ("geolocation" in navigator) {
            geolocation.inner = navigator.geolocation;
        } else {
            console.log("I'm sorry, but geolocation services are not supported by your browser.");
        }
    }

    geolocation.getPosition = function(cb) {
        geolocation.inner.getCurrentPosition(function(position) {
          cb(position.coords.latitude, position.coords.longitude);
        });
    }

    win.ROM = { geolocation: geolocation };
})(window)