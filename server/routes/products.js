const mongoose = require(`mongoose`)
const router = require(`express`).Router()
const createError = require('http-errors')
const productsModel = require(`../models/products`)
const fs = require('fs')
const path = require('path')
const multer = require('multer')
const jwt = require('jsonwebtoken')
const JWT_PRIVATE_KEY = fs.readFileSync(process.env.JWT_PRIVATE_KEY_FILENAME, 'utf8')

const uploadedProductImagesFolderPath = path.resolve(__dirname, `..`, process.env.UPLOADED_FILES_FOLDER, `products`)
const acceptedProductImageMimeTypes = new Set([`image/png`, `image/jpg`, `image/jpeg`, `image/webp`])
const MAX_PRODUCT_IMAGES = 8

fs.mkdirSync(uploadedProductImagesFolderPath, {recursive: true})

const buildUploadedProductImagePath = (filename) => `/uploads/products/${filename}`

// Accepts only image extensions that can be rendered directly in browser previews.
const buildSafeImageExtension = (originalName) => {
    const extension = String(path.extname(originalName || ``) || ``).toLowerCase()
    if ([`.png`, `.jpg`, `.jpeg`, `.webp`].includes(extension)) {
        return extension
    }
    return `.jpg`
}

const productImageStorage = multer.diskStorage({
    destination: (req, file, callback) => callback(null, uploadedProductImagesFolderPath),
    filename: (req, file, callback) => {
        const safeExtension = buildSafeImageExtension(file.originalname)
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExtension}`
        callback(null, uniqueName)
    }
})

const uploadProductImages = multer({
    storage: productImageStorage,
    limits: {files: MAX_PRODUCT_IMAGES, fileSize: 5 * 1024 * 1024}
})

const isUploadedProductImagePath = (value) => String(value || ``).startsWith(`/uploads/products/`)
const getUploadedProductFilePathFromImagePath = (imagePath) =>
    path.join(uploadedProductImagesFolderPath, path.basename(String(imagePath || ``)))

// Deletes uploaded files best-effort (missing files are ignored).
const removeUploadedFiles = (filePaths = []) =>
    Promise.all((Array.isArray(filePaths) ? filePaths : []).map((filePath) =>
        fs.promises.unlink(filePath).catch(() => null)
    ))

// Multer errors are normalized into clear 400 responses for product image uploads.
const normalizeUploadError = (err, req, res, next) => {
    if (!err) return next()
    if (err instanceof multer.MulterError) {
        if (err.code === `LIMIT_FILE_SIZE`) {
            return next(createError(400, `Each product image must be 5MB or less`))
        }
        if (err.code === `LIMIT_FILE_COUNT`) {
            return next(createError(400, `You can upload up to ${MAX_PRODUCT_IMAGES} product images`))
        }
        return next(createError(400, `Failed to upload product images`))
    }
    return next(err)
}

// Middleware: verifies JWT and exposes decoded token for next handlers.
const verifyUsersJWTPassword = (req, res, next) => {
    jwt.verify(req.headers.authorization, JWT_PRIVATE_KEY, {algorithms: ["HS256"]}, (err, decodedToken) => {
        if (err) {
            next(createError(403, `User is not logged in`))
        } else {
            req.decodedToken = decodedToken
            next()
        }
    })
}

// Middleware: allows only administrators to continue.
const checkThatUserIsAnAdministrator = (req, res, next) => {
    if (Number(req.decodedToken.accessLevel) >= Number(process.env.ACCESS_LEVEL_ADMIN)) {
        next()
    } else {
        next(createError(403, `User is not an administrator`))
    }
}

// Middleware: validates MongoDB ObjectId route parameter.
const validateProductIDParam = (req, res, next) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return next(createError(400, `Invalid product id`))
    }
    next()
}

// Public endpoint: returns all products sorted by insertion order.
router.get(`/products`, (req, res, next) => {
    productsModel.find().sort({_id: 1})
        .then((data) => {
            res.json(data)
        })
        .catch((err) => next(err))
})

// Route handler: returns one product document by ID after auth middleware passes.
const getProductDocument = (req, res, next) => {
    productsModel.findById(req.params.id)
        .then(data => {
            res.json(data)
        })
        .catch((err) => next(err))
}

router.get(`/products/:id`, validateProductIDParam, verifyUsersJWTPassword, getProductDocument)


// Route handler: creates a new product document.

const createNewProductDocument = (req, res, next) => {
    const uploadedFiles = Array.isArray(req.files) ? req.files : []

    const hasInvalidMimeType = uploadedFiles.some((file) => !acceptedProductImageMimeTypes.has(String(file.mimetype || ``).toLowerCase()))
    if (hasInvalidMimeType) {
        return removeUploadedFiles(uploadedFiles.map((file) => file.path))
            .then(() => next(createError(400, `Only .png, .jpg, .jpeg and .webp format accepted`)))
    }

    const createdProductPayload = {...req.body}
    if (uploadedFiles.length > 0) {
        createdProductPayload.images = uploadedFiles.map((file) => buildUploadedProductImagePath(file.filename))
    }

    productsModel.create(createdProductPayload)
        .then(data => {
            res.json(data)
        })
        .catch((err) => {
            removeUploadedFiles(uploadedFiles.map((file) => file.path))
                .finally(() => next(err))
        })
}

// Add new product (admin only).
router.post(
    `/products`,
    verifyUsersJWTPassword,
    checkThatUserIsAnAdministrator,
    (req, res, next) => uploadProductImages.array(`productImages`, MAX_PRODUCT_IMAGES)(req, res, (err) => normalizeUploadError(err, req, res, next)),
    createNewProductDocument
)


// Route handler: updates one product document by ID.

const updateProductDocument = (req, res, next) => {
    const uploadedFiles = Array.isArray(req.files) ? req.files : []

    const hasInvalidMimeType = uploadedFiles.some((file) => !acceptedProductImageMimeTypes.has(String(file.mimetype || ``).toLowerCase()))
    if (hasInvalidMimeType) {
        return removeUploadedFiles(uploadedFiles.map((file) => file.path))
            .then(() => next(createError(400, `Only .png, .jpg, .jpeg and .webp format accepted`)))
    }

    productsModel.findById(req.params.id)
        .then((existingProduct) => {
            if (!existingProduct) {
                return removeUploadedFiles(uploadedFiles.map((file) => file.path))
                    .then(() => next(createError(404, `Product not found`)))
            }

            const updates = {...req.body}
            if (uploadedFiles.length > 0) {
                updates.images = uploadedFiles.map((file) => buildUploadedProductImagePath(file.filename))
            }

            productsModel.findByIdAndUpdate(req.params.id, {$set: updates}, {new: true, runValidators: true})
                .then((updatedProduct) => {
                    if (uploadedFiles.length > 0) {
                        const oldUploadedImagePaths = (Array.isArray(existingProduct.images) ? existingProduct.images : [])
                            .map((imagePath) => String(imagePath || ``).trim())
                            .filter((imagePath) => imagePath && isUploadedProductImagePath(imagePath))
                            .map(getUploadedProductFilePathFromImagePath)

                        removeUploadedFiles(oldUploadedImagePaths).finally(() => res.json(updatedProduct))
                        return
                    }

                    res.json(updatedProduct)
                })
                .catch((updateErr) => {
                    removeUploadedFiles(uploadedFiles.map((file) => file.path))
                        .finally(() => next(updateErr))
                })
        })
        .catch((err) => {
            removeUploadedFiles(uploadedFiles.map((file) => file.path))
                .finally(() => next(err))
        })
}

// Update one product (admin only).
router.put(
    `/products/:id`,
    validateProductIDParam,
    verifyUsersJWTPassword,
    checkThatUserIsAnAdministrator,
    (req, res, next) => uploadProductImages.array(`productImages`, MAX_PRODUCT_IMAGES)(req, res, (err) => normalizeUploadError(err, req, res, next)),
    updateProductDocument
)

// Route handler: deletes one product document by ID.
const deleteProductDocument = (req, res, next) => {
    productsModel.findById(req.params.id)
        .then((existingProduct) => {
            if (!existingProduct) {
                return next(createError(404, `Product not found`))
            }

            productsModel.findByIdAndDelete(req.params.id)
                .then((data) => {
                    const uploadedImagePaths = (Array.isArray(existingProduct.images) ? existingProduct.images : [])
                        .map((imagePath) => String(imagePath || ``).trim())
                        .filter((imagePath) => imagePath && isUploadedProductImagePath(imagePath))
                        .map(getUploadedProductFilePathFromImagePath)

                    removeUploadedFiles(uploadedImagePaths).finally(() => res.json(data))
                })
                .catch((err) => next(err))
        })
        .catch((err) => next(err))
}

// Delete one product (admin only).
router.delete(`/products/:id`, validateProductIDParam, verifyUsersJWTPassword, checkThatUserIsAnAdministrator, deleteProductDocument)

module.exports = router
