const mongoose = require("mongoose");

const BookingSchema = new mongoose.Schema({
  apptDate: {
    type: Date,
    required: true,
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
  company: {
    type: mongoose.Schema.ObjectId,
    ref: "Company",
    required: true,
  },
  travelTime: {
    type: Number,
    // required: [true, "travelTime(seconds) is required (calculated from api )"],
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Booking", BookingSchema);
