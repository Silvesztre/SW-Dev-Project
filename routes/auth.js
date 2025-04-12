const express = require('express')
const { register, login, getMe, logout, changePassword } = require('../controllers/auth')
const { OAuth2Client } = require("google-auth-library")
const dotenv = require('dotenv')

dotenv.config({ path: '../config/config.env' })

const router = express.Router()

const { protect } = require('../middleware/auth')

router.post('/register', register)
router.post('/login', login)
router.get('/me', protect, getMe)
router.get('/logout', logout)
router.put('/change-password', protect, changePassword)

// Google OAuth
router.post('/oauth', async function(req, res, next) {
    res.header('Access-Control-Allow-Origin', 'http://localhost:3000')
    res.header('Referrer-Policy', 'no-referrer-when-downgrade')
    
    const redirectUrl = 'http://127.0.0.1:5000/oauth'

    const oAuth2Client = new OAuth2Client(
        process.env.CLIENT_ID,
        process.env.CLIENT_SECRET,
        redirectUrl
    )

    const authorizeUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email openid',
        prompt: 'consent'
    })

    res.json({url:authorizeUrl})
})

module.exports = router