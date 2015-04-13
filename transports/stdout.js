/*jshint node:true, laxcomma: true, smarttabs: true*/
'use strict';
/**
 * Winstons daily file log rotate transport
 * @module module:hive-log/transports/stdout
 * @author Eric Satterwhite
 * @since 0.1.0
 * @requires winston
 * @requires winston-syslog
 */

var winston = require( 'winston' );
module.exports = winston.transports.Console;
