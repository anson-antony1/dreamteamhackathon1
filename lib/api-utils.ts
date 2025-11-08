// Custom error class for API errors
export class APIError extends Error {
    constructor(
        public message: string,
        public statusCode: number = 500,
        public code?: string
    ) {
        super(message);
        this.name = 'APIError';
    }
}

// Error handler for API routes
export function handleAPIError(error: unknown) {
    console.error('API Error:', error);

    if (error instanceof APIError) {
        return {
            error: error.message,
            code: error.code,
            status: error.statusCode,
        };
    }

    if (error instanceof Error) {
        return {
            error: error.message,
            status: 500,
        };
    }

    return {
        error: 'An unexpected error occurred',
        status: 500,
    };
}

// Validation utilities
export function validateRequired<T extends Record<string, any>>(
    data: T,
    fields: (keyof T)[]
) {
    const missingFields = fields.filter(field => !data[field]);

    if (missingFields.length > 0) {
        throw new APIError(
            `Missing required fields: ${missingFields.join(', ')}`,
            400,
            'MISSING_FIELDS'
        );
    }
}

export function validateAppointmentDate(date: string, time: string) {
    const appointmentDate = new Date(`${date}T${time}`);
    const now = new Date();

    if (appointmentDate < now) {
        throw new APIError(
            'Appointment date must be in the future',
            400,
            'INVALID_DATE'
        );
    }
}

// Rate limiting utility
const rateLimit = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(userId: string, limit: number = 100, windowMs: number = 60000) {
    const now = Date.now();
    const userRateLimit = rateLimit.get(userId);

    if (!userRateLimit || now > userRateLimit.resetTime) {
        rateLimit.set(userId, {
            count: 1,
            resetTime: now + windowMs,
        });
        return;
    }

    if (userRateLimit.count >= limit) {
        throw new APIError(
            'Too many requests',
            429,
            'RATE_LIMIT_EXCEEDED'
        );
    }

    userRateLimit.count += 1;
}

// Response formatters
export function formatSuccess<T>(data: T) {
    return {
        success: true,
        data,
    };
}

export function formatError(error: string, code?: string, status: number = 500) {
    return {
        success: false,
        error,
        code,
        status,
    };
}