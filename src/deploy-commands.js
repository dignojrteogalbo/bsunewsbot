import dotenv from 'dotenv';
dotenv.config();

import { SlashCommandBuilder } from '@discordjs/builders';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
const clientId = process.env.CLIENTID;
const token = process.env.TOKEN;
const guildId = "596320306835095554"; // Test Server
// const guildId = "882725373459181589"; // BSU CS Students

const newsCommand = new SlashCommandBuilder().setName('news').setDescription('Replies with the latest news story')
    .addStringOption(option =>
        option.setName('category')
            .setDescription('The news category')
            .setRequired(false)
            .addChoice('Featured', 'tag/featured')
            .addChoice('News for the Campus Community', 'category/news-for-the-campus-community')
            .addChoice('Campus Life and Student Success', 'category/campus-life-and-student-success'));

const ratingCommand = new SlashCommandBuilder().setName('rate').setDescription('Send an anonymous rating of an instructor')
    .addStringOption(option => 
        option.setName('name')
            .setDescription('Name of the instructor')
            .setRequired(true))
    .addIntegerOption(option =>
        option.setName('rating')
            .setDescription('Instructor\'s rating out of 5')
            .setRequired(true)
            .addChoice('1 ⭐️', 1)
            .addChoice('2 ⭐️⭐️', 2)
            .addChoice('3 ⭐️⭐️⭐️', 3)
            .addChoice('4 ⭐️⭐️⭐️⭐️', 4)
            .addChoice('5 ⭐️⭐️⭐️⭐️⭐️', 5))
    .addStringOption(option =>
        option.setName('message')
            .setDescription('Add your message')
            .setRequired(true));

const commands = [
    new SlashCommandBuilder().setName('ping').setDescription('Replies with pong!'),
    new SlashCommandBuilder().setName('server').setDescription('Replies with server info!'),
    new SlashCommandBuilder().setName('user').setDescription('Replies with user info!'),
    newsCommand,
    ratingCommand
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