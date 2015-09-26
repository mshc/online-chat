//(function(){
	var ws = null;
	function $(id) {
		return document.getElementById(id);
	}
	window.addEventListener('error', function(e) {
		console.log('window error', e);
	});
	window.addEventListener('load', onLoadWindow, false);

	function onLoadWindow() {
		$('submit-button').addEventListener('click', function() {
			var name = $('name-input').value;
			ws.send(JSON.stringify({
				action: 'auth',
				name: name
			}));
		}, false);
		$('send-button').addEventListener('click', function() {
			var message = $('message-input').value;
			ws.send(JSON.stringify({
				action: 'message',
				message: message
			}));
		}, false);
		initWS();
	}
	function initWS() {
		//var ws = null;
		ws = new WebSocket('ws://localhost:9000');
		ws.addEventListener('error', function(e) {
			console.log('we error', e);
			var $errorPanel = $('error-panel');
			$errorPanel.style.display = 'block';
		});
		ws.addEventListener('close', function(e) {
			console.log('we close', e);
			$('init-container').style.display = 'block';
			$('error-panel').style.display = 'block';
			$('login-form').style.display = 'none';
			$('chat-container').style.display = 'none';
			window.setTimeout(initWS, 5000);
		});
		ws.addEventListener('open', onOpen, false);
		ws.addEventListener('message', onMessage, false);
	}

	function onMessage(event) {
		console.log('message', event.data);
		var message = JSON.parse(event.data);
		switch (message.action) {
			case 'auth-success':
				showUI();
				break;
			case 'load-users':
				var users = message.users;
				var $usersList = $('users-list');
				while ($usersList.firstChild) {
					$usersList.removeChild($usersList.firstChild);
				}
				for (var i = 0; i < users.length; i++) {
					var div = document.createElement('div');
					div.innerHTML = users[i];
					$usersList.appendChild(div);
				}
				break;
			case 'load-messages':
				var messages = message.messages;
				var $messagesList = $('messages-list');
				while ($messagesList.firstChild) {
					$messagesList.removeChild($messagesList.firstChild);
				}
				for (var i = 0; i < messages.length; i++) {
					var div = document.createElement('div');
					var date = new Date(messages[i].date);
					div.innerHTML = '(' + date.toLocaleString() + ') ' + messages[i].user + ': ' + messages[i].text;
					$messagesList.appendChild(div);
				}
				break;
			case 'user-message':
				var message = message.message;
				console.log('user-message', message);
				var $messagesList = $('messages-list');
				var div = document.createElement('div');
				var date = new Date(message.date);
				div.innerHTML = '(' + date.toLocaleString() + ') ' + message.user + ': ' + message.text;
				$messagesList.appendChild(div);
				break;
			case 'user-join':
				var user = message.user;
				var $usersList = $('users-list');
				var div = document.createElement('div');
				div.innerHTML = user;
				$usersList.appendChild(div);
				break;
			case 'user-left':
				var user = message.user;
				var $usersList = $('users-list');
				var nodes = $usersList.childNodes;
				console.log(nodes);
				for (i = 0; i < nodes.length; i ++) {
					if (nodes[i].innerText == user) {
						$usersList.removeChild(nodes[i]);
					}
				}
				break;
		}
	}
	function onOpen(event) {
		$('init-container').style.display = 'block';
		$('login-form').style.display = 'block';
		$('error-panel').style.display = 'none';
		$('chat-container').style.display = 'none';
	}
	function showUI() {
		$('init-container').style.display = 'none';
		$('chat-container').style.display = 'block';
	}

//})();

