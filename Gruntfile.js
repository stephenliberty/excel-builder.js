var _ = require('lodash');

module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        browserify: {
            dist: {
                src: ['src/**/*.js'],
                dest: 'dist/excel-builder.dist.js',
                options: {
                    transform: ['browserify-shim'],
                    require: ['q'],
                    external: ['lodash', 'jszip']
                }
            },
            compiled: {
                src: ['src/**/*.js'],
                dest: 'dist/excel-builder.compiled.js',
                options: {
                    require: ['lodash', 'jszip', 'q']
                }
            }
        },
        jasmine: {
            pivotal: {
                src: 'dist/excel-builder.compiled.js',
                options: {
                    specs: 'spec/Excel/**/*.js'
                }
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
                src: ['src/**/*.js']
            }
        },
        watch: {
            files: ['src/**/*'],
            tasks: ['browserify'],
            options: {
                spawn: false
            }
        },
    });
    
    
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-contrib-jasmine');

    // Default task(s).
    grunt.registerTask('default', ['jshint:all', 'browserify', 'uglify']);
};
