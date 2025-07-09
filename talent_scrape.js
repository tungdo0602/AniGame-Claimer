const bot = require("discord.js-selfbot-v13");
const fs = require('fs');

let TOKEN = "";
let data = {}
let CHANNEL_ID = "";

try {
    data = JSON.parse(fs.readFileSync("./talentData.json", "utf-8"));
} catch {
    console.log("File not found!");
}

function updateData(msg){
    if(!msg.embeds) return;
    if(msg.embeds[0].description && msg.embeds[0].description.includes("Cards with this variant")){
        let desc = msg.embeds[0].description.split("\n\n\n");
        desc[0] = desc[0].slice(44);
        desc.map(s => s.split("\n\n")).forEach(str => {
            let [talent_desc, cards] = str;
            talent_desc = talent_desc.split(": ");
            let talent = talent_desc[0].match(/\*\*(.+?)\*\*/)[1];
            talent_desc = talent_desc[1].replace(/(\_\_|\*\*)/g, "");
            cards = cards.split(": **")[1].split(", ");
            if(!data[talent]) data[talent] = [];
            data[talent].push([talent_desc, cards]);
            console.log(data[talent]);
        });

    }
}

const client = new bot.Client();

setInterval(()=>{
    fs.writeFileSync("./talentData.json", JSON.stringify(data), "utf-8");
    console.log("Saved!");
}, 10000);

client.on("ready", async () => {
    console.log(`${client.user.username} is ready!`);
});

client.on("messageUpdate", function(_, msg){
    if(msg.channelId == CHANNEL_ID && msg.author.id == "571027211407196161") updateData(msg);
})

client.login(TOKEN);
