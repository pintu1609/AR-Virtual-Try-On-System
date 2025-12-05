const mongoose = require('mongoose');


const OutfitSchema = new mongoose.Schema({
name: { type: String, required: true },
filename: { type: String, required: true },
addedAt: { type: Date, default: Date.now }
});


module.exports = mongoose.model('Outfit', OutfitSchema);