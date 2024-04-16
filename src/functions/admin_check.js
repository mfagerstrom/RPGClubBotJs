import { PermissionsBitField } from "discord.js";

export function admin_check(client, interaction) {
    const is_admin = interaction.member.permissionsIn(interaction.channel).has(PermissionsBitField.Flags.Administrator);

    if (!is_admin) {
        interaction.reply({
            content: 'Access denied.  Command requires Administrator role.'
        });
    }

    return is_admin;
}