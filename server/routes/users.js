const router = require(`express`).Router()
const createError = require('http-errors')
const usersModel = require(`../models/users`)
const bcrypt = require('bcryptjs')  // Password hashing/checking for stored credentials.
const fs = require('fs')
const path = require('path')
const jwt = require('jsonwebtoken')
const JWT_PRIVATE_KEY = fs.readFileSync(process.env.JWT_PRIVATE_KEY_FILENAME, 'utf8')

const multer = require('multer')
const uploadedFilesFolderPath = path.resolve(__dirname, `..`, process.env.UPLOADED_FILES_FOLDER)
const getUploadedFilePath = (filename) => path.join(uploadedFilesFolderPath, filename)
const upload = multer({dest: uploadedFilesFolderPath})

const emptyFolder = require('empty-folder')

// Validates phone format used by profile endpoints (7-15 digits).
const isPhoneValid = (phone) => /^\d{7,15}$/.test(String(phone || ``).trim())

// Reads stored profile photo file and returns base64 payload, or null when unavailable.
const readProfilePhotoAsBase64 = (photoFilename) =>
    new Promise((resolve) => {
        if (!photoFilename) {
            return resolve(null)
        }

        fs.readFile(getUploadedFilePath(photoFilename), "base64", (readErr, fileData) => {
            if (readErr || !fileData) {
                return resolve(null)
            }

            resolve(fileData)
        })
    })

// Sends a consistent profile payload to the client, including base64 photo when available.
const sendProfileResponse = (user, res) => {
     // Shared profile fields returned by both GET/PUT profile endpoints.
    const basePayload = {
        name: user.name,
        email: user.email,
        phone: user.phone || ``,
        address: user.address || ``,
        accessLevel: user.accessLevel
    }

    readProfilePhotoAsBase64(user.profilePhotoFilename)
        .then((profilePhoto) => res.json({...basePayload, profilePhoto}))
        .catch(() => res.json({...basePayload, profilePhoto: null}))
}


// Development-only endpoint: clears users and recreates a known admin account.
router.post(`/users/reset_user_collection`, (req, res, next) => {
    // Remove all users first to guarantee deterministic reset behavior.
    usersModel.deleteMany({})
        .then(() => {
            const adminPassword = `123-qwe_QWE`

            // Hash admin password before storing it in DB.
            bcrypt.hash(adminPassword, parseInt(process.env.PASSWORD_HASH_SALT_ROUNDS), (error, hash) => {
                if (error) {
                    return next(error)
                }
                // Recreate baseline administrator account with admin access level.
                usersModel.create({
                    name: "Administrator",
                    email: "admin@admin.com",
                    password: hash,
                    accessLevel: parseInt(process.env.ACCESS_LEVEL_ADMIN)
                })
                    .then(createData => 
                        {
                            emptyFolder(uploadedFilesFolderPath, false, result => res.json(createData))
                        })                     
                    .catch(() => next(createError(500, `Failed to create Admin user for testing purposes`)))
            })
        })
        .catch(err => next(err))
})

// Registers a customer account if email is not already present.
router.post(`/users/register/:name/:email/:password`, upload.single("profilePhoto"), (req, res, next) => {
    if (!req.file) 
        {
    return next(createError(601, `No file was selected to be uploaded`))
        }
    else if (req.file.mimetype !== "image/png" && req.file.mimetype !== "image/jpg" && req.file.mimetype !== "image/jpeg") 
        {
        return fs.unlink(getUploadedFilePath(req.file.filename), () => {
        res.json({errorMessage: `Only .png, .jpg and .jpeg format accepted`})
        })
        }
    else // uploaded file is valid
{
    // Enforce unique email identity at application level.
    usersModel.findOne({email: req.params.email})
        .then(uniqueData => {
            if (uniqueData) {
                return next(createError(403, `User already exists`))
            } else {
                // Store only hashed passwords; never persist plaintext credentials.
                bcrypt.hash(req.params.password, parseInt(process.env.PASSWORD_HASH_SALT_ROUNDS), (error, hash) => {
                    if (error) {
                        return next(error)
                    }

                    // New users are created with customer access level by default.
                    usersModel.create({
                        name: req.params.name,
                        email: req.params.email,
                        password: hash,
                        accessLevel: parseInt(process.env.ACCESS_LEVEL_CUSTOMER),
                        profilePhotoFilename: req.file.filename

                    })
                        .then(data => {
                            // Issue JWT immediately after successful registration.
                            const token = jwt.sign({
                                email: data.email,
                                accessLevel: data.accessLevel}, 
                                JWT_PRIVATE_KEY, {algorithm: 'HS256', expiresIn: process.env.JWT_EXPIRY})

                            fs.readFile(getUploadedFilePath(req.file.filename), 'base64', (readErr, fileData) =>
                            {
                                if (readErr) {
                                    return next(readErr)
                                }

                            res.json({name: data.name, accessLevel: data.accessLevel, profilePhoto: fileData, token: token})
                        })
                    })
                    .catch(() => next(createError(409, `User was not registered`)))
                })
            }
        })
        .catch(err => next(err))
    }
})

