import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.details.map(detail => detail.message)
      });
      return;
    }
    
    next();
  };
};

// Validation schemas
export const userValidation = {
  create: Joi.object({
    email: Joi.string().email().required(),
    full_name: Joi.string().min(2).max(100).required(),
    role: Joi.string().valid('admin', 'manager', 'driver', 'user').required(),
    password: Joi.string().min(6).required()
  }),
  
  update: Joi.object({
    email: Joi.string().email(),
    full_name: Joi.string().min(2).max(100),
    role: Joi.string().valid('admin', 'manager', 'driver', 'user'),
    password: Joi.string().min(6)
  }),
  
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  })
};

export const vehicleValidation = {
  create: Joi.object({
    license_plate: Joi.string().min(2).max(20).required(),
    make: Joi.string().min(2).max(100).required(),
    model: Joi.string().min(2).max(100).required(),
    year: Joi.number().integer().min(1900).max(new Date().getFullYear() + 1).required(),
    capacity: Joi.number().integer().min(1).required(),
    status: Joi.string().valid('available', 'in_use', 'maintenance', 'out_of_service'),
    current_location: Joi.object({
      lat: Joi.number().min(-90).max(90).required(),
      lng: Joi.number().min(-180).max(180).required()
    })
  }),
  
  update: Joi.object({
    license_plate: Joi.string().min(2).max(20),
    make: Joi.string().min(2).max(100),
    model: Joi.string().min(2).max(100),
    year: Joi.number().integer().min(1900).max(new Date().getFullYear() + 1),
    capacity: Joi.number().integer().min(1),
    status: Joi.string().valid('available', 'in_use', 'maintenance', 'out_of_service'),
    current_location: Joi.object({
      lat: Joi.number().min(-90).max(90).required(),
      lng: Joi.number().min(-180).max(180).required()
    }),
    assigned_driver_id: Joi.string().uuid()
  })
};

export const driverValidation = {
  create: Joi.object({
    user_id: Joi.string().uuid().required(),
    license_number: Joi.string().min(5).max(50).required(),
    license_expiry: Joi.date().greater('now').required(),
    phone_number: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).required(),
    status: Joi.string().valid('available', 'on_trip', 'off_duty'),
    current_location: Joi.object({
      lat: Joi.number().min(-90).max(90).required(),
      lng: Joi.number().min(-180).max(180).required()
    })
  }),
  
  update: Joi.object({
    license_number: Joi.string().min(5).max(50),
    license_expiry: Joi.date().greater('now'),
    phone_number: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/),
    status: Joi.string().valid('available', 'on_trip', 'off_duty'),
    current_location: Joi.object({
      lat: Joi.number().min(-90).max(90).required(),
      lng: Joi.number().min(-180).max(180).required()
    })
  })
};

export const tripValidation = {
  create: Joi.object({
    vehicle_id: Joi.string().uuid().required(),
    driver_id: Joi.string().uuid().required(),
    start_location: Joi.object({
      lat: Joi.number().min(-90).max(90).required(),
      lng: Joi.number().min(-180).max(180).required(),
      address: Joi.string().min(5).max(500).required()
    }).required(),
    end_location: Joi.object({
      lat: Joi.number().min(-90).max(90).required(),
      lng: Joi.number().min(-180).max(180).required(),
      address: Joi.string().min(5).max(500).required()
    }).required(),
    start_time: Joi.date().greater('now').required(),
    status: Joi.string().valid('scheduled', 'in_progress', 'completed', 'cancelled')
  }),
  
  update: Joi.object({
    vehicle_id: Joi.string().uuid(),
    driver_id: Joi.string().uuid(),
    start_location: Joi.object({
      lat: Joi.number().min(-90).max(90).required(),
      lng: Joi.number().min(-180).max(180).required(),
      address: Joi.string().min(5).max(500).required()
    }),
    end_location: Joi.object({
      lat: Joi.number().min(-90).max(90).required(),
      lng: Joi.number().min(-180).max(180).required(),
      address: Joi.string().min(5).max(500).required()
    }),
    start_time: Joi.date(),
    end_time: Joi.date(),
    status: Joi.string().valid('scheduled', 'in_progress', 'completed', 'cancelled')
  })
};

export const locationUpdateValidation = {
  create: Joi.object({
    vehicle_id: Joi.string().uuid().required(),
    driver_id: Joi.string().uuid().required(),
    location: Joi.object({
      lat: Joi.number().min(-90).max(90).required(),
      lng: Joi.number().min(-180).max(180).required()
    }).required(),
    speed: Joi.number().min(0).max(300),
    heading: Joi.number().min(0).max(360)
  })
};
