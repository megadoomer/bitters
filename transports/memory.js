/*jshint node:true, laxcomma: true, smarttabs: true*/
'use strict';
/**
 * Winstons in memory / no-op transport
 * @module module:hive-log/transports/memory
 * @author Eric Satterwhite
 * @since 0.1.0
 * @requires winston
 */

var winston = require( 'winston' );
module.exports = winston.transports.Memmory;
