var io = require('socket.io'),
    express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = io.listen(server),
    game = require(__dirname + '/game'),
    sockets = [];

server.listen(3000);
app.get('/index.html', function(req, res){
    res.sendfile('index.html', {root: './'});
});

io.sockets.on('connection', function(socket) {
    sockets.push(socket);

    if(sockets.length == 2){
        game(sockets.slice(0));
        sockets = [];
    }
});










