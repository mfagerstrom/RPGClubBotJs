// loads private data such as discord bot token from .env file
import { config } from 'dotenv';

// discord specific libraries
import { Client, Routes, PermissionsBitField } from 'discord.js';
import { REST } from '@discordjs/rest';

// Microsoft SQL server
import { Connection, Request, TYPES } from 'tedious';

const sql_config = {
    server: 'localhost',
    authentication: {
        type: 'default',
        options: {
            userName: 'bot',
            password: 'REJW99ftbotbot'
        }
    },
    options: {
        database: 'rpgclub_voting'
    }
};

// Application commands
import { export_vote, export_vote_command_setup } from './functions/export_vote.js';
import { hltb_search, hltb_command_setup } from './functions/hltb.js';
//import { list_nominations, noms_command_setup } from './functions/noms.js';

// private data in .env file
config();

// data needed for discord bot
const TOKEN = process.env.BOT_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const client = new Client({
    intents: ['Guilds', 'GuildMessages', 'MessageContent']
});

const rest = new REST({version:'10'}).setToken(TOKEN);

client.on('ready', () => {
    console.log(`${client.user.tag} has logged in.`);

    client.on('messageCreate', message => {
        outputMessageToConsole(message);

        // handle twitter preview issues
        if(message.content.includes('https://twitter.com') || message.content.includes('https://x.com')) {

            let messageArray = message.content.split(/(\s+)/);

            for (let x = 0; x < messageArray.length; x++) {
                if (messageArray[x].includes('https://twitter.com') || messageArray[x].includes('https://x.com')) {
                    message.channel.send(messageArray[x].replaceAll('https://twitter.com', 'https://vxtwitter.com').replaceAll('https://x.com', 'https://vxtwitter.com'));
                }
            }
        }
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
                export_vote(client, interaction);
            }
        }

        else if (interaction.commandName === 'noms') {
            //list_nominations(client, interaction);
        }

        else if (interaction.commandName === 'nominate') {
            //nominate(client, interaction);
        }
    }
});

async function main() {
    //connectAndExecuteSql("select * from vote_round");

    const commands = [
        export_vote_command_setup,
        hltb_command_setup,
        //noms_command_setup,
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

function outputMessageToConsole(message) {
    const messageChannelName = message.channel.name;
    const messageDateTime = message.createdAt.toLocaleString();
    const messageAuthor = message.author.globalName;
    const messageContent = message.content;

    console.log(`<${messageChannelName}> [${messageDateTime}] ${messageAuthor}: ${messageContent}`);
}

function connectAndExecuteSql(sql_statement) {
    console.log(sql_config);
    const sql_connection = new Connection(sql_config);

    sql_connection.on('connect', err => {
        if (err) {
            console.error(err.message);
        } else {
            console.log("Connected.");
            executeSqlStatement(sql_connection, sql_statement);
        }
    });

    sql_connection.connect();
}

function executeSqlStatement(sql_connection, sql_statement) {
    console.log("Executing SQL Statement...");
    const request = new Request(sql_statement, (err, rowcount) => {
        if (err) {
            console.error(err.message);
        } else {
            console.log(`${rowCount} row(s) returned`);
        }
    });

    let result = "";

    request.on('row', function(columns) {
        let val = {}
        columns.forEach(function(column) {
            val[column.metadata.colName] = column.value;
        });
        result.push(val);
        console.log(result);
    });

    sql_connection.execSql(request);
}

function admin_check(client, interaction) {
    const is_admin = interaction.member.permissionsIn(interaction.channel).has(PermissionsBitField.Flags.Administrator);

    if (!is_admin) {
        interaction.reply({
            content: 'Access denied.  Command requires Administrator role.'
        });
    }

    return is_admin;
}

main();