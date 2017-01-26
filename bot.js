var Discord = require("discord.js");
var client = new Discord.Client();
var config = require("./config.json");

client.on("message", msg => {
	var prefix = config.prefix;
	//return if not prefix command
	if(!msg.content.startsWith(prefix)) return;
	//return if bot said a thing
	if(msg.author.bot) return;
	//commands
    if (msg.content.startsWith(prefix + "ping")) {
        msg.channel.sendMessage("pong!");
    }
});

client.on('ready', () => {
  console.log('I am ready!');
});

bot.on("guildMemberAdd", (member) => {
    console.log(`New User "${member.user.username}" has joined "${member.guild.name}"` );
    member.guild.defaultChannel.sendMessage(`Welcome "${member.user.username}"!!!!`);
});

bot.on('error', e => { console.error(e); });

client.login(config.token);