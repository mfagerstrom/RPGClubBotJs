import { HowLongToBeatService } from 'howlongtobeat';

const hltbService = new HowLongToBeatService();

export async function hltb_search(client, interaction) {
    const hltb_query = interaction.options.getString('query');
    const destination_channel = interaction.channel;

    hltbService.search(hltb_query).then(result => outputHltbResultsAsEmbed(interaction, result, destination_channel, hltb_query));
}

function outputHltbResultsAsEmbed(interaction, result, destination_channel, hltb_query) {
    if (result.length) {
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
    } else {
        interaction.reply(`Sorry, no results were found for "${hltb_query}"`);
    }
}