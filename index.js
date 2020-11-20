const Discord = require('discord.js');
const dotenv = require('dotenv');
const client = new Discord.Client();
const WebSocket = require('ws');

dotenv.config();

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});
const ws = new WebSocket(process.env.GATEWAY);

let isProcessing = false;

ws.on('open', function open() {
    console.log("Connection established!");
});

client.on('message', message => {
    if (message.content.startsWith('!db ')) {
        if (isProcessing) {
            message.reply("Nah I am already processing something, wait man.");
            return;
        }
        if (message.content.startsWith('!db crawl ')) {
            isProcessing = true;
            let matches = [];
            let string = "";
            let chunks = [];
            message.channel.send("I am contacting the DocBot Gateway server now. It may take some time to process!").then((msg) => {
                ws.send(JSON.stringify({
                    "api_key": process.env.API_KEY,
                    "service": message.content.substr(10)
                }));
                ws.on('message', function incoming(data) {
                    data = JSON.parse(data);

                    if (data.message == "match") {
                        matches.push(data.parameters);
                    }
                    if (data.message == "finished") {
                        isProcessing = false;

                        if (matches.length == 0) {

                            if (Math.random() > 0.99) {
                                message.reply("I have found 0 matches!", { files: ["https://media1.tenor.com/images/b11044c627cef3e97d4d09680e3f2ec0/tenor.gif"] });
                            }else{
                                message.reply("I have found 0 matches!");
                            }
                            return;
                        }
                        msg.edit(msg.content + "\n\nFinished crawling the service! I have found " + matches.length + " matches. I will list them below:\n\n\n").then((msgedit) => {
                            matches.forEach((match) => {

                                let filteredSentence = match.sentence.replace("`", "");
                                string += `Case https://edit.tosdr.org/cases/${match.case}\nSentence: ${filteredSentence}\nDocument: https://edit.tosdr.org/documents/${match.document.id} (${match.document.name})\nThe Service \`${match.service.name}\` has a \`${match.service.rating}\` Rating\n\n`;
                            });
                            chunks = string.match(/(.|[\r\n]){1,2000}/g);
                            chunks.forEach((chunk) => {
                                message.channel.send(chunk);
                            })
                        });
                    }
                });
            });
        }
    }
});

client.login(process.env.TOKEN);