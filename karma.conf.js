// Karma configuration
// Not generated on Tue Jan 05 2016 23:48:18 GMT+0100 (CET)

var customLaunchers = require('./test/capabilities-android.json');

for (var prop in customLaunchers) {
	if (customLaunchers.hasOwnProperty(prop)) {
		customLaunchers[prop].base = 'BrowserStack'
	}
}

var objPropsToArray = function (obj) {
	var arr = [];
	for (var prop in obj) {
		if (obj.hasOwnProperty(prop)) {
			arr.push(prop);
		}
	}

	return arr;
}

var customLaunchersArr = objPropsToArray(customLaunchers);

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],

    // list of files / patterns to load in the browser
    files: [
      // Polyfills
      'node_modules/document-register-element/build/document-register-element.js', // this one work in PhantomJS, webcomponentjs one fail
      // 'node_modules/customevent-polyfill/CustomEvent.js',
      'node_modules/webcomponents.js/MutationObserver.js',

      // Common test for HTMLElement implementation
      'test/helper/HTMLMediaElement.js',
      'test/helper/HTMLVideoElement.js',

      // Source, for the moment, unable to test directly with TS source ...
      'dist/videomock.js',

      // Tests
      // 'test/**/*spec.js'
			'test/HTMLVideoMock.spec.js'
    ],

    // list of files to exclude
    exclude: [
    ],

    // Disable typescript config because this is really a mess to do testing with ts !!!
    // Better do test in native JS
    //
    // // preprocess matching files before serving them to the browser
    // // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    // preprocessors: {
    //   '**/*.ts': ['typescript']
    // },

    // typescriptPreprocessor: {
    //   // options passed to the typescript compiler
    //   options: {
    //     sourceMap: false, // (optional) Generates corresponding .map file.
    //     target: 'ES5', // (optional) Specify ECMAScript target version: 'ES3' (default), or 'ES5'
    //     module: 'amd', // (optional) Specify module code generation: 'commonjs' or 'amd'
    //     noImplicitAny: false, // (optional) Warn on expressions and declarations with an implied 'any' type.
    //     noResolve: false, // (optional) Skip resolution and preprocessing.
    //     removeComments: true, // (optional) Do not emit comments to output.
    //     concatenateOutput: false // (optional) Concatenate and emit output to single file. By default true if module option is omited, otherwise false.
    //   },
    //   // extra typing definitions to pass to the compiler (globs allowed)
    //   typings: [
    //     'node_modules/karma-typescript-preprocessor/typings/jasmine/*.d.ts',
    //     'typings/tsd.d.ts'
    //   ],
    //   // transforming the filenames
    //   transformPath: function(path) {
    //     return path.replace(/\.ts$/, '.js');
    //   }
    // },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress', 'spec', 'verbose'],


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    // browsers: ['brokenie'], //,'PhantomJS'
		browsers: customLaunchersArr,

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true,

		concurrency: 1,

		retryLimit: 0,

		// global config of your BrowserStack account
    browserStack: {
      username: 'zentrick1',
      accessKey: 'HF4k1gYkA1RpKAZgb3UG'
    },
    // define browsers
    customLaunchers: customLaunchers
		// customLaunchers = require('./capabilities-desktop.json').capabilities
  });
};
