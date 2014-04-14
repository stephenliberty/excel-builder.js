var _ = require('underscore');

module.exports = function(grunt) {
    
    var compileOptions = {
        baseUrl: ".",
        name: "buildtools/index",
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
    
    var files = grunt.file.expand({
        cwd: './dist',
        filter: function (src) {
            if(src.indexOf('WorksheetExportWorker') != -1) {
                return false;
            }
            return true;
        }
    }, '../Excel/**/*.js');
    
    grunt.file.write('./buildtools/index.js', "define(" + JSON.stringify(files) + ", function () {})");
    
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
        },
        uglify: {
            options: {
                compress: {
                    drop_console: true
                }
            },
            optimize: {
                files: {
                    'dist/<%= pkg.name %>.compiled.min.js': ['dist/<%= pkg.name %>.compiled.js'],
                    'dist/<%= pkg.name %>.dist.min.js': ['dist/<%= pkg.name %>.dist.js']
                }
            }
        },
        jshint: {
            options: {
                jshintrc: true
            },
            all: {
                //http://stackoverflow.com/questions/20695823/grunt-contrib-jshint-ignores-has-no-effect (hence the ! in front of **/*Worker.js
                src: ['Excel/**/*.js', '!**/*Worker.js']
            }
        }
    });
    
    

    grunt.loadNpmTasks('grunt-contrib-requirejs');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-uglify');

    // Default task(s).
    grunt.registerTask('default', ['jshint:all', 'requirejs', 'optimize']);
};
