/*      _                 _                                  _ _ _     
 *     (_)               | |                                | (_) |    
 *  ___ _ _ __ ___  _ __ | | ___ ______ ___  ___  ___ ______| |_| |__  
 * / __| | '_ ` _ \| '_ \| |/ _ \______/ _ \/ __|/ __|______| | | '_ \ 
 * \__ \ | | | | | | |_) | |  __/     | (_) \__ \ (__       | | | |_) |
 * |___/_|_| |_| |_| .__/|_|\___|      \___/|___/\___|      |_|_|_.__/ 
 *     | |                                                 
 *     |_|   Test Suite - message redirection */
/// <reference types="node" />
/// <reference types="jest" />

import * as osc from '../src/index'

const oscRegular = new osc.simpleOscLib()
const oscStrict  = new osc.simpleOscLib({strictMode : true, strictAddress : true, asciiOnly : true})

const tildeEncode = (message : string) => {
	return Buffer.from(message.replaceAll('~', osc.null))
}

describe('messageRedirect', () => {
	test('fail on non-buffer', () => {
		// @ts-expect-error Testing failures.
		expect(() => oscRegular.redirectMessage('hello', '/newTown')).toThrow(TypeError)
	})
	test('strict fail on incorrect padding', () => {
		const badBuffer = Buffer.from(`/hello${osc.null}`)
		expect(() => oscStrict.redirectMessage(badBuffer, '/newTown')).toThrow(osc.OSCSyntaxError)
	})
	test('fail on bad original message (empty)', () => {
		expect(() => oscRegular.redirectMessage(Buffer.alloc(0), '/newTown')).toThrow(osc.OSCSyntaxError)
	})
	test('strict fail on incoming address with no slash', () => {
		const noSlash = oscRegular.messageBuilder('hello').toBuffer()
		expect(() => oscStrict.redirectMessage(noSlash, '/newTown')).toThrow(osc.OSCSyntaxError)
	})
	test('fail on empty new address', () => {
		const validMessage = (oscRegular.messageBuilder('/hello')).string('world').toBuffer()
		// @ts-expect-error testing failures
		expect(() => oscRegular.redirectMessage(validMessage)).toThrow(osc.OSCSyntaxError)

	})
	test('strict fail on new address without slash', () => {
		const validMessage = (oscRegular.messageBuilder('/hello')).string('world').toBuffer()
		expect(() => oscStrict.redirectMessage(validMessage, 'hello')).toThrow(osc.OSCSyntaxError)
	})
	test('fail on invalid new address', () => {
		const validMessage = (oscRegular.messageBuilder('/hello')).string('world').toBuffer()
		expect(() => oscRegular.redirectMessage(validMessage, '/äzan')).toThrow(osc.OSCSyntaxError)
	})
	test('pass on no args', () => {
		const validNoArgs = tildeEncode('/hello~~')
		const expected    = '/newTown~~~~,s~~/hello~~'
		expect(oscRegular.printableBuffer(oscRegular.redirectMessage(validNoArgs, '/newTown'), '~', '', true)).toEqual(expected)
	})
	test('pass on empty args', () => {
		const validNoArgs = (oscRegular.messageBuilder('/hello')).toBuffer()
		const expected    = '/newTown~~~~,s~~/hello~~'
		expect(oscRegular.printableBuffer(oscRegular.redirectMessage(validNoArgs, '/newTown'), '~', '', true)).toEqual(expected)
	})

	test('pass on good args', () => {
		const validMessage = (oscRegular.messageBuilder('/hello')).string('world').toBuffer()
		const expected = '/newTown~~~~,ss~/hello~~world~~~'
		expect(oscRegular.printableBuffer(oscRegular.redirectMessage(validMessage, '/newTown'), '~', '', true)).toEqual(expected)
	})

	test('pass on good args, address on end (callback 1)', () => {
		const validMessage = (oscRegular.messageBuilder('/hello')).string('world').toBuffer()
		const callBack = (bufferNewAddress : Buffer, bufferOldAddress : Buffer, argList : string[], argBuffer : Buffer) => {
			argList.push('s')

			return Buffer.concat([
				bufferNewAddress,
				oscRegular.encodeBufferChunk('s', `,${argList.join('')}`),
				argBuffer,
				bufferOldAddress
			])
		}
		const expected = '/newTown~~~~,ss~world~~~/hello~~'
		expect(oscRegular.printableBuffer(oscRegular.redirectMessage(validMessage, '/newTown', callBack), '~', '', true)).toEqual(expected)
	})

	test('redirect square first integer (callback 2)', () => {
		const validMessage = (oscRegular.messageBuilder('/hello')).integer(20).toBuffer()
		const callBack = (bufferNewAddress : Buffer, _bufferOldAddress : Buffer, _argList : string[], argBuffer : Buffer) => {
			const firstArgument = oscRegular.decodeBufferChunk('i', argBuffer)

			return Buffer.concat([
				bufferNewAddress,
				oscRegular.encodeBufferChunk('s', ',i'),
				oscRegular.encodeBufferChunk('i', (firstArgument.value as number) * (firstArgument.value as number))
			])
		}
		const expected = { address : '/newTown', args : [{ type : 'integer', value : 400 }], type : 'osc-message' }
		expect(oscRegular.readMessage(oscRegular.redirectMessage(validMessage, '/newTown', callBack))).toEqual(expected)
	})

	test('pass on no comma', () => {
		const originalBuffer = tildeEncode('/hello~~s~~~world~~~')
		const expected    = '/newTown~~~~,ss~/hello~~world~~~'
		expect(oscRegular.printableBuffer(oscRegular.redirectMessage(originalBuffer, '/newTown'), '~', '', true)).toEqual(expected)
	})

	test('strict fail on no comma', () => {
		const originalBuffer = tildeEncode('/hello~~s~~~world~~~')
		expect(() => oscStrict.redirectMessage(originalBuffer, '/newTown')).toThrow(osc.OSCSyntaxError)
	})
})