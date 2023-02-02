const path = require('path')
const webpack = require('webpack')

module.exports = (argv) => ({
	mode: argv.mode === 'production' ? 'production' : 'development',

	// This is necessary because Figma's 'eval' works differently than normal eval
	// 開啟 devtool 會在 console.log 提供精確的錯誤發生位置
	devtool: argv.mode === 'production' ? false : 'inline-source-map',

	entry: {
		code: './src/create-instance.js',
	},

	output: {
		filename: 'code.js',
		path: path.resolve(__dirname, 'dist'),
		clean: true,
	},

	resolve: {
		// Add `.ts` and `.tsx` as a resolvable extension.
		extensions: ['.ts', '.tsx', '.js'],
		// Add support for TypeScripts fully qualified ESM imports.
		extensionAlias: {
			'.js': ['.js', '.ts'],
			'.cjs': ['.cjs', '.cts'],
			'.mjs': ['.mjs', '.mts'],
		},
	},

	module: {
		rules: [
			// all files with a `.ts`, `.cts`, `.mts` or `.tsx` extension will be handled by `ts-loader`
			{ test: /\.([cm]?ts|tsx)$/, loader: 'ts-loader' },
		],
	},

	plugins: [
		// 可以把底下這行刪掉看看會怎樣
		new webpack.DefinePlugin({
			global: {}, // Fix missing symbol error when running in developer VM
		}),
	],
})
