var Discord = require("discord.js");
var ytdl = require('ytdl-core');
var client = new Discord.Client();
var config = require("./config.json");
var commands = require("./commands.json");
var YouTube = require('youtube-node');
var youTube = new YouTube();
youTube.setKey(config.youTubeKey);

//Music Globals
var volume = .5;
var queue = [];
var queuePosition = 0;
var isPlaying = false;

//Music Helper
// var playQueueSong = function(song){
// 	if(!(queue[queuePosition])){
// 		return false;
// 	}
// 	var requestUrl = 'http://youtube.com/watch?v=' + song.id;
// 	var streamOptions = { seek: 0, volume: volume};
// 	client.channels.get(config.channel).join().then(connection => {
// 		var stream = ytdl(requestUrl, {filter: 'audioonly'});
// 		var dispatcher = connection.playStream(stream, streamOptions);
// 		dispatcher.on("end", reason => {
// 			console.log(queue);
// 			console.log(queuePosition);
// 			queuePosition++;
// 			if(queue[queuePosition]){
// 				playQueueSong(queue[queuePosition]);
// 			}
// 		});
// 	})
// 	.catch(console.error);
// 	return true;
// }

//function to retrieve relevant song information
//callback(error, song)
var findSong = function(search, callback){
	youTube.search(search, 1, function(error, result) {
		if(error){
			console.log(error)
			callback(true, null);
		}
		else {
			var song ={};
			song.id = result.items[0].id.videoId;
			song.title = result.items[0].snippet.title;
			song.desc = result.items[0].snippet.description;
			callback(false, song);
		}
	});
};

//function to put song on end of queue
var queueSong = function(song){
	queue.push(song);
};

//function to start music playback
//callback(error)
var playMusic = function(callback){
	var song;
	if(queue.length == 0){
		callback && callback("No song queued");
		return;
	}
	else if(!(queue[queuePosition])){
		queuePosition = 0;
	}
	song = queue[queuePosition];
	var requestUrl = 'http://youtube.com/watch?v=' + song.id;
	var streamOptions = { seek: 0, volume: volume};
	client.channels.get(config.channel).join().then(connection => {
		var stream = ytdl(requestUrl, {filter: 'audioonly'});
		var dispatcher = connection.playStream(stream, streamOptions);
		isPlaying = true
		dispatcher.on("end", reason => {
			console.log("Stream ended due to:");
			console.log(reason);
			//Stream ended due to end of song
			if(reason == "Stream is not generating quickly enough."){
				queuePosition++;
				if(queue[queuePosition]){
					playMusic();
				}
				else{
					isPlaying = false;
				}
			}
			else{

			}
		});
		callback && callback(false);
	})
	.catch(console.error);
};

//function to skip to next song
var nextSong = function(){
	queuePosition++;
	if(isPlaying){
		playMusic();
	}
}

//function to skip to prev song
var prevSong = function(){
	queuePosition--;
	if(queuePosition < 0)
		queuePosition = 0;
	if(isPlaying){
		playMusic();
	}
}

//function to stop playback
var stopMusic = function(){
	client.channels.get(config.channel).leave();
	isPlaying = false;
	return;
}

//function to get current song info
var getCurSong = function(){
	return queue[queuePosition];
}

//music events
client.on("message", msg => {
	var prefix = config.prefix;
	//return if not prefix command
	if(!msg.content.startsWith(prefix)) return;
	//return if bot said a thing
	if(msg.author.bot) return;
	var lcMsg = msg.content.toLowerCase();

	if(lcMsg.startsWith(prefix + commands.queueSong)){
    	var sublength = (prefix + commands.queueSong).length;
    	var searchTerms = msg.content.substring(sublength);
    	findSong(searchTerms, function(error, song){
    		if(error){
    			msg.channel.sendMessage("An error occured");
    			return;
    		}
    		else{
    			queueSong(song);
    			msg.channel.sendMessage(song.title + " was added to music queue");
    			return;
    		}
    	});
	}
	else if(lcMsg.startsWith(prefix + commands.play)){
		playMusic(function(error){
			if(error){
    			msg.channel.sendMessage("An error occured: " + error);
			}
			else{
    			msg.channel.sendMessage("Starting queued music");
			}
		});
	}
	else if(lcMsg.startsWith(prefix + commands.next)){
		nextSong();
    	msg.channel.sendMessage("Skipping track...");
	}
	else if(lcMsg.startsWith(prefix + commands.prev)){
		prevSong();
    	msg.channel.sendMessage("Previous track...");
	}
	else if(lcMsg.startsWith(prefix + commands.stop)){
		stopMusic();
    	msg.channel.sendMessage("Stop playback.");
	}
	else if(lcMsg.startsWith(prefix + commands.info)){
		var curSong = getCurSong();
		if (curSong){
	    	msg.channel.sendMessage("Current Song: " + curSong.title);
	    	msg.channel.sendMessage(curSong.desc);
	    	msg.channel.sendMessage("Source: " + 'http://youtube.com/watch?v=' + curSong.id);
	    }
	    else{
	    	msg.channel.sendMessage("No Current Song");
	    }
	}
	else if(lcMsg.startsWith(prefix + commands.list)){
		if(queue.length == 0){
	    	msg.channel.sendMessage("No Songs queued");
		}
		else{
			var out = "Current song queue:\n";
			for(var i = 0; i < queue.length; i++){
				var tmp = "";
				if(queuePosition == i)
					tmp = tmp + "-->";
				else
					tmp = tmp + "      ";
				tmp = tmp + "(" + i + ")\t" + queue[i].title + "\n";
				out = out + tmp;
			}
			if (queuePosition == queue.length){
				out = out + "-->\n";
			}
	    	msg.channel.sendMessage(out);
		}
	}
	return;
});


