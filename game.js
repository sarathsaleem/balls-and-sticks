function game(sockets) {
    var players = [],
        grid = [],
        balls = [],
        gameOver = false;

    function emit(action, params) {
        players.forEach(function (player) {
            player.socket.emit(action, params);
        });
    }

    function getRandomArbitrary(min, max) {
        return Math.random() * (max - min) + min;
    }

    function init(sockets) {
        var gSize = 25,
            numSticks = 90,
            numBalls = 40,
            numPosts = 4,
            x,
            y,
            temp;

        console.log('Game started');

        players = [];
        grid = [];
        balls = [];

        for (var i = 0; i < sockets.length; i++) {
            players.push({
                socket: sockets[i],
                point: 0
            });
        }

        for (var i = 0; i < gSize; i++) {
            grid[i] = [];

            for (var j = 0; j < gSize; j++) {
                grid[i][j] = null;
            }
        }

        ['red', 'blue'].forEach(function (color) {
            for (var i = 0; i < numSticks; i++) {
                do {
                    temp = Math.floor(gSize * gSize * Math.random());
                    x = Math.floor(temp / gSize);
                    y = temp - (x * gSize);

                    if (grid[x][y] === null && x !== 0 && y !== 0 && x !== gSize - 1 && y !== gSize - 1) {
                        if (grid[x - 1][y] === null && grid[x + 1][y] === null && grid[x][y - 1] === null && grid[x][y + 1] === null) {
                            break;
                        }
                    }

                } while (true);

                grid[x][y] = {
                    type: 'stick',
                    color: color,
                    orientation: Math.floor(2 * Math.random()) + 1
                };
            }

            for (var i = 0; i < numPosts; i++) {
                do {
                    temp = Math.floor(gSize * gSize * Math.random());
                    x = Math.floor(temp / gSize);
                    y = temp - (x * gSize);

                    if (grid[x][y] === null && x !== 0 && y !== 0 && x !== gSize - 1 && y !== gSize - 1) {
                        break;
                    }

                } while (true);

                grid[x][y] = {
                    type: 'post',
                    color: color
                };
            }
        });

        for (var i = 0; i < numBalls; i++) {
            do {
                temp = Math.floor(gSize * gSize * Math.random());
                x = Math.floor(temp / gSize);
                y = temp - (x * gSize);

                if (grid[x][y] === null && x !== 0 && y !== 0 && x !== gSize - 1 && y !== gSize - 1) {
                    break;
                }
            } while (true);

            balls.push({
                speed: getRandomArbitrary(.005, .01),
                dir: ['up', 'down', 'right', 'left'][Math.floor(4 * Math.random())],
                x: x,
                y: y,
                id: i
            });
        }

        for (var i = 0; i < sockets.length; i++) {
            socket = sockets[i];
            socket.emit('event-grid', {
                grid: grid,
                balls: balls,
                player: ['red', 'blue'][i]
            });

            socket.on("click-event", function (data) {
                grid[data.x][data.y].orientation = (grid[data.x][data.y].orientation === 1 ? 2 : 1);
                emit('event-stick', {
                    x: data.x,
                    y: data.y,
                    orientation: grid[data.x][data.y].orientation
                });
            });
        }

        for (var i = 0; i < balls.length; i++) {
            setNextPosition(balls[i]);
        }
    }

    setTimeout(function () {
        console.log('Game Ended');
        gameOver = true;

        if (players[0].point == players[1].point) {
            emit('event-end', 'Draw');
            return;
        }

        var winner = players[0].point > players[1].point ? 0 : 1,
            loser = winner === 1 ? 0 : 1;

        players[winner].socket.emit('event-end', 'You won');
        players[loser].socket.emit('event-end', 'You lost');

        players[0].socket.disconnect();
        players[1].socket.disconnect();
    }, 2.5 * 60 * 1000);


    /******************************/

    function setNextPosition(ball) {
        var nextX = 0,
            nextY = 0,
            player,
            time;

        if (gameOver) {
            return;
        }

        if (grid[ball.x][ball.y] !== null) {
            if (grid[ball.x][ball.y].type === 'post') {
                player = players[['red', 'blue'].indexOf(grid[ball.x][ball.y].color)];
                player.point++;
                emit('event-ball-delete', {
                    ball: ball,
                    points: [players[0].point, players[1].point]
                });
                return;
            }

            if (grid[ball.x][ball.y].orientation === 1) {
                switch (ball.dir) {
                case 'left':
                    ball.dir = 'up';
                    break;
                case 'right':
                    ball.dir = 'down';
                    break;
                case 'up':
                    ball.dir = 'left';
                    break;
                case 'down':
                    ball.dir = 'right';
                    break;
                }
            } else {
                switch (ball.dir) {
                case 'left':
                    ball.dir = 'down';
                    break;
                case 'right':
                    ball.dir = 'up';
                    break;
                case 'up':
                    ball.dir = 'right';
                    break;
                case 'down':
                    ball.dir = 'left';
                    break;
                }
            }
        }

        switch (true) {
        case ball.dir === 'left' && ball.y === 0:
            ball.dir = 'right';
            break;
        case ball.dir === 'right' && ball.y === grid[ball.x].length - 1:
            ball.dir = 'left';
            break;
        case ball.dir === 'up' && ball.x === 0:
            ball.dir = 'down';
            break;
        case ball.dir === 'down' && ball.x === grid.length - 1:
            ball.dir = 'up';
            break;
        }

        switch (ball.dir) {
        case 'left':
            nextX = ball.x;
            nextY = 0;

            for (var i = ball.y - 1; i >= 0; i--) {
                if (grid[ball.x][i] != null) {
                    nextY = i;
                    break;
                }
            }
            break;

        case 'right':
            nextX = ball.x;
            nextY = grid[ball.x].length - 1;

            for (var i = ball.y + 1; i < grid[ball.x].length; i++) {
                if (grid[ball.x][i] != null) {
                    nextY = i;
                    break;
                }
            }
            break;

        case 'up':
            nextY = ball.y;
            nextX = 0;

            for (var i = ball.x - 1; i >= 0; i--) {
                if (grid[i][ball.y] != null) {
                    nextX = i;
                    break;
                }
            }
            break;

        case 'down':
            nextY = ball.y;
            nextX = grid.length - 1;

            for (var i = ball.x + 1; i < grid.length; i++) {
                if (grid[i][ball.y] != null) {
                    nextX = i;
                    break;
                }
            }
            break;
        }

        time = (Math.abs(ball.x - nextX) + Math.abs(ball.y - nextY)) / ball.speed;
        ball.x = nextX;
        ball.y = nextY;
        ball.time = time;
        setTimeout(setNextPosition.bind(undefined, ball), time);
        emit('event-ball', ball);
    }

    init(sockets);
}

module.exports = game;