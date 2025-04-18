const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please add a name"],
    validate: [
      {
        validator: function (v) {
          return !/^\d/.test(v); // cannot start with a digit
        },
        message: "Please add a valid name"
      },
      {
        validator: function (v) {
          // allows Thai, English, and spaces only
          return /^[a-zA-Zก-๙\s]+$/.test(v);
        },
        message: "Please add a valid name"
      }
    ]
  },
  email: {
    type: String,
    required: [true, "Please add an email"],
    unique: true,
    match: [
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      "Please add a valid email",
    ],
  },
  //ADDED: telephone number in a thai format numbers only
  tel: {
    type: String,
    required: [true, "Please add a telephone number"],
    match: [/^(0[0-9]{9})$/, "Please add a valid telephone number"],
  },
  //ADDED: homeaddress
  address: {
    type: String,
    // required: [true, "Please add an address"],
    required: false,
  },
  district: {
    type: String,
    // required: [true, "Please add a district"],
    required: false,
  },
  province: {
    type: String,
    // required: [true, "Please add a province"],
    required: false,
  },
  postalcode: {
    type: String,
    // required: [true, "Please add a postal code"],
    required: false,
    maxlength: [5, "Postal Code can not be more than 5 digits"],
  },
  //ADDED: geolocation (latitude and longitude)
  latitude: {
    type: Number,
  },
  longitude: {
    type: Number,
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  password: {
    type: String,
    required: [true, "Please add a password"],
    minlength: 6,
    select: false,
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Encrypt password using bcrypt
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next()
});

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", UserSchema);
