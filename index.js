const Discord = require('discord.js');
const botsettings = require('./botsettings.json');
const mongoose = require('mongoose')

const bot = new Discord.Client({disableEveryone: true});

mongoose.connect('mongodb+srv://eusuntgabi:eusuntgabi@cluster0.0bpkf.mongodb.net/Data', {useNewUrlParser: true, useUnifiedTopology: true})

const fs = require("fs");
bot.commands = new Discord.Collection();
bot.aliases = new Discord.Collection();

fs.readdir("./commands/", (err, files) => {

    if(err) console.log(err)

    let jsfile = files.filter(f => f.split(".").pop() === "js") 
    if(jsfile.length <= 0) {
         return console.log("[LOGS] Couldn't Find Commands!");
    }

    jsfile.forEach((f, i) => {
        let pull = require(`./commands/${f}`);
        bot.commands.set(pull.config.name, pull);  
        pull.config.aliases.forEach(alias => {
            bot.aliases.set(alias, pull.config.name)
        });
    });
});
bot.on("message", async message => {
    const Levels = require('discord-xp')
    Levels.setURL("mongodb+srv://eusuntgabi:eusuntgabi@cluster0.0bpkf.mongodb.net/Data")
    const randomXp = Math.floor(Math.random() * 9) + 1; //Random amont of XP until the number you want + 1
    const hasLeveledUp = await Levels.appendXp(message.author.id, message.guild.id, randomXp);
    if (hasLeveledUp) {
        const user = await Levels.fetch(message.author.id, message.guild.id);
        message.channel.send(`You leveled up to ${user.level}! Keep it going!`);
    }
    
    //Rank
    if(message.content === "/rank") {
        const user = await Levels.fetch(message.author.id, message.guild.id);
        message.channel.send(`You are currently level **${user.level}**!`)
    }
    
    //Leaderboard
    if(message.content === "/leaderboard" || message.content === "/lb") {
        const rawLeaderboard = await Levels.fetchLeaderboard(message.guild.id, 5);
        const leaderboard = await Levels.computeLeaderboard(client, rawLeaderboard);
        if (rawLeaderboard.length < 1) return reply("Nobody's in leaderboard yet.");

        const lb = leaderboard.map(e => `${e.position}. ${e.username}#${e.discriminator}\nLevel: ${e.level}\nXP: ${e.xp.toLocaleString()}`);

        message.channel.send(`${lb.join("\n\n")}}`)
    }
})
bot.on("message", async message => {
    bot.user.setActivity(`Playing in ${bot.guilds.cache.size} servers | /help`,  {type: "PLAYING"})

    if(message.author.bot || message.channel.type === "dm") return;

    let prefix = botsettings.prefix;
    let messageArray = message.content.split(" ");
    let cmd = messageArray[0];
    let args = message.content.substring(message.content.indexOf(' ')+1);

    if(!message.content.startsWith(prefix)) return;
    let commandfile = bot.commands.get(cmd.slice(prefix.length)) || bot.commands.get(bot.aliases.get(cmd.slice(prefix.length)))
    if(commandfile) commandfile.run(bot,message,args)

})

bot.login(process.env.token);