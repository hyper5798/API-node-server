// getUserFromToken would be based on your authentication strategy
const authResources = require('../lib/authResources')
const resResources = require('../lib/resResources')

module.exports = async function setCurrentUser(req, res, next) {
  try {
    // grab authentication token from req header
    let token = authResources.getInputToken(req)
    if(token === undefined) {
      return resResources.noAccess(res)
    }
    let user = await authResources.tokenVerify(token)
    // append the user object the the request object
    req.user = user
    // call next middleware in the stack
    next();
  } catch (error) {
    resResources.catchError(res, error.message)
  }
};