import dotenv from 'dotenv';
import { Client, Intents, MessageEmbed, MessageAttachment } from 'discord.js';
import fetch from 'node-fetch';
import { existsSync, createWriteStream } from 'fs';
import md5 from 'md5';
import Parser from 'rss-parser';
let parser = new Parser();

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.DIRECT_MESSAGE_REACTIONS] });
const RSS_URL = 'https://www.boisestate.edu/news/';

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

function RateEmbed(name, rating, content = null) {
    let embed = new MessageEmbed()
        .setTitle(name)
        .setColor(0x0033A0)
        .setTimestamp(Date.now());

    if (content) {
        embed.addFields({ name: 'Message: ', value: content, inline: false });
    }

    switch (rating) {
        case 1:
            embed.setDescription('⭐️');
            break;
        case 2:
            embed.setDescription('⭐️⭐️');
            break;
        case 3:
            embed.setDescription('⭐️⭐️⭐️');
            break;
        case 4:
            embed.setDescription('⭐️⭐️⭐️⭐️');
            break;
        case 5:
            embed.setDescription('⭐️⭐️⭐️⭐️⭐️');
            break;
    }

    return { embeds: [embed] };
}

client.once('ready', () => {
    console.log('Ready!');
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

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
            let option = interaction.options.getString('category') ?? '';
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
                                }).catch(err => console.log(err));
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
                    }).catch(err => console.log(err));
            })();
            
            break;

        case 'rate':
            let name = interaction.options.getString('name');
            let rating = interaction.options.getInteger('rating');
            let content = interaction.options.getString('message') ?? '';

            let message = (content != '') ? RateEmbed(name, rating, content) : RateEmbed(name, rating);

            (async() => {
                await interaction.reply({ content: 'Confirm message in DMs', ephemeral: true });
                await interaction.user.send(message);

                let confirmMessage = await interaction.user.send('Confirm message (30 secs)');
                await confirmMessage.react('👍');
                await confirmMessage.react('👎');

                const filter = (reaction, user) => reaction.emoji.name === '👍' || reaction.emoji.name === '👎' && !user.bot;

                const reactionCollector = confirmMessage.createReactionCollector({ filter, max: 1, time: 30_000 });

                reactionCollector.on('collect', (reaction, user) => {
                    if (reaction.emoji.name === '👍') {
                        confirmMessage.edit('Message confirmed.')
                        interaction.channel.send(message);
                    } else {
                        confirmMessage.edit('Message canceled.')
                    }
                });

                reactionCollector.on('end', (collected, reason) => {
                    if (reason === 'time') 
                        confirmMessage.edit('Confirmation period timed out.');
                });
            })();
            break;
    }
});

client.login(token).catch(err => console.log(err));


