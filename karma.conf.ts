import * as karma from "karma";

process.env.CHROME_BIN = require('puppeteer').executablePath();

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
            retries: 4,
        }
    },
    autoWatch: false,
    singleRun: true,
    concurrency: 4,
    reporters: [/*"progress",*/ "helpful", "karma-typescript"],
    browsers: ["ChromeHeadlessNoSandbox", "PhantomJS"],
    customLaunchers: {
        ChromeHeadlessNoSandbox: {
            base: 'ChromeHeadless',
            flags: ['--no-sandbox']
        }
    },
    karmaTypescriptConfig: {
        bundlerOptions: {
            addNodeGlobals: false,
            ignore: ["ws"],
            sourceMap: true,
            constants: {
                TIMEOUT_FACTOR: TIMEOUT_FACTOR,
            },
        },
        reports: {
            "lcovonly": {
                "filename": "report.lcov"
            },
            "html": "coverage",
            "text-summary": ""
        },
        coverageOptions: {
            exclude: /\.spec\.ts$/i
        },
        compilerOptions: {
            "lib": [
                "es5",
                "dom",
                "es2015.promise"
        
            ]
        },
    },
    captureTimeout: 0,
    browserNoActivityTimeout: 120000,
};

const karmaConfig = (config: karma.Config): void => {
    config.set(configData as any);
};

export default karmaConfig;