//Events
// client.on("message", msg => {
// 	var prefix = config.prefix;
// 	//return if not prefix command
// 	if(!msg.content.startsWith(prefix)) return;
// 	//return if bot said a thing
// 	if(msg.author.bot) return;
// 	//commands
//     if (msg.content.startsWith(prefix + "ping")) {
//         msg.channel.sendMessage("pong!");
//         return;
//     }
//     if(msg.content.startsWith(prefix + "testNyan")){
//     	msg.channel.sendMessage("Testing nyan cat");
//     	var requestUrl = 'http://youtube.com/watch?v=QH2-TGUlwu4';
//     	var streamOptions = { seek: 0, volume: 1};
//     	client.channels.get(config.channel).join().then(connection => {
//     		var stream = ytdl(requestUrl, {filter: 'audioonly'});
//     		var dispatcher = connection.playStream(stream, streamOptions);
//     	})
//     	.catch(console.error);
//     	return;
//     }
//     if(msg.content.startsWith(prefix + "stopNyan")){
//     	client.channels.get(config.channel).leave();
//     	return;
//     }
//     if(msg.content.startsWith(prefix + "startQueuedMusic")){
//     	if(playQueueSong(queue[queuePosition])){
//     		msg.channel.sendMessage("Starting Queued Music");
//     	}
//     	else{
//     		msg.channel.sendMessage("No Music Queued");
//     	}
//     	return;
//     }
//     if(msg.content.startsWith(prefix + "queueMusic")){
//     	var sublength = (prefix + "queueMusic").length;
//     	var searchTerms = msg.content.substring(sublength);
//     	youTube.search(searchTerms, 1, function(error, result) {
//     		if(error){
//     			console.log(error);
//     			msg.channel.sendMessage("Opps! Something went wrong!");
//     		}
//     		else {
//     			var song = {
//     				"id": result.items[0].id.videoId,
//     				"title": result.items[0].snippet.title,
//     				"desc": result.items[0].snippet.description
//     			};
//     			var position = queue.push(song);
//     			var diff = position - queuePosition;
//     			msg.channel.sendMessage("Queued: " + song.title+ "\nPlace in Queue: " + diff);
//     		}
//     	});
//     	return;
//     }
//     if(msg.content.startsWith(prefix + "music")){
//     	var sublength = (prefix + "music").length;
//     	var searchTerms = msg.content.substring(sublength);
//     	youTube.search(searchTerms, 1, function(error, result) {
//     		if(error){
//     			console.log(error)
//     		}
//     		else {
//     			var requestUrl = 'http://youtube.com/watch?v=' + result.items[0].id.videoId;
//     			var streamOptions = { seek: 0, volume: volume};
//     			var title = result.items[0].snippet.title;
//     			var desc = result.items[0].snippet.description;
// 		    	client.channels.get(config.channel).join().then(connection => {
// 					msg.channel.sendMessage("Playing: " + title + "\n*" + desc + "*");
// 		    		var stream = ytdl(requestUrl, {filter: 'audioonly'});
// 		    		var dispatcher = connection.playStream(stream, streamOptions);
// 		    		dispatcher.on("end", reason => {
//     					//msg.channel.sendMessage("Finished Playing " + title);
//     					console.log("End: " + title);
//     					console.log(reason);
// 		    		});
// 		    	})
// 		    	.catch(console.error);
//     		}
//     	});
//     	return;
//     }
//     if(msg.content.startsWith(prefix + "stopMusic")){
//     	client.channels.get(config.channel).leave();
//     	return;
//     }
//     return;
// });

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