/*jshint node:true, laxcomma: true, smarttabs: true*/
'use strict';
/**
 * Winstons daily file log rotate transport
 * @module hive-log/transports/file
 * @author Eric Satterwhite
 * @since 0.1.0
 * @requires winston
 */

var winston = require( 'winston' );
module.exports = winston.transports.DailyRotateFile;
