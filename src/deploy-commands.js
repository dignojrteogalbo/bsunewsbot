import dotenv from 'dotenv';
dotenv.config();

import { SlashCommandBuilder } from '@discordjs/builders';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
const clientId = process.env.CLIENTID;
const token = process.env.TOKEN;
const guildId = "596320306835095554";

const newsCommand = new SlashCommandBuilder().setName('news').setDescription('Replies with the latest news story')
    .addStringOption(option =>
        option.setName('category')
            .setDescription('The news category')
            .setRequired(false)
            .addChoice('Featured', 'tag/featured')
            .addChoice('News for the Campus Community', 'category/news-for-the-campus-community')
            .addChoice('Campus Life and Student Success', 'category/campus-life-and-student-success'));

const commands = [
    new SlashCommandBuilder().setName('ping').setDescription('Replies with pong!'),
    new SlashCommandBuilder().setName('server').setDescription('Replies with server info!'),
    new SlashCommandBuilder().setName('user').setDescription('Replies with user info!'),
    newsCommand
    
]
    .map(command => command.toJSON());

const rest = new REST({ version: '9' }).setToken(token);

(async () => {
    try {
        await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            { body: commands },
        );

        console.log('Successfully registered application commands.');
    } catch (error) {
        console.error(error);
    }
})();