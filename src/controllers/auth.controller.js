const AuthService = require('../services/auth.service');

exports.createJWTToken = async (req) => {
    try {
        // Check if the request is coming from valid domain
        const isValidOrigin = AuthService.verifyOrigin(req.headers.host);
        if (!isValidOrigin) {
            throw { cMessage: 'INVALID_ORIGIN' };
        }
        return AuthService.signJWT({
            requestedAt: new Date().toISOString(),
        });
    } catch (err) {
        throw err;
    }
};
