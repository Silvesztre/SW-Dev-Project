const express = require('express')
const {
    editUserAddress
} = require('../controllers/users')

const router = express.Router()
const { protect } = require('../middleware/auth')

router.route('/:userId/address').patch(protect, editUserAddress)

module.exports = router