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
                    description: 'Please enter the location where stream files should be placed',
                    message: 'Cannot find directory!',
                    required: true,
                    default: 'N/A',
                },
                {
                    token: 'STREAM_BASENAME',
                    pattern: '',
                    type: 'string',
                    description: "Please enter the basename for the stream files",
                    message: 'Cannot leave empty! Please enter a value',
                    required: true,
                    default: 'receivedMessages',
                },
                {
                    token: 'STREAM_MAXSIZE',
                    pattern: '^([1-9][0-9]{3,8}|1000000000)$',
                    type: 'number',
                    description: "Please enter the max size for each stream file",
                    message: 'Please enter a valid number between 1000 and 1000000000',
                    required: false,
                    default: 'N/A',
                },
                {
                    token: 'STREAM_ATTACHLOC',
                    pattern: '',
                    type: 'file',
                    description: "Please enter the location for attachment files",
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
            description: 'Compliance bot should restart periodially to clear data structures.\nFor busy networks this should happen at least daily.\nPlease enter a number of minutes (10 to 5000):',
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
