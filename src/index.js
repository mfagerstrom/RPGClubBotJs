import { config } from 'dotenv';
import { Client, PermissionsBitField, Routes } from 'discord.js';
import fetchAll from 'discord-fetch-all';
import { REST } from '@discordjs/rest';
import { HowLongToBeatService } from 'howlongtobeat';


config();
const TOKEN = process.env.BOT_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const BOT_CHANNEL_ID = process.env.BOT_CHANNEL_ID;

const client = new Client({
    intents: ['Guilds', 'GuildMessages', 'MessageContent']
});

const rest = new REST({version:'10'}).setToken(TOKEN);
const hltbService = new HowLongToBeatService();

client.on('ready', () => {console.log(`${client.user.tag} has logged in.`)});

client.on('interactionCreate', async (interaction) => {
    if (interaction.isChatInputCommand()) {
        // for all interactions
        const bot_channel =  client.channels.cache.get(BOT_CHANNEL_ID);

        if (interaction.commandName === 'hltb') {
            const hltb_query = interaction.options.getString('query');
            const destination_channel = interaction.channel;

            hltbService.search(hltb_query).then(result => outputHltbResultsAsEmbed(interaction, result, destination_channel));
        }

        else if (interaction.commandName === 'export_channel') {
            const is_admin = interaction.member.permissionsIn(interaction.channel).has(PermissionsBitField.Flags.Administrator);
            interaction.reply('Initiating channel export.');
            const source_channel_id = interaction.options.getString('source_channel')
                .replace('#', '')
                .replace('<', '')
                .replace('>', '');
            const source_channel =  client.channels.cache.get(source_channel_id);

            let destination_channel_id = interaction.options.getString('destination_channel');
            let destination_channel;
            if (destination_channel_id == null) {
                destination_channel = interaction.channel;
            } else {
                destination_channel_id = destination_channel_id.replace('#', '').replace('<', '').replace('>', '');
                destination_channel = client.channels.cache.get(destination_channel_id);
            }

            const starting_message_number = interaction.options.getInteger('starting_message_number');
            const spoiler_mode = interaction.options.getBoolean('spoiler_channel_export');

            let params = {
                'source_channel': source_channel,
                'destination_channel': destination_channel,
                'bot_channel': bot_channel,
                'command_user': interaction.member.user,
                'starting_message_number': starting_message_number,
                'spoiler_mode': spoiler_mode,
            };

            let bot_message = `[application command] ${params.command_user.displayName} `
                + `ran /export_channel source_channel_id:${params.source_channel.id} `
                + `destination_channel_id:${params.destination_channel.id}`;
            if (params.starting_message_number != null) {
                bot_message += ` starting_message_number:${params.starting_message_number}`;
            }
            if (params.spoiler_mode) {
                bot_message += ` spoiler_channel_export:${params.spoiler_mode}`;
            }
            console.log(bot_message);
            params.bot_channel.send(bot_message);

            if (is_admin) {
                exportChannelMessages(params)
                    .then(function(params) {
                        {
                            writeExportedMessagesToForumChannel(params);
                        }
                    });
            } else {
                interaction.reply({
                    content: 'Access denied.  Command requires Administrator role.'
                });
            }
        } // export_channel end
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

function outputHltbResultsAsEmbed(interaction, result, destination_channel) {

    const hltb_result = result[0];

    const hltbEmbed = {
        color: 0x0099ff,
        title: `How Long to Beat ${hltb_result.name}`,
        url: `https://howlongtobeat.com/game/${hltb_result.id}`,
        author: {
            name: 'HowLongToBeat™',
            icon_url: 'https://howlongtobeat.com/img/hltb_brand.png',
            url: 'https://howlongtobeat.com',
        },
        fields: [
            {
                name: 'Main',
                value: `${hltb_result.gameplayMain} Hours`,
                inline: true,
            },
            {
                name: 'Main + Extra',
                value: `${hltb_result.gameplayMainExtra} Hours`,
                inline: true,
            },
            {
                name: 'Completionist',
                value: `${hltb_result.gameplayCompletionist} Hours`,
                inline: true,
            }
        ],
        image: {
            url: hltb_result.imageUrl,
        }
    };

    interaction.reply({ embeds: [hltbEmbed] });
}

function outputMessageToConsole(message) {
    const messageChannelName = message.channel.name;
    const messageDateTime = message.createdAt.toLocaleString();
    const messageAuthor = message.author.globalName;
    const messageContent = message.content;

    console.log(`<${messageChannelName}> [${messageDateTime}] ${messageAuthor}: ${messageContent}`);
}

async function exportChannelMessages(params) {
    let x = 0;
    let bot_message = `[export channel] Collecting all messages in #${params.source_channel.name}.`;
    if (params.starting_message_number) {
        x = params.starting_message_number-1;
        bot_message = `[export channel] Collecting messages in #${params.source_channel.name} starting with message ${params.starting_message_number}.`;
    }
    console.log(bot_message);
    params.bot_channel.send(bot_message);

    const allMessages = await fetchAll.messages(params.source_channel, {
        reverseArray: true, // Reverse the returned array
        userOnly: true, // Only return messages by users
        botOnly: false, // Only return messages by bots
        pinnedOnly: false, // Only returned pinned messages
    });

    params.exportedMessages = [];

    for (x; x < allMessages.length; x++) {
        params.exportedMessages.push({
            "id": allMessages[x].id,
            "author": allMessages[x].author,
            "createdTimestamp": allMessages[x].createdTimestamp,
            "content": allMessages[x].content,
            "attachments": allMessages[x].attachments
        });
    }

    bot_message = `[export channel] ${params.exportedMessages.length} messages collected.`;
    console.log(bot_message);
    params.bot_channel.send(bot_message);

    return params;
}

async function writeExportedMessagesToForumChannel(params) {
    let bot_message = `[export channel] Writing messages to ${params.destination_channel.name} forum channel.`;
    console.log(bot_message);
    params.bot_channel.send(bot_message);

    for (params.messageCounter = 1; params.messageCounter <= params.exportedMessages.length; params.messageCounter++) {
        // spoiler images need to be treated as file attachments
        // when using file attachments, messages with files are displayed out of order
        // so... I'm slowing it down for spoiler mode.
        if (params.spoiler_mode) {
            let sleep = async (ms) => await new Promise(r => setTimeout(r,ms));
            await sleep(1500)
            outputMessageAsEmbed(params);
        } else {
            outputMessageAsEmbed(params);
        }
    }
}

function outputMessageAsEmbed(params) {
    let message = params.exportedMessages[params.messageCounter-1];

    let imageUrl = '';
    let fileUrl = '';

    if (message.attachments.size > 0 && !params.spoiler_mode) {
        imageUrl = message.attachments.first().url;
    }

    if (message.attachments.size > 0 && params.spoiler_mode) {
        fileUrl = message.attachments.first().url;
    }

    let messageContent = message.content;

    if (params.spoiler_mode) {
        messageContent = messageContent.replaceAll('||','');
        if (messageContent.length) {
            messageContent = `||${messageContent}||`;
        }
    }

    const messageEmbed = {
        color: 0x0099ff,
        title: '',
        url: '',
        author: {
            name: message.author.username,
            icon_url: message.author.avatarURL(),
            url: '',
        },
        description: messageContent,
        fields: [
            {
                name: '',
                value: new Date(message.createdTimestamp).toLocaleString(),
            }
        ],
        image: {
            url: imageUrl,
        },
        footer: {
            text: `Exported from #${params.source_channel.name}, message ${params.messageCounter} of ${params.exportedMessages.length}`,
            icon_url: 'https://cdn.discordapp.com/avatars/1154429583031025705/07cd692b5b2c8e5ad5b4d06ad166684c.webp',
        },
    };

    if (fileUrl) {
        params.destination_channel.send({
            embeds: [messageEmbed],
            files: [{
                attachment: fileUrl,
                name: "SPOILER_FILE.jpg"
            }]
        });
    } else {
        params.destination_channel.send({ embeds: [messageEmbed] });
    }
}

client.on('messageCreate', (message) => {
    // only for testing purposes
    // outputMessageLog(message);
});