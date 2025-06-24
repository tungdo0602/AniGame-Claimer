const bot = require("discord.js-selfbot-v13");
const fs = require('fs');

let TOKEN = "ODE4ODU2MjY2NzIxMTMyNTY0.GiOzB6.mpldgBO0LTs8Hn_AWi6GPkLoDumQDGPeGWP8Xg";
let data = {}
let CHANNEL_ID = "913451615573385269";

try {
    fs.readFileSync("./cardData.json", "utf-8");
} catch {
    console.log("File not found!");
}

function updateData(msg, log = false){
    let cn = msg.components[0].components;
    let info = cn[0].components[0].content.split("\n\n");
    let name = info[0].match(/\*\*(.*?)\*\*/)[1];
    let val = info[1].split("\n").map(e=>e.split("** ")[1]);
    let id = Number(val[0]);
    let series = val[1];
    let location = null;
    if(val[2] != "None"){
        loc_info = val[2].split(" | ")
        location = {
            value: Number(loc_info[0]),
            floor: loc_info[1].split(", ").map(Number)
        }
    }
    let type = val[4].slice(0, -2).replace(" <:Null:132974654938258228", "");
    let stats = {
        hp: Number(val[5]),
        atk: Number(val[6]),
        def: Number(val[7]),
        spd: Number(val[8])
    }
    let talent = cn[1].content.split("\n")[1].split(": ")[0].slice(5).match(/\*\*(.*?)\*\*/)[1];
    data[id] = {
        "name": name,
        "series": series,
        "location": location,
        "type": type,
        "stats": stats,
        "talent": talent
    }
    fs.writeFileSync("./cardData.json", JSON.stringify(data), "utf-8");
    if(log) console.log(data[id]);
}

let interval = null;

const client = new bot.Client();

client.on("ready", async () => {
    console.log(`${client.user.username} is ready!`);
});

client.on("messageUpdate", async function(_msg, msg){
    if(!(msg.channelId == CHANNEL_ID && msg.author.id == "571027211407196161")) return;
    let btn = msg.components[1].components[2];
    updateData(_msg);
    updateData(msg, true);
    if(!interval)
        interval = setInterval(()=>msg.clickButton(btn.customId), 1000);
});

client.login(TOKEN);