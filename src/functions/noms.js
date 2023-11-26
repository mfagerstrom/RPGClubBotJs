import { EmbedBuilder } from "discord.js";

export function list_nominations(client, interaction, sql_config) {
    const sql_connection = new Connection(sql_config);
    const destination_channel = interaction.channel;

    console.log(sql_config);
    console.log(sql_connection);


    sql_connection.on('connect', (err) => {
        if (err) {
            console.log(err);
        } else {
            destination_channel.send('Connected to SQL Server');
            get_nominations(interaction, destination_channel);
        }
    });

    console.log('Attempting to connect to SQL Server');
    sql_connection.connect();
}

function get_nominations(interaction, destination_channel) {
    destination_channel.send("Insert SQL stuffs here");
}

export const noms_command_setup = {
    name: 'noms',
    description: 'Runs a search on howlongtobeat.com',
    options: [{
        name: 'vote_type',
        description: 'Nominations for which vote?',
        choices: [
            {
                name: 'RPG Game of the Month',
                value: 'rpg_gotm',
            },
            {
                name: 'Non-RPG Game of the Month',
                value: 'nrpg_gotm',
            },
        ],
        type: 3,
        required: true,
    }]
};