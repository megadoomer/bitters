/*jshint laxcomma: true, smarttabs: true*/
/*globals module,process,require */
'use strict';
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
 * var logger = require('hive-log')
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
 * var logger = require('hive-log');
 *
 * logger.debug('Hi, %s, my name is %', "Bill", variable)
 * ```
 *
 * The last argument to any of the log method can be a serialiable object and it will be included in the log data in an appropriate format.
 *
 * ```js
 * var logger = require('hive-log');
 *
 * logger.debug("Dude, I just got some %s data", 'crazy', {key:'value'} )
 * ```
 * @module hive-log
 * @author Eric Satterwhite
 * @since 0.1.0
 * @requires keef
 * @requires winston
 * @requires path
 * @requires util
 * @requires domain
 * @requires events
 * @requires gaz/array
 * @requires gaz/lang
 */

var winston      = require( 'winston' )                  // winston logging module             // configuration package for hive
  , path         = require('path')                       // node path module
  , util         = require('util')                       // node util module
  , domain       = require( 'domain' )                   // node domain module
  , events       = require( 'events' )                   // node events module
  , conf         = require( 'keef' )               // configuration package for alice
  , compact      = require('gaz/array').compact // mout compact module 
  , toArray      = require('gaz/lang').toArray  // mout compact module
  , loggerdomain = domain.create()                       // domain object for logging
  , loggers      = []                                    // container to hold logger objects loaded
  , log_types                                            // typs of loggers to enable, captured from config
  , levels                                               // Syslog log levels
  , colors                                               // colors map for log levels
  , exceptionloggers                                     // logger to deal with errors specifically
  , loggerdomain                                         // Domain for logging to run under
  , logger                                               // the logger object to be exported
  , emitter                                              // error emitter for logging domin
  , log                                                  // logging configuration
  , cli                                                  // stdout logging object
  , log_dir                                              // directory to dump log files
  , stderr_log                                           // path for error logs
  , DEBUG                                                // Flag to enable stdout logging
  ;

log        = conf.get('log')
log_types  = conf.get('logger');
log_types  = compact( toArray( log_types ) );
log_dir    = log.file.dir;
stderr_log = path.join(log_dir,'hive.error.log');
emitter    = new events.EventEmitter();

levels = {
	/**
	 * Logs a message at the emerg log level
	 * @static
	 * @function emerg
	 * @memberof module:hive-log
	 * @param {String} message The message to log. Can contain positional string formatting params `%s`, `%d`, `%j`
	 * @param {...String} [params] additional params to be passed through as psositional format arguments
	 * @param {Object} [meta] any additional data you wish to store with the message
	 */
	emerg: 8,
	/**
	 * Logs a message at the alert log level
	 * @static
	 * @function alert
	 * @memberof module:hive-log
	 * @param {String} message The message to log. Can contain positional string formatting params `%s`, `%d`, `%j`
	 * @param {...String} [params] additional params to be passed through as psositional format arguments
	 * @param {Object} [meta] any additional data you wish to store with the message
	 */
	alert: 7,
	/**
	 * Logs a message at the crit log level
	 * @static
	 * @function crit
	 * @memberof module:hive-log
	 * @param {String} message The message to log. Can contain positional string formatting params `%s`, `%d`, `%j`
	 * @param {...String} [params] additional params to be passed through as psositional format arguments
	 * @param {Object} [meta] any additional data you wish to store with the message
	 */
	crit: 6,
	/**
	 * Logs a message at the error log level
	 * @static
	 * @function error
	 * @memberof module:hive-log
	 * @param {String} message The message to log. Can contain positional string formatting params `%s`, `%d`, `%j`
	 * @param {...String} [params] additional params to be passed through as psositional format arguments
	 * @param {Object} [meta] any additional data you wish to store with the message
	 */
	error: 5,
	/**
	 * Logs a message at the warning log level
	 * @static
	 * @function warning
	 * @memberof module:hive-log
	 * @param {String} message The message to log. Can contain positional string formatting params `%s`, `%d`, `%j`
	 * @param {...String} [params] additional params to be passed through as psositional format arguments
	 * @param {Object} [meta] any additional data you wish to store with the message
	 */
	warning: 4,
	/**
	 * Logs a message at the notice log level
	 * @static
	 * @function notice
	 * @memberof module:hive-log
	 * @param {String} message The message to log. Can contain positional string formatting params `%s`, `%d`, `%j`
	 * @param {...String} [params] additional params to be passed through as psositional format arguments
	 * @param {Object} [meta] any additional data you wish to store with the message
	 */
	notice: 3,
	/**
	 * Logs a message at the info log level
	 * @static
	 * @function info
	 * @memberof module:hive-log
	 * @param {String} message The message to log. Can contain positional string formatting params `%s`, `%d`, `%j`
	 * @param {...String} [params] additional params to be passed through as psositional format arguments
	 * @param {Object} [meta] any additional data you wish to store with the message
	 */
	info: 2,
	/**
	 * Logs a message at the debug log level
	 * @static
	 * @function debug
	 * @memberof module:hive-log
	 * @param {String} message The message to log. Can contain positional string formatting params `%s`, `%d`, `%j`
	 * @param {...String} [params] additional params to be passed through as psositional format arguments
	 * @param {Object} [meta] any additional data you wish to store with the message 
	 */
	debug: 1,
	/**
	 * Logs a message at the http log level
	 * @static
	 * @function http
	 * @memberof module:hive-log
	 * @param {String} message The message to log. Can contain positional string formatting params `%s`, `%d`, `%j`
	 * @param {...String} [params] additional params to be passed through as psositional format arguments
	 * @param {Object} [meta] any additional data you wish to store with the message
	 */
	http: 0
}

colors = {
	emerg: 'red',
	alert: 'yellow',
	crit: 'red',
	error: 'red',
	warning: 'red',
	notice: 'yellow',
	info: 'green',
	debug: 'blue',
	http: 'cyan'
}

// try to resolve a module to load a
// logging backend
log_types.forEach(function( type ){
	var backend = null // the backend we are about to load
	  , backendconf    // derived configuration for the logging backend
	  , e;			   // potention error
	try{
		backend = require("./transports/" + type )
	} catch( err ){
		backendconf = conf.get( type );
		if( backendconf && backendconf.module ){
			backend = require( backendconf.module );
		} else{
			e = new Error();
			e.name="InvalidLogType";
			e.message = util.format( "unable to load logging module %s", type);
			emitter.emit('error', e);
		}
	}
	if( backend ){
		loggers.push( new backend( log[ type ] ) );
	}
})


exceptionloggers = [
	new winston.transports.Console( conf.get('log:stderr') )
];


loggerdomain.on('error', function( err ){
	process.stderr.write("problem writing to log %s\n %s", err.message, err.stack )
});


// run the loggers under a domain
loggerdomain.run( function(){
	logger = new (winston.Logger)({
		transports:loggers,
		exceptionHandlers: !process.env.HIVE_RUNNER ? exceptionloggers : null,
		addColors:true,
		levels:levels,
		colors:colors,
		padLevels:true
	});
});

/**
 * Loggs a message at the debug log level
 * @namespace module:hive-log.exception
 * @memberof module:hive-log
 */
logger.exception = winston.exception;

/**
 * Generates a More readible and parseable stack trace
 * @function getTrace
 * @param {Error} error An error object to generate a more readible stack trace from
 * @memberof module:hive-log.exception
 * @returns {Array} an array of object where each object is a line in the stack trace
 */


/**
 * Returns current os information
 * @function getOsInfo
 * @memberof module:hive-log.exception
 * @returns {Object} Os information containing `loadavg` and `uptime`
 */

 /**
 * Os stats includeing `pid`,`uid`, `gid`, `cwd`, `execPath`, `version`, `argv`, and `memoryUsage`
 * @function getProcessInfo
 * @memberof module:hive-log.exception
 * @returns an object containing current OS stats
 */

module.exports = logger;
