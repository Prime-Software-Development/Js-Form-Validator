/**
 * Special concat/build task to handle various jQuery build requirements
 * Concats AMD modules, removes their definitions,
 * and includes/excludes specified modules
 */

module.exports = function( grunt ) {

	"use strict";

	var fs = require( "fs" ),
	    requirejs = require( "requirejs" ),
	    Insight = require( "insight" ),
	    pkg = require( "../../package.json" ),
	    srcFolder = __dirname + "/../../src/",
	    rdefineEnd = /\}\s*?\);[^}\w]*$/,
	    read = function( fileName ) {
		    return grunt.file.read( srcFolder + fileName );
	    },
	    globals = read( "exports/global.js" ),
	    wrapper = read( "wrapper.js" ).split( /\/\/ \@CODE\n\/\/[^\n]+/ ),
	    config = {
		    baseUrl: "src",
		    name: "jquery",

		    // Allow strict mode
		    useStrict: true,

		    // We have multiple minify steps
		    optimize: "none",

		    // Include dependencies loaded with require
		    findNestedDependencies: true,

		    // Avoid inserting define() placeholder
		    skipModuleInsertion: true,

		    // Avoid breaking semicolons inserted by r.js
		    skipSemiColonInsertion: true,
		    wrap: {
			    start: wrapper[ 0 ].replace( /\/\*jshint .* \*\/\n/, "" ),
			    end: globals.replace(
				    /\/\*\s*ExcludeStart\s*\*\/[\w\W]*?\/\*\s*ExcludeEnd\s*\*\//ig,
				    ""
			    ) + wrapper[ 1 ]
		    },
		    rawText: {},
		    onBuildWrite: convert
	    };

	/**
	 * Strip all definitions generated by requirejs
	 * Convert "var" modules to var declarations
	 * "var module" means the module only contains a return
	 * statement that should be converted to a var declaration
	 * This is indicated by including the file in any "var" folder
	 * @param {String} name
	 * @param {String} path
	 * @param {String} contents The contents to be written (including their AMD wrappers)
	 */
	function convert( name, path, contents ) {
		var amdName;

		// Convert var modules
		if ( /.\/var\//.test( path.replace( process.cwd(), "" ) ) ) {
			contents = contents
				.replace( /define\([\w\W]*?return/, "var " + ( /var\/([\w-]+)/.exec( name )[ 1 ] ) + " =" )
				.replace( rdefineEnd, "" );

			// Sizzle treatment
		} else if ( /\/sizzle$/.test( name ) ) {
			contents = "var Sizzle =\n" + contents

				// Remove EXPOSE lines from Sizzle
					.replace( /\/\/\s*EXPOSE[\w\W]*\/\/\s*EXPOSE/, "return Sizzle;" );

		} else {

			contents = contents
				.replace( /\s*return\s+[^\}]+(\}\s*?\);[^\w\}]*)$/, "$1" )

				// Multiple exports
				.replace( /\s*exports\.\w+\s*=\s*\w+;/g, "" );

			// Remove define wrappers, closure ends, and empty declarations
			contents = contents
				.replace( /define\([^{]*?{\s*(?:("|')use strict\1(?:;|))?/, "" )
				.replace( rdefineEnd, "" );

			// Remove anything wrapped with
			// /* ExcludeStart */ /* ExcludeEnd */
			// or a single line directly after a // BuildExclude comment
			contents = contents
				.replace( /\/\*\s*ExcludeStart\s*\*\/[\w\W]*?\/\*\s*ExcludeEnd\s*\*\//ig, "" )
				.replace( /\/\/\s*BuildExclude\n\r?[\w\W]*?\n\r?/ig, "" );

			// Remove empty definitions
			contents = contents
				.replace( /define\(\[[^\]]*\]\)[\W\n]+$/, "" );
		}

		// AMD Name
		if ( ( amdName = grunt.option( "amd" ) ) != null && /^exports\/amd$/.test( name ) ) {
			if ( amdName ) {
				grunt.log.writeln( "Naming jQuery with AMD name: " + amdName );
			} else {
				grunt.log.writeln( "AMD name now anonymous" );
			}

			// Remove the comma for anonymous defines
			contents = contents
				.replace( /(\s*)"jquery"(\,\s*)/, amdName ? "$1\"" + amdName + "\"$2" : "" );

		}
		return contents;
	}

	grunt.registerMultiTask(
		"build",
		"Concatenate source, remove sub AMD definitions, " +
		"(include/exclude modules with +/- flags), embed date/version",
		function() {
			var flag, index,
			    done = this.async(),
			    flags = this.flags,
			    optIn = flags[ "*" ],
			    name = grunt.option( "filename" ),
			    minimum = this.data.minimum,
			    removeWith = this.data.removeWith,
			    excluded = [],
			    included = [],
			    version = grunt.config( "pkg.version" ),
			    /**
			     * Recursively calls the excluder to remove on all modules in the list
			     * @param {Array} list
			     * @param {String} [prepend] Prepend this to the module name.
			     *  Indicates we're walking a directory
			     */
			    excludeList = function( list, prepend ) {
				    if ( list ) {
					    prepend = prepend ? prepend + "/" : "";
					    list.forEach( function( module ) {

						    // Exclude var modules as well
						    if ( module === "var" ) {
							    excludeList(
								    fs.readdirSync( srcFolder + prepend + module ), prepend + module
							    );
							    return;
						    }
						    if ( prepend ) {

							    // Skip if this is not a js file and we're walking files in a dir
							    if ( !( module = /([\w-\/]+)\.js$/.exec( module ) ) ) {
								    return;
							    }

							    // Prepend folder name if passed
							    // Remove .js extension
							    module = prepend + module[ 1 ];
						    }

						    // Avoid infinite recursion
						    if ( excluded.indexOf( module ) === -1 ) {
							    excluder( "-" + module );
						    }
					    } );
				    }
			    },
			    /**
			     * Adds the specified module to the excluded or included list, depending on the flag
			     * @param {String} flag A module path relative to
			     *  the src directory starting with + or - to indicate
			     *  whether it should included or excluded
			     */
			    excluder = function( flag ) {
				    var additional,
				        m = /^(\+|\-|)([\w\/-]+)$/.exec( flag ),
				        exclude = m[ 1 ] === "-",
				        module = m[ 2 ];

				    if ( exclude ) {

					    // Can't exclude certain modules
					    if ( minimum.indexOf( module ) === -1 ) {

						    // Add to excluded
						    if ( excluded.indexOf( module ) === -1 ) {
							    grunt.log.writeln( flag );
							    excluded.push( module );

							    // Exclude all files in the folder of the same name
							    // These are the removable dependencies
							    // It's fine if the directory is not there
							    try {
								    excludeList( fs.readdirSync( srcFolder + module ), module );
							    } catch ( e ) {
								    grunt.verbose.writeln( e );
							    }
						    }

						    additional = removeWith[ module ];

						    // Check removeWith list
						    if ( additional ) {
							    excludeList( additional.remove || additional );
							    if ( additional.include ) {
								    included = included.concat( additional.include );
								    grunt.log.writeln( "+" + additional.include );
							    }
						    }
					    } else {
						    grunt.log.error( "Module \"" + module + "\" is a minimum requirement." );
						    if ( module === "selector" ) {
							    grunt.log.error(
								    "If you meant to replace Sizzle, use -sizzle instead."
							    );
						    }
					    }
				    } else {
					    grunt.log.writeln( flag );
					    included.push( module );
				    }
			    };

			// Filename can be passed to the command line using
			// command line options
			// e.g. grunt build --filename=jquery-custom.js
			name = name ? ( "dist/" + name ) : this.data.dest;

			// append commit id to version
			if ( process.env.COMMIT ) {
				version += " " + process.env.COMMIT;
			}

			// figure out which files to exclude based on these rules in this order:
			//  dependency explicit exclude
			//  > explicit exclude
			//  > explicit include
			//  > dependency implicit exclude
			//  > implicit exclude
			// examples:
			//  *                  none (implicit exclude)
			//  *:*                all (implicit include)
			//  *:*:-css           all except css and dependents (explicit > implicit)
			//  *:*:-css:+effects  same (excludes effects because explicit include is
			//                     trumped by explicit exclude of dependency)
			//  *:+effects         none except effects and its dependencies
			//                     (explicit include trumps implicit exclude of dependency)
			delete flags[ "*" ];
			for ( flag in flags ) {
				excluder( flag );
			}

			// Handle Sizzle exclusion
			// Replace with selector-native
			if ( ( index = excluded.indexOf( "sizzle" ) ) > -1 ) {
				config.rawText.selector = "define(['./selector-native']);";
				excluded.splice( index, 1 );
			}

			// Replace exports/global with a noop noConflict
			if ( ( index = excluded.indexOf( "exports/global" ) ) > -1 ) {
				config.rawText[ "exports/global" ] = "define(['../core']," +
					"function( jQuery ) {\njQuery.noConflict = function() {};\n});";
				excluded.splice( index, 1 );
			}

			grunt.verbose.writeflags( excluded, "Excluded" );
			grunt.verbose.writeflags( included, "Included" );

			// append excluded modules to version
			if ( excluded.length ) {
				version += " -" + excluded.join( ",-" );

				// set pkg.version to version with excludes, so minified file picks it up
				grunt.config.set( "pkg.version", version );
				grunt.verbose.writeln( "Version changed to " + version );

				// Have to use shallow or core will get excluded since it is a dependency
				config.excludeShallow = excluded;
			}
			config.include = included;

			/**
			 * Handle Final output from the optimizer
			 * @param {String} compiled
			 */
			config.out = function( compiled ) {
				compiled = compiled

				// Embed Version
					.replace( /@VERSION/g, version )

					// Embed Date
					// yyyy-mm-ddThh:mmZ
					.replace( /@DATE/g, ( new Date() ).toISOString().replace( /:\d+\.\d+Z$/, "Z" ) );

				// Write concatenated source to file
				grunt.file.write( name, compiled );
			};

			// Turn off opt-in if necessary
			if ( !optIn ) {

				// Overwrite the default inclusions with the explicit ones provided
				config.rawText.jquery = "define([" +
					( included.length ? included.join( "," ) : "" ) +
					"]);";
			}

			// Trace dependencies and concatenate files
			requirejs.optimize( config, function( response ) {
				grunt.verbose.writeln( response );
				grunt.log.ok( "File '" + name + "' created." );
				done();
			}, function( err ) {
				done( err );
			} );
		} );

	// Special "alias" task to make custom build creation less grawlix-y
	// Translation example
	//
	//   grunt custom:+ajax,-dimensions,-effects,-offset
	//
	// Becomes:
	//
	//   grunt build:*:*:+ajax:-dimensions:-effects:-offset
	grunt.registerTask( "custom", function() {
		var args = this.args,
		    modules = args.length ? args[ 0 ].replace( /,/g, ":" ) : "",
		    done = this.async(),
		    insight = new Insight( {
			    trackingCode: "UA-1076265-4",
			    pkg: pkg
		    } );

		function exec( trackingAllowed ) {
			var tracks = args.length ? args[ 0 ].split( "," ) : [];
			var defaultPath = [ "build", "custom" ];

			tracks = tracks.map( function( track ) {
				return track.replace( /\//g, "+" );
			} );

			if ( trackingAllowed ) {

				// Track individuals
				tracks.forEach( function( module ) {
					var path = defaultPath.concat( [ "individual" ], module );

					insight.track.apply( insight, path );
				} );

				// Track full command
				insight.track.apply( insight, defaultPath.concat( [ "full" ], tracks ) );
			}

			grunt.task.run( [ "build:*:*" + ( modules ? ":" + modules : "" ), "uglify", "dist" ] );
			done();
		}

		grunt.log.writeln( "Creating custom build...\n" );

		// Ask for permission the first time
		if ( insight.optOut === undefined ) {
			insight.askPermission( null, function( error, result ) {
				exec( result );
			} );
		} else {
			exec( !insight.optOut );
		}
	} );
};
