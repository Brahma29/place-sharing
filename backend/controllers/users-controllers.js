const HttpError = require('../models/http-error');
const { v4: uuid } = require('uuid');
const { validationResult } = require('express-validator');
const User = require('../models/user');
const brcypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const getUsers = async (req, res, next) => {
  let users;
  try {
    users = await User.find({}, '-password');
  } catch (err) {
    const error = new HttpError(
      'Fetching user failed, please try again later.',
      500
    );
    return next(error);
  }
  res
    .status(200)
    .json({ users: users.map((u) => u.toObject({ getters: true })) });
};

//*************************SIGN UP**************************

const signUp = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError(
        'Invalid inputs passed, please check your entered data.',
        422
      )
    );
  }

  const { name, email, password } = req.body;
  let existingUser;

  try {
    existingUser = await User.findOne({ email });
  } catch (err) {
    const error = new HttpError(
      'Signing up failed, please try again later',
      500
    );
    return next(error);
  }
  if (existingUser) {
    const error = new HttpError('User with email address already exists.', 422);
    return next(error);
  }

  let hashedPassword;
  try {
    hashedPassword = await brcypt.hash(password, 12);
  } catch (err) {
    const error = new HttpError(
      'Signing up failed, please try again later',
      500
    );
    return next(error);
  }

  const createdUser = await User({
    name,
    email,
    password: hashedPassword,
    image: req.file.path,
    places: [],
  });

  try {
    await createdUser.save();
  } catch (err) {
    const error = new HttpError(
      'Signing up failed, please try again later',
      500
    );
    return next(error);
  }

  let token;
  try {
    token = jwt.sign(
      { userId: createdUser.id, email: createdUser.email },
      process.env.JWT_KEY,
      { expiresIn: '1h' }
    );
  } catch (err) {
    const error = new HttpError(
      'Signing up failed, please try again later',
      500
    );
    return next(error);
  }

  return res
    .status(201)
    .json({ userId: createdUser.id, email: createdUser.email, token });
};
const login = async (req, res, next) => {
  const { email, password } = req.body;

  const identifiedUser = await User.findOne({ email });
  if (!identifiedUser) {
    const error = new HttpError('Invalid credentials', 401);
    return next(error);
  }

  let isValidPassword = false;
  try {
    isValidPassword = await brcypt.compare(password, identifiedUser.password);
  } catch (err) {
    const error = new HttpError('Something went wrong', 500);
    return next(error);
  }

  if (!isValidPassword) {
    const error = new HttpError('Invalid credentials', 403);
    return next(error);
  }

  let token;
  try {
    token = jwt.sign(
      { userId: identifiedUser.id, email: identifiedUser.email },
      process.env.JWT_KEY,
      { expiresIn: '1h' }
    );
  } catch (err) {
    const error = new HttpError(
      'Signing up failed, please try again later',
      500
    );
    return next(error);
  }

  return res.status(200).json({
    userId: identifiedUser.id,
    email: identifiedUser.email,
    token,
  });
};

exports.getUsers = getUsers;
exports.signUp = signUp;
exports.login = login;
