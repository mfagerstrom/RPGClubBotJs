import { config } from 'dotenv';
import { Client, Routes } from 'discord.js';
import { REST } from '@discordjs/rest';

import { export_vote } from './functions/export_vote.js';
import { hltb_search } from './functions/hltb.js';

config();
const TOKEN = process.env.BOT_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const client = new Client({
    intents: ['Guilds', 'GuildMessages', 'MessageContent']
});

const rest = new REST({version:'10'}).setToken(TOKEN);

client.on('ready', () => {console.log(`${client.user.tag} has logged in.`)});

client.on('interactionCreate', async (interaction) => {
    if (interaction.isChatInputCommand()) {

        if (interaction.commandName === 'hltb') {
            hltb_search(client, interaction);
        }

        else if (interaction.commandName === 'export_channel') {
            export_vote(client, interaction);
        }
    }
});

async function main() {
    const commands = [{
        name: 'export_channel',
        description: 'Export a channel\'s content to a forum channel.',
        options: [{
            name: 'source_channel',
            description: 'The channel you are exporting messages from.',
            type: 3,
            required: true,
        },{
            name: 'destination_channel',
            description: 'The the forum channel you are exporting messages to.',
            type: 3,
            required: false,
        },{
            name: 'starting_message_number',
            description: 'The number of the first message to output, for if an export is interrupted.',
            type: 4,
            required: false,
        },{
            name: 'spoiler_channel_export',
            description: 'Is the source channel a spoiler channel?',
            type: 5,
            default: false,
            required: false,
        }],
    },
    {
        name: 'hltb',
        description: 'Runs a search on howlongtobeat.com',
        options: [{
            name: 'query',
            description: 'The name of the game you are searching for.',
            type: 3,
            required: true,
        }]
    }];

    try {
        console.log('Started refreshing application (/) commands.');
        await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
            body: commands,
        });

        await client.login(TOKEN);
    } catch (err) {
        console.log(err);
    }
}

main();



function outputMessageToConsole(message) {
    const messageChannelName = message.channel.name;
    const messageDateTime = message.createdAt.toLocaleString();
    const messageAuthor = message.author.globalName;
    const messageContent = message.content;

    console.log(`<${messageChannelName}> [${messageDateTime}] ${messageAuthor}: ${messageContent}`);
}

client.on('messageCreate', (message) => {
    // only for testing purposes
    // outputMessageLog(message);
});