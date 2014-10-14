/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global require, exports, io, $ */

var socket = io.connect('');
socket.on("connect", function () {});


socket.on("event-grid", init);
socket.on("event-ball", updateball);
socket.on('event-stick', updateStick);
socket.on('event-ball-delete', deleteBall);
socket.on('event-end', finishGame);

function init(data) {
    getGrid(data.grid, data.balls, data.player);
}

function getGrid(grid, balls, player) {
    var clear = '<div class="clear" />';
    var ballStr = '<div class="ball"></div>';
    var gridMap = '';

    $("#main").attr("player", player);
    $('body').removeClass('red blue').addClass(player);
    $('.red-point').text(0);
    $('.blue-point').text(0);

    $('.iam').text('I am ' + player.toUpperCase());

    for (var i = 0; i < grid.length; i++) {
        for (var j = 0; j < grid[i].length; j++) {
            var mclass = '';

            if (grid[i][j] !== null) {
                if (grid[i][j].type === 'stick') {
                    mclass = 'stick stick-' + grid[i][j].orientation + ' ' + grid[i][j].color;
                } else {
                    mclass = 'post-' + grid[i][j].color;
                }
            }

            gridMap += '<div class="cell ' + mclass + '" pos="' + i + ',' + j + '" />';
        }
        gridMap += clear;
    }

    $("#main").html(gridMap);

    for (var i = 0; i < balls.length; i++) {
        var ball = balls[i];
        var pos = ball.x + ',' + ball.y;
        var ballStr = $('<div class="ball" id="' + ball.id + '"></div>');

        $("#main").append(ballStr);
        $(ballStr).css($('.cell').filter('[pos="' + pos + '"]').position());
    }


    $('.stick').on('click', function () {

        if ($("#main").attr('player') === 'blue' && $(this).hasClass('red')) {
            return;
        }
        if ($("#main").attr('player') === 'red' && $(this).hasClass('blue')) {
            return;
        }

        var pos = $(this).attr('pos');
        socket.emit("click-event", {
            x: +(pos.split(',')[0]),
            y: +(pos.split(',')[1])
        });
    })
}


function updateball(ball) {
    var pos = ball.x + ',' + ball.y;
    $('#' + ball.id).finish().animate($('.cell').filter('[pos="' + pos + '"]').position(), ball.time);
}

function updateStick(stick) {
    $('[pos="' + stick.x + ',' + stick.y + '"]').removeClass('stick-1 stick-2').addClass('stick-' + stick.orientation);
}

function deleteBall(data) {
    $('#' + data.ball.id).remove();

    $('.red-point').text(data.points[0]);
    $('.blue-point').text(data.points[1]);

}

function finishGame(msg) {
    alert(msg);
    window.location = window.location;
}
