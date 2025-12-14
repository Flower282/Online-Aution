/**
 * Content-Type validation middleware
 * Must be applied BEFORE express.json()
 */
export const validateContentType = (req, res, next) => {
    // Only validate POST, PUT, PATCH requests with body
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        const contentType = req.get('Content-Type');
        
        // If Content-Type is explicitly set and is not JSON
        if (contentType && !contentType.includes('application/json')) {
            return res.status(400).json({ error: 'Content-Type must be application/json' });
        }
    }
    next();
};

/**
 * JSON parsing error handler
 * Must be applied AFTER express.json()
 */
export const handleJsonError = (err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ error: 'Invalid JSON' });
    }
    next(err);
};
