const fs = require('fs');
const readline = require('readline');

const crushEmails = [];

const readInterface = readline.createInterface({
  input: fs.createReadStream('selected_emails.csv'),
  output: process.stdout,
  console: false
});

readInterface.on('line', function(line) {
  crushEmails.push(line);
});

readInterface.on('close', async function() {
    console.log(crushEmails);
    await sendEmails(crushEmails);
});

//let crushEmails = ["eheidari@usc.edu", "maxwellfung@berkeley.edu", "cyclanthaceae@berkeley.edu"]; 

const delay = ms => new Promise(res => setTimeout(res, ms));

async function sendEmails(crushEmails) {
    for (const email of crushEmails) {
        const response = await fetch('https://us-central1-murmurwebsite.cloudfunctions.net/sendEmail', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ emails: [email] }),
        });
        
        if (response.ok) {
            console.log(`Email sent ${email}`);
        } else {
            console.log(response); 
            console.error(`Failed ${email}`);
        }

        await delay(60000); 
    }
}

sendEmails(crushEmails);