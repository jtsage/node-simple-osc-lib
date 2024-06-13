const osc = require('../index.js')
const osc_x32 = require('../x32.js')
const dump = osc.debugOSCBuffer
const block = osc.debugOSCBufferBlocks

// const oscMessage1 = {
// 	address : '/hello',
// 	args    : [
// 		{ type : 'string', value : 'hi' },
// 		{ type : 'string', value : 'there' },
// 	],
// }
// const oscMessage2 = {
// 	address : '/goodbye',
// 	args    : [
// 		{ type : 'string', value : 'cruel' },
// 		{ type : 'string', value : 'world' },
// 	],
// }
// const timeTag = osc.generateTimeTagFromDelta(0.5)

// // const test1 = osc.oscBuildMessage(oscMessage1)
// const test2 = osc.oscBuildBundle({
// 	timetag : timeTag,
// 	elements : [oscMessage1, oscMessage2],
// })
// // const test3 = osc_old.toBuffer(oscMessage)

// console.log(test2)
// // console.log(test3)

// console.log(dump(test2))
// // console.log(dump(test3))

// console.log(block(test2))
// // console.log(block(test3))

// // console.log(test2.subarray(0, 7).toString('utf8'))
// // return first7Bytes === '#bundle')
// console.dir(osc.oscReadPacket(test2), {depth : null})

const testNodeMessages = [
	'/-show/showfile/show "MyShow" 0 0 0 0 0 0 0 0 0 0 "2.08"',
	'/-show/showfile/cue/000 1200 "Cue Idx0 Num1200" 0 -1 -1 0 1 0 0',
	'/-show/showfile/cue/001 1210 "Cue Idx1 Num1210" 0 1 -1 0 1 0 0',
	'/-show/showfile/scene/001 "AAA" "aaa" %111111110 1',
	'/-show/showfile/scene/002 "BBB" "bbb" %000000010 1',
	'/-show/showfile/snippet/000 "Aaa" 1 1 0 32768 1 ',
	'/dca/2 OFF   -32.5',
	'/dca/2/config "THEATER" 1 RD',
	'/dca/3 ON   -oo',
	'/dca/3/config "--" 1 RD',
	'/bus/01/config "StgMon" 63 YEi',
	'/bus/01/mix ON -11.0 OFF +0 OFF   -oo',
]

for ( const thisMessage of testNodeMessages ) {
	const nodeInMessage = {
		address : 'node',
		args : [{ type : 'string', value : thisMessage }],
	}
	const nodePacket = osc.oscBuildMessage(nodeInMessage)

	console.log(osc_x32.oscReadPacket(nodePacket))
}

// console.log(osc_x32.dB2Float('-10 dB'))
// console.log(osc_x32.dB2Float('+9dB'))
// console.log(osc_x32.dB2Float('-0 db'))
// console.log(osc_x32.dB2Float('+0.0 db'))
// console.log(osc_x32.dB2Float(-16))
// console.log(osc_x32.dB2Float('-16 db'))
// console.log(osc_x32.dB2Float('-oo dB'))



//console.log(osc_x32.oscReadPacket('/-show/showfile/show "MyShow" 0 0 0 0 0 0 0 0 0 0 "2.08"'))

// console.log(osc_x32.processNodeMessage('/-show/showfile/show "MyShow" 0 0 0 0 0 0 0 0 0 0 "2.08"'))
// console.log(osc_x32.processNodeMessage('/-show/showfile/cue/000 1200 "Cue Idx0 Num1200" 0 -1 -1 0 1 0 0'))
// console.log(osc_x32.processNodeMessage('/-show/showfile/cue/001 1210 "Cue Idx1 Num1210" 0 1 -1 0 1 0 0'))
// console.log(osc_x32.processNodeMessage('/-show/showfile/scene/001 "AAA" "aaa" %111111110 1'))
// console.log(osc_x32.processNodeMessage('/-show/showfile/scene/002 "BBB" "bbb" %000000010 1'))
// console.log(osc_x32.processNodeMessage('/-show/showfile/snippet/000 "Aaa" 1 1 0 32768 1 '))