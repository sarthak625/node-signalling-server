const express = require('express');
const router = express.Router();

const routeUtils = require('../utils/route.utils');
const AuthController = require('../controllers/auth.controller');

router.get('/jwt', async (req, res) => {
    try {
        const token = await AuthController.createJWTToken(req);
        return res.status(200).send({ token });
    } catch (err) {
        const data = routeUtils.errorHandler(err);
        return res.status(data.statusCode).send({ msg: data.message });
    }
});

module.exports = router;