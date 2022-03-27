require('dotenv').config();

const express = require('express');
const app = express();

const log4js = require('log4js');
log4js.configure(require('./config/logger.json'));

const logger = log4js.getLogger('console');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(require('cors')({
    origin: '*',
}));

app.use((err, req, res, next) => {
    // This check makes sure this is a JSON parsing issue, but it might be
    // coming from any middleware, not just body-parser:

    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).send({
            code: 400,
            message: 'Invalid JSON',
        }); // Bad request
    }

    next();
});

app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

app.use((req, res, next) => {
    if (process.env.ENV === 'local' || process.env.ENV === 'dev') {
        logger.debug('Params');
        logger.debug('---------------------');
        logger.debug(req.params);
        logger.debug('Headers');
        logger.debug('---------------------');
        logger.debug(req.headers);
        logger.debug('Body');
        logger.debug('---------------------');
        logger.debug(req.body);
    }
    const ip = req.headers['x-forwarded-for'] ||
        req.socket.remoteAddress ||
        null;
    logger.info(`${req.headers.host} ${req.method} ${req.url} ---> ${ip}--> ${req.headers['user-agent']}`)
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

app.use('/', require('./src/routes/auth.route'));

const server = require('http').createServer(app);

// Socket IO Handling
const io = require('socket.io')(server);

require('./db');


const SocketController = require('./src/controllers/socket.controller');
io.on('connection', SocketController.handleSocketConnection);

server.listen(process.env.PORT || 4000, () => {
    logger.info(`Server running on ${process.env.PORT || 4000}`);
});