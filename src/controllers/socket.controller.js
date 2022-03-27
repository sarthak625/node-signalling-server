const AuthService = require('../services/auth.service');
const SocketService = require('../services/socket.service');

const log4js = require('log4js');
const logger = log4js.getLogger('console');

exports.handleSocketConnection = async (socket) => {
    logger.info(`Trying to establish socket connection`);

    if (socket.handshake.auth && socket.handshake.auth.token) {
        const isValidToken = AuthService.verifyJWT(socket.handshake.auth.token);
        if (!isValidToken) {
            socket.disconnect();
            return;
        }
    } else {
        socket.disconnect();
        return;
    }

    logger.info(`Socket connection established`);
    
    socket.on('disconnect', () => {
        logger.debug('disconnect');
        SocketService.removeSocketFromConnectedUsers(socket.id);
    });

    socket.on('join-call', async (event, callback) => {
        logger.debug('join-call');
        logger.debug(event);
        SocketService.addToConnectedUsersList(socket.id, event.value);
        return callback({
            socketId: socket.id,
            username: event.value,
        });
    });

    socket.on('leave-call', () => {
        logger.debug('leave-call');
        SocketService.removeSocketFromConnectedUsers(socket.id);
    });

    socket.on('get-connected-users', async (callback) => {
        logger.debug('get-connected-users');
        const data = await SocketService.getConnectedUsersList();
        return callback(data);
    });

    socket.on('create-call-doc', async (data, callback) => {
        try {
            logger.debug('create-call-doc');
            logger.debug(data);
            const callDoc = await SocketService.createCallDocForUser(data, socket.id);
            return callback(callDoc);
        } catch (err) {
            if (err.customErr) {
                return callback({ err: err.customErr });
            } else {
                logger.error(err);
                return callback({ err: 'Something went wrong' });
            }
        }
    });

    socket.on('add-offer-candidate', async (data, callback) => {
        try {
            logger.debug('add-offer-candidate');
            logger.debug(data);
            const candidate = await SocketService.addOfferCandidateForCall(data);
            socket.to(data.userSocketId).emit('on-offer-candidate-received', { offerCandidate: candidate });
            return callback(candidate);
        } catch (err) {
            if (err.customErr) {
                return callback({ err: err.customErr });
            } else {
                logger.error(err);
                return callback({ err: 'Something went wrong' });
            }
        }
    });
    
    socket.on('add-answer-candidate', async (data, callback) => {
        try {
            logger.debug('add-answer-candidate');
            logger.debug(data);
            const { candidate, caller } = await SocketService.addAnswerCandidateForCall(data);
            socket.to(caller).emit('on-answer-candidate-received', { answerCandidate: candidate });
            return callback(candidate);
        } catch (err) {
            if (err.customErr) {
                return callback({ err: err.customErr });
            } else {
                logger.error(err);
                return callback({ err: 'Something went wrong' });
            }
        }
    });
    
    socket.on('add-offer', async (data, callback) => {
        try {
            logger.debug('add-offer');
            logger.debug(data);
            const callDoc = await SocketService.addOffer(data);
            logger.debug('call-received');
            logger.debug(data);
            socket.to(callDoc.callee).emit('call-received', callDoc);
            return callback(callDoc);
        } catch (err) {
            if (err.customErr) {
                return callback({ err: err.customErr });
            } else {
                logger.error(err);
                return callback({ err: 'Something went wrong' });
            }
        }
    });

    socket.on('add-answer', async (data, callback) => {
        try {
            logger.debug('add-answer');
            logger.debug(data);
            const callDoc = await SocketService.addAnswer(data);
            socket.to(callDoc.caller).emit('on-answer-received', { answer: callDoc.answer });
            return callback(callDoc);
        } catch (err) {
            if (err.customErr) {
                return callback({ err: err.customErr });
            } else {
                logger.error(err);
                return callback({ err: 'Something went wrong' });
            }
        }
    });
}