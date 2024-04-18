// loads private data such as discord bot token from .env file
import { config } from 'dotenv';

// discord specific libraries
import { Client } from 'discord.js';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';

// Application commands
import { export_channel, export_channel_command_setup } from './functions/export_channel.js';
import { hltb_search, hltb_command_setup } from './functions/hltb.js';
import { output_message_to_console } from './functions/output_message_to_console.js';
import { admin_check } from './functions/admin_check.js';
import { on_join } from './functions/on_join.js';

// private data in .env file
config();

// data needed for discord bot
const TOKEN = process.env.BOT_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const client = new Client({
    intents: ['Guilds', 'GuildMessages', 'GuildMembers', 'GuildPresences', 'MessageContent']
});

const rest = new REST({version:'10'}).setToken(TOKEN);

client.on('ready', () => {
    console.log(`${client.user.tag} has logged in.`);

    client.on('messageCreate', message => {
        output_message_to_console(message);
    });

    client.on('guildMemberAdd', (member) => {
        on_join(member);
    });
});

client.on('interactionCreate', async (interaction) => {
    if (interaction.isChatInputCommand()) {

        if (interaction.commandName === 'hltb') {
            hltb_search(client, interaction);
        }

        else if (interaction.commandName === 'export_channel') {
            const ok_to_run_command = admin_check(client, interaction);

            if (ok_to_run_command) {
                export_channel(client, interaction);
            }
        }
    }
});

async function main() {

    const commands = [
        export_channel_command_setup,
        hltb_command_setup
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