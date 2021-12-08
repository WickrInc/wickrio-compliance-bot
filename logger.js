const winston = require('winston')
const DailyRotateFile = require('winston-daily-rotate-file')
const fs = require('fs')
const path = require('path')

const logDir = 'logs'
if (!fs.existsSync(logDir)) {
  // Create the directory if it does not exist
  fs.mkdirSync(logDir)
}

const processesJsonFile = path.join(process.cwd(), 'processes.json')
if (!fs.existsSync(processesJsonFile)) {
  console.error(processesJsonFile + ' does not exist!')
  process.exit(1)
}

const processesJson = fs.readFileSync(processesJsonFile)
const processesJsonObject = JSON.parse(processesJson)

process.env.log_tokens = JSON.stringify(
  processesJsonObject.apps[0].env.log_tokens
)

let LOG_LEVEL, LOG_FILE_SIZE, LOG_MAX_FILES

if(process.env.log_tokens === 'undefined' && process.env.log_tokens === undefined) {
  processesJsonObject.apps[0].env.log_tokens = {}
  processesJsonObject.apps[0].env.log_tokens.LOG_LEVEL = {}
  LOG_LEVEL = {}
  LOG_LEVEL.value = 'info'
  processesJsonObject.apps[0].env.log_tokens.LOG_LEVEL.value = 'info'
  processesJsonObject.apps[0].env.log_tokens.LOG_FILE_SIZE = {}
  LOG_FILE_SIZE = {}
  LOG_FILE_SIZE.value = '10m'
  processesJsonObject.apps[0].env.log_tokens.LOG_FILE_SIZE.value = '10m'
  processesJsonObject.apps[0].env.log_tokens.LOG_MAX_FILES = {}
  LOG_MAX_FILES = {}
  LOG_MAX_FILES.value = '5'
  processesJsonObject.apps[0].env.log_tokens.LOG_MAX_FILES.value = '5'
} else {
  let { LOG_LEVEL, LOG_FILE_SIZE, LOG_MAX_FILES } = JSON.parse(
    process.env.log_tokens
  )
  if (LOG_LEVEL === undefined || LOG_LEVEL.value === undefined) {
    processesJsonObject.apps[0].env.log_tokens.LOG_LEVEL = {}
    LOG_LEVEL = {}
    LOG_LEVEL.value = 'info'
    processesJsonObject.apps[0].env.log_tokens.LOG_LEVEL.value = 'info'
  }
  if (LOG_FILE_SIZE === undefined || LOG_FILE_SIZE.value === undefined) {
    processesJsonObject.apps[0].env.log_tokens.LOG_FILE_SIZE = {}
    LOG_FILE_SIZE = {}
    LOG_FILE_SIZE.value = '10m'
    processesJsonObject.apps[0].env.log_tokens.LOG_FILE_SIZE.value = '10m'
  }
  if (LOG_MAX_FILES === undefined || LOG_MAX_FILES.value === undefined) {
    processesJsonObject.apps[0].env.log_tokens.LOG_MAX_FILES = {}
    LOG_MAX_FILES = {}
    LOG_MAX_FILES.value = '5'
    processesJsonObject.apps[0].env.log_tokens.LOG_MAX_FILES.value = '5'
  }
}

try {
  fs.writeFileSync(
    processesJsonFile,
    // Write the JSON object with 2 spaces and indentation
    JSON.stringify(processesJsonObject, null, 2),
    err => {
      if (err) throw err
    }
  )
} catch (err) {
  console.error(err)
}
const level = LOG_LEVEL !== undefined ? LOG_LEVEL.value : 'info'
const maxSize = LOG_FILE_SIZE !== undefined ? LOG_FILE_SIZE.value : '10m'
const maxFiles = LOG_MAX_FILES !== undefined ? LOG_MAX_FILES.value : '5'

const rotateTransport = new DailyRotateFile({
  filename: path.join(logDir, 'log-%DATE%.output'),
  level,
  maxSize,
  maxFiles,
})

const errorTransport = new DailyRotateFile({
  filename: path.join(logDir, 'error-%DATE%.output'),
  maxSize,
  maxFiles,
  level: 'error',
})

// transport.on('rotate', function(oldFilename, newFilename) {
//   // do something fun
// })

const logConfiguration = {
  transports: [rotateTransport, errorTransport],
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DDTHH:mm:ss',
    }),
    winston.format.colorize(),
    winston.format.printf(info =>
      info.stack
        ? `${[info.timestamp]} ${info.level}: ${info.message}\n${info.stack}`
        : `${[info.timestamp]} ${info.level}: ${info.message}`
    )
  ),
}

const logger = winston.createLogger(logConfiguration)

module.exports = logger
