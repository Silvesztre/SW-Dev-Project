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
        scope: 'https://www.googleapis.com/auth/userinfo.profile openid',
        prompt: 'consent'
    })

    res.json({url:authorizeUrl})
})

/* async function getUserData(access_token) {
    const response = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token${access_token}`)
    const data = await response.json()
    console.log(`data: ${data}`)
} */

/* GET home page */
/* router.get('/oauth', async function (req, res, next) {
    const code = req.query.code
    try {
        const redirectUrl = 'http://127.0.0.1:5000/oauth'
        const oAuth2Client = new OAuth2Client(
            process.env.CLIENT_ID, 
            process.env.CLIENT_SECRET,
            redirectUrl
        )
        const res = await oAuth2Client.getToken(code)
        await oAuth2Client.setCredentials(res.tokens)
        console.log('Token acquired')
        const user = oAuth2Client.credentials
        console.log(`credentials: ${user}`)
        await getUserData(user.access_token)   
    } catch (err) {
        console.log("Error with signing in with Google")
    }
})  */


module.exports = router