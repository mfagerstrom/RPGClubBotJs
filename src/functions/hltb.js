import { HowLongToBeatService } from 'howlongtobeat';
import {EmbedBuilder, ButtonBuilder, ActionRowBuilder} from "discord.js";

const hltbService = new HowLongToBeatService();

export async function hltb_search(client, interaction) {
    const hltb_query = interaction.options.getString('query');
    const destination_channel = interaction.channel;

    hltbService.search(hltb_query).then(result => outputHltbResultsAsEmbed(interaction, result, destination_channel, hltb_query));
}

function outputHltbResultsAsEmbed(interaction, result, destination_channel, hltb_query) {
    if (result.length) {
        const hltb_result = result[0];

        const hltbEmbed = new EmbedBuilder()
            .setColor(0x0099ff)
            .setTitle(`How Long to Beat ${hltb_result.name}`)
            .setURL(`https://howlongtobeat.com/game/${hltb_result.id}`)
            .setAuthor({
                name: 'HowLongToBeat™',
                iconURL: 'https://howlongtobeat.com/img/hltb_brand.png',
                url: 'https://howlongtobeat.com',
            })
            .setFields([
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
            ])
            .setImage(hltb_result.imageUrl);

        interaction.reply({ embeds: [hltbEmbed] });
    } else {
        interaction.reply(`Sorry, no results were found for "${hltb_query}"`);
    }
}

export const hltb_command_setup = {
    name: 'hltb',
    description: 'Runs a search on howlongtobeat.com',
    options: [{
        name: 'query',
        description: 'The name of the game you are searching for.',
        type: 3,
        required: true,
    }]
};