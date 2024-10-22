const mongoose = require("mongoose");


const ownerSchema = new mongoose.Schema({
  ownerName: { type: String, required: true },
 
  
  adhaarNumber: String,
  whatsappNumber: String,
  ownerComments: String,
});

const Owner = mongoose.model('Owner', ownerSchema);
module.exports = Owner;
