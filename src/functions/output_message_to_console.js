export function output_message_to_console(message) {
    const messageChannelName = message.channel.name;
    const messageDateTime = message.createdAt.toLocaleString();
    const messageAuthor = message.author.username;
    const messageContent = message.content;

    console.log(`<${messageChannelName}> [${messageDateTime}] ${messageAuthor}: ${messageContent}`);
}