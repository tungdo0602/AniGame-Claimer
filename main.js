const bot = require("discord.js-selfbot-v13");
const prompt = require("readline-sync").question;

const TOKEN = prompt("Token: ");
const BOT_ID = "571027211407196161";

const client = new bot.Client();

const rarities = {
    "": 0,
    "C": 1,
    "UC": 2,
    "R": 3,
    "SR": 4,
    "UR": 5
}

function getRarity(t){
    if(t.includes("common")){
        if(t.includes("not")) return "UC";
        else return "C";
    } else if(t.includes("rare")){
        if(t.includes("ultra")) return "UR";
        else if(t.includes("super")) return "SR";
        else return "R";
    }
    return "";
}

let CHANNEL_ID = "";
let accard = true,
    acgift = true

let cards = 0,
    gifts = 0,
    chighest = "",
    chistory = "",
    claimtimestamp = 0

function updateClaim(textArr){
    var cprefix = getRarity(textArr[0]);
    chighest = Object.keys(rarities)[Math.max(rarities[chighest], rarities[cprefix])];
    var cardclaim = `[${cprefix}] ${textArr[1]}`;
    if(cprefix == "SR" || cprefix == "UR") chistory += cardclaim + "\n";
    return cardclaim;
}

client.on("ready", async () => {
    console.clear();
    console.log(`${client.user.username} is ready!`);
});

client.on("messageCreate", async function(msg){
    if(msg.author.id == BOT_ID && msg.channelId == CHANNEL_ID){
        if(msg.components.length > 0){
            var btn = msg.components[0].components[0];
            if(btn.type == "BUTTON"){
                if(btn.label == "Claim!" && ((new Date()).getTime()/1000) > claimtimestamp && accard){
                    try {
                        await msg.clickButton(btn.customId);
                        cards += 1;
                    } catch {}
                } else if(btn.emoji && btn.emoji.name == "🎁" && acgift){
                    msg.clickButton(btn.customId);
                    gifts += 1;
                }
            }
        }
        if(msg.embeds.length > 0){
            var status = msg.embeds[0];
            var title = status.title;
            var desc = status.description;
            if(title.includes(client.user.username) && title.includes("claimed")){
                if(desc.includes("collection")){
                    var texts = desc.split("**");
                    console.log(`Claimed ${updateClaim(texts)}!`);
                } else if(desc.includes("rewards")){
                    var texts = desc.split("\n")[1].slice(5).split(" ");
                    console.log(`Claimed ${updateClaim(texts)}! [gift box]`);
                }
            } else if(desc && desc.includes("You are not eligible to claim this card!")){
                claimtimestamp = Number(desc.split(":")[1]);
                console.log("Updated claim cooldown timestamp!");
            }
        }
    }
    if(msg.author.id == client.user.id){
        if(msg.content == ".sum"){ // too lazy to use switch case
            msg.delete();
            let canClaimCard = ((new Date()).getTime()/1000) > claimtimestamp;
            msg.channel.send(`> ## Claimed
> - **Cards: \`${cards}\`**
> - **Gifts:** \`${gifts}\`
> -# **Highest rariry:** \`${chighest ? chighest : " "}\`
> ## Info
> **Current channel:** <#${CHANNEL_ID}>
> **canClaimCard:** \`${canClaimCard}\`
> **Claim cooldown:** ${canClaimCard ? "None" : `<t:${claimtimestamp}:F>`}
## History (Only SR, UR)
\`\`\`${chistory ? chistory : " "}\`\`\``)
        } else if(msg.content == ".tclaim"){
            msg.delete();
            accard = !accard;
            msg.channel.send(`> Auto claim card is **${accard ? "Enabled" : "Disabled"}**!`);
        } else if(msg.content == ".tgift"){
            msg.delete();
            acgift = !acgift;
            msg.channel.send(`> Auto claim gift is **${acgift ? "Enabled" : "Disabled"}**!`);
        } else if(msg.content == ".sch"){
            msg.delete();
            CHANNEL_ID = msg.channel.id;
            msg.channel.send(`> Set channel to <#${CHANNEL_ID}>`);
        } else if(msg.content == ".ahelp"){
            msg.delete();
            msg.channel.send(`> ## Command list
> - .sum - Show summary.
> - .tclaim - Toggle auto claim card.
> - .tgift - Toggle auto claim gift.
> - .sch - Set claim channel.
> - .ahelp - Help page.`);
        }
    }
});

client.login(TOKEN);
