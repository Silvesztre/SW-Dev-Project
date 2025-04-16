const User = require("../models/User");
const axios = require("axios");

//@desc     Edit user address
//@route    PATCH /api/v1/users/:userId/address
//@access   Private
exports.editUserAddress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    if (userId !== req.params.userId) {
      return res.status(403).json({
        success: false,
        message: `User ${req.user.id} is not authorized to update this user's address`,
      });
    }

    const { address, district, province, postalcode } = req.body;

    const requiredFields = {
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

    const updatedAddress = {
      address,
      district,
      province,
      postalcode,
      latitude,
      longitude,
    };

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updatedAddress },
      { new: true }
    );

    res.status(200).json({ success: true, data: updatedUser });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: "Failed to update address",
      error: err.message,
    });
  }
};
