import fs from 'fs'
import path from 'path'
import WickrIOAPI from 'wickrio_addon'
import WickrIOBotAPI from 'wickrio-bot-api'

// const WickrUser = WickrIOBotAPI.WickrUser
const bot = new WickrIOBotAPI.WickrIOBot()

process.title = 'complianceBot'
module.exports = WickrIOAPI
process.stdin.resume() // so the program will not close instantly

async function exitHandler(options, err) {
  try {
    await bot.close()
    if (err || options.exit) {
      console.log('Exit reason:', err)
      process.exit()
    } else if (options.pid) {
      process.kill(process.pid)
    }
  } catch (err) {
    console.log(err)
  }
}

// catches ctrl+c and stop.sh events
process.on('SIGINT', exitHandler.bind(null, { exit: true }))

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, { pid: true }))
process.on('SIGUSR2', exitHandler.bind(null, { pid: true }))

// catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, { exit: true }))

async function main() {
  const tokens = JSON.parse(process.env.tokens)
  try {
    let client

    if (
      tokens.WICKRIO_BOT_NAME !== undefined &&
      tokens.WICKRIO_BOT_NAME.value !== undefined
    ) {
      client = tokens.WICKRIO_BOT_NAME.value
    } else if (process.argv[2] === undefined) {
      client = await fs.readFileSync('client_bot_username.txt', 'utf-8')
      client = client.trim()
    } else {
      client = process.argv[2]
    }

    const status = await bot.start(client)
    if (!status) {
      exitHandler(null, {
        exit: true,
        reason: 'Client not able to start',
      })
    }
  } catch (err) {
    console.log(err)
    process.exit()
  }

  try {
    const type = 'complianceruntime'
    const value = 'true'
    WickrIOAPI.cmdSetControl(type, value)
    WickrIOAPI.cmdSetControl('contactbackup', 'false')
    WickrIOAPI.cmdSetControl('convobackup', 'false')
  } catch (err) {
    console.log(err)
    process.exit()
  }

  // Set the duration (seconds)
  let rtDuration = '1440'
  if (tokens.RUNTIME_DURATION !== undefined) {
    try {
      if (tokens.RUNTIME_DURATION.encrypted) {
        rtDuration = WickrIOAPI.cmdDecryptString(tokens.RUNTIME_DURATION.value)
      } else {
        rtDuration = tokens.RUNTIME_DURATION.value
      }

      const rtDurationSeconds = parseInt(rtDuration, 10) * 60
      rtDuration = rtDurationSeconds.toString()

      WickrIOAPI.cmdSetControl('duration', rtDuration)
    } catch (err) {
      console.log(err)
      process.exit()
    }
  }

  let useStreaming

  // set the streaming, if is turned on
  if (tokens.USE_STREAMING !== undefined) {
    if (tokens.USE_STREAMING.encrypted) {
      useStreaming = WickrIOAPI.cmdDecryptString(tokens.USE_STREAMING.value)
    } else {
      useStreaming = tokens.USE_STREAMING.value
    }
    if (useStreaming === 'yes') {
      let dest, basename, maxsize, attachloc

      if (tokens.STREAM_DESTINATION !== undefined) {
        if (tokens.STREAM_DESTINATION.encrypted) {
          dest = WickrIOAPI.cmdDecryptString(tokens.STREAM_DESTINATION.value)
        } else {
          dest = tokens.STREAM_DESTINATION.value
        }
      } else {
        dest = path.join(__dirname, 'messages')
        if (!fs.existsSync(dest)) {
          fs.mkdirSync(dest)
        }
      }

      if (tokens.STREAM_BASENAME.encrypted) {
        basename = WickrIOAPI.cmdDecryptString(tokens.STREAM_BASENAME.value)
      } else {
        basename = tokens.STREAM_BASENAME.value
      }

      if (tokens.STREAM_MAXSIZE.encrypted) {
        maxsize = WickrIOAPI.cmdDecryptString(tokens.STREAM_MAXSIZE.value)
      } else {
        maxsize = tokens.STREAM_MAXSIZE.value
      }

      if (tokens.STREAM_DESTINATION !== undefined) {
        if (tokens.STREAM_ATTACHLOC.encrypted) {
          attachloc = WickrIOAPI.cmdDecryptString(tokens.STREAM_ATTACHLOC.value)
        } else {
          attachloc = tokens.STREAM_ATTACHLOC.value
        }
      } else {
        attachloc = path.join(__dirname, 'attachments')
        if (!fs.existsSync(attachloc)) {
          fs.mkdirSync(attachloc)
        }
      }

      const csm = WickrIOAPI.cmdSetFileStreaming(
        dest,
        basename,
        maxsize,
        attachloc
      )
      console.log(csm)
    }
  } else {
    useStreaming = 'no'
  }

  // If not using streaming then start listening for messages
  if (useStreaming !== 'yes') {
    // turn off streaming
    try {
      const csm = WickrIOAPI.cmdSetStreamingOff()
      console.log(csm)
    } catch (err) {
      console.log(err)
    }

    // set the callback function that will receive incoming messages into the bot client
    try {
      await bot.startListening(listen)
    } catch (err) {
      console.log(err)
      process.exit()
    }
  }
}

function listen(message) {
  try {
    fs.appendFileSync('receivedMessages.log', message + '\n', 'utf8')
  } catch (err) {
    return console.log(err)
  }
}

main()
