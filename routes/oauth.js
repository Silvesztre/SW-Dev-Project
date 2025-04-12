const express = require('express')
const router = express.Router()
const dotenv = require('dotenv')
const { OAuth2Client } = require("google-auth-library")
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const { sendTokenResponse } = require('../controllers/auth')

dotenv.config({ path: '../config/config.env' })

/* GET home page */
router.get('/', async function (req, res, next) {
    const code = req.query.code
    try {
        const redirectUrl = 'http://127.0.0.1:5000/oauth'
        const oAuth2Client = new OAuth2Client(
            process.env.CLIENT_ID,
            process.env.CLIENT_SECRET,
            redirectUrl
        )
        const tokenResponse = await oAuth2Client.getToken(code)
        await oAuth2Client.setCredentials(tokenResponse.tokens)

        const user = oAuth2Client.credentials

        const ticket = await oAuth2Client.verifyIdToken({
            idToken: user.id_token,
            audience: process.env.CLIENT_ID
        })

        const payload = ticket.getPayload()

        // console.log('payload', payload)

        const email = payload.email

        const appUser = await User.findOne({ email });

        if (appUser) {
            sendTokenResponse(appUser, 200, res);
        } else {
            const tempToken = jwt.sign({
                email: payload.email,
                name: payload.name,
            }, process.env.JWT_SECRET, { expiresIn: '5m' })

            res.redirect(`http://localhost:3000/register?token=${tempToken}`)
        }
    } catch (err) {
        console.log("Error with signing in with Google", err)
        res.status(500).send('OAuth login failed')
    }
}) 


module.exports=router