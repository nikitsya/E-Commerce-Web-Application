const MAX_EMAIL_LENGTH = 254
const MAX_LOCAL_PART_LENGTH = 64
const MAX_DOMAIN_LENGTH = 253
const MAX_DOMAIN_LABEL_LENGTH = 63

const LOCAL_PART_PATTERN = /^[a-z0-9!#$%&'*+/=?^_`{|}~.-]+$/i
const DOMAIN_LABEL_PATTERN = /^[a-z0-9-]+$/i
const ALPHA_TLD_PATTERN = /^[a-z]{2,63}$/i
const PUNYCODE_TLD_PATTERN = /^xn--[a-z0-9-]{2,59}$/i

const normalizeEmail = (email) => String(email || ``).trim().toLowerCase()

const getEmailValidationError = (email, fieldLabel = `Email`) => {
    const normalizedEmail = normalizeEmail(email)

    if (!normalizedEmail) return `${fieldLabel} is required`
    if (normalizedEmail.length > MAX_EMAIL_LENGTH) return `${fieldLabel} must be at most ${MAX_EMAIL_LENGTH} characters`
    if (/\s/.test(normalizedEmail)) return `${fieldLabel} must not contain whitespace`
    if (/[^\x21-\x7E]/.test(normalizedEmail)) return `${fieldLabel} contains unsupported characters`

    const atIndex = normalizedEmail.indexOf(`@`)
    const lastAtIndex = normalizedEmail.lastIndexOf(`@`)
    if (atIndex <= 0 || atIndex !== lastAtIndex || atIndex === normalizedEmail.length - 1) {
        return `${fieldLabel} must contain exactly one @ between local and domain parts`
    }

    const localPart = normalizedEmail.slice(0, atIndex)
    const domainPart = normalizedEmail.slice(atIndex + 1)

    if (localPart.length > MAX_LOCAL_PART_LENGTH) {
        return `${fieldLabel} local part must be at most ${MAX_LOCAL_PART_LENGTH} characters`
    }
    if (!LOCAL_PART_PATTERN.test(localPart)) return `${fieldLabel} local part contains invalid characters`
    if (localPart.startsWith(`.`) || localPart.endsWith(`.`) || localPart.includes(`..`)) {
        return `${fieldLabel} local part has an invalid dot placement`
    }

    if (domainPart.length > MAX_DOMAIN_LENGTH) return `${fieldLabel} domain must be at most ${MAX_DOMAIN_LENGTH} characters`
    if (domainPart.includes(`..`) || !domainPart.includes(`.`)) {
        return `${fieldLabel} domain must contain valid labels separated by dots`
    }

    const domainLabels = domainPart.split(`.`)
    if (domainLabels.some((label) => !label)) return `${fieldLabel} domain must not contain empty labels`

    for (const label of domainLabels) {
        if (label.length > MAX_DOMAIN_LABEL_LENGTH) {
            return `${fieldLabel} domain label must be at most ${MAX_DOMAIN_LABEL_LENGTH} characters`
        }
        if (!DOMAIN_LABEL_PATTERN.test(label)) return `${fieldLabel} domain label contains invalid characters`
        if (label.startsWith(`-`) || label.endsWith(`-`)) {
            return `${fieldLabel} domain label must not start or end with hyphen`
        }
    }

    const topLevelDomain = domainLabels[domainLabels.length - 1]
    if (!ALPHA_TLD_PATTERN.test(topLevelDomain) && !PUNYCODE_TLD_PATTERN.test(topLevelDomain)) {
        return `${fieldLabel} top-level domain is invalid`
    }

    return null
}

const buildEmailField = ({fieldLabel = `Email`, unique = false} = {}) => {
    const fieldConfig = {
        type: String,
        required: [true, `${fieldLabel} is required`],
        trim: true,
        maxlength: [MAX_EMAIL_LENGTH, `${fieldLabel} must be at most ${MAX_EMAIL_LENGTH} characters`],
        set: normalizeEmail,
        validate: {
            validator: (value) => !getEmailValidationError(value, fieldLabel),
            message: (props) => getEmailValidationError(props.value, fieldLabel) || `${fieldLabel} format is invalid`
        }
    }

    if (unique) {
        fieldConfig.unique = true
        fieldConfig.index = true
    }

    return fieldConfig
}

module.exports = {
    buildEmailField,
    getEmailValidationError,
    normalizeEmail,
    limits: {
        MAX_EMAIL_LENGTH,
        MAX_LOCAL_PART_LENGTH,
        MAX_DOMAIN_LENGTH,
        MAX_DOMAIN_LABEL_LENGTH
    }
}
