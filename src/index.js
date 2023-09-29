import { config } from 'dotenv';
import { Client, Routes } from 'discord.js';
import { REST } from '@discordjs/rest';

import { export_vote, export_vote_command_setup } from './functions/export_vote.js';
import { hltb_search, hltb_command_setup } from './functions/hltb.js';

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
    const commands = [
        export_vote_command_setup,
        hltb_command_setup,
    ];

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