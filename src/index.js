import dotenv from 'dotenv';
import { Client, Intents, MessageEmbed, MessageAttachment } from 'discord.js';
import fetch from 'node-fetch';
import { existsSync, createWriteStream } from 'fs';
import md5 from 'md5';
import Parser from 'rss-parser';
let parser = new Parser();

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });
const RSS_URL = 'https://www.boisestate.edu/news/';
const imagePath = 'attachment://DSC_5377-1.jpeg';

dotenv.config();
const token = process.env.TOKEN;

function NewsEmbed({title, creator, info, link, categories, timestamp, imageName = null, imageURL = null}) {
    let embed = new MessageEmbed()
        .setTitle(title)
        .setAuthor(creator)
        .setDescription(info)
        .setURL(link)
        .setFooter('Categories: ' + categories)
        .setTimestamp(timestamp);

    if (imageURL !== null) {
        let thumbnail = new MessageAttachment(`${imageName}`);
        embed.setThumbnail(imageURL);
        return { embeds: [embed], files: [thumbnail] };
    }

    return { embeds: [embed] };
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
                        let image = null;
                        let imageName = null;

                        if (imageURL !== null) {
                            if (existsSync(`${md5(imageURL)}.jpg`)) {
                                image = `attachment://${md5(imageURL)}.jpg`;
                                imageName = `${md5(imageURL)}.jpg`;

                                interaction.reply(NewsEmbed({
                                    title: title,
                                    creator: creator,
                                    info: info,
                                    link: link,
                                    categories: categories,
                                    timestamp: timestamp,
                                    imageName: imageName,
                                    imageURL: image
                                }));
                            } else {
                                fetch(imageURL).then(res => {
                                    const dest = createWriteStream(`${md5(imageURL)}.jpg`);
                                    res.body.pipe(dest).on('finish', () => {
                                        image = `attachment://${md5(imageURL)}.jpg`;
                                        imageName = `${md5(imageURL)}.jpg`;

                                        interaction.reply(NewsEmbed({
                                            title: title,
                                            creator: creator,
                                            info: info,
                                            link: link,
                                            categories: categories,
                                            timestamp: timestamp,
                                            imageName: imageName,
                                            imageURL: image
                                        }))
                                    })
                                });
                            }
                        } else {
                            interaction.reply(NewsEmbed({
                                title: title,
                                creator: creator,
                                info: info,
                                link: link,
                                categories: categories,
                                timestamp: timestamp,
                            }));
                        }
                    });
            })();
            
            break;
    }
});

client.login(token);


