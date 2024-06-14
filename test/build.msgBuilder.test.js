const osc  = require('../index.js')

const oscRegular = new osc.simpleOscLib()


describe('message builder', () => {
	test('build init fail (no address)', () => {
		expect(() => oscRegular.messageBuilder()).toThrow(TypeError)
	})

	test('build empty ok', () => {
		expect(oscRegular.messageBuilder('/hello').toBuffer().length).toEqual(12)
	})
	test('build empty roundtrip ok', () => {
		const output = oscRegular.readMessage(oscRegular.messageBuilder('/hello').toBuffer())
		expect(output.args.length).toEqual(0)
		expect(output.address).toEqual('/hello')
	})

	test('build string ok', () => {
		expect(oscRegular.messageBuilder('/hello').s('hello').toBuffer().length).toEqual(20)
	})
	test('build integer roundtrip ok', () => {
		const input = 'howdy'
		const output = oscRegular.readMessage(oscRegular.messageBuilder('/hello').s(input).toBuffer())
		expect(output.args[0].value).toEqual(input)
	})
	test('build string fail (bad type)', () => {
		expect(() => oscRegular.messageBuilder('/hello').s(20)).toThrow(TypeError)
	})

	test('build integer ok', () => {
		expect(oscRegular.messageBuilder('/hello').i(20).toBuffer().length).toEqual(16)
	})
	test('build integer roundtrip ok', () => {
		const input = 20
		const output = oscRegular.readMessage(oscRegular.messageBuilder('/hello').i(input).toBuffer())
		expect(output.args[0].value).toEqual(input)
	})
	test('build integer fail (bad type)', () => {
		expect(() => oscRegular.messageBuilder('/hello').i(20.2022)).toThrow(TypeError)
	})

	test('build float ok', () => {
		expect(oscRegular.messageBuilder('/hello').f(69.23).toBuffer().length).toEqual(16)
	})
	test('build float roundtrip ok', () => {
		const input = 69.23
		const output = oscRegular.readMessage(oscRegular.messageBuilder('/hello').f(input).toBuffer())
		expect(output.args[0].value).toBeCloseTo(input)
	})
	test('build float fail (bad type)', () => {
		expect(() => oscRegular.messageBuilder('/hello').f('not float')).toThrow(TypeError)
	})

	test('build buffer ok', () => {
		expect(oscRegular.messageBuilder('/hello').b(Buffer.alloc(3)).toBuffer().length).toEqual(20)
	})
	test('build buffer roundtrip ok', () => {
		const input = Buffer.alloc(3).fill('c')
		const output = oscRegular.readMessage(oscRegular.messageBuilder('/hello').b(input).toBuffer())
		expect(output.args[0].value).toEqual(input)
	})
	test('build buffer fail (bad type)', () => {
		expect(() => oscRegular.messageBuilder('/hello').b('not buffer')).toThrow(TypeError)
	})
})