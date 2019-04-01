import buble from 'rollup-plugin-buble';

export default {
	external: ['preact'],
	output: {
		globals: {
			preact: 'preact'
		}
	},
	plugins: [
		buble({
			jsx: 'h',
			objectAssign: 'assign'
		})
	]
};
