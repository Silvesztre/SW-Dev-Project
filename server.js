const express = require('express')
const dotenv = require('dotenv')
const cookieParser = require('cookie-parser')
const connectDB = require('./config/db')
const cors = require("cors");
const mongoSanitize = require('express-mongo-sanitize')
const helmet = require('helmet')
const {xss} = require('express-xss-sanitizer')
const rateLimit = require('express-rate-limit')
const hpp = require('hpp')
const swaggerJsDoc = require('swagger-jsdoc')
const swaggerUI = require('swagger-ui-express')

// Load env vars
dotenv.config({ path: './config/config.env' })

// Connect to database
connectDB()

// Route files
const companies = require('./routes/companies')
const appointments = require('./routes/appointments')
const auth = require('./routes/auth')
const oauth = require('./routes/oauth')
const users = require('./routes/users')

const app = express()

// Body parser
app.use(express.json())

app.use(cors());

// Cookie parser
app.use(cookieParser())

// Set security headers
app.use(helmet())

// Sanitize data
app.use(mongoSanitize())

// Prevent XSS attacks
app.use(xss())

const limiter = rateLimit({
    windowsMs: 10*60*1000, // 10 mins
    max: 100
})
app.use(limiter)

// Prevent http param pollution
app.use(hpp())

app.use('/api/v1/companies', companies)
app.use('/api/v1/appointments', appointments)
app.use('/api/v1/auth', auth)
app.use('/oauth', oauth)
app.use('/api/v1/users', users)

const PORT = process.env.PORT || 5000

const server = app.listen(PORT, console.log('Server running in ', process.env.NODE_ENV, ' mode on port ', PORT))

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`)
    // Close server & exit process
    server.close(() => process.exit(1))
})

const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'Library API',
            version: '1.0.0',
            description: 'A simple Express VacQ API'
        },
        servers: [
            {
                url: 'http://localhost:5000/api/v1'
            }
        ]
    },
    apis: ['./routes/*.js']
}

const swaggerDocs = swaggerJsDoc(swaggerOptions)
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocs))