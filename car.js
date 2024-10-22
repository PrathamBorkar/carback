const mongoose = require('mongoose');

// Reference the Owner model
const Owner = require('./owner'); 

// Define the Car schema
const carSchema = new mongoose.Schema({
  regno: { type: String, required: true },
  model: { type: String, required: true },
  year: { type: Number, required: true },
  price: { type: Number, required: true },
  ownerNO: { type: Number, required: true },
  transmission: { type: String, required: true },
  fuelType: { type: String, required: true },
  seats: { type: Number, required: true },
  askableprice: { type: Number, required: true },
  description: { type: String, required: true },
  images: [String], // Array to store image URLs
  owner: {
    type: mongoose.Schema.Types.ObjectId, // Reference the Owner model by ObjectId
    ref: 'Owner',  // Reference the 'Owner' model name
    required: true,
  },
});

const Car = mongoose.model('Car', carSchema);

module.exports = Car;
