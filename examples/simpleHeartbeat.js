/*      _                 _                                  _ _ _     
 *     (_)               | |                                | (_) |    
 *  ___ _ _ __ ___  _ __ | | ___ ______ ___  ___  ___ ______| |_| |__  
 * / __| | '_ ` _ \| '_ \| |/ _ \______/ _ \/ __|/ __|______| | | '_ \ 
 * \__ \ | | | | | | |_) | |  __/     | (_) \__ \ (__       | | | |_) |
 * |___/_|_| |_| |_| .__/|_|\___|      \___/|___/\___|      |_|_|_.__/ 
 *     | |                                                 
 *     |_|   HeartBeat Send Example */

const oscDeviceAddress   = '127.0.0.1'
const oscDevicePort      = 3333
const heartBeatFrequency = 1000 // in ms

/*
 * Change for installed package
 * const osc              = require('simple-osc-lib')
 */
const osc   = require('../index.js')
const dgram = require('node:dgram')

const oscSocket = dgram.createSocket({type : 'udp4', reuseAddr : true})
const oscLib    = new osc.simpleOscLib()

const heartBeatMessage = {
	address : '/hello',
	args    : [
		{ type : 'string', value : 'world' },
	],
}
const heartBeatBuffer = oscLib.buildMessage(heartBeatMessage)

setInterval(() => {
	oscSocket.send(heartBeatBuffer, 0, heartBeatBuffer.length, oscDevicePort, oscDeviceAddress)
}, heartBeatFrequency)

