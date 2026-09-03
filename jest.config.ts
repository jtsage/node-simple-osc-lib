/* @jest-config-loader ts-node */

import { createDefaultPreset } from 'ts-jest'

const tsJestTransformCfg = createDefaultPreset().transform

export default {
	coverageReporters : [
		'json-summary',
		'text',
		'html',
	],
	errorOnDeprecated : true,
	testEnvironment : 'node',
	transform : {
		...tsJestTransformCfg,
	},
	verbose : false,
}