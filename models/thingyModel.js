const { mongoose, Schema } = require('mongoose');

const thingySchema = new Schema({
  name: {
    type: String,
    required: true,
  },
});

const Thingy = mongoose.model('Thingy', thingySchema);

module.exports = Thingy;
