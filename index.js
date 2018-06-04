/*jshint laxcomma: true, smarttabs: true*/
/*globals module,process,require */
'use strict'
/**
 * primary logging harness for hive. Profides stdout, file and syslog logging by
 * default. Also allows for ad-hoc logging module loading given the module is a winston
 * compaitible class.
 * ## hive Log
 * A multi transport logging package for the hive platform. The logger can support any logger the implements the [winston](https://www.npmjs.org/package/winston) logging interface. Out of the box the logging package supports `file` transports for a log file that will get rotated every day, `stdout` which simply dumps all logs to the host computers stdout, and `syslog` which attempts to send logs to a running syslog server over udp.
 *
 * ### Configuration
 *
 * Logging options are set using the hive conf package so you can set you logging options as you would everything else. You use the `--logger` or `-l` the flag can be passed mutliple times to specify multiple transports. There is always an exception transport called `stderr` in the config that will always write to stdout For example, if you wanted to log to syslog, but also get feedback from stdout:
 *
 * ```sh
 * node server.js --logger=stdout --logger=syslog
 * ```
 *
 * trasport specific configuration can be specified using the `log`:`<TRANSPORT>` prefix. For example you can disable the json formatting by passing the `prettyPrint` option a falsy value.
 *
 *
 * ```sh
 * node server --logger=stdout --log:stdout:prettyPrint=0
 * node server --log:stderr:prettyPrint=1
 * ```
 *
 * #### Available Transports
 *
 *  Name | Description |
 * :------:|-----------|
 * stdout | prints output to the current stdout |
 * syslog | sends logs to a syslog server over `UDP` |
 * file | Writes logs to a file that is rotated daily |
 * papertrail | Sends logs to a configured papertrail server |
 *
 * ### Logging
 *
 * The logging package exports a fully configured winston interface that supports syslog logging levels. Each level is method on the interface that logs with the logging level, tag and logging level
 *
 *
 * ```
 * var logger = require('bitters')
 * logger.http('hello world')
 * logger.debug('hello world')
 * logger.info('hello world')
 * logger.notice('hello world')
 * logger.warning('hello world')
 * logger.error('hello world')
 * logger.crit('hello world')
 * logger.alert('hello world')
 * logger.emerg('hello world')
 * ```
 *
 * #### Formatting
 * The loggers suppport the same formatting options and Node's [util](http://nodejs.org/api/util.html#util_util_format_format) module.
 *
 * ```js
 * var logger = require('bitters')
 *
 * logger.debug('Hi, %s, my name is %', "Bill", variable)
 * ```
 *
 * The last argument to any of the log method can be a serialiable object and it will be included in the log data in an appropriate format.
 *
 * ```js
 * var logger = require('hive-log')
 *
 * logger.debug("Dude, I just got some %s data", 'crazy', {key:'value'} )
 * ```
 * @module bitters
 * @author Eric Satterwhite
 * @since 0.1.0
 * @requires keef
 * @requires winston
 * @requires path
 * @requires domain
 * @requires events
 * @requires gaz/array
 * @requires gaz/lang
 */

var winston = require('winston')
  , path = require('path')
  , util = require('util')
  , domain = require('domain')
  , conf = require('keef')
  , {compact} = require('gaz/array')
  , {toArray} = require('gaz/lang')
  , loggerdomain = domain.create()
  , loggers = []
  , log_types
  , levels
  , colors
  , exceptionloggers
  , logger
  , log

log        = conf.get('log')
log_types  = conf.get('logger')
log_types  = compact(toArray(typeof log_types === 'string' ? log_types.split(/(?:\s+)?,(?:\s+)?/) : log_types))

