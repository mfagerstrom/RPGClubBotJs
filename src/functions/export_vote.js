import {PermissionsBitField} from "discord.js";
import fetchAll from "discord-fetch-all";

export function export_vote(client, interaction) {
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
    params.destination_channel.send(bot_message);

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
}

async function exportChannelMessages(params) {
    let x = 0;
    let bot_message = `[export channel] Collecting all messages in #${params.source_channel.name}.`;
    if (params.starting_message_number) {
        x = params.starting_message_number-1;
        bot_message = `[export channel] Collecting messages in #${params.source_channel.name} starting with message ${params.starting_message_number}.`;
    }
    console.log(bot_message);
    params.destination_channel.send(bot_message);

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
    params.destination_channel.send(bot_message);

    return params;
}

async function writeExportedMessagesToForumChannel(params) {
    let bot_message = `[export channel] Writing messages to ${params.destination_channel.name} forum channel.`;
    console.log(bot_message);
    params.destination_channel.send(bot_message);

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

    bot_message = `[export channel] Export completed.  <@191938640413327360>`;
    console.log(bot_message);
    params.destination_channel.send(bot_message);
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

export const export_vote_command_setup = {
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
};