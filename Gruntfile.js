'use strict';

var pkg = require('./package.json');
module.exports = function(grunt) {
  // Time grunt tasks
  require('time-grunt')(grunt);

  // Load all grunt tasks
  //  require('load-grunt-tasks')(grunt);
  var importOnce = require('node-sass-import-once');
  // Project configuration.
  grunt.initConfig({
    pkg: pkg,
    clean: {
      css: ['css'],
      bower: ['bower_components'],
      reports: ['reports']
    },

    sass: {
      options: {
        importer: importOnce,
        importOnce: {
          index: true,
          bower: true
        }
      },
      dist: {
        files: {
          'css/<%= pkg.name %>.css': 'sass/<%= pkg.name %>-sketch.scss',
          'css/noprefix/<%= pkg.name %>-sketch.css': 'sass/<%= pkg.name %>-sketch.scss'
        }
      }
    },

    autoprefixer: {
      options: {
        browsers: ['last 2 version']
      },
      multiple_files: {
        expand: true,
        flatten: true,
        src: 'css/noprefix/*.css',
        dest: 'css'
      }
    },

    shell: {
      options: {
        stdout: true,
        stderr: true
      },
      bower: {
        command: 'bower install'
      }
    },

    jshint: {
      all: [
        'Gruntfile.js',
        'js/**/*.js'
      ],
      options: {
        jshintrc: '.jshintrc'
      }
    },

    watch: {
      sass: {
        files: ['sass/**/*.scss'],
        tasks: ['sass', 'autoprefixer'],
        options: {
          interrupt: true,
          livereload: true
        }
      },
      htmljs: {
        files: ['*.html', '*.js'],
        options: {
          interrupt: true,
          livereload: true
        }
      }
    },

    depserve: {
      options: {
        open: '<%= depserveOpenUrl %>'
      }
    },
    webdriver: {
      options: {
        specFiles: ['test/*spec.js']
      },
      local: {
        webdrivers: ['chrome']
      }
    },
    concurrent: {
      devmode: {
        tasks: ['watch', 'depserve'],
        options: {
          logConcurrentOutput: true
        }
      }
    }
  });



  /*  */
  grunt.loadNpmTasks('grunt-sass');
  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-dep-serve');
  grunt.loadNpmTasks('grunt-autoprefixer');
  grunt.loadNpmTasks('grunt-concurrent');
  grunt.loadNpmTasks('webdriver-support');

  // Default task.
  grunt.registerTask('default', 'Basic build', [
    'sass',
    'autoprefixer'
  ]);

  grunt.registerTask('devmode', 'Development Mode', [
    'concurrent:devmode'
  ]);

  // First run task.
  grunt.registerTask('firstrun', 'Basic first run', function() {
    grunt.config.set('depserveOpenUrl', '/index.html');
    grunt.task.run('default');
    grunt.task.run('depserve');
  });

  // Default task.
  grunt.registerTask('test', 'Test', [
    'jshint',
    'webdriver'
  ]);

  grunt.registerTask('release', 'Release', [
    'clean',
    'shell:bower',
    'default',
    'test'
  ]);

};