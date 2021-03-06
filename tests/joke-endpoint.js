/* eslint-disable */

const settings = require("../settings");

const meta = {
    name: "Joke",
    category: "Endpoints",
    endpointURL: "/joke"
};

/**
 * @typedef {Object} UnitTestResult
 * @prop {String} name
 * @prop {Boolean} success
 */

/**
 * Runs this unit test
 * @returns {Promise<Array<UnitTestResult>, String>}
 */
function run()
{
    return new Promise((resolve, reject) => {
        return resolve({ meta });
    });
}

module.exports = { meta, run };
