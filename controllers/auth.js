const User = require("../models/User");

//@desc     Register user
//@route    POST /api/v1/auth/register
//@access   Public

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role, telephone, homeAddress } = req.body;

    // Validate required fields
    if (!name || !email || !password || !telephone || !homeAddress) {
      return res.status(400).json({
        success: false,
        msg: "Please provide all required fields: name, email, password, telephone, and homeAddress",
      });
    }

    // Validate nested homeAddress fields
    const requiredAddressFields = [
      "houseNumber",
      "subdistrict",
      "district",
      "province",
      "postalCode",
    ];
    const missingFields = requiredAddressFields.filter(
      (field) => !homeAddress[field]
    );
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        msg: `Missing required address fields: ${missingFields.join(", ")}`,
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role,
      telephone,
      homeAddress,
    });

    sendTokenResponse(user, 200, res);
  } catch (err) {
    // ✅ Log full stack to console (for debugging)
    console.error(err.stack);

    // ✅ Send error message to client (friendly)
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