module.exports = function(grunt) {

	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		requirejs: {
			compile: {
				options: {
					baseUrl: ".",
					name: "<%= pkg.name %>",
					/*optimize: "none",*/
					paths: {
						"requireLib": "node_modules/requirejs/require",
						"underscore": "node_modules/underscore/underscore-min",
						"JSZip": "node_modules/jszip/dist/jszip"
					},
					shim: {
						"underscore": {
							"exports": '_'
						},
						"JSZip": {
							"exports": "JSZip"
						}
					},
					include: "requireLib",
					out: "build/<%= pkg.name %>.min.js"
				}
			}
		}
	});

	// Load the plugin that provides the "requirejs" task.
	grunt.loadNpmTasks('grunt-contrib-requirejs');

	// Default task(s).
	grunt.registerTask('default', ['requirejs']);
};
