const dotenv = require('dotenv');
const { Client, Intents } = require('discord.js');
const { parse } = require('rss-to-json');

const client = new Client({ intents: [Intents.FLAGS.GUILDS ]});
const RSS_URL = 'https://www.boisestate.edu/news/';

dotenv.config();
const token = process.env.TOKEN;


client.once('ready', () => {
    console.log('Ready!');
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;
    const { options } = interaction.options.getString;

    switch (commandName) {
        case 'ping':
            await interaction.reply('Pong!');

            break;
        
        case 'server':
            await interaction.reply(`Server name: ${interaction.guild.name}\nTotal members: ${interaction.guild.memberCount}`);

            break;

        case 'user':
            await interaction.reply(`Your tag: ${interaction.user.tag}\nYour id: ${interaction.user.id}`);

            break;

        case 'news':
            (async () => {
                var rss = await parse(RSS_URL+interaction.options+'/feed');

                await interaction.reply(`${JSON.stringify(rss.items[0].title)} \n ${JSON.stringify(rss.items[0].link)}`);

            })();
            
            break;
    }
});

client.login(token);


