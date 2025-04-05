const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please add a name"],
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
  telephone: {
    type: String,
    required: [true, "Please add a telephone number"],
    match: [/^(0[689]{1}[0-9]{8})$/, "Please add a valid telephone number"],
  },
  //ADDED: home address
  homeAddress: {
    houseNumber: {
      type: String,
      required: [true, "Please enter the house number"],
    },
    village: { type: String },
    moo: { type: String },
    soi: { type: String },
    road: { type: String },
    subdistrict: {
      type: String,
      required: [true, "Please enter the subdistrict (ตำบล/แขวง)"],
    },
    district: {
      type: String,
      required: [true, "Please enter the district (อำเภอ/เขต)"],
    },
    province: {
      type: String,
      required: [true, "Please enter the province"],
    },
    postalCode: {
      type: String,
      required: [true, "Please enter the postal code"],
      match: [/^\d{5}$/, "Postal code must be 5 digits"],
    },
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
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
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
