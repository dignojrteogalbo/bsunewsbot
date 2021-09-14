const dotenv  = require('dotenv');
const { Client, Intents, MessageEmbed } = require('discord.js');
let Parser = require('rss-parser');
let parser = new Parser();
// const { parse: RSSParse } = require('rss-to-json');
// const { decode } = require('html-entities');
// const { parse: HTMLParse } = require('node-html-parser');

const client = new Client({ intents: [Intents.FLAGS.GUILDS ]});
const RSS_URL = 'https://www.boisestate.edu/news/';

dotenv.config();
const token = process.env.TOKEN;

function NewsEmbed({title, creator, info, link, categories, timestamp, image = null}) {
    let embed = new MessageEmbed()
        .setTitle(title)
        .setAuthor(creator)
        .setDescription(info)
        .setURL(link)
        .setFooter('Categories: ' + categories)
        .setTimestamp(timestamp);

    if (image !== null) embed.setThumbnail(image);

    return embed;
}

client.once('ready', () => {
    console.log('Ready!');
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;
    const option =  interaction.options.getString('category') ?? '';

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
                await parser.parseURL(RSS_URL + option + '/feed')
                    .then(feed => {
                        const title = feed.items[0].title;
                        const creator = feed.items[0].creator;
                        const link = feed.items[0].link;
                        const info = feed.items[0].contentSnippet;
                        const categories = feed.items[0].categories.join(' | ');
                        const timestamp = Date.parse(feed.items[0].pubDate);
                        const parseImages = feed.items[0]['content:encoded'].match(/src\s*=\s*"(.+?)"/);
                        const imageURL = (parseImages === null) ? null : parseImages[1];

                        interaction.reply({ embeds: [NewsEmbed({
                            title: title,
                            creator: creator,
                            info: info,
                            link: link,
                            categories: categories,
                            timestamp: timestamp,
                            image: imageURL
                        })] });
                    });
            })();
            
            break;
    }
});

client.login(token);


