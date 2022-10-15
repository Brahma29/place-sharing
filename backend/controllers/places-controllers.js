const HttpError = require('../models/http-error');
const { v4: uuid } = require('uuid');
const { validationResult } = require('express-validator');
const Place = require('../models/place');
const User = require('../models/user');
const { default: mongoose } = require('mongoose');
const fs = require('fs');

let dummyPlaces = [
  {
    id: 'p1',
    title: 'empire states building',
    description: 'most famous skyscraper in the whole world',
    imageUrl:
      'https://cdn.britannica.com/73/114973-050-2DC46083/Midtown-Manhattan-Empire-State-Building-New-York.jpg',
    address: '20 W 34th St., New York, NY 10001, United States',
    location: {
      lat: 40.7484405,
      lng: -73.9878531,
    },
    creator: 'u1',
  },
  {
    id: 'p2',
    title: 'empire states building',
    description: 'most famous skyscraper in the whole world',
    imageUrl:
      'https://cdn.britannica.com/73/114973-050-2DC46083/Midtown-Manhattan-Empire-State-Building-New-York.jpg',
    address: '20 W 34th St., New York, NY 10001, United States',
    location: {
      lat: 40.7484405,
      lng: -73.9878531,
    },
    creator: 'u2',
  },
];

const getPlaceById = async (req, res, next) => {
  const placeId = req.params.pid;
  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, could not find a place',
      500
    );
    return next(error);
  }
  if (!place) {
    const error = new HttpError(
      'Could not find a place with the provided id',
      404
    );
    return next(error);
  }
  return res.json({ place: place.toObject({ getters: true }) });
};

const getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.uid;
  let places;
  try {
    places = await Place.find({ creator: userId });
  } catch (err) {
    throw new HttpError('Creating place failed, please try again.', 500);
  }

  if (!places || places.length === 0) {
    return next(
      new HttpError('Could not find a places with the provided user id.', 404)
    );
  }

  res.json({ places: places.map((p) => p.toObject({ getters: true })) });
};

const createPlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new HttpError(
      'Invalid inputs passed, please check your entered data.',
      422
    );
  }
  const { title, description, coordinates, address, creator } = req.body;

  const createdPlace = new Place({
    title,
    description,
    address,
    location: coordinates,
    image: req.file.path,
    creator,
  });

  let user;

  try {
    user = await User.findById(creator);
  } catch (err) {
    const error = new HttpError('Creating Place failed, please try again', 500);
    return next(error);
  }

  if (!user) {
    const error = new HttpError('We could not find user with provided id', 404);
    return next(error);
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdPlace.save({ session: sess });
    user.places.push(createdPlace);
    await user.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError('Creating Place failed, please try again', 500);
    return next(error);
  }
  return res.status(201).json({ place: createdPlace });
};

const updatePlaceById = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new HttpError(
      'Invalid inputs passed, please check your entered data.',
      422
    );
  }
  const { title, description } = req.body;
  const placeId = req.params.pid;
  let place = await Place.findById(placeId);
  if (!place) {
    return next(
      new HttpError('Could not find a places with the provided user id.', 404)
    );
  }

  if (place.creator.toString() !== req.userData.userId) {
    const error = new HttpError(
      'You are not authorized to update this place.',
      403
    );
    return next(error);
  }

  let updatedPlace;
  try {
    updatedPlace = await Place.findByIdAndUpdate(
      placeId,
      {
        title,
        description,
      },
      { returnDocument: 'after' }
    );
  } catch (err) {
    throw new HttpError('Updating item failed, Please try again.', 500);
  }

  return res
    .status(200)
    .json({ place: updatedPlace.toObject({ getters: true }) });
};

const deletePlaceById = async (req, res, next) => {
  const placeId = req.params.pid;
  let place;
  try {
    place = await Place.findById(placeId).populate('creator');
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, could not delete place.',
      500
    );
    return next(error);
  }

  if (!place) {
    const error = new HttpError('We could not find place for this id', 404);
    return next(error);
  }

  if (place.creator.id !== req.userData.userId) {
    const error = new HttpError(
      'You are not authorized to delete this place.',
      403
    );
    return next(error);
  }

  const imagePath = place.image;

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await place.remove({ session: sess });
    place.creator.places.pull(place);
    await place.creator.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, could not delete place.',
      500
    );
    return next(error);
  }

  fs.unlink(imagePath, (err) => {
    console.log(err);
  });

  return res.status(200).json({ message: 'Place deleted successfully.' });
};

exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlaceById = updatePlaceById;
exports.deletePlaceById = deletePlaceById;
