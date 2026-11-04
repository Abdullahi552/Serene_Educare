class AppError extends Error {
    constructor(message, statusCode, code = null, errors = null) {
        super(message);
        this.statusCode = statusCode;
        this.code = code; // e.g., 'VALIDATION_ERROR'
        this.errors = errors; // e.g., { email: "Invalid email format" }
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
export default AppError;