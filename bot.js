var Discord = require("discord.js");
var ytdl = require('ytdl-core');
var client = new Discord.Client();
var config = require("./config.json");
var YouTube = require('youtube-node');
var youTube = new YouTube();
youTube.setKey(config.youTubeKey);

//Globals
var volume = .5;
var queue = [];
var queuePosition = 0;

//Song queue Helper
var playQueueSong = function(song){
	if(!(queue[queuePosition])){
		return false;
	}
	var requestUrl = 'http://youtube.com/watch?v=' + song.id;
	var streamOptions = { seek: 0, volume: volume};
	client.channels.get(config.channel).join().then(connection => {
		var stream = ytdl(requestUrl, {filter: 'audioonly'});
		var dispatcher = connection.playStream(stream, streamOptions);
		dispatcher.on("end", reason => {
			console.log(queue);
			console.log(queuePosition);
			queuePosition++;
			if(queue[queuePosition]){
				playQueueSong(queue[queuePosition]);
			}
		});
	})
	.catch(console.error);
	return true;
}

//Events
client.on("message", msg => {
	var prefix = config.prefix;
	//return if not prefix command
	if(!msg.content.startsWith(prefix)) return;
	//return if bot said a thing
	if(msg.author.bot) return;
	//commands
    if (msg.content.startsWith(prefix + "ping")) {
        msg.channel.sendMessage("pong!");
        return;
    }
    if(msg.content.startsWith(prefix + "testNyan")){
    	msg.channel.sendMessage("Testing nyan cat");
    	var requestUrl = 'http://youtube.com/watch?v=QH2-TGUlwu4';
    	var streamOptions = { seek: 0, volume: 1};
    	client.channels.get(config.channel).join().then(connection => {
    		var stream = ytdl(requestUrl, {filter: 'audioonly'});
    		var dispatcher = connection.playStream(stream, streamOptions);
    	})
    	.catch(console.error);
    	return;
    }
    if(msg.content.startsWith(prefix + "stopNyan")){
    	client.channels.get(config.channel).leave();
    	return;
    }
    if(msg.content.startsWith(prefix + "startQueuedMusic")){
    	if(playQueueSong(queue[queuePosition])){
    		msg.channel.sendMessage("Starting Queued Music");
    	}
    	else{
    		msg.channel.sendMessage("No Music Queued");
    	}
    	return;
    }
    if(msg.content.startsWith(prefix + "queueMusic")){
    	var sublength = (prefix + "queueMusic").length;
    	var searchTerms = msg.content.substring(sublength);
    	youTube.search(searchTerms, 1, function(error, result) {
    		if(error){
    			console.log(error);
    			msg.channel.sendMessage("Opps! Something went wrong!");
    		}
    		else {
    			var song = {
    				"id": result.items[0].id.videoId,
    				"title": result.items[0].snippet.title,
    				"desc": result.items[0].snippet.description
    			};
    			var position = queue.push(song);
    			var diff = position - queuePosition;
    			msg.channel.sendMessage("Queued: " + song.title+ "\nPlace in Queue: " + diff);
    		}
    	});
    	return;
    }
    if(msg.content.startsWith(prefix + "music")){
    	var sublength = (prefix + "music").length;
    	var searchTerms = msg.content.substring(sublength);
    	youTube.search(searchTerms, 1, function(error, result) {
    		if(error){
    			console.log(error)
    		}
    		else {
    			var requestUrl = 'http://youtube.com/watch?v=' + result.items[0].id.videoId;
    			var streamOptions = { seek: 0, volume: volume};
    			var title = result.items[0].snippet.title;
    			var desc = result.items[0].snippet.description;
		    	client.channels.get(config.channel).join().then(connection => {
					msg.channel.sendMessage("Playing: " + title + "\n*" + desc + "*");
		    		var stream = ytdl(requestUrl, {filter: 'audioonly'});
		    		var dispatcher = connection.playStream(stream, streamOptions);
		    		dispatcher.on("end", reason => {
    					//msg.channel.sendMessage("Finished Playing " + title);
    					console.log("End: " + title);
    					console.log(reason);
		    		});
		    	})
		    	.catch(console.error);
    		}
    	});
    	return;
    }
    if(msg.content.startsWith(prefix + "stopMusic")){
    	client.channels.get(config.channel).leave();
    	return;
    }
    return;
});

client.on('ready', () => {
  console.log('I am ready!');
  client.user.setGame("God");
});

client.on("guildMemberAdd", (member) => {
    console.log(`New User "${member.user.username}" has joined "${member.guild.name}"` );
    member.guild.defaultChannel.sendMessage(`Welcome "${member.user.username}"!!!!`);
});

client.on('error', e => { console.error(e); });

client.login(config.token);