export function on_join(member) {
    let role = member.guild.roles.cache.find(r=> r.name === "newcomers");
    member.roles.add(role);
}