const express = require('express');
const { getUsers } = require('../controllers/user.controller');
const { protect, adminOnly } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', protect, adminOnly, getUsers);

module.exports = router;
