/*      _                 _                                  _ _ _     
 *     (_)               | |                                | (_) |    
 *  ___ _ _ __ ___  _ __ | | ___ ______ ___  ___  ___ ______| |_| |__  
 * / __| | '_ ` _ \| '_ \| |/ _ \______/ _ \/ __|/ __|______| | | '_ \ 
 * \__ \ | | | | | | |_) | |  __/     | (_) \__ \ (__       | | | |_) |
 * |___/_|_| |_| |_| .__/|_|\___|      \___/|___/\___|      |_|_|_.__/ 
 *     | |                                                 
 *     |_|   Test Suite - NON-DATA (null) types [T,F,N,I] */

const osc = require('../index.js')

const getSimpleExpected = (type, value, emptyBuffer = true) => {
	return {
		buffer_remain : emptyBuffer ? Buffer.alloc(0) : expect.any(Buffer),
		type          : type,
		value         : value,
	}
}

const oscRegular = new osc.simpleOscLib()

describe('argument-less types', () => {
	describe('encode', () => {
		test.each([
			['T', 'true'],
			['F', 'false'],
			['N', 'null/nil'],
			['I', 'bang'],
		])('low level encode [%s] %s : empty zero length buffer', (a, _b) => {
			const expected = Buffer.alloc(0)
			expect(oscRegular.encodeBufferChunk(a)).toEqual(expected)
		})
	})
	describe('decode', () => {
		test.each([
			['T', 'true', 'true'],
			['F', 'false', 'false'],
			['N', 'null/nil', 'null'],
			['I', 'bang', 'bang'],
		])('low level decode [%s] %s', (a, _b, expectType) => {
			const input    = Buffer.alloc(0)
			const expected = getSimpleExpected(expectType, null)
			expect(oscRegular.decodeBufferChunk(a, input)).toEqual(expected)
		})
	})
})

