const Joi = require('joi');

// Generic validation middleware
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        code: 400,
        message: 'Validation failed',
        data: { errors }
      });
    }

    req[property] = value;
    next();
  };
};

// Validation schemas
const schemas = {
  // Login validation
  login: Joi.object({
    eventCode: Joi.string().required().min(3).max(32).messages({
      'string.empty': 'Event code is required',
      'string.min': 'Event code must be at least 3 characters',
      'string.max': 'Event code must be at most 32 characters'
    }),
    empNo: Joi.string().required().min(3).max(32).messages({
      'string.empty': 'Employee number is required',
      'string.min': 'Employee number must be at least 3 characters',
      'string.max': 'Employee number must be at most 32 characters'
    })
  }),

  // Vote submission validation
  vote: Joi.object({
    programId: Joi.number().integer().positive().required().messages({
      'number.base': 'Program ID must be a number',
      'number.integer': 'Program ID must be an integer',
      'number.positive': 'Program ID must be positive',
      'any.required': 'Program ID is required'
    }),
    scores: Joi.object({
      stagePresence: Joi.number().integer().min(1).max(5).required().messages({
        'number.base': 'Stage presence score must be a number',
        'number.integer': 'Stage presence score must be an integer',
        'number.min': 'Stage presence score must be between 1 and 5',
        'number.max': 'Stage presence score must be between 1 and 5',
        'any.required': 'Stage presence score is required'
      }),
      performance: Joi.number().integer().min(1).max(5).required().messages({
        'number.base': 'Performance score must be a number',
        'number.integer': 'Performance score must be an integer',
        'number.min': 'Performance score must be between 1 and 5',
        'number.max': 'Performance score must be between 1 and 5',
        'any.required': 'Performance score is required'
      }),
      popularity: Joi.number().integer().min(1).max(5).required().messages({
        'number.base': 'Popularity score must be a number',
        'number.integer': 'Popularity score must be an integer',
        'number.min': 'Popularity score must be between 1 and 5',
        'number.max': 'Popularity score must be between 1 and 5',
        'any.required': 'Popularity score is required'
      }),
      teamwork: Joi.number().integer().min(1).max(5).required().messages({
        'number.base': 'Teamwork score must be a number',
        'number.integer': 'Teamwork score must be an integer',
        'number.min': 'Teamwork score must be between 1 and 5',
        'number.max': 'Teamwork score must be between 1 and 5',
        'any.required': 'Teamwork score is required'
      }),
      creativity: Joi.number().integer().min(1).max(5).required().messages({
        'number.base': 'Creativity score must be a number',
        'number.integer': 'Creativity score must be an integer',
        'number.min': 'Creativity score must be between 1 and 5',
        'number.max': 'Creativity score must be between 1 and 5',
        'any.required': 'Creativity score is required'
      })
    }).required().messages({
      'any.required': 'Scores object is required'
    })
  }),

  // Employee creation validation
  employee: Joi.object({
    empNo: Joi.string().required().min(3).max(32).messages({
      'string.empty': 'Employee number is required',
      'string.min': 'Employee number must be at least 3 characters',
      'string.max': 'Employee number must be at most 32 characters'
    }),
    name: Joi.string().required().min(2).max(64).messages({
      'string.empty': 'Name is required',
      'string.min': 'Name must be at least 2 characters',
      'string.max': 'Name must be at most 64 characters'
    }),
    department: Joi.string().allow('', null).max(64).messages({
      'string.max': 'Department must be at most 64 characters'
    }),
    mobile: Joi.string().allow('', null).pattern(/^[1-9]\d{10}$/).messages({
      'string.pattern.base': 'Mobile number must be a valid 11-digit Chinese mobile number'
    })
  }),

  // Program creation validation
  program: Joi.object({
    eventId: Joi.number().integer().positive().required().messages({
      'number.base': 'Event ID must be a number',
      'number.integer': 'Event ID must be an integer',
      'number.positive': 'Event ID must be positive',
      'any.required': 'Event ID is required'
    }),
    seqNo: Joi.number().integer().positive().required().messages({
      'number.base': 'Sequence number must be a number',
      'number.integer': 'Sequence number must be an integer',
      'number.positive': 'Sequence number must be positive',
      'any.required': 'Sequence number is required'
    }),
    title: Joi.string().required().min(2).max(128).messages({
      'string.empty': 'Program title is required',
      'string.min': 'Program title must be at least 2 characters',
      'string.max': 'Program title must be at most 128 characters'
    }),
    performer: Joi.string().required().min(2).max(256).messages({
      'string.empty': 'Performer is required',
      'string.min': 'Performer must be at least 2 characters',
      'string.max': 'Performer must be at most 256 characters'
    }),
    description: Joi.string().allow('', null).max(1000).messages({
      'string.max': 'Description must be at most 1000 characters'
    }),
    durationMinutes: Joi.number().integer().min(1).max(60).default(5).messages({
      'number.base': 'Duration must be a number',
      'number.integer': 'Duration must be an integer',
      'number.min': 'Duration must be at least 1 minute',
      'number.max': 'Duration must be at most 60 minutes'
    })
  }),

  // Event creation validation
  event: Joi.object({
    code: Joi.string().required().min(3).max(32).pattern(/^[A-Z0-9]+$/).messages({
      'string.empty': 'Event code is required',
      'string.min': 'Event code must be at least 3 characters',
      'string.max': 'Event code must be at most 32 characters',
      'string.pattern.base': 'Event code must contain only uppercase letters and numbers'
    }),
    name: Joi.string().required().min(2).max(128).messages({
      'string.empty': 'Event name is required',
      'string.min': 'Event name must be at least 2 characters',
      'string.max': 'Event name must be at most 128 characters'
    }),
    mode: Joi.number().integer().valid(1, 2).default(1).messages({
      'number.base': 'Mode must be a number',
      'any.only': 'Mode must be 1 (per program) or 2 (unified)'
    }),
    windowMinutes: Joi.number().integer().min(1).max(60).default(5).messages({
      'number.base': 'Window minutes must be a number',
      'number.integer': 'Window minutes must be an integer',
      'number.min': 'Window minutes must be at least 1',
      'number.max': 'Window minutes must be at most 60'
    }),
    weights: Joi.object({
      stage_presence: Joi.number().min(0).max(1).required(),
      performance: Joi.number().min(0).max(1).required(),
      popularity: Joi.number().min(0).max(1).required(),
      teamwork: Joi.number().min(0).max(1).required(),
      creativity: Joi.number().min(0).max(1).required()
    }).required().custom((value, helpers) => {
      const sum = Object.values(value).reduce((a, b) => a + b, 0);
      if (Math.abs(sum - 1) > 0.01) {
        return helpers.error('custom.weightsSum');
      }
      return value;
    }).messages({
      'custom.weightsSum': 'Weights must sum to 1.0'
    })
  }),

  // Query parameter validation
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1).messages({
      'number.base': 'Page must be a number',
      'number.integer': 'Page must be an integer',
      'number.min': 'Page must be at least 1'
    }),
    limit: Joi.number().integer().min(1).max(100).default(20).messages({
      'number.base': 'Limit must be a number',
      'number.integer': 'Limit must be an integer',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit must be at most 100'
    })
  }),

  // Voting window control validation
  voteWindow: Joi.object({
    action: Joi.string().valid('open', 'close').required().messages({
      'any.only': 'Action must be either "open" or "close"',
      'any.required': 'Action is required'
    }),
    duration: Joi.number().integer().min(60).max(3600).when('action', {
      is: 'open',
      then: Joi.required(),
      otherwise: Joi.optional()
    }).messages({
      'number.base': 'Duration must be a number',
      'number.integer': 'Duration must be an integer',
      'number.min': 'Duration must be at least 60 seconds',
      'number.max': 'Duration must be at most 3600 seconds (1 hour)',
      'any.required': 'Duration is required when opening vote window'
    })
  })
};

// Specific validation middleware functions
const validateLogin = validate(schemas.login);
const validateVote = validate(schemas.vote);
const validateEmployee = validate(schemas.employee);
const validateProgram = validate(schemas.program);
const validateEvent = validate(schemas.event);
const validatePagination = validate(schemas.pagination, 'query');
const validateVoteWindow = validate(schemas.voteWindow);

// Custom validation for ID parameters
const validateId = (paramName = 'id') => {
  return validate(Joi.object({
    [paramName]: Joi.number().integer().positive().required()
  }), 'params');
};

module.exports = {
  validate,
  schemas,
  validateLogin,
  validateVote,
  validateEmployee,
  validateProgram,
  validateEvent,
  validatePagination,
  validateVoteWindow,
  validateId
};