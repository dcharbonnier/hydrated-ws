import * as karma from "karma";

process.env.CHROME_BIN = require('puppeteer').executablePath()

const TIMEOUT_FACTOR = process.env.TRAVIS_JOB_NUMBER ? 20 : 1;

let configData: any = {
    frameworks: ["mocha", "chai", "karma-typescript", "promise"],
    files: [
        "src/**/*.ts"
    ],
    preprocessors: {
        "src/**/*.ts'": ["karma-typescript"],
        'src/**/*!(*.spec).ts': ["karma-typescript"]

    },
    client: {
        captureConsole: true,
        mocha: {
            timeout: TIMEOUT_FACTOR * 4000,
        }
    },
    autoWatch: true,
    singleRun: false,
    concurrency: 4,
    reporters: [/*"progress",*/ "helpful", "karma-typescript"],
    browsers: ["Chrome"],
    karmaTypescriptConfig: {
        bundlerOptions: {
            addNodeGlobals: false,
            ignore: ["ws"],
            sourceMap: true,
            constants: {
                TIMEOUT_FACTOR: TIMEOUT_FACTOR,
            },
        },
        coverageOptions: {
            exclude: /\.spec\.ts$/i
        }
    },
    captureTimeout: 0,
    browserNoActivityTimeout: 120000,
};

if (process.env.TRAVIS_JOB_NUMBER) {

    const customLaunchers: any = {};

    [
        ["chrome", [/*26, 30, 40, */50, 61]],
        // ["safari", [/*7, 8, 9,*/ 10, 11]],
        // ["microsoftedge", [/*13, 14*/, 15]],
        // ["firefox", [/*11, 20, */30, 40, 50, 55]]
    ]
        .map(([browserName, versions]) => {
                (versions as any).map((version: any) =>
                    customLaunchers[`sl_${browserName}_${version}`] = {
                        base: 'SauceLabs',
                        browserName,
                        version: version.toString()
                    })
            }
        );
    configData.karmaTypescriptConfig.reports = {
        "lcovonly": {
            "filename": "report.lcov"
        },
        "html": "coverage",
        "text-summary": ""
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

    configData.reporters.unshift("saucelabs");
    configData.customLaunchers = customLaunchers;
    configData.browsers = (Object as any).keys(customLaunchers);
}

const karmaConfig = (config: karma.Config): void => {
    config.set(configData as any);
};

export default karmaConfig;