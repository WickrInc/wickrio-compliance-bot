var addon = require('wickrio_addon');
var fs = require('fs');

process.title = "complianceBot";
module.exports = addon;
process.stdin.resume(); //so the program will not close instantly

function exitHandler(options, err) {
  if (err) {
    console.log(err.stack);
    addon.cmdStopAsyncRecvMessages();
    console.log(addon.closeClient());
    process.exit();
  }
  if (options.exit) {
    addon.cmdStopAsyncRecvMessages();
    console.log(addon.closeClient());
    process.exit();
  } else if (options.pid) {
    addon.cmdStopAsyncRecvMessages();
    console.log(addon.closeClient());
    process.kill(process.pid);
  }
}

//catches ctrl+c and stop.sh events
process.on('SIGINT', exitHandler.bind(null, {
  exit: true
}));

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, {
  pid: true
}));
process.on('SIGUSR2', exitHandler.bind(null, {
  pid: true
}));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {
  exit: true
}));

return new Promise(async (resolve, reject) => {
  try {
    if (process.argv[2] === undefined) {
      var client = await fs.readFileSync('client_bot_username.txt', 'utf-8');
      client = client.trim();
      var response = await addon.clientInit(client);
      resolve(response);
    } else {
      var response = await addon.clientInit(process.argv[2]);
      resolve(response);
    }
  } catch (err) {
    console.log(err);
    process.exit();
  }
}).then(result => {
  console.log(result);
  try {
    var type='complianceruntime';
    var value='true';
    addon.cmdSetControl(type, value);
  } catch (err) {
    console.log(err);
    process.exit();
  }

  try {
    addon.cmdStartAsyncRecvMessages(listen);
  } catch (err) {
    console.log(err);
    process.exit();
  }

  function listen(message) {
    try {
      fs.appendFileSync('receivedMessages.log', message + '\n', 'utf8');
    } catch (err) {
      return console.log(err);
    }
  }
}).catch(error => {
  console.log('Error: ', error);
});
