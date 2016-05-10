module.exports = function( grunt ) {
	var fs = require( "fs" );

	// Project configuration
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		build: {
			all: {
				dest: "dist/validator.js",
				minimum: [
					"core",
					"additional-methods"
				],

				// Exclude specified modules if the module matching the key is removed
				removeWith: {
				}
			},
			/*min: {
				dest: "dist/validator.min.js",
				optimize: "uglify"
			}*/
		},
		jshint: {
			all: {
				src: [
					"src/**/*.js", "Gruntfile.js", "build/**/*.js", "dist/*.js"
				],
				options: {
					jshintrc: true
				}
			}
		}
	});

	// Load grunt tasks from NPM packages
	require( "load-grunt-tasks" )( grunt );

	grunt.loadNpmTasks('grunt-contrib-jshint');

	// Integrate Validator specific tasks
	grunt.loadTasks( "build/tasks" );

	// run jslint
	grunt.registerTask( "lint", [ "jshint" ] );

	grunt.registerTask( "dev", [ "build:*:*", "lint" ] );

	grunt.registerTask( "default", [ "lint", "dev" ] );
};
