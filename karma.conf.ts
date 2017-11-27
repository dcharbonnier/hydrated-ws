import * as karma from "karma";
process.env.CHROME_BIN = require('puppeteer').executablePath()

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
        autoWatch: false,
        singleRun: true,
        reporters: ["progress", "coverage", "karma-typescript"],
        browsers: ["ChromeHeadless"],
        karmaTypescriptConfig: {
            coverageOptions: {
                excludes: 'src/**/(*.spec).ts'
            }
        }
    } as any);
};

export default config;