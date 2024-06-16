/*      _                 _                                  _ _ _     
 *     (_)               | |                                | (_) |    
 *  ___ _ _ __ ___  _ __ | | ___ ______ ___  ___  ___ ______| |_| |__  
 * / __| | '_ ` _ \| '_ \| |/ _ \______/ _ \/ __|/ __|______| | | '_ \ 
 * \__ \ | | | | | | |_) | |  __/     | (_) \__ \ (__       | | | |_) |
 * |___/_|_| |_| |_| .__/|_|\___|      \___/|___/\___|      |_|_|_.__/ 
 *     | |                                                 
 *     |_|   HeartBeat Redirect Example (with messageBuilder) */
/* eslint-disable no-console */

const oscDeviceAddress   = '127.0.0.1'
const originalPort       = 4444 // send and listen
const newPort            = 3333 // send only
const heartBeatFrequency = 1000 // in ms

/*
 * Change for installed package
 * const osc              = require('simple-osc-lib')
 */
const osc   = require('../index.js')
const dgram = require('node:dgram')

const oscSocket = dgram.createSocket({type : 'udp4', reuseAddr : true})
const oscLib    = new osc.simpleOscLib()

const heartBeatMessage = (oscLib.messageBuilder('/hello')).string('world')
const heartBeatBuffer  = heartBeatMessage.toBuffer()


oscSocket.on('message', (msg, _rinfo) => {
	try {
		const newPacket = oscLib.redirectMessage(msg, '/newTown')
		oscSocket.send(newPacket, 0, newPacket.length, newPort, oscDeviceAddress)
	} catch (err) {
		console.log(`Invalid packet received : ${err}`)
	}
})
oscSocket.on('error', (err) => {
	console.log(`listener error:\n${err.stack}`)
	oscSocket.close()
})
oscSocket.on('listening', () => {
	const address = oscSocket.address()
	console.log(`listening to osc on ${address.address}:${address.port}`)
})
oscSocket.bind(originalPort, oscDeviceAddress)

setInterval(() => {
	oscSocket.send(heartBeatBuffer, 0, heartBeatBuffer.length, originalPort, oscDeviceAddress)
}, heartBeatFrequency)

