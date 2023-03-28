const https = require('https');
const fs = require('fs');

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


execute()
async function execute() {
    const filename = await question('Give me file name\n')

    console.log(filename)

    const file = await loadArrayFromFile(filename)

    console.log(file)

    let links = file[0]
    let file_name = file[1]

    mergeTextFiles(links)
    .then((mergedContents) => {
        //AND SAVE THAT
        console.log('\nMERGING\n')
        let base64Image = mergedContents.split(';base64,').pop();

        fs.writeFile(file_name, base64Image, {encoding: 'base64'}, function(err) {
            console.log('File created');
        });

    })
    .catch((error) => {
        console.error(error);
    })
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

async function mergeTextFiles(fileUrls) {
    const fileContents = [];

    // Download each file and add its content to the array
    for (let i = 0; i < fileUrls.length; i++) {
        const fileUrl = fileUrls[i];
        const fileData = await downloadFile(fileUrl);
        fileContents.push(fileData);
    }

    let mergedContents = ''

    // Merge the contents together into a single string
    for (let index = 0; index < fileContents.length; index++) {
        const element = fileContents[index];
        mergedContents = `${mergedContents}${element}`
    }

    // Return the merged string
    return mergedContents;
}
  
async function downloadFile(fileUrl) {
    return new Promise((resolve, reject) => {
        https.get(fileUrl, (response) => {
            let data = '';
            response.on('data', (chunk) => {
                data += chunk;
            });
            response.on('end', () => {
                console.log(`downloaded ${fileUrl}`)
                resolve(data);
            });
        }).on('error', (error) => {
            reject(error);
        });
    });
}