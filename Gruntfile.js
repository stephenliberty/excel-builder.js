var _ = require('underscore');

module.exports = function(grunt) {
    
    var compileOptions = {
        baseUrl: ".",
        name: "<%= pkg.name %>",
        optimize: "none",
        paths: {
            "underscore": "node_modules/underscore/underscore",
            "JSZip": "node_modules/jszip/dist/jszip"
        },
        shim: {
            "underscore": {
                "exports": '_'
            },
            "JSZip": {
                "exports": "JSZip"
            }
        }
    };
    
    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        requirejs: {
            compile: {
                options: _.defaults({
                    out: "dist/<%= pkg.name %>.compiled.js"
                }, compileOptions)
            },
            dist: {
                options: _.defaults({
                    wrap: {
                        startFile: [
                            './buildtools/start.js',
                            './node_modules/almond/almond.js'
                        ],
                        endFile: [
                            './buildtools/end.js'
                        ]
                    },
                    out: "dist/<%= pkg.name %>.dist.js"
                }, compileOptions)
            }
        }
    });

    // Load the plugin that provides the "requirejs" task.
    grunt.loadNpmTasks('grunt-contrib-requirejs');

    // Default task(s).
    grunt.registerTask('default', ['requirejs']);
};
