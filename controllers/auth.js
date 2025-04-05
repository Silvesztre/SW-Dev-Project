const User = require("../models/User");
const axios = require("axios");

//@desc     Register user
//@route    POST /api/v1/auth/register
//@access   Public

exports.register = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      role,
      tel,
      address,
      district,
      province,
      postalcode,
    } = req.body;

    // Validate required fields
    const requiredFields = {
      name,
      email,
      password,
      tel,
      address,
      district,
      province,
      postalcode,
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([_, value]) => !value)
      .map(([key]) => key);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        msg: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    // Geocoding request to HERE API
    const apiKey = process.env.HERE_API_KEY;
    const fullAddress = `${address} ${district} ${province} ${postalcode}`;
    const geocodeUrl = `https://geocode.search.hereapi.com/v1/geocode?q=${encodeURIComponent(
      fullAddress
    )}&apiKey=${apiKey}`;

    const geoRes = await axios.get(geocodeUrl);
    const geoItems = geoRes.data.items;

    let latitude = null;
    let longitude = null;

    if (geoItems && geoItems.length > 0) {
      const position = geoItems[0].position;
      latitude = position.lat;
      longitude = position.lng;
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role,
      tel,
      address,
      district,
      province,
      postalcode,
      latitude,
      longitude,
    });

    sendTokenResponse(user, 200, res);
  } catch (err) {
    console.error(err.stack);
    res.status(400).json({
      success: false,
      msg: err.message || "Registration failed",
    });
  }
};

//@desc     Login user
//@route    POST api/v1/auth/login
//@access   Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email | !password) {
      return res.status(400).json({
        success: false,
        msg: "Please provide an email and password",
      });
    }

    // Check for user
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(400).json({
        success: false,
        msg: "Invalid credentials",
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        msg: "Invalid credentials",
      });
    }

    // Create token
    // const token = user.getSignedJwtToken()
    // res.status(200).json({success: true, token})
    sendTokenResponse(user, 200, res);
  } catch (err) {
    return res.status(401).json({
      success: false,
      msg: "Cannot convert email or password to string",
    });
  }
};

//@desc     Get current Logged in user
//@route    GET api/v1/auth/me
//@access   Private
exports.getMe = async (req, res, next) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({
    success: true,
    data: user,
  });
};

const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === "production") {
    options.secure = true;
  }

  res.status(statusCode).cookie("token", token, options).json({
    success: true,
    //add for frontend
    _id: user._id,
    name: user.name,
    email: user.email,
    //end for frontend
    token,
  });
};

//@desc     Log user out / clear cookie
//@route    GET /api/v1/auth/logout
//@access   Private
exports.logout = async (req, res, next) => {
  res.cookie("token", "none", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    data: {},
  });
};


exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: "Please provide current and new passwords" });
    }

    let user = await User.findById(req.user.id).select("+password");

    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({ success: false, error: "Current password is incorrect" });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: "Failed to change password",
      error: err.message,
    })
  }
}