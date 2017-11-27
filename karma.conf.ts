import * as karma from "karma";

if (!process.env.SAUCE_USERNAME || !process.env.SAUCE_ACCESS_KEY) {
    console.log('Make sure the SAUCE_USERNAME and SAUCE_ACCESS_KEY environment variables are set.')
    process.exit(1)
}


const customLaunchers = {
    sl_chrome: {
        base: 'SauceLabs',
        browserName: 'chrome',
        platform: 'Windows 7',
        version: '35'
    },
    sl_firefox: {
        base: 'SauceLabs',
        browserName: 'firefox',
        version: '30'
    },
    sl_ios_safari: {
        base: 'SauceLabs',
        browserName: 'iphone',
        platform: 'OS X 10.9',
        version: '7.1'
    },
    sl_ie_11: {
        base: 'SauceLabs',
        browserName: 'internet explorer',
        platform: 'Windows 8.1',
        version: '11'
    }
};

const config = (config:karma.Config):void => {

    config.set({
        frameworks: ["mocha", "chai", "karma-typescript"],
        files: [
            "src/**/*.ts"
        ],
        preprocessors: {
            "src/**/*.ts'": ["karma-typescript"],
            'src/**/*!(*.spec).ts': ["karma-typescript", "coverage"]

        },
        singleRun: true,
        reporters: ["progress", "saucelabs", "karma-typescript"],
        customLaunchers: customLaunchers,
        browsers: Object.keys(customLaunchers),
        karmaTypescriptConfig: {
            coverageOptions: {
                excludes: 'src/**/(*.spec).ts'
            }
        },
        captureTimeout: 0,
        browserNoActivityTimeout: 45000,
        sauceLabs: {
            testName: "Advanced WebSocket",
            recordScreenshots: false,
            tunnelIdentifier: process.env.TRAVIS_JOB_NUMBER,
            build: 'Build ' + process.env.TRAVIS_BUILD_NUMBER + '.' + process.env.TRAVIS_BUILD_ID
            username: process.env.SAUCE_USERNAME,
            accessKey: process.env.SAUCE_ACCESS_KEY,
            startConnect: false,
            public: 'public'
        }
    } as any);
};

export default config;