const { v4 } = require('uuid');

/**
 * @params - function to genarate a uuid
 * @type Random Strings
 * 
 */

exports.generateuuid = () => {
    return v4();
}