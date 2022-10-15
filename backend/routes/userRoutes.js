const express = require('express');
const userControllers = require('../controllers/users-controllers');
const { check } = require('express-validator');
const fileUpload = require('../middleware/file-upload');

const router = express.Router();

router.get('/', userControllers.getUsers);

router.post(
  '/signup',
  fileUpload.single('image'),
  [
    check('name').not().isEmpty(),
    check('email').normalizeEmail().isEmail(),
    check('password').isLength({ min: 8 }),
  ],
  userControllers.signUp
);

router.post('/login', userControllers.login);

module.exports = router;
