const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Something went wrong';
    let code = err.code || null;
    let errors = err.errors || null;

    // Prisma unique constraint error (e.g., duplicate email)
    if (err.code === 'P2002') {
        const field = err.meta.target[0];
        statusCode = 409;
        message = `A record with this ${field} already exists.`;
        errors = { [field]: `This ${field} is already taken.` };
    }

    res.status(statusCode).json({
        message,
        ...(code && { code }),
        ...(errors && { errors }),
    });
};

export default errorHandler;