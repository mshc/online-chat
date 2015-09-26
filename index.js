var express = require('express');
var WebSocketServer = require('ws').Server;
var app = express();

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(request, response) {
	response.render('pages/index');
});

app.listen(app.get('port'), function() {
	console.log('Node app is running on port', app.get('port'));
});

var MESSAGES = {
	'USER_MESSAGE': 1,
	'USER_JOIN': 2,
	'USER_LEFT': 3
}

function Users() {
	var list = [];
	this.join = function(username) {
		list.push(username);
		console.log('users join', username, JSON.stringify(list));
	};
	this.remove = function(username) {
		var index = list.indexOf(username);
		list.splice(index, 1);
		console.log('users remove', username, JSON.stringify(list));
	};
	this.get = function() {
		return list.slice();
	};
	this.exists = function(name) {
		return !(list.indexOf(name) == -1);
	}
}
var users = new Users();

function Messages() {
	var list = [];
	this.add = function(message) {
		list.push(message);
	};
	this.get = function(from, to) {
		from = from || 0;
		to = to || from + 20;
		return list.slice(from, to);
	};
}
var messages = new Messages();

var wss = new WebSocketServer({port: 9000});
wss.on('connection', function (ws) {	
	var username = '';
	var registered = false;
	console.log('on connection');

	ws.on('message', function (message) {
		console.log('message', message);
		var event = null;
		try {
			event = JSON.parse(message);
			console.log('event', event);
		} catch (e) {
			console.log('PARSE error');
			return;
		}
		//console.log('event', JSON.stringify(event));
		switch (event.action) {
			case 'auth': 
				username = event.name;
				console.log('username', username);
				if (users.exists(username)) {
					console.log('send message auth-fail');
					ws.send(JSON.stringify({
						'action': 'auth-fail',
						'message': 'User already exists'
					}));
				} else {
					console.log('send message auth-success');
					users.join(username);
					ws.send(JSON.stringify({
						'action': 'auth-success'
					}));
					broadcast({
						'action': 'user-join',
						'user': username
					});
					var usersList = users.get();
					ws.send(JSON.stringify({
						'action': 'load-users',
						'users': usersList
					}));
					var messagesList = messages.get();
					ws.send(JSON.stringify({
						'action': 'load-messages',
						'messages': messagesList
					}));
				}
				break;
			case 'message':
				var text = event.message
				console.log('user message', text);
				var now = new Date().getTime();
				var message = {
					user: username,
					text: text,
					date: now
				};
				messages.add(message);
				broadcast({
					'action': 'user-message',
					'message': message
				});
				break;
		}
	});

	ws.on('close', function() {
		console.log('close');
		if (username) {
			users.remove(username);
			broadcast({
				'action': 'user-left',
				'user': username
			});
		}
	});

	ws.on('error', function() {
		console.log('error');
	})
});


function broadcast(message) {
	console.log('broadcast', JSON.stringify(message));
	var now = new Date().getTime();
	message.date = now;
	if (wss && wss.clients) {
		wss.clients.forEach(function (ws) {
			ws.send(JSON.stringify(message));
		});
	}
}