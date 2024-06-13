const osc = require('../index.js')
const dump = osc.debugOSCBuffer
const block = osc.debugOSCBufferBlocks

const oscMessage1 = {
	address : '/hello',
	args    : [
		{ type : 'string', value : 'hi' },
		{ type : 'string', value : 'there' },
	],
}
const oscMessage2 = {
	address : '/goodbye',
	args    : [
		{ type : 'string', value : 'cruel' },
		{ type : 'string', value : 'world' },
	],
}
const timeTag = osc.generateTimeTagFromDelta(0.5)

// const test1 = osc.oscBuildMessage(oscMessage1)
const test2 = osc.oscBuildBundle({
	timetag : timeTag,
	elements : [oscMessage1, oscMessage2],
})
// const test3 = osc_old.toBuffer(oscMessage)

console.log(test2)
// console.log(test3)

console.log(dump(test2))
// console.log(dump(test3))

console.log(block(test2))
// console.log(block(test3))

// console.log(test2.subarray(0, 7).toString('utf8'))
// return first7Bytes === '#bundle')
console.dir(osc.oscReadPacket(test2), {depth : null})
