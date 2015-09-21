# express-static-livereload

a express middleware to livereload static files

# Installation

    $ npm install express-static-livereload  --save-dev

# Usage

    var express = require('express');
    var app = express();
    var server = require('http').Server(app);

    if (app.get('env') === 'development') {
        var reload = require('express-static-livereload');
        app.use(reload({
            server: server,
            path: 'public'
        }));
    }

    server.listen(3000);
