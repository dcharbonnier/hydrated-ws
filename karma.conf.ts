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
    client: {
        captureConsole: true,
        mocha: {
            timeout: 120000
        }
    },
    autoWatch: true,
    singleRun: false,
    reporters: [/*"progress", "coverage", */"helpful", "karma-typescript"],
    browsers: ["ChromeHeadless"],
    karmaTypescriptConfig: {
        coverageOptions: {
            excludes: 'src/**/(*.spec).ts'
        }
    },
    captureTimeout: 0,
    browserNoActivityTimeout: 120000,
};

if (process.env.TRAVIS_JOB_NUMBER) {
    const customLaunchers = {
        // sl_chrome: {
        //     base: 'SauceLabs',
        //     browserName: 'chrome',
        //     version: '61'
        // },
        // sl_firefox: {
        //     base: 'SauceLabs',
        //     browserName: 'firefox',
        //     version: '55'
        // },
        sl_macos_safari: {
            base: 'SauceLabs',
            browserName: 'safari',
            version: '11'
        },
        sl_edge: {
            base: 'SauceLabs',
            browserName: 'microsoftedge',
            version: '14'
        }
    };


    configData.sauceLabs = {
        testName: "Advanced WebSocket",
        recordScreenshots: false,
        tunnelIdentifier: process.env.TRAVIS_JOB_NUMBER,
        build: 'Build ' + process.env.TRAVIS_BUILD_NUMBER + '.' + process.env.TRAVIS_BUILD_ID,
        username: process.env.SAUCE_USERNAME,
        accessKey: process.env.SAUCE_ACCESS_KEY,
        startConnect: false,
        connectOptions: {
            noSslBumpDomains: "all"
        },
        public: 'public'
    };
    configData.autoWatch = false;
    configData.singleRun = true;

    configData.reporters.unshift("saucelabs");
    configData.customLaunchers = customLaunchers;
    configData.browsers = (Object as any).keys(customLaunchers);
}

const karmaConfig = (config: karma.Config): void => {
    config.set(configData as any);
};

export default karmaConfig;