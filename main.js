const bot = require("discord.js-selfbot-v13");
const prompt = require("readline-sync").question;

const TOKEN = prompt("Token: ");
const BOT_ID = "571027211407196161";

const rarities = {
    "": 0,
    "C": 1,
    "UC": 2,
    "R": 3,
    "SR": 4,
    "UR": 5
}

const ScratchType = ["none", "exp", "anicard", "shard", "stamina", "gold", "raidpass", "calendarfragment","skinfragment", "diamond"]

function getRarity(t){
    t = t.toLowerCase();
    if(t.includes("common")){
        if(t.includes("not") || t.includes("un")) return "UC";
        else return "C";
    } else if(t.includes("rare")){
        if(t.includes("ultra")) return "UR";
        else if(t.includes("super")) return "SR";
        else return "R";
    }
    return "";
}

function getScratchData(c){
    let data = {
        "type": ScratchType.NO_REWARD,
        "data": {}
    }
    let emoji = c.emoji.name.toLowerCase().replaceAll(/[0-9]/g, "");
    data.type = emoji == "🗑️" ? "none" : emoji.includes("shard") ? "shard" : emoji;
    let amount = Number(c.label);
    data.data["amount"] = amount ? amount : 1;
    if(emoji == "anicard") data.data["rarity"] = getRarity(c.label);
    return data;
}

let CHANNEL_ID = "",
    DEBUG_CHANNEL_ID = "";
let accard = true,
    acgift = true,
    aclotto = false

let counter = {
    "C": 0,
    "UC": 0,
    "R": 0,
    "SR": 0,
    "UR": 0
}

let lottostat = Array(4);
for(let i=0;i<lottostat.length;i++){
    let temp = new Array(5);
    for(let j=0;j<temp.length;j++){
        temp[j] = Object.fromEntries(ScratchType.map(k=>[k, 0]));
    }
    lottostat[i] = temp;
}

let lottoUrPos = Array(4);
for(let i=0;i<lottoUrPos.length;i++){
    lottoUrPos[i] = Array(5).fill(0);
}

function findMaxLottoStat(key){
    let m = 0;
    let pos = [0,0];
    for(let i=0;i<lottostat.length;i++){
        for(let j=0;j<lottostat[0].length;j++){
            if(lottostat[i][j][key] > m){
                m = lottostat[i][j][key];
                pos = [i,j];
            }
        }
    }
    return pos;
}

function findMaxUrPos(){ // Lmao duplicate
    let m = 0;
    let pos = [0,0];
    for(let i=0;i<lottoUrPos.length;i++){
        for(let j=0;j<lottoUrPos[0].length;j++){
            if(lottoUrPos[i][j] > m){
                m = lottoUrPos[i][j];
                pos = [i,j];
            }
        }
    }
    return pos;
}

let cards = 0,
    gifts = 0,
	lottos = 0,
    statlottocount = 0,
    chighest = "",
    chistory = "",
    claimtimestamp = 0,
    gifttimestamp = 0,
    lottotimestamp = 0,
    olottotimestamp = 0

function updateClaim(textArr){
    var cprefix = getRarity(textArr[0]);
    counter[cprefix] += 1;
    chighest = Object.keys(rarities)[Math.max(rarities[chighest], rarities[cprefix])];
    var cardclaim = `[${cprefix}] ${textArr[1]}`;
    if(cprefix == "SR" || cprefix == "UR") chistory += cardclaim + "\n";
    return cardclaim;
}

function updateLotto(t){
    let num = Number(t.split("").filter(Number).join(""));
    if(t.includes("minute"))
        num *= 60;
    lottotimestamp = Math.floor((new Date()).getTime()/1000) + num + 1;
}

process.on('unhandledRejection', ()=>{}); // DiscordAPIError fix

const client = new bot.Client();

client.on("ready", async () => {
    console.clear();
    console.log(`${client.user.username} is ready!`);
});

client.on("messageUpdate", function(_, msg){
    // Collect global data
    if(msg.author.id == BOT_ID){
        if(msg.embeds.length > 0 && msg.components.length > 0){
            let embed = msg.embeds[0];
            let title = embed.title;
            if(title && title.includes("Scratch Ticket")){
                statlottocount += 1;
                if(msg.components[0].components[0].disabled){ // Check for the scratch has been clicked
                    for(let i=0;i<msg.components.length;i++){
                        for(let j=0;j<msg.components[0].components.length;j++){
                            let data = getScratchData(msg.components[i].components[j]);
                            if(data.type == "anicard" && data.data.rarity == "UR") lottoUrPos[i][j] += 1;
                            if(data) lottostat[i][j][data.type] += 1;
                        }
                    }
                }
            }
        }
    }
});

