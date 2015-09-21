var express = require('express');
var reload = require('../index');
var app = express();
var server = require('http').Server(app);


app.engine('.html', require('ejs').__express);
app.set('views', __dirname + '/views');
app.set('view engine', 'html');


app.use(express.static(__dirname + '/public'));

app.use(reload({
    server: server,
    path: 'public'
}));

var users = [
  { name: 'tobi', email: 'tobi@learnboost.com' },
  { name: 'loki', email: 'loki@learnboost.com' },
  { name: 'jane', email: 'jane@learnboost.com' }
];

app.get('/', function(req, res){
  res.render('users', {
    users: users,
    title: "EJS example",
    header: "Some users"
  });
});

server.listen(3000);
console.log('server started on port 3000');
