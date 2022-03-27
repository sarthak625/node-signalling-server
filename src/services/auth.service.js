const JWT = require('jsonwebtoken');

exports.signJWT = async (body) => {
    return JWT.sign(body, process.env.JWT_SECRET, {
        expiresIn: Number(process.env.JWT_EXPIRES_IN || (30 * 60)),
    })
}

exports.verifyJWT = (token) => {
    try {
        const decoded = JWT.verify(token, process.env.JWT_SECRET);
        return decoded;
    } catch (err) {
        return false;
    }
}

exports.verifyOrigin = (origin) => {
    const validOrigins = process.env.VALID_ORIGINS.split(',');
    return validOrigins.includes(origin);
}
