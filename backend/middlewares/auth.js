import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
  // Get token from the Authorization header (Bearer token)
  const token = req.cookies.token; // Get token from cookies
  if (!token) {
    return res.status(401).json({ message: "No auth token, access denied" });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified.id; // Store the user ID in the request object
    next();
  } catch (error) {
    res.status(401).json({ message: "Token verification failed" });
  }
};

export default authMiddleware;