client.on("messageCreate", function(msg){
    if(msg.channelId == CHANNEL_ID)
        if(aclotto && ((new Date()).getTime()/1000) > lottotimestamp && lottotimestamp != olottotimestamp){
            olottotimestamp = lottotimestamp;
            msg.channel.sendSlash(BOT_ID, "lotto").catch(()=>{
                console.log("Failed to lotto!");
            });
        }
    if(msg.author.id == BOT_ID){
        if(msg.channelId == CHANNEL_ID){
            if(msg.components.length > 0){
                var btn = msg.components[0].components[0];
                if(btn.type == "BUTTON"){
                    if(btn.label == "Claim!" && ((new Date()).getTime()/1000) > claimtimestamp && accard){
                        msg.clickButton(btn.customId).catch(()=>{
                            console.log("Failed to claim card!");
                        });
                    } else if(btn.emoji && btn.emoji.name == "🎁" && acgift){
                        msg.clickButton(btn.customId).catch(()=>{
                            console.log("Failed to claim gift!");
                        });
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
                        cards += 1;
                        console.log(`Claimed ${updateClaim(texts)}!`);
                    } else if(desc.includes("rewards")){
                        var texts = desc.split("\n")[1].slice(5).split(" ");
                        gifts += 1;
                        console.log(`Claimed ${updateClaim(texts)}! [gift box]`);
                    }
                } else if(desc && desc.includes("You are not eligible to claim this card!")){
                    claimtimestamp = Number(desc.split(":")[1]);
                    console.log("Updated claim cooldown timestamp!");
                } else if(title.includes("Scratch Ticket")){
                    msg.clickButton(msg.components[Math.floor(Math.random()*4)].components[Math.floor(Math.random()*5)].customId).catch(()=>{
                        console.log("Failed to click lotto button!");
                    });
                    updateLotto("15 minute");
					lottos += 1;
                }
            }
            if(msg.content && msg.content.includes("This command is on cooldown... try again in")){
                updateLotto(msg.content);
                console.log("Updated lotto cooldown timestamp!");
            }
        }
        else if(msg.channelId == "758956287937085450"){ // Global market channel

        }
        if(msg.channelId == DEBUG_CHANNEL_ID) console.log(msg);
    }
    if(msg.author.id == client.user.id){
        if(msg.content == ".sum"){ // too lazy to use switch case
            msg.delete();
            let canClaimCard = ((new Date()).getTime()/1000) > claimtimestamp;
            msg.channel.send(`> ## Summary
> - **Cards:** \`${cards}\`
> - **Gifts:** \`${gifts}\`
> - **Lottos:** \`${lottos}\`
> -# **Highest rariry:** \`${chighest ? chighest : " "}\`
> ## Info
> **Current channel:** ${CHANNEL_ID ? `<#${CHANNEL_ID}>` : "None"}
> **canClaimCard:** \`${canClaimCard}\`
> **Claim cooldown:** ${canClaimCard ? "None" : `<t:${claimtimestamp}:R>`}
> **Lotto cooldown:** ${lottotimestamp == 0 ? `Run lotto in <#${CHANNEL_ID ? CHANNEL_ID : 0}> first>!` : `<t:${lottotimestamp}:R>`}
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
        } else if(msg.content == ".tlotto"){
            msg.delete();
            aclotto = !aclotto;
            msg.channel.send(`> Auto lotto is **${aclotto ? "Enabled" : "Disabled"}**!`);
        } else if(msg.content == ".sch"){
            msg.delete();
            CHANNEL_ID = msg.channel.id;
            msg.channel.send(`> Set channel to <#${CHANNEL_ID}>`);
        } else if(msg.content == ".dsch"){
            msg.delete();
            DEBUG_CHANNEL_ID = msg.channel.id;
            msg.channel.send(`> Set debug channel to <#${DEBUG_CHANNEL_ID}>`);
        } else if(msg.content == ".ahelp"){
            msg.delete();
            msg.channel.send(`> ## Command list
> - .sum - Show summary.
> - .sumr - Show list of claimed card's rarity.
> - .tclaim - Toggle auto claim card.
> - .tgift - Toggle auto claim gift.
> - .tlotto - Toggle auto lotto.
> - .sch - Set claim channel.
> - .lottostat - Get statistics of lottery.
> - .ahelp - Help page.`);
        } else if(msg.content == ".sumr"){
            let out = "";
            for(let k in counter){
                out += `> - **${k}:** \`${counter[k]}\`\n`;
            }
            msg.delete();
            msg.channel.send("> ## Claimed Rarities:\n" + out);
        } else if(msg.content == ".lottostat"){
            let out = "";
            for(let i=0;i<ScratchType.length;i++){
                out += `> - **${ScratchType[i]}:** \`(${findMaxLottoStat(ScratchType[i]).join(", ")})\`\n`;
            }
            msg.delete();
            msg.channel.send(`> ## Max entries pos (col, row):\n> ### Total lottos: \`${statlottocount}\`\n` + out + `> - **UR Card:** \`(${findMaxUrPos().join(", ")})\``);
        }
    }
});

client.login(TOKEN);
