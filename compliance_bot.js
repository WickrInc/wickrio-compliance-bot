var fs = require('fs');
const WickrIOAPI = require('wickrio_addon');
const WickrIOBotAPI = require('wickrio-bot-api');
const WickrUser = WickrIOBotAPI.WickrUser;
const bot = new WickrIOBotAPI.WickrIOBot();

process.title = "complianceBot";
module.exports = WickrIOAPI;
process.stdin.resume(); //so the program will not close instantly

async function exitHandler(options, err) {
  try {
    var closed = await bot.close();
    if (err || options.exit) {
      console.log("Exit reason:", err);
      process.exit();
    } else if (options.pid) {
      process.kill(process.pid);
    }
  } catch (err) {
    console.log(err);
  }
}

//catches ctrl+c and stop.sh events
process.on('SIGINT', exitHandler.bind(null, { exit: true }));

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, { pid: true }));
process.on('SIGUSR2', exitHandler.bind(null, { pid: true }));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, { exit: true }));

async function main() {
  try {
    var client;

    if (process.argv[2] === undefined) {
      client = await fs.readFileSync('client_bot_username.txt', 'utf-8');
      client = client.trim();
    } else {
      client = process.argv[2];
    }

    var status = await bot.start(client)
    if (!status) {
      exitHandler(null, {
        exit: true,
        reason: 'Client not able to start'
      });
    }
  } catch (err) {
    console.log(err);
    process.exit();
  }

  try {
    var type='complianceruntime';
    var value='true';
    WickrIOAPI.cmdSetControl(type, value);
  } catch (err) {
    console.log(err);
    process.exit();
  }

  try {
    await bot.startListening(listen); //Passes a callback function that will receive incoming messages into the bot client
  } catch (err) {
    console.log(err);
    process.exit();
  }
}

function listen(message) {
  try {
    fs.appendFileSync('receivedMessages.log', message + '\n', 'utf8');
  } catch (err) {
    return console.log(err);
  }
}

main();

