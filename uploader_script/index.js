const fs = require('fs');
const Discord = require('discord.js');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve, reject) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
}

global()
async function global() {
    const config = await loadArrayFromFile('config.json')

    // console.log(config)

    //DISCORD
    const { Client, Intents,MessageAttachment} = require('discord.js');
    const client = new Discord.Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

    client.login(config.discord_bot);
    client.channels.fetch(config.channel)

    client.on('ready', () => {
        console.log(`Logged in : ${client.user.tag}!\n`);
        execute()
    });

    //////////////////////////////////////////////////////////////////////////

    async function execute() {
        const filePath = await question('Give name of file u want to upload\nfilePath : ')
        const fileData = fs.readFileSync(filePath);
        const dataUrl = `data:${getMimeType(filePath)};base64,${fileData.toString('base64')}`;

        let chunks = await splitString(dataUrl)
        let files = await createTextFiles(chunks)
        let links = await uploadChunks(files)

        let output_data = [links,filePath]

        fs.writeFile(`${filePath}.json`, JSON.stringify(output_data), (err) => {
            if (err) throw err;
            console.log('output file saved as :',`${filePath}.json`);
        });

        console.log([links,filePath])
    }

    //////////////////////////////////////////////////////////////////////////

    async function uploadChunks(chunks) {

        let links = []

        for (let index = 0; index < chunks.length; index++) {
            const element = chunks[index];
            let link = await uploadChunk(element,element)

            fs.unlink(element, (err) => {
                if (err) throw err;
                console.log(`${element} deleted!`);
            });

            links.push(link)
        }

        return links
    }

    function uploadChunk(blob,name) {
        return new Promise((resolve, reject) => {
          const channel = client.channels.cache.get(config.channel);
          const attachment = new MessageAttachment(blob, name);
      
          channel.send({ files: [attachment] })
            .then(message => {
                const attachmentUrl = message.attachments.first().url;
                resolve(attachmentUrl);
            })
            .catch(error => {
                reject(error);
            });
        });
    }

    // Function to split a long string into 7.5MB chunks
    function splitString(str) {
        const chunkSize = 7 * 1024 * 1024; // 7MB IT COULD BE 8MB BUT DISCORD sometimes says that it higher 
        const chunks = [];
        let i = 0;
        while (i < str.length) {
            chunks.push(str.substr(i, chunkSize));
            i += chunkSize;
        }
        return chunks;
    }

    // Function to load array from file as a promise
    function loadArrayFromFile(filename) {
        return new Promise((resolve, reject) => {
        fs.readFile(filename, (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    const loadedArray = JSON.parse(data);
                    resolve(loadedArray);
                }
            });
        });
    }

    // Function to create text files for each chunk
    function createTextFiles(chunks) {
        const filenames = [];
        chunks.forEach((chunk, index) => {
            const filename = `chunk_${index}.txt`;
            fs.writeFileSync(filename, chunk);
            filenames.push(filename);
        });
        return filenames;
    }

    function getMimeType(filePath) {
        const mime = require('mime-types');
        return mime.lookup(filePath);
    }

}