levels = {
  /**
   * Logs a message at the emerg log level
   * @static
   * @function emerg
   * @memberof module:bitters
   * @param {String} message The message to log. Can contain positional string formatting params `%s`, `%d`, `%j`
   * @param {...String} [params] additional params to be passed through as psositional format arguments
   * @param {Object} [meta] any additional data you wish to store with the message
   */
  emerg: 0,
  /**
   * Logs a message at the alert log level
   * @static
   * @function alert
   * @memberof module:bitters
   * @param {String} message The message to log. Can contain positional string formatting params `%s`, `%d`, `%j`
   * @param {...String} [params] additional params to be passed through as psositional format arguments
   * @param {Object} [meta] any additional data you wish to store with the message
   */
  alert: 1,
  /**
   * Logs a message at the crit log level
   * @static
   * @function crit
   * @memberof module:bitters
   * @param {String} message The message to log. Can contain positional string formatting params `%s`, `%d`, `%j`
   * @param {...String} [params] additional params to be passed through as psositional format arguments
   * @param {Object} [meta] any additional data you wish to store with the message
   */
  crit: 2,
  /**
   * Logs a message at the error log level
   * @static
   * @function error
   * @memberof module:bitters
   * @param {String} message The message to log. Can contain positional string formatting params `%s`, `%d`, `%j`
   * @param {...String} [params] additional params to be passed through as psositional format arguments
   * @param {Object} [meta] any additional data you wish to store with the message
   */
  error: 3,
  /**
   * Logs a message at the warning log level
   * @static
   * @function warning
   * @memberof module:bitters
   * @param {String} message The message to log. Can contain positional string formatting params `%s`, `%d`, `%j`
   * @param {...String} [params] additional params to be passed through as psositional format arguments
   * @param {Object} [meta] any additional data you wish to store with the message
   */
  warning: 4,
  /**
   * Logs a message at the notice log level
   * @static
   * @function notice
   * @memberof module:bitters
   * @param {String} message The message to log. Can contain positional string formatting params `%s`, `%d`, `%j`
   * @param {...String} [params] additional params to be passed through as psositional format arguments
   * @param {Object} [meta] any additional data you wish to store with the message
   */
  notice: 5,
  /**
   * Logs a message at the info log level
   * @static
   * @function info
   * @memberof module:bitters
   * @param {String} message The message to log. Can contain positional string formatting params `%s`, `%d`, `%j`
   * @param {...String} [params] additional params to be passed through as psositional format arguments
   * @param {Object} [meta] any additional data you wish to store with the message
   */
  info: 6,
  /**
   * Logs a message at the debug log level
   * @static
   * @function debug
   * @memberof module:bitters
   * @param {String} message The message to log. Can contain positional string formatting params `%s`, `%d`, `%j`
   * @param {...String} [params] additional params to be passed through as psositional format arguments
   * @param {Object} [meta] any additional data you wish to store with the message
   */
  debug: 7,
  /**
   * Logs a message at the http log level
   * @static
   * @function http
   * @memberof module:bitters
   * @param {String} message The message to log. Can contain positional string formatting params `%s`, `%d`, `%j`
   * @param {...String} [params] additional params to be passed through as psositional format arguments
   * @param {Object} [meta] any additional data you wish to store with the message
   */
  http: 8
}

colors = {
  emerg: 'blackBG bold red'
, alert: 'redBG white'
, crit: 'bold yellow'
, error: 'red'
, warning: 'bold yellow'
, notice: 'bold blue'
, info: 'green'
, debug: 'grey'
, http: 'magenta'
}

for (const type of log_types) {
  try {
    var backend = require('./transports/' + type )
  } catch (err) {
    const backendconf = conf.get( type )
    if( backendconf && backendconf.module ){
      backend = require( backendconf.module )
    } else {
      const e = new Error()
      e.name='InvalidLogType'
      e.message = `unable to load logging module ${type}`
      process.emit('error', e)
    }
  }

  if (backend) {
    loggers.push(new backend(log[type]))
  }
}

exceptionloggers = [
  new winston.transports.Console( conf.get('log:stderr') )
]

loggerdomain.on('error', ( err ) => {
  process.stderr.write('problem writing to log %s\n %s', err.message, err.stack )
})


// run the loggers under a domain
loggerdomain.run( function(){
  logger = new (winston.Logger)({
    transports: loggers,
    exceptionHandlers: !process.env.NODE_ENV === 'test' ? exceptionloggers : null,
    addColors: true,
    levels: levels,
    colors: colors,
    padLevels: true
  })

  /**
   * Loggs a message at the debug log level
   * @namespace module:bitters.exception
   * @memberof module:bitters
   */
  logger.exception = winston.exception
})

/**
 * Generates a More readible and parseable stack trace
 * @function getTrace
 * @param {Error} error An error object to generate a more readible stack trace from
 * @memberof module:bitters.exception
 * @returns {Array} an array of object where each object is a line in the stack trace
 */


/**
 * Returns current os information
 * @function getOsInfo
 * @memberof module:bitters.exception
 * @returns {Object} Os information containing `loadavg` and `uptime`
 */

 /**
 * Os stats includeing `pid`,`uid`, `gid`, `cwd`, `execPath`, `version`, `argv`, and `memoryUsage`
 * @function getProcessInfo
 * @memberof module:bitters.exception
 * @returns an object containing current OS stats
 */

module.exports = logger
