import * as karma from "karma";

process.env.CHROME_BIN = require('puppeteer').executablePath()

let configData: any = {
    frameworks: ["mocha", "chai", "karma-typescript"],
    files: [
        "src/**/*.ts"
    ],
    preprocessors: {
        "src/**/*.ts'": ["karma-typescript"],
        'src/**/*!(*.spec).ts': ["karma-typescript", "coverage"]

    },
    autoWatch: true,
    singleRun: false,
    reporters: ["progress", "coverage", "karma-typescript"],
    browsers: ["ChromeHeadless"],
    karmaTypescriptConfig: {
        coverageOptions: {
            excludes: 'src/**/(*.spec).ts'
        }
    },
    captureTimeout: 0,
    browserNoActivityTimeout: 45000,
};

if (process.env.TRAVIS_JOB_NUMBER) {
    const customLaunchers = {
        sl_chrome: {
            base: 'SauceLabs',
            browserName: 'chrome',
            platform: 'Windows 10',
            version: '61'
        },
        // sl_firefox: {
        //     base: 'SauceLabs',
        //     browserName: 'firefox',
        //     version: '30'
        // },
        // sl_ios_safari: {
        //     base: 'SauceLabs',
        //     browserName: 'iphone',
        //     platform: 'OS X 10.9',
        //     version: '7.1'
        // },
        // sl_ie_11: {
        //     base: 'SauceLabs',
        //     browserName: 'internet explorer',
        //     platform: 'Windows 8.1',
        //     version: '11'
        // }
    };


    configData.sauceLabs = {
        testName: "Advanced WebSocket",
        recordScreenshots: false,
        tunnelIdentifier: process.env.TRAVIS_JOB_NUMBER,
        build: 'Build ' + process.env.TRAVIS_BUILD_NUMBER + '.' + process.env.TRAVIS_BUILD_ID,
        username: process.env.SAUCE_USERNAME,
        accessKey: process.env.SAUCE_ACCESS_KEY,
        startConnect: false,
        public: 'public'
    };
    configData.autoWatch = false;
    configData.singleRun = true;

    configData.reporters.push("saucelabs");
    configData.customLaunchers = customLaunchers;
    configData.browsers = (Object as any).keys(customLaunchers);
}

const karmaConfig = (config: karma.Config): void => {
    config.set(configData as any);
};

export default karmaConfig;