const WickrIOBotAPI = require('wickrio-bot-api');
const util = require('util')


require("dotenv").config({
  path: `.env.configure`
})

var wickrIOConfigure;

process.stdin.resume(); //so the program will not close instantly

function exitHandler(options, err) {
  try {
    if (err) {
      process.kill(process.pid);
      process.exit();
    }
    if (options.exit) {
      process.exit();
    } else if (options.pid) {
      process.kill(process.pid);
    }
  } catch (err) {
    console.log(err);
  }
}

//catches ctrl+c and stop.sh events
process.on('SIGINT', exitHandler.bind(null, {exit: true}));

//catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, {pid: true}));
process.on('SIGUSR2', exitHandler.bind(null, {pid: true}));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {
  exit: true,
  reason: 'uncaughtException'
}));

main();


async function main()
{
    const tokenConfig = [
        {
            token: 'USE_STREAMING',
            pattern: 'yes|no',
            type: 'string',
            description: 'Do you want to use streaming',
            message: 'Please enter either yes or no',
            required: true,
            default: 'no',
            list: [
                {
                    token: 'STREAM_DESTINATION',
                    pattern: '',
                    type: 'file',
                    description: 'Please specify the directory to save message data',
                    message: 'Cannot find directory!',
                    required: true,
                    default: 'N/A',
                },
                {
                    token: 'STREAM_BASENAME',
                    pattern: '',
                    type: 'string',
                    description: "Please add a prefix for message data files",
                    message: 'Cannot leave empty! Please enter a value',
                    required: true,
                    default: 'receivedMessages',
                },
                {
                    token: 'STREAM_MAXSIZE',
                    pattern: '^([1-9][0-9]{3,8}|1000000000)$',
                    type: 'number',
                    description: "Please enter the maximum size in bytes for each messages file [1GB = 1073741824]",
                    message: 'Please enter a valid number between 1000 and 1000000000',
                    required: false,
                    default: 'N/A',
                },
                {
                    token: 'STREAM_ATTACHLOC',
                    pattern: '',
                    type: 'file',
                    description: "Please specify the directory to save attachment data",
                    message: 'Cannot find directory!',
                    required: true,
                    default: 'N/A',
                }
            ]
        },
        {
            token: 'RUNTIME_DURATION',
            pattern: '^([1-9][0-9]{1,2}|[1-4][0-9]{1,3}|[1-5]000)$',
            type: 'string',
            description: 'Memory can reach 100% if the bot isn't restarted periodically. Please enter a time in minutes to restart the service [24hrs = 1440]',
            message: 'Please enter a valid number',
            required: true,
            default: '1440'
        }
    ];


    var fullName = process.cwd() + "/processes.json";
    wickrIOConfigure = new WickrIOBotAPI.WickrIOConfigure(tokenConfig, fullName, false, false);

    await wickrIOConfigure.configureYourBot("WickrIO-Compliance-Bot");
    process.exit();
}
