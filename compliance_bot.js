var fs = require('fs');
const WickrIOAPI = require('wickrio_addon');
const WickrIOBotAPI = require('wickrio-bot-api');
const WickrUser = WickrIOBotAPI.WickrUser;
const bot = new WickrIOBotAPI.WickrIOBot();
const logger = require('./logger');

process.title = "complianceBot";
module.exports = WickrIOAPI;
process.stdin.resume(); //so the program will not close instantly

async function exitHandler(options, err) {
  try {
    var closed = await bot.close();
    if (err || options.exit) {
      logger.info("Exit reason:", err);
      process.exit();
    } else if (options.pid) {
      process.kill(process.pid);
    }
  } catch (err) {
    logger.error(err);
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

    bot.processesJsonToProcessEnv()

    var tokens = JSON.parse(process.env.tokens);
    
    if (tokens.WICKRIO_BOT_NAME !== undefined &&
        tokens.WICKRIO_BOT_NAME.value !== undefined) {
      client = tokens.WICKRIO_BOT_NAME.value;
    } else if (process.argv[2] === undefined) {
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
    logger.error(err);
    process.exit();
  }

  try {
    var type='complianceruntime';
    var value='true';
    await WickrIOAPI.cmdSetControl(type, value);
    await WickrIOAPI.cmdSetControl('contactbackup', 'false');
    await WickrIOAPI.cmdSetControl('convobackup', 'false');
  } catch (err) {
    logger.error(err);
    process.exit();
  }

  // Set the duration (seconds)
  var rtDuration='1440';
  if (tokens.RUNTIME_DURATION !== undefined) {
    try {
      if (tokens.RUNTIME_DURATION.encrypted) {
        rtDuration = await WickrIOAPI.cmdDecryptString(tokens.RUNTIME_DURATION.value);
      } else {
        rtDuration = tokens.RUNTIME_DURATION.value;
      }

      rtDurationSeconds = parseInt(rtDuration, 10) * 60;
      rtDuration = rtDurationSeconds.toString();

      await WickrIOAPI.cmdSetControl('duration', rtDuration);
    } catch (err) {
      logger.error(err);
      process.exit();
    }
  }



  var useStreaming;

  // set the streaming, if is turned on
  if (tokens.USE_STREAMING !== undefined) {
    if (tokens.USE_STREAMING.encrypted) {
      useStreaming = await WickrIOAPI.cmdDecryptString(tokens.USE_STREAMING.value);
    } else {
      useStreaming = tokens.USE_STREAMING.value;
    }
    if (useStreaming === "yes") {
      var dest, basename, maxsize, attachloc;

      if (tokens.STREAM_DESTINATION !== undefined) {
        if (tokens.STREAM_DESTINATION.encrypted) {
          dest = await WickrIOAPI.cmdDecryptString(tokens.STREAM_DESTINATION.value);
        } else {
          dest = tokens.STREAM_DESTINATION.value;
        }
      } else {
        dest = __dirname + "messages";
        if (!fs.existsSync(dest)) {
          fs.mkdirSync(dest);
        }
      }

      if (tokens.STREAM_BASENAME.encrypted) {
        basename = await WickrIOAPI.cmdDecryptString(tokens.STREAM_BASENAME.value);
      } else {
        basename = tokens.STREAM_BASENAME.value;
      }

      if (tokens.STREAM_MAXSIZE.encrypted) {
        maxsize = await WickrIOAPI.cmdDecryptString(tokens.STREAM_MAXSIZE.value);
      } else {
        maxsize = tokens.STREAM_MAXSIZE.value;
      }

      if (tokens.STREAM_DESTINATION !== undefined) {
        if (tokens.STREAM_ATTACHLOC.encrypted) {
          attachloc = await WickrIOAPI.cmdDecryptString(tokens.STREAM_ATTACHLOC.value);
        } else {
          attachloc = tokens.STREAM_ATTACHLOC.value;
        }
      } else {
        attachloc = __dirname + "attachments";
        if (!fs.existsSync(attachloc)) {
          fs.mkdirSync(attachloc);
        }
      }

      var csm = await WickrIOAPI.cmdSetFileStreaming(dest, basename, maxsize, attachloc);
      logger.info(csm);
    }
  } else {
    useStreaming = "no";
  }

  // If not using streaming then start listening for messages
  if (useStreaming !== "yes") {
    // turn off streaming
    try {
      var csm = await WickrIOAPI.cmdSetStreamingOff();
      logger.info(csm);
    } catch (err) {
      logger.error(err);
    }

    // set the callback function that will receive incoming messages into the bot client
    try {
      await bot.startListening(listen);
    } catch (err) {
      logger.error(err);
      process.exit();
    }
  }
}

function listen(message) {
  try {
    fs.appendFileSync('receivedMessages.log', message + '\n', 'utf8');
  } catch (err) {
    return logger.error(err);
  }
}

main();

