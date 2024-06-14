const osc = require('../index.js')

const getSimpleExpected = (type, value, emptyBuffer = true) => {
	return {
		buffer_remain : emptyBuffer ? Buffer.alloc(0) : expect.any(Buffer),
		type          : type,
		value         : value,
	}
}

const oscRegular = new osc.simpleOscLib()
const oscStrict  = new osc.simpleOscLib({strictMode : true, strictAddress : true, asciiOnly : true})

describe('blobs', () => {
	test('decode non-padded buffer (non-strict)', () => {
		const malformedBuffer = Buffer.alloc(9)
		malformedBuffer.writeUInt32BE(5)
		malformedBuffer.write('hello', 4)

		const expected = getSimpleExpected('blob', Buffer.from('hello'))
		
		expect(oscRegular.decodeBufferChunk('b', malformedBuffer)).toEqual(expected)
	})

	test('fail decode non-padded buffer (strict)', () => {
		const malformedBuffer = Buffer.alloc(9)
		malformedBuffer.writeUInt32BE(5)
		malformedBuffer.write('hello', 4)
		
		expect(() => oscStrict.decodeBufferChunk('b', malformedBuffer)).toThrow(osc.OSCSyntaxError)
	})

	test('round robin', () => {
		const inputString  = 'hello'
		const inputBuffer  = Buffer.from(inputString)
		const encodedBlock = oscRegular.encodeBufferChunk('b', inputBuffer)
		const decodedBlock = oscRegular.decodeBufferChunk('b', encodedBlock)

		const expected = getSimpleExpected('blob', inputBuffer)
		
		expect(decodedBlock).toEqual(expected)
	})
})
