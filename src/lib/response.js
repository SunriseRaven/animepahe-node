/**
 * response.js
 * Standardized JSON response helpers for Express.
 */

function success(res, data, message = 'OK', code = 200) {
  return res.status(code).json({
    status: 'success',
    message,
    data,
  });
}

function error(res, message, code = 400) {
  return res.status(code).json({
    status: 'error',
    message,
    data: null,
  });
}

function notFound(res, message = 'Not found') {
  return error(res, message, 404);
}

function serverError(res, message = 'Internal server error') {
  return error(res, message, 500);
}

module.exports = { success, error, notFound, serverError };
