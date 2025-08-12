const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { query } = require('../config/database');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '2h';

// Generate JWT token
const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { 
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'anniversary-voting-system',
    audience: 'voting-users'
  });
};

// Verify JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: 'anniversary-voting-system',
      audience: 'voting-users'
    });
  } catch (error) {
    throw new Error('Invalid token');
  }
};

// Generate token hash for storage
const generateTokenHash = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

// Create user session
const createSession = async (employeeId, eventId, token, ipAddress, userAgent) => {
  const tokenHash = generateTokenHash(token);
  const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours

  await query(
    `INSERT INTO user_sessions (employee_id, event_id, token_hash, expires_at, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (employee_id, event_id) 
     DO UPDATE SET 
       token_hash = EXCLUDED.token_hash,
       expires_at = EXCLUDED.expires_at,
       ip_address = EXCLUDED.ip_address,
       user_agent = EXCLUDED.user_agent,
       created_at = CURRENT_TIMESTAMP`,
    [employeeId, eventId, tokenHash, expiresAt, ipAddress, userAgent]
  );
};

// Validate session
const validateSession = async (token, employeeId, eventId) => {
  const tokenHash = generateTokenHash(token);
  
  const result = await query(
    `SELECT * FROM user_sessions 
     WHERE employee_id = $1 AND event_id = $2 AND token_hash = $3 AND expires_at > CURRENT_TIMESTAMP`,
    [employeeId, eventId, tokenHash]
  );

  return result.rows.length > 0;
};

// Revoke session
const revokeSession = async (employeeId, eventId) => {
  await query(
    'DELETE FROM user_sessions WHERE employee_id = $1 AND event_id = $2',
    [employeeId, eventId]
  );
};

// Clean expired sessions
const cleanExpiredSessions = async () => {
  const result = await query(
    'DELETE FROM user_sessions WHERE expires_at < CURRENT_TIMESTAMP'
  );
  
  return result.rowCount;
};

// Get session info
const getSessionInfo = async (employeeId, eventId) => {
  const result = await query(
    `SELECT token_hash, expires_at, ip_address, user_agent, created_at
     FROM user_sessions 
     WHERE employee_id = $1 AND event_id = $2 AND expires_at > CURRENT_TIMESTAMP`,
    [employeeId, eventId]
  );

  return result.rows.length > 0 ? result.rows[0] : null;
};

// Decode token without verification (for extracting payload)
const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
};

// Get token expiration time
const getTokenExpiration = (token) => {
  const decoded = decodeToken(token);
  return decoded ? new Date(decoded.exp * 1000) : null;
};

// Check if token is expired
const isTokenExpired = (token) => {
  const expiration = getTokenExpiration(token);
  return expiration ? expiration < new Date() : true;
};

// Refresh token (generate new token with same payload)
const refreshToken = async (token, ipAddress, userAgent) => {
  try {
    const decoded = verifyToken(token);
    const newToken = generateToken({
      employeeId: decoded.employeeId,
      eventId: decoded.eventId,
      empNo: decoded.empNo,
      name: decoded.name,
      department: decoded.department
    });

    // Update session
    await createSession(decoded.employeeId, decoded.eventId, newToken, ipAddress, userAgent);
    
    return newToken;
  } catch (error) {
    throw new Error('Cannot refresh expired or invalid token');
  }
};

module.exports = {
  generateToken,
  verifyToken,
  generateTokenHash,
  createSession,
  validateSession,
  revokeSession,
  cleanExpiredSessions,
  getSessionInfo,
  decodeToken,
  getTokenExpiration,
  isTokenExpired,
  refreshToken
};