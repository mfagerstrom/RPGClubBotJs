// loads private data such as discord bot token from .env file
import { config } from 'dotenv';

// discord specific libraries
import { Client, Routes } from 'discord.js';
import { REST } from '@discordjs/rest';

// Application commands
import { export_channel, export_channel_command_setup } from './functions/export_channel.js';
import { hltb_search, hltb_command_setup } from './functions/hltb.js';
import { output_message_to_console } from './functions/output_message_to_console.js';
import { admin_check } from './functions/admin_check.js';
import { on_join } from './functions/on_join.js';
//import { list_nominations, noms_command_setup } from './functions/noms.js';

// private data in .env file
config();

// data needed for discord bot
const TOKEN = process.env.BOT_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

// Microsoft SQL server
import { Connection, Request, TYPES } from 'tedious';

const SQL_SERVER = process.env.SQL_SERVER;
const SQL_USERNAME = process.env.SQL_USERNAME;
const SQL_PASSWORD = process.env.SQL_PASSWORD;
const SQL_DATABASE = process.env.SQL_DATABASE;

const sql_config = {
    server: SQL_SERVER,
    authentication: {
        type: 'default',
        options: {
            userName: SQL_USERNAME,
            password: SQL_PASSWORD,
        }
    },
    options: {
        database: SQL_DATABASE,
    }
};

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
        console.log(member);
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
        export_channel_command_setup,
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

main();