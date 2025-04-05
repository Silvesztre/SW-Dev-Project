const Appointment = require("../models/Appointment");
const Company = require("../models/Company");
const User = require("../models/User");
const axios = require("axios");

//@desc     Get all appointments
//@route    GET /api/v1/appointments
//@access   Public
exports.getAppointments = async (req, res, next) => {
  let query;
  //General users can see only their appointments!
  if (req.user.role !== "admin") {
    query = Appointment.find({ user: req.user.id }).populate({
      path: "company",
      select: "name province tel",
    });
  } else {
    // If you are an admin, you can see all!
    if (req.params.companyId) {
      console.log(req.params.companyId);
      query = Appointment.find({ company: req.params.companyId }).populate({
        path: "company",
        select: "name province tel",
      });
    } else {
      query = Appointment.find().populate({
        path: "company",
        select: "name province tel",
      });
    }
  }

  try {
    const appointments = await query;

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Cannot find Appointment",
    });
  }
};

//@desc     GET single appointment
//@route    GET /api/v1/appointments/:id
//@access   Public
exports.getAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id).populate({
      path: "company",
      select: "name description tel",
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: `No appointment with the id of ${req.params.id}`,
      });
    }

    res.status(200).json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    console.log(error.stack);
    return res.status(500).json({
      success: false,
      message: "Cannot find Appointment",
    });
  }
};

//@desc     Add appointment
//@route    POST /api/v1/companies/:companyId/appointment
//@access   Private
exports.addAppointment = async (req, res, next) => {
  try {
    req.body.company = req.params.companyId;

    const company = await Company.findById(req.params.companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: `No company with the id of ${req.params.companyId}`,
      });
    }

    // ✅ Necessary: get user's coordinates from DB
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: `No user found`,
      });
    }

    // ✅ Validate apptDate is between May 10–13, 2022
    const selectedDate = new Date(req.body.apptDate);
    const rangeStart = new Date("2022-05-10T00:00:00");
    const rangeEnd = new Date("2022-05-13T23:59:59");

    if (selectedDate < rangeStart || selectedDate > rangeEnd) {
      return res.status(400).json({
        success: false,
        message: "Appointment must be scheduled between May 10–13, 2022",
      });
    }

    // ✅ Limit to 3 appointments per user
    const existedAppointment = await Appointment.find({ user: req.user.id });
    if (existedAppointment.length >= 3 && req.user.role !== "admin") {
      return res.status(400).json({
        success: false,
        message: `The user with ID ${req.user.id} has already made 3 appointments`,
      });
    }

    // ✅ Call TravelTime API
    const travelTimeRes = await axios.post(
      "https://api.traveltimeapp.com/v4/routes",
      {
        locations: [
          {
            id: "point-from",
            coords: {
              lat: user.latitude,
              lng: user.longitude,
            },
          },
          {
            id: "point-to-1",
            coords: {
              lat: company.latitude,
              lng: company.longitude,
            },
          },
        ],
        departure_searches: [
          {
            id: "departure-search",
            transportation: {
              type: "driving",
            },
            departure_location_id: "point-from",
            arrival_location_ids: ["point-to-1"],
            departure_time: "2025-04-05T09:00:00+01:00", // can be dynamic
            properties: ["travel_time"],
          },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-Application-Id": process.env.TRAVELTIME_APP_ID,
          "X-Api-Key": process.env.TRAVELTIME_API_KEY,
        },
      }
    );
    console.log(travelTimeRes.data);
    // ✅ Extract travel time
    const travelTime =
      travelTimeRes.data.results[0]?.locations[0]?.properties[0]?.travel_time;

    if (!travelTime) {
      return res.status(500).json({
        success: false,
        message: "Failed to calculate travel time from TravelTime API",
      });
    }

    // ✅ Create the appointment with travelTime
    req.body.user = req.user.id;
    req.body.travelTime = travelTime;

    const appointment = await Appointment.create(req.body);

    res.status(200).json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    console.log(error.stack);
    return res.status(500).json({
      success: false,
      message: "Cannot create Appointment",
    });
  }
};

//@desc     Update appointment
//@route    PUT /api/v1/appointments/:id
//@access   Private
exports.updateAppointment = async (req, res, next) => {
  try {
    let appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: `No appointment with the id of ${req.params.id}`,
      });
    }

    // ✅ Check ownership or admin permission
    if (
      appointment.user.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: `User ${req.user.id} is not authorized to update this appointment`,
      });
    }

    // ✅ Only allow apptDate to be updated
    if (!req.body.apptDate || Object.keys(req.body).length > 1) {
      return res.status(400).json({
        success: false,
        message: "Only apptDate can be updated",
      });
    }

    // ✅ Validate apptDate range
    const selectedDate = new Date(req.body.apptDate);
    const rangeStart = new Date("2022-05-10T00:00:00");
    const rangeEnd = new Date("2022-05-13T23:59:59");

    if (selectedDate < rangeStart || selectedDate > rangeEnd) {
      return res.status(400).json({
        success: false,
        message: "Appointment must be scheduled between May 10–13, 2022",
      });
    }

    appointment.apptDate = selectedDate;
    await appointment.save();

    res.status(200).json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    console.log(error.stack);
    return res.status(500).json({
      success: false,
      message: "Cannot update Appointment",
    });
  }
};

// @desc     Delete appointment
// @route    DELETE /api/v1/appointments/:id
// @access   Private
exports.deleteAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: `No appointment with the id of ${req.params.id}`,
      });
    }

    // ✅ ADDED: Allow only the owner or an admin to delete
    if (
      appointment.user.toString() !== req.user.id && // ✅ ADDED: Check ownership
      req.user.role !== "admin" // ✅ ADDED: Admin bypass
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this appointment", // ✅ ADDED: Custom unauthorized message
      });
    }

    await appointment.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    console.log(error.stack);
    return res.status(500).json({
      success: false,
      message: "Cannot delete Appointment",
    });
  }
};
