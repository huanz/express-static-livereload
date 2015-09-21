var fs = require('fs');
var path = require('path');
var watch = require('node-watch');
var chalk = require('chalk');

function isObject(value) {
    var type = typeof value;
    return !!value && type === 'object';
};

function extend() {
    var i = 1;
    var target = arguments[0] || {};
    var len = arguments.length;
    var obj, keys, j;
    for (; i < len; i++) {
        obj = arguments[i];
        if (isObject(obj)) {
            keys = Object.keys(obj);
            j = keys.length;
            while (j--) {
                target[keys[j]] = obj[keys[j]];
            }
        }
    }
    return target;
}

function _logPrefix() {
    var now = new Date();
    var str = now.getHours() + ':' + now.getMinutes() + ':' + now.getSeconds();
    return '[' + chalk.cyan(str) + ']';
};

function log() {
    process.stdout.write(_logPrefix() + ' ');
    console.log.apply(console, arguments);
}

function isHtml(req) {
    var ha = req.headers['accept'];
    if (!ha) return false;
    return (~ha.indexOf('html'));
}

var ignoreList = ['.js', '.css', '.woff', '.woff2', 'eot', 'ttf', '.svg', '.ico', '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp'];

function isIgnore(url) {
    if (!url) return true;
    return ignoreList.some(function(item) {
        return (~url.indexOf(item));
    });
}

function existBody(regex, html) {
    if (!html) return false;
    return regex.test(html);
}

function injectSnap(regex, html, snippet) {
    return html.replace(regex, function(w) {
        return w + snippet;
    });
}

var defaluts = {
    path: 'public',
    port: 35729,
    match: /<body[^>]*>/i,
    filter: function(filename) {
        return !/node_modules/.test(filename);
    },
    delay: 1000,
    clientConsole: false
};

module.exports = function(opt) {
    var config = extend({}, defaluts, opt);
    if (!config.server) {
        console.log('you must config your server');
        return function(req, res, next) {
            next();
        };
    }
    var snippet = '<script id="__ds_socket__" src="/socket.io/socket.io.js"></script>';
    if (config.clientConsole) {
        snippet += '<script src="/__ds/__ds_livereload_console.js"></script>';
    } else {
        snippet += '<script async src="/__ds/__ds_livereload.js"></script>';
    }
    var io = require('socket.io')(config.server);

    io.on('connection', function(socket) {
        log('Livereload client connected');
        if (config.clientConsole) {
            socket.on('console:log', function(args) {
                args.unshift(chalk.green('LOG'));
                log.apply(null, args);
            });
            socket.on('console:warn', function(args) {
                args.unshift(chalk.yellow('WARN'));
                log.apply(null, args);
            });
            socket.on('console:info', function(args) {
                args.unshift(chalk.cyan('INFO'));
                log.apply(null, args);
            });
            socket.on('console:error', function(args) {
                args.unshift(chalk.red('ERROR'));
                log.apply(null, args);
            });
        }
    });

    // 监听文件变化，reload
    var changedQueue = {};
    var boardcastChange = function(filename) {
        log('change: ' + chalk.yellow(path.relative(config.path, filename)));
        io.emit('file:change', {
            path: filename,
            name: path.basename(filename),
            ext: path.extname(filename).replace(/^\./, ''),
        });
        changedQueue[filename].stamp = Date.now();
    };
    watch(config.path, function(filename) {
        if (config.filter(filename)) {
            if (!changedQueue[filename]) {
                changedQueue[filename] = {};
                boardcastChange(filename);
            } else if (Date.now() - changedQueue[filename].stamp > config.delay) {
                boardcastChange(filename);
            } else {
                if (!changedQueue[filename].timer) {
                    setTimeout(function() {
                        boardcastChange(filename);
                    }, Date.now() - changedQueue[filename].stamp);
                    changedQueue[filename].timer = 1;
                }
            }
        }
    });

    return function(req, res, next) {
        var end = res.end;
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
        if (req.url.indexOf('/__ds/__ds_livereload') !== -1) {
            res.sendfile(__dirname + '/lib/__ds_livereload' + (config.clientConsole ? '_console.js' : '.js'));
        } else if (res.injected || !isHtml(req) || isIgnore(req.url)) {
            return next();
        } else {
            res.end = function(string, encoding) {
                if (string !== undefined) {
                    var html = string instanceof Buffer ? string.toString(encoding) : string;
                    if (existBody(config.match, html)) {
                        res.data = (res.data || '') + injectSnap(config.match, html, snippet);
                        res.injected = true;
                        if (!res._header) {
                            res.setHeader('content-length', Buffer.byteLength(res.data, encoding));
                        }
                    }
                }
                end.call(res, res.data, encoding);
            };
            return next();
        }
    };
};
