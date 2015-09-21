# express-static-livereload [![npm package](https://img.shields.io/npm/v/express-static-livereload?style=flat-square)](https://www.npmjs.com/package/express-static-livereload)

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

[Example](https://github.com/huanz/express-static-livereload/tree/master/example)

# Options

    var defaluts = {
        path: 'public',
        match: /<body[^>]*>/i,
        filter: function(filename) {
            return !/node_modules/.test(filename);
        },
        delay: 1000,
        console: false
    };

 **path**

 `type`: `string/array`

 监听变化的目录。可以是目录名字符串或者数组。

 **match**

 默认匹配`body`开始标签，将相关脚本插入到`body`开始标签之后，可以根据情况修改。`console`:`true`的时候可以改成插入到`head`，可以监听到所有js的报错，并发送到server控制台。

 **filter**

过滤不需要监听的文件。默认过滤掉`path`目录下面`node_modules`目录下文件。

**delay**

修改相同文件同步操作的最小时间间隔。默认`1000ms`

**console**

是否劫持浏览器`console`。开启之后会把浏览器的`console`信息以及错误信息传输到server控制台。如果要在浏览器控制台使用自带的`console`功能，请使用`__console`代替。
