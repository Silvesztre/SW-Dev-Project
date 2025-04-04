const express = require('express')
const {
    getCompanies,
    getCompany,
    createCompany,
    updateCompany,
    deleteCompany
} = require('../controllers/companies')

// Include other resource routers
const appointmentRouter = require('./appointments')

const router = express.Router()
const { protect, authorize } = require('../middleware/auth')

// Re-route into other resource routers
router.use('/:companyId/appointments/', appointmentRouter)

router.route('/').get(getCompanies).post(protect, authorize('admin'), createCompany)
router.route('/:id').get(getCompany).put(protect, authorize('admin'), updateCompany)
                    .delete(protect, authorize('admin'), deleteCompany)

module.exports = router

/**
* @swagger
* components:
*   schemas:
*     Company:
*       type: object
*       required:
*         - name
*         - address
*       properties:
*         id:
*           type: string
*           format: uuid
*           description: The auto-generated id of the company
*           example: d290f1ee-6c54-4b01-90e6-d701748f0851
*         ลําดับ:
*           type: string
*           description: Ordinal number
*         name:
*           type: string
*           description: Company name
*         address:
*           type: string
*           description: House No., Street, Road
*         district:
*           type: string
*           description: District
*         province:
*           type: string
*           description: province
*         postalcode:
*           type: string
*           description: 5-digit postal code
*         tel:
*           type: string
*           description: telephone number
*         region:
*           type: string,
*           description: region
*       example:
*         id: 67cbdf6f248e28b01425068b
*         ลำดับ: 3
*         name: กรุงไทย
*         address: 56/96 ม.5 ต.ปากเกร็ด
*         district: ปากเกร็ด
*         province: นนทบุรี
*         postalcode: 11120
*         tel: 02-5822299
*         region: ปริมณฑล ( Perimeter )
*/

/** 
* @swagger
* tags:
*   name: Companies
*   description: The companies managing API 
*/

/**
 * @swagger
 * /companies:
 *   get:
 *     summary: Returns the list of all the companies
 *     tags: [Companies]
 *     responses:
 *       200:
 *         description: The list of the companies
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Company'
 */

/**
 * @swagger
 * /companies/{id}:
 *   get:
 *     summary: Get the company by id
 *     tags:
 *       - Companies
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The company id
 *     responses:
 *       200:
 *         description: The company description by id
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Company'
 *       404:
 *         description: The company was not found
 */

/**
 * @swagger
 * /companies:
 *   post:
 *     summary: Create a new company
 *     tags:
 *       - Companies
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Company'
 *     responses:
 *       201:
 *         description: The company was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Company'
 *       500:
 *         description: Some server error
 */

/**
 * @swagger
 * /companies/{id}:
 *   put:
 *     summary: Update the company by id
 *     tags:
 *       - Companies
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The company id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Company'
 *     responses:
 *       200:
 *         description: The company was updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Company'
 *       404:
 *         description: The company was not found
 *       500:
 *         description: Some error happened
 */

/**
 * @swagger
 * /companies/{id}:
 *   delete:
 *     summary: Remove the company by id
 *     tags:
 *       - Companies
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The company id
 *     responses:
 *       200:
 *         description: The company was deleted
 *       404:
 *         description: The company was not found
 */