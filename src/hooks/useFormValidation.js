import { useState, useEffect } from 'react'

// Custom hook for real-time form validation
export const useFormValidation = (initialState, validationRules) => {
  const [values, setValues] = useState(initialState)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [isValid, setIsValid] = useState(false)

  const validateField = (name, value) => {
    const rules = validationRules[name]
    if (!rules) return ''

    for (const rule of rules) {
      const error = rule(value, values)
      if (error) return error
    }
    return ''
  }

  const validateForm = () => {
    const newErrors = {}
    let formIsValid = true

    Object.keys(validationRules).forEach(name => {
      const error = validateField(name, values[name])
      if (error) {
        newErrors[name] = error
        formIsValid = false
      }
    })

    setErrors(newErrors)
    setIsValid(formIsValid)
    return formIsValid
  }

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target
    const newValue = type === 'checkbox' ? checked : type === 'file' ? files[0] : value

    setValues(prev => ({
      ...prev,
      [name]: newValue
    }))

    // Validate field on change if it has been touched
    if (touched[name]) {
      const error = validateField(name, newValue)
      setErrors(prev => ({
        ...prev,
        [name]: error
      }))
    }
  }

  const handleBlur = (e) => {
    const { name } = e.target
    setTouched(prev => ({
      ...prev,
      [name]: true
    }))

    const error = validateField(name, values[name])
    setErrors(prev => ({
      ...prev,
      [name]: error
    }))
  }

  const handleFocus = (e) => {
    const { name } = e.target
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const reset = () => {
    setValues(initialState)
    setErrors({})
    setTouched({})
    setIsValid(false)
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (Object.keys(touched).length > 0) {
        validateForm()
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [values, touched])

  return {
    values,
    errors,
    touched,
    isValid,
    handleChange,
    handleBlur,
    handleFocus,
    validateForm,
    reset,
    setValues
  }
}

// Common validation rules
export const validationRules = {
  required: (value) => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return 'This field is required'
    }
    return ''
  },

  email: (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (value && !emailRegex.test(value)) {
      return 'Please enter a valid email address'
    }
    return ''
  },

  password: (value) => {
    if (value && value.length < 6) {
      return 'Password must be at least 6 characters long'
    }
    if (value && !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
      return 'Password must contain uppercase, lowercase, and number'
    }
    return ''
  },

  confirmPassword: (value, allValues) => {
    if (value && value !== allValues.password) {
      return 'Passwords do not match'
    }
    return ''
  },

  phone: (value) => {
    const phoneRegex = /^09\d{9}$/
    if (value && !phoneRegex.test(value)) {
      return 'Please enter a valid Philippine mobile number (09XXXXXXXXX)'
    }
    return ''
  },

  minLength: (min) => (value) => {
    if (value && value.length < min) {
      return `Must be at least ${min} characters long`
    }
    return ''
  },

  maxLength: (max) => (value) => {
    if (value && value.length > max) {
      return `Must be no more than ${max} characters long`
    }
    return ''
  },

  file: (value) => {
    if (value && value.size > 5 * 1024 * 1024) { // 5MB limit
      return 'File size must be less than 5MB'
    }
    if (value && !value.type.startsWith('image/')) {
      return 'Please upload an image file'
    }
    return ''
  }
}
