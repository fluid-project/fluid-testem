/*

    Tests for the static "instrumenter" function.

 */
/* eslint-env node */
"use strict";
var fluid  = require("infusion");
var jqUnit = require("node-jqunit");
var fs     = require("fs");
var path   = require("path");
var os     = require("os");
var rimraf = require("rimraf");

require("../../");
require("./instrumenter-testDefs");
require("./lib/isInstrumented");

fluid.registerNamespace("fluid.tests.testem.instrumenter");

fluid.tests.testem.instrumenter.runAllTests = function (that) {
    jqUnit.module(that.options.moduleName);
    fluid.each(that.options.testDefs, fluid.tests.testem.instrumenter.runSingleTest);
    rimraf.sync(that.options.baseOutputDir);
    fluid.log("Removed temporary output.");
};

fluid.tests.testem.instrumenter.runSingleTest = function (testDef) {
    jqUnit.asyncTest(testDef.name, function () {
        try {
            fluid.testem.instrumenter.instrument(testDef.inputPath, testDef.outputPath, testDef.instrumentationOptions).then(
                function () {
                    jqUnit.start();
                    jqUnit.assert("The instrumentation run should have completed successfully.");

                    fluid.each(testDef.shouldExist, function (relativeFilePath) {
                        var fileThatShouldExist = path.resolve(testDef.outputPath, relativeFilePath);
                        jqUnit.assertTrue("File '" + relativeFilePath + "' should exist.", fs.existsSync(fileThatShouldExist));

                        var fileStats = fs.statSync(fileThatShouldExist);
                        if (fileStats.isFile()) {
                            jqUnit.assertTrue("File '" + relativeFilePath + "' should not be empty.", fileStats.size > 0);
                        }
                    });

                    fluid.each(testDef.shouldNotExist, function (relativeFilePath) {
                        var fileThatShouldNotExist = path.resolve(testDef.outputPath, relativeFilePath);
                        jqUnit.assertFalse("File '" + relativeFilePath + "' should not exist.", fs.existsSync(fileThatShouldNotExist));
                    });

                    fluid.each(testDef.shouldBeInstrumented, function (relativeFilePath) {
                        var fileThatShouldBeInstrumented = path.resolve(testDef.outputPath, relativeFilePath);
                        jqUnit.assertTrue("File '" + relativeFilePath + "' should be instrumented.", fluid.test.testem.isInstrumented(fileThatShouldBeInstrumented));
                    });

                    fluid.each(testDef.shouldNotBeInstrumented, function (relativeFilePath) {
                        var fileThatShouldNotBeInstrumented = path.resolve(testDef.outputPath, relativeFilePath);
                        jqUnit.assertFalse("File '" + relativeFilePath + "' should not be instrumented.", fluid.test.testem.isInstrumented(fileThatShouldNotBeInstrumented));
                    });
                },
                function (error) {
                    jqUnit.start();
                    jqUnit.fail(error.stack);
                }
            );
        }
        catch (error) {
            jqUnit.start();
            jqUnit.fail(error.stack);
        }
    });
};

fluid.defaults("fluid.tests.testem.instrumenter.runner", {
    gradeNames: ["fluid.component"],
    moduleName: "Test the instrumentation functions.",
    baseOutputDir: {
        expander: {
            funcName: "fluid.testem.generateUniqueDirName",
            args:     [os.tmpdir(), "instrumenter-tests", "{that}.id"] // basePath, prefix, suffix
        }
    },
    testDefs: fluid.tests.testem.instrumenter.testDefs,
    listeners: {
        "onCreate.runTests": {
            funcName: "fluid.tests.testem.instrumenter.runAllTests",
            args:     ["{that}"]
        }
    }
});

fluid.tests.testem.instrumenter.runner();
