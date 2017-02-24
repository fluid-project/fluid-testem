// A testem configuration file in which complete coverage is the expected result.
/* eslint-env node */
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

require("../harness");

var testemComponent = gpii.tests.testem.harness({
    sourceDirs: ["src"],
    serveDirs:  ["src"],
    testPages:   ["complete.html"],
    testemOptions: {
        cwd: __dirname // required because we are working outside of our package root.
    }
});

module.exports = testemComponent.getTestemOptions();
