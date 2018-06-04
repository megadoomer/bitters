/*jshint node:true, laxcomma: true, smarttabs: true*/
'use strict';
/**
 * Winstons stdout / console transport
 * @module module:bitters/transports/stdout
 * @author Eric Satterwhite
 * @since 0.1.0
 * @requires winston
 */

var winston = require( 'winston' )
module.exports = winston.transports.Console
