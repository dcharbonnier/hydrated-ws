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
    reporters: [/*"progress",*/ "coverage", "helpful", "karma-typescript"],
    browsers: ["ChromeHeadless"],
    karmaTypescriptConfig: {
        coverageOptions: {
            excludes: '**/(*.spec).ts'
        }
    },
    captureTimeout: 0,
    browserNoActivityTimeout: 120000,
};

if (process.env.TRAVIS_JOB_NUMBER) {
    const customLaunchers = {};

    [
        ["chrome", [16, 20, 30, 40, 50, 61]],
        ["safari", [7, 8, 9, 10, 11]],
        ["microsoftedge", [12, 13, 14, 15, 16]],
        ["firefox", [11, 20, 30, 40, 50, 57]]
    ]
        .map(([browserName, versions]) =>
            versions.map(version =>
                customLaunchers[`sl_chrome_${version}`] = {base: 'SauceLabs', browserName, version}));

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

    configData.reporters.unshift("saucelabs");
    configData.customLaunchers = customLaunchers;
    configData.browsers = (Object as any).keys(customLaunchers);
}

const karmaConfig = (config: karma.Config): void => {
    config.set(configData as any);
};

export default karmaConfig;