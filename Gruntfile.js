var _ = require('underscore');

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
    grunt.loadNpmTasks('grunt-contrib-requirejs');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-browserify');

    // Default task(s).
    grunt.registerTask('default', ['jshint:all', 'browserify', 'uglify']);
};
