const bot = require("discord.js-selfbot-v13");
const fs = require('fs');

let TOKEN = "";
let CHANNEL_ID = "";
let argv = process.argv
if(argv.length < 3){
    const prompt = require("readline-sync").question;
    TOKEN = prompt("Token: ");
} else {
    if(argv[2].toLowerCase() == "--help"){
        console.log(`Usage: node ${require('path').basename(__filename)} [TOKEN] [CHANNEL_ID]`);
        process.exit();
    }
    TOKEN = argv[2];
    if(argv.length == 4)
        CHANNEL_ID = argv[3];
}
const BOT_ID = "571027211407196161";

const rarities = {
    "": 0,
    "C": 1,
    "UC": 2,
    "R": 3,
    "SR": 4,
    "UR": 5
}

const ScratchType = ["none", "exp", "anicard", "shard", "stamina", "gold", "raidpass", "calendarfragment","skinfragment", "diamond", "goldenegg", "urcard"]

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
        "type": "none",
        "data": {}
    }
    let emoji = c.emoji.name.toLowerCase().replaceAll(/[0-9]/g, "");
    data.type = emoji == "🗑️" ? "none" : emoji.includes("shard") ? "shard" : emoji;
    let amount = Number(c.label);
    data.data["amount"] = amount ? amount : 1;
    if(emoji == "anicard") data.data["rarity"] = getRarity(c.label);
    return data;
}

let DEBUG_CHANNEL_ID = "";

let accard = true,
    acgift = true,
    aclotto = false

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

function readFileSafe(filePath, failedContent = ""){
    let out = "";
    try {
        out = fs.readFileSync(filePath, "utf-8");
    } catch {
        console.log("File not found!");
        fs.writeFileSync(filePath, failedContent, "utf-8");
    }
    return out;
}

let temp = readFileSafe("lotto.json", JSON.stringify({"count": statlottocount, "stat": lottostat}));
if(temp){
    temp = JSON.parse(temp);
    lottostat = temp["stat"];
    statlottocount = temp["count"];
}
temp = null; // Free up memory

function findMaxLottoStat(key){
    let m = -1;
    let pos = [];
    for(let i=0;i<4;i++){
        for(let j=0;j<5;j++){
            m = Math.max(m, lottostat[i][j][key]);
        }
    }
    for(let i=0;i<4;i++){
        for(let j=0;j<5;j++){
            if(lottostat[i][j][key] == m)
                pos.push([i,j]);
        }
    }
    if(pos.length == 0) return [[0, 0]];
    return pos;
}

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
    lottotimestamp = (new Date()).getTime() + num*1000 + 1000;
}

process.on('unhandledRejection', ()=>{}); // DiscordAPIError fix

const client = new bot.Client();

client.on("ready", async () => {
    console.clear();
    console.log(`${client.user.username} is ready!`);
    setInterval(()=>{
        fs.writeFile("lotto.json", JSON.stringify({
            "count": statlottocount,
            "stat": lottostat
        }), (err)=>console.log(err ? "Failed to save statistics!" : "Saved statistics!"));
    }, 60000); // 5 Minutes
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
                            if(data.type == "anicard" && data.data.rarity == "UR") lottostat[i][j]["urcard"] += 1;
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
        if(aclotto && (new Date()).getTime() > lottotimestamp && lottotimestamp != olottotimestamp){
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
                    if(btn.label == "Claim!" && (new Date()).getTime() > claimtimestamp && accard){
                        msg.clickButton(btn.customId).catch(()=>{
                            console.log("Failed to claim card!");
                        });
                    } else if(btn.emoji && btn.emoji.name == "🎁" && (new Date()).getTime() > gifttimestamp && acgift){
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
                    claimtimestamp = Number(desc.split(":")[1])*1000;
                    console.log("Updated claim cooldown timestamp!");
                } else if(title.includes("Scratch Ticket")){
                    msg.clickButton(msg.components[Math.floor(Math.random()*4)].components[Math.floor(Math.random()*5)].customId).catch(()=>{
                        console.log("Failed to click lotto button!");
                    });
                    updateLotto("15 minute");
					lottos += 1;
                }
            }
            if(msg.content){
                if(msg.content.includes("This command is on cooldown... try again in")){
                    updateLotto(msg.content);
                    console.log("Updated lotto cooldown timestamp!");
                } else if(msg.content.includes("You have claimed 5")){
                    var h = parseInt((msg.content.match(/(\d+)h/) || [0, 0])[1])*3600;
                    var m = parseInt((msg.content.match(/(\d+)m/) || [0, 0])[1])*60;
                    var s = parseInt((msg.content.match(/(\d+)s/) || [0, 0])[1]); // Not sure if it has seconds.
                    gifttimestamp = (new Date()).getTime() + (h+m+s)*1000;
                }
            }
        }
        else if(msg.channelId == "758956287937085450"){ // Global market channel

        }
        if(msg.channelId == DEBUG_CHANNEL_ID) console.log(msg);
    }
    if(msg.author.id == client.user.id && msg.guildId != "682900984757878794"){ // Anigame official server block
        if(msg.content == ".sum"){ // too lazy to use switch case
            msg.delete();
            let canClaimCard = (new Date()).getTime() > claimtimestamp;
            let canClaimGift = (new Date()).getTime() > gifttimestamp;
            msg.channel.send(`> ## Summary
> - **Cards:** \`${cards}\`
> - **Gifts:** \`${gifts}\`
> - **Lottos:** \`${lottos}\`
> -# **Highest rariry:** \`${chighest ? chighest : " "}\`
> ## Info
> **Current channel:** ${CHANNEL_ID ? `<#${CHANNEL_ID}>` : "None"}
> **canClaimCard:** \`${canClaimCard}\`
> **Claim cooldown:** ${canClaimCard ? "None" : `<t:${Math.floor(claimtimestamp/1000)}:R>`}
> **Gift cooldown:** ${canClaimGift ? "None" : `<t:${Math.floor(gifttimestamp/1000)}:R>`}
> **Lotto cooldown:** ${lottotimestamp == 0 ? `Run lotto in <#${CHANNEL_ID ? CHANNEL_ID : 0}> first>!` : `<t:${lottotimestamp/1000}:R>`}
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
> - .lstat - Get statistics of lottery.
> - .ahelp - Help page.`);
        } else if(msg.content == ".sumr"){
            let out = "";
            for(let k in counter){
                out += `> - **${k}:** \`${counter[k]}\`\n`;
            }
            msg.delete();
            msg.channel.send("> ## Claimed Rarities:\n" + out);
        } else if(msg.content == ".lstat"){
            let out = "";
            for(let i=0;i<ScratchType.length;i++){
                out += `> - **${ScratchType[i]}:** ${findMaxLottoStat(ScratchType[i]).map(e=>"\`("+e.join(", ")+")\`").join(" | ")}\n`;
            }
            msg.delete();
            msg.channel.send(`> ## Max entries pos (col, row):\n> ### Total lottos: \`${statlottocount}\`\n` + out);
        }
    }
});

client.login(TOKEN);
