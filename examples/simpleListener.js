/*      _                 _                                  _ _ _     
 *     (_)               | |                                | (_) |    
 *  ___ _ _ __ ___  _ __ | | ___ ______ ___  ___  ___ ______| |_| |__  
 * / __| | '_ ` _ \| '_ \| |/ _ \______/ _ \/ __|/ __|______| | | '_ \ 
 * \__ \ | | | | | | |_) | |  __/     | (_) \__ \ (__       | | | |_) |
 * |___/_|_| |_| |_| .__/|_|\___|      \___/|___/\___|      |_|_|_.__/ 
 *     | |                                                 
 *     |_|   HeartBeat Send Example (with messageBuilder) */
/* eslint-disable no-console */

const oscDeviceAddress   = '0.0.0.0'
const oscDevicePort      = 3333

/*
 * Change for installed package
 * const osc              = require('simple-osc-lib')
 */
const osc   = require('../index.js')
const dgram = require('node:dgram')

const oscSocket = dgram.createSocket({type : 'udp4', reuseAddr : true})
const oscLib    = new osc.simpleOscLib()

oscSocket.on('message', (msg, rinfo) => {
	console.log(`Packet of ${rinfo.size} bytes received`)
	console.log(`Packet from ${rinfo.family === 'IPv4' ? 'udp4' : 'udp6'}://${rinfo.address}:${rinfo.port}`)
	try {
		console.dir(oscLib.readPacket(msg), { depth : 4 })
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
oscSocket.bind(oscDevicePort, oscDeviceAddress)
