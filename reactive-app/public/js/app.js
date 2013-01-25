(function(win) {
    var app = {};

    app.init = function() {
        console.log("init application");
    };

    win.document.addEventListener("DOMContentLoaded", app.init, false);
})(window);