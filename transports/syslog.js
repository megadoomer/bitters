/*jshint node:true, laxcomma: true, smarttabs: true, node: true*/
'use strict';
/**
 * Winstons daily file log rotate transport
 * @module hive-log/transports/syslog
 * @author Eric Satterwhite
 * @since 0.1.0
 * @requires winston
 * @requires winston-posix-syslog
 */

var winston = require( 'winston' );

try{
	var syslog = require('winston-posix-syslog').PosixSyslog;
} catch( e ){
	syslog = winston.transports.DailyRotateFile;
}

module.exports = syslog;
