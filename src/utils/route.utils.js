const log4js = require('log4js');
const logger = log4js.getLogger('console');

exports.errorHandler = (err) => {
    if (err.cMessage) {
        return {
            statusCode: 400,
            message: err.cMessage
        };
    }

    logger.error(err);
    if (err && err.message) {
        logger.error(`message > ${err.message} `);
    }
    return {
        statusCode: 500,
        message: 'SOME_ERROR_OCCURRED'
    };
}