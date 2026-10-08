const mongoose = require('mongoose');

const boardSchema = new mongoose.Schema({
  title: String,
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

const boardModel = mongoose.model('board', boardSchema)

module.exports = boardModel;