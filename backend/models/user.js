const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, minLength: 8 },
  image: { type: String, required: true },
  places: [
    {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Place',
    },
  ],
});

module.exports = mongoose.model('User', UserSchema);
