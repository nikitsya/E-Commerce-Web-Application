const MAX_SAFE_TEXT_LENGTH = 5000
const CONTROL_CHARACTERS_PATTERN = /[\x00-\x1F\x7F]/
const PHONE_PATTERN = /^\d{7,15}$/
const IMAGE_PATH_PATTERN = /^\/?[a-z0-9/_\-.]+$/i
const SIMPLE_FILENAME_PATTERN = /^[a-z0-9._-]{1,128}$/i
const ORDER_ID_PATTERN = /^[a-z0-9-]{6,64}$/i
const OBJECT_ID_STRING_PATTERN = /^[a-f0-9]{24}$/i
const BCRYPT_HASH_PATTERN = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/

const normalizeText = (value) => String(value || ``).trim()

const getTextValidationError = (value, {
    fieldLabel = `Field`,
    required = false,
    minLength = 1,
    maxLength = 255,
    allowEmpty = true
} = {}) => {
    const normalized = normalizeText(value)

    if (maxLength < 1 || maxLength > MAX_SAFE_TEXT_LENGTH) {
        return `${fieldLabel} max length configuration is invalid`
    }

    if (!normalized) {
        if (required || !allowEmpty) return `${fieldLabel} is required`
        return null
    }

    if (normalized.length < minLength) return `${fieldLabel} must be at least ${minLength} characters`
    if (normalized.length > maxLength) return `${fieldLabel} must be at most ${maxLength} characters`
    if (CONTROL_CHARACTERS_PATTERN.test(normalized)) return `${fieldLabel} contains unsupported characters`

    return null
}

const buildTextField = ({
                            fieldLabel = `Field`,
                            required = false,
                            minLength = 1,
                            maxLength = 255,
                            defaultValue = ``,
                            allowEmpty = true
                        } = {}) => {
    const config = {
        type: String,
        trim: true,
        set: normalizeText,
        maxlength: [maxLength, `${fieldLabel} must be at most ${maxLength} characters`],
        validate: {
            validator: (value) => !getTextValidationError(value, {
                fieldLabel,
                required,
                minLength,
                maxLength,
                allowEmpty
            }),
            message: (props) => getTextValidationError(props.value, {
                fieldLabel,
                required,
                minLength,
                maxLength,
                allowEmpty
            }) || `${fieldLabel} format is invalid`
        }
    }

    if (required) {
        config.required = [true, `${fieldLabel} is required`]
    } else {
        config.default = defaultValue
    }

    return config
}

const getPhoneValidationError = (value, fieldLabel = `Phone`) => {
    const normalized = normalizeText(value)
    if (!normalized) return null
    if (!PHONE_PATTERN.test(normalized)) return `${fieldLabel} must contain 7-15 digits`
    return null
}

const buildPhoneField = ({fieldLabel = `Phone`, required = false} = {}) => ({
    type: String,
    trim: true,
    default: required ? undefined : ``,
    set: normalizeText,
    validate: {
        validator: (value) => {
            const normalized = normalizeText(value)
            if (!normalized) return !required
            return !getPhoneValidationError(normalized, fieldLabel)
        },
        message: (props) => {
            const normalized = normalizeText(props.value)
            if (!normalized && required) return `${fieldLabel} is required`
            return getPhoneValidationError(normalized, fieldLabel) || `${fieldLabel} format is invalid`
        }
    },
    ...(required ? {required: [true, `${fieldLabel} is required`]} : {})
})

const buildIntegerField = ({
                               fieldLabel = `Value`,
                               required = true,
                               min = 0,
                               max = Number.MAX_SAFE_INTEGER,
                               defaultValue
                           } = {}) => {
    const config = {
        type: Number,
        min: [min, `${fieldLabel} must be at least ${min}`],
        max: [max, `${fieldLabel} must be at most ${max}`],
        validate: {
            validator: (value) => {
                if (value === null || value === undefined) return !required
                return Number.isInteger(value) && Number.isFinite(value)
            },
            message: `${fieldLabel} must be an integer`
        }
    }

    if (required) {
        config.required = [true, `${fieldLabel} is required`]
    }

    if (defaultValue !== undefined) {
        config.default = defaultValue
    }

    return config
}

const buildNumberField = ({
                              fieldLabel = `Value`,
                              required = true,
                              min = 0,
                              max = Number.MAX_SAFE_INTEGER,
                              defaultValue
                          } = {}) => {
    const config = {
        type: Number,
        min: [min, `${fieldLabel} must be at least ${min}`],
        max: [max, `${fieldLabel} must be at most ${max}`],
        validate: {
            validator: (value) => {
                if (value === null || value === undefined) return !required
                return Number.isFinite(value)
            },
            message: `${fieldLabel} must be a valid number`
        }
    }

    if (required) {
        config.required = [true, `${fieldLabel} is required`]
    }

    if (defaultValue !== undefined) {
        config.default = defaultValue
    }

    return config
}

const buildOrderIdField = () => ({
    type: String,
    trim: true,
    required: [true, `Order ID is required`],
    set: normalizeText,
    validate: {
        validator: (value) => ORDER_ID_PATTERN.test(normalizeText(value)),
        message: `Order ID format is invalid`
    }
})

const buildObjectIdStringField = ({fieldLabel = `ID`} = {}) => ({
    type: String,
    required: [true, `${fieldLabel} is required`],
    trim: true,
    set: normalizeText,
    validate: {
        validator: (value) => OBJECT_ID_STRING_PATTERN.test(normalizeText(value)),
        message: `${fieldLabel} must be a valid 24-character ObjectId`
    }
})

const buildImagePathField = ({fieldLabel = `Image path`, required = false} = {}) => ({
    type: String,
    trim: true,
    set: normalizeText,
    default: required ? undefined : ``,
    validate: {
        validator: (value) => {
            const normalized = normalizeText(value)
            if (!normalized) return !required
            return IMAGE_PATH_PATTERN.test(normalized)
        },
        message: (props) => {
            const normalized = normalizeText(props.value)
            if (!normalized && required) return `${fieldLabel} is required`
            return `${fieldLabel} format is invalid`
        }
    },
    ...(required ? {required: [true, `${fieldLabel} is required`]} : {})
})

const buildSimpleFilenameField = ({fieldLabel = `Filename`, required = false} = {}) => ({
    type: String,
    trim: true,
    set: normalizeText,
    default: required ? undefined : ``,
    validate: {
        validator: (value) => {
            const normalized = normalizeText(value)
            if (!normalized) return !required
            return SIMPLE_FILENAME_PATTERN.test(normalized)
        },
        message: (props) => {
            const normalized = normalizeText(props.value)
            if (!normalized && required) return `${fieldLabel} is required`
            return `${fieldLabel} format is invalid`
        }
    },
    ...(required ? {required: [true, `${fieldLabel} is required`]} : {})
})

const buildBcryptHashField = ({fieldLabel = `Password hash`} = {}) => ({
    type: String,
    trim: true,
    required: [true, `${fieldLabel} is required`],
    set: normalizeText,
    validate: {
        validator: (value) => BCRYPT_HASH_PATTERN.test(normalizeText(value)),
        message: `${fieldLabel} format is invalid`
    }
})

module.exports = {
    normalizeText,
    getTextValidationError,
    getPhoneValidationError,
    buildTextField,
    buildPhoneField,
    buildIntegerField,
    buildNumberField,
    buildOrderIdField,
    buildObjectIdStringField,
    buildImagePathField,
    buildSimpleFilenameField,
    buildBcryptHashField
}
