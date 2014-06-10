module.exports = function(grunt) {

  grunt.initConfig({

    // Import package manifest
    pkg: grunt.file.readJSON("ooyala.jquery.json"),

    // Banner definitions
    meta: {
      banner: "/*\n" +
        " *  <%= pkg.title || pkg.name %> - v<%= pkg.version %>\n" +
        " *  <%= pkg.description %>\n" +
        " *  <%= pkg.homepage %>\n" +
        " *\n" +
        " *  Made with love by <%= pkg.author.name %>\n" +
        " *  Under <%= pkg.licenses[0].type %> License\n" +
        " */\n"
    },

    // Concat definitions
    concat: {
      dist: {
        src: ["src/jquery.ooyala.js"],
        dest: "dist/jquery.ooyala.js"
      },
      options: {
        banner: "<%= meta.banner %>"
      }
    },

    // Lint definitions
    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      app: ['src/**/*.js'],
      test: {
        files: {
          src: 'test/**/*.js'
        },
        options: {
          jshintrc: 'test/.jshintrc'
        }
      }
    },

    // Minify definitions
    uglify: {
      dist: {
        src: ["dist/jquery.ooyala.js"],
        dest: "dist/jquery.ooyala.min.js"
      },
      options: {
        banner: "<%= meta.banner %>"
      }
    },

    shell: {
      bower: {
        command: './node_modules/.bin/bower install'
      }
    },

    karma: {
      options: {
        configFile: "karma.conf.js"
      },
      ci: {
        browsers: ["PhantomJS"],
        singleRun: true
      },
      debug: {
        browsers: ["Chrome"],
        preprocessors: {},
        reporters: ["dots"],
        singleRun: false
      }
    },

    coverage: {
      options: {
        thresholds: {
          statements: 100,
          branches: 100,
          lines: 100,
          functions: 100
        },
        dir: "coverage",
        root: __dirname
      }
    },

    docco: {
      generate: {
        src: ["src/jquery.ooyala.js"],
        options: {
          output: "doc/"
        }
      }
    }
  });

  grunt.loadNpmTasks("grunt-contrib-concat");
  grunt.loadNpmTasks("grunt-contrib-jshint");
  grunt.loadNpmTasks("grunt-contrib-uglify");
  grunt.loadNpmTasks("grunt-karma");
  grunt.loadNpmTasks("grunt-istanbul-coverage");
  grunt.loadNpmTasks("grunt-docco");
  grunt.loadNpmTasks("grunt-shell");

  grunt.registerTask("test", ["shell:bower", "jshint", "karma:ci", "coverage"]);
  grunt.registerTask("dist", ["test", "concat", "uglify", "docco"]);
};