// Authenticates existing user and returns JWT on successful password check.
router.post(`/users/login/:email/:password`, (req, res, next) => {
    usersModel.findOne({email: req.params.email})
        .then((data) => {
            if (!data) {
                return res.json({errorMessage: `User is not logged in`})
            }

            bcrypt.compare(req.params.password, data.password, (err, result) => {
                if (err) {
                    return next(err)
                }

                if (!result) {
                    return res.json({errorMessage: `User is not logged in`})
                }

                const token = jwt.sign(
                    {email: data.email, accessLevel: data.accessLevel},
                    JWT_PRIVATE_KEY,
                    {algorithm: "HS256", expiresIn: process.env.JWT_EXPIRY}
                )

                fs.readFile(
                    getUploadedFilePath(data.profilePhotoFilename),
                    "base64",
                    (readErr, fileData) => {
                        if (readErr || !fileData) {
                            return res.json({
                                name: data.name,
                                accessLevel: data.accessLevel,
                                profilePhoto: null,
                                token: token
                            })
                        }

                        res.json({
                            name: data.name,
                            accessLevel: data.accessLevel,
                            profilePhoto: fileData,
                            token: token
                        })
                    }
                )
            })
        })
        .catch((err) => next(err))
})

// Returns the currently logged-in user's profile data.
router.get(`/users/profile`, (req, res, next) => {
    // Verify JWT from request header before allowing profile access.
    jwt.verify(req.headers.authorization, JWT_PRIVATE_KEY, {algorithms: ["HS256"]}, (err, decodedToken) => {
        if (err) {
            return next(createError(403, `User is not logged in`))
        }

         // Use email from decoded token to fetch the exact user profile.
        usersModel.findOne({email: decodedToken.email})
            .then((data) => {
                // Token is valid but user record no longer exists.
                if (!data) {
                    return next(createError(404, `User profile not found`))
                }
                // Reuse shared profile response helper (with base64 photo if available).
                sendProfileResponse(data, res)
            })
            // Forward DB errors to centralized error handler middleware.
            .catch((findErr) => next(findErr))
    })
})

// Updates logged-in user's profile data and optionally replaces profile photo.
router.put(`/users/profile`, upload.single("profilePhoto"), (req, res, next) => {
    // Updates logged-in user's profile data and optionally replaces profile photo.
    jwt.verify(req.headers.authorization, JWT_PRIVATE_KEY, {algorithms: ["HS256"]}, (err, decodedToken) => {
        if (err) {
            return next(createError(403, `User is not logged in`))
        }

        // Resolve current user from token identity.
        usersModel.findOne({email: decodedToken.email})
            .then((data) => {
                if (!data) {
                    return next(createError(404, `User profile not found`))
                }

                // Normalize incoming text fields before validation/storage.
                const name = String(req.body.name || ``).trim()
                const phone = String(req.body.phone || ``).trim()
                const address = String(req.body.address || ``).trim()

                // Profile validation rules for professional error handling UI.
                if (!name) return next(createError(400, `Name is required`))
                if (phone && !isPhoneValid(phone)) return next(createError(400, `Phone must be 7-15 digits`))
                if (!address) return next(createError(400, `Address is required`))

                // Prepare DB update object with text fields.
                const updates = {name, phone, address}

                // Handle optional new profile image upload.
                if (req.file) {
                    // Only allow supported image MIME types.
                    if (req.file.mimetype !== "image/png" && req.file.mimetype !== "image/jpg" && req.file.mimetype !== "image/jpeg") {
                        // Remove invalid uploaded file and return validation error.
                        return fs.unlink(getUploadedFilePath(req.file.filename), () => {
                            next(createError(400, `Only .png, .jpg and .jpeg format accepted`))
                        })
                    }
                    
                    // Remove previous profile photo file to avoid orphan files.
                    if (data.profilePhotoFilename) {
                        fs.unlink(getUploadedFilePath(data.profilePhotoFilename), () => {})
                    }
                    // Save new random uploaded filename in user record.
                    updates.profilePhotoFilename = req.file.filename
                }

                // Persist profile updates and return fresh profile payload to client.
                usersModel.findByIdAndUpdate(data._id, {$set: updates}, {new: true})
                    .then((updatedUser) => sendProfileResponse(updatedUser, res))
                    .catch((updateErr) => next(updateErr))
            })
            .catch((findErr) => next(findErr))
    })
})

// Returns all customers for admin UI, including base64 profile photos when available.
router.get(`/users`, (req, res, next) => {
    jwt.verify(req.headers.authorization, JWT_PRIVATE_KEY, {algorithms: ["HS256"]}, (err, decodedToken) => {
        if (err) {
            return next(createError(403, `User is not logged in`))
        }

        if (decodedToken.accessLevel < process.env.ACCESS_LEVEL_ADMIN) {
            return next(createError(403, `User is not an administrator, so they cannot view customer records`))
        }

        usersModel.find({accessLevel: Number(process.env.ACCESS_LEVEL_CUSTOMER)})
            .sort({_id: 1})
            .then(async (users) => {
                const payload = await Promise.all(users.map(async (user) => ({
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone || ``,
                    address: user.address || ``,
                    accessLevel: user.accessLevel,
                    profilePhoto: await readProfilePhotoAsBase64(user.profilePhotoFilename)
                })))

                res.json(payload)
            })
            .catch((findErr) => next(findErr))
    })
})

// Stateless logout endpoint: client is expected to discard its JWT token.
router.post(`/users/logout`, (req, res) => {
    res.json({})
})

module.exports = router
