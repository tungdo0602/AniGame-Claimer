const bot = require("discord.js-selfbot-v13");
const fs = require('fs');

let TOKEN = "ODE4ODU2MjY2NzIxMTMyNTY0.GiOzB6.mpldgBO0LTs8Hn_AWi6GPkLoDumQDGPeGWP8Xg";
let data = {}
let CHANNEL_ID = "913451615573385269";

try {
    data = JSON.parse(fs.readFileSync("./cardData.json", "utf-8"));
} catch {
    console.log("File not found!");
}

let done = true;
function updateData(msg, log = false){
    if(msg.components.length != 2) return;
    if(msg.components[0].type != "CONTAINER") return;
    if(msg.components[0].components.length != 5) return;
    if(!(msg.components[0].components[4].content && msg.components[0].components[4].content.includes("Page"))) return;
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
    if(log) console.log(data[id]);
}

let interval = null;

const client = new bot.Client();

client.on("ready", async () => {
    console.log(`${client.user.username} is ready!`);
});

setInterval(()=>{
    fs.writeFileSync("./cardData.json", JSON.stringify(data), "utf-8");
    console.log("Saved!");
}, 10000);

client.on("messageCreate", function(msg){
    if(msg.author.id != "571027211407196161") return;
    updateData(msg, true);
})

client.on("messageUpdate", function(_msg, msg){
    if(msg.author.id != "571027211407196161") return;
    updateData(msg, true);
});

client.login(TOKEN);
