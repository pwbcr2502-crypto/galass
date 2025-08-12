const Employee = require('../models/Employee');
const { query } = require('../config/database');
const { generateToken, createSession, revokeSession } = require('../utils/jwt');
const { logInfo, logWarn, logError, logAudit } = require('../config/logger');

class AuthController {
  // Employee login
  static async login(req, res) {
    try {
      const { eventCode, empNo } = req.body;
      const ipAddress = req.ip;
      const userAgent = req.headers['user-agent'];
      const deviceId = req.deviceId;

      // Find event by code
      const eventResult = await query(
        'SELECT * FROM events WHERE code = $1 AND status IN (0, 1)',
        [eventCode]
      );

      if (eventResult.rows.length === 0) {
        logWarn('Login attempt with invalid event code', {
          eventCode,
          empNo,
          ip: ipAddress
        });
        
        return res.status(400).json({
          code: 400,
          message: 'Invalid event code or event not active',
          data: null
        });
      }

      const event = eventResult.rows[0];

      // Find employee
      const employee = await Employee.findByEmpNo(empNo);
      if (!employee) {
        logWarn('Login attempt with invalid employee number', {
          eventCode,
          empNo,
          ip: ipAddress
        });
        
        return res.status(400).json({
          code: 400,
          message: 'Employee number not found',
          data: null
        });
      }

      // Generate JWT token
      const tokenPayload = {
        employeeId: employee.id,
        eventId: event.id,
        empNo: employee.empNo,
        name: employee.name,
        department: employee.department
      };

      const token = generateToken(tokenPayload);

      // Create session
      await createSession(employee.id, event.id, token, ipAddress, userAgent);

      // Update last login time
      await employee.updateLastLogin();

      // Check if employee has voted for any programs
      const votedProgramsResult = await query(
        'SELECT program_id FROM votes WHERE event_id = $1 AND employee_id = $2',
        [event.id, employee.id]
      );

      const votedPrograms = votedProgramsResult.rows.map(row => row.program_id);

      logAudit('LOGIN', employee.id, {
        eventId: event.id,
        empNo: employee.empNo,
        ip: ipAddress,
        deviceId
      });

      logInfo('Employee logged in successfully', {
        employeeId: employee.id,
        empNo: employee.empNo,
        eventId: event.id,
        ip: ipAddress
      });

      res.json({
        code: 200,
        message: 'Login successful',
        data: {
          token,
          employee: {
            id: employee.id,
            empNo: employee.empNo,
            name: employee.name,
            department: employee.department
          },
          event: {
            id: event.id,
            code: event.code,
            name: event.name,
            status: event.status
          },
          hasVoted: votedPrograms.length > 0,
          votedPrograms
        }
      });

    } catch (error) {
      logError('Login failed', error, {
        empNo: req.body.empNo,
        eventCode: req.body.eventCode,
        ip: req.ip
      });

      res.status(500).json({
        code: 500,
        message: 'Login failed',
        data: null
      });
    }
  }

  // Employee logout
  static async logout(req, res) {
    try {
      const { employeeId, eventId } = req.user;

      // Revoke session
      await revokeSession(employeeId, eventId);

      logAudit('LOGOUT', employeeId, {
        eventId,
        ip: req.ip
      });

      res.json({
        code: 200,
        message: 'Logout successful',
        data: null
      });

    } catch (error) {
      logError('Logout failed', error, {
        userId: req.user?.employeeId,
        ip: req.ip
      });

      res.status(500).json({
        code: 500,
        message: 'Logout failed',
        data: null
      });
    }
  }

  // Get current user profile
  static async getProfile(req, res) {
    try {
      const { employeeId, eventId } = req.user;

      const employee = await Employee.findById(employeeId);
      if (!employee) {
        return res.status(404).json({
          code: 404,
          message: 'Employee not found',
          data: null
        });
      }

      // Get user's voting history for this event
      const votes = await employee.getVotes(eventId);

      res.json({
        code: 200,
        message: 'Profile retrieved successfully',
        data: {
          employee: employee.toJSON(),
          votes,
          totalVotes: votes.length
        }
      });

    } catch (error) {
      logError('Failed to get user profile', error, {
        userId: req.user?.employeeId,
        ip: req.ip
      });

      res.status(500).json({
        code: 500,
        message: 'Failed to get profile',
        data: null
      });
    }
  }

  // Validate token (health check for frontend)
  static async validateToken(req, res) {
    try {
      // If middleware passed, token is valid
      res.json({
        code: 200,
        message: 'Token is valid',
        data: {
          user: req.user,
          expiresAt: req.tokenExp || null
        }
      });

    } catch (error) {
      logError('Token validation failed', error, {
        userId: req.user?.employeeId,
        ip: req.ip
      });

      res.status(500).json({
        code: 500,
        message: 'Token validation failed',
        data: null
      });
    }
  }

  // Refresh token
  static async refreshToken(req, res) {
    try {
      const { employeeId, eventId } = req.user;
      const ipAddress = req.ip;
      const userAgent = req.headers['user-agent'];

      // Get fresh employee data
      const employee = await Employee.findById(employeeId);
      if (!employee) {
        return res.status(404).json({
          code: 404,
          message: 'Employee not found',
          data: null
        });
      }

      // Generate new token
      const tokenPayload = {
        employeeId: employee.id,
        eventId: eventId,
        empNo: employee.empNo,
        name: employee.name,
        department: employee.department
      };

      const newToken = generateToken(tokenPayload);

      // Update session
      await createSession(employee.id, eventId, newToken, ipAddress, userAgent);

      logInfo('Token refreshed successfully', {
        employeeId: employee.id,
        eventId,
        ip: ipAddress
      });

      res.json({
        code: 200,
        message: 'Token refreshed successfully',
        data: {
          token: newToken,
          employee: {
            id: employee.id,
            empNo: employee.empNo,
            name: employee.name,
            department: employee.department
          }
        }
      });

    } catch (error) {
      logError('Token refresh failed', error, {
        userId: req.user?.employeeId,
        ip: req.ip
      });

      res.status(500).json({
        code: 500,
        message: 'Token refresh failed',
        data: null
      });
    }
  }

  // Get session info
  static async getSessionInfo(req, res) {
    try {
      const { employeeId, eventId } = req.user;

      const sessionInfo = await query(
        `SELECT expires_at, ip_address, created_at 
         FROM user_sessions 
         WHERE employee_id = $1 AND event_id = $2 AND expires_at > CURRENT_TIMESTAMP`,
        [employeeId, eventId]
      );

      if (sessionInfo.rows.length === 0) {
        return res.status(404).json({
          code: 404,
          message: 'Session not found',
          data: null
        });
      }

      const session = sessionInfo.rows[0];

      res.json({
        code: 200,
        message: 'Session info retrieved',
        data: {
          expiresAt: session.expires_at,
          loginIp: session.ip_address,
          loginTime: session.created_at,
          remainingMinutes: Math.ceil((new Date(session.expires_at) - new Date()) / 60000)
        }
      });

    } catch (error) {
      logError('Failed to get session info', error, {
        userId: req.user?.employeeId,
        ip: req.ip
      });

      res.status(500).json({
        code: 500,
        message: 'Failed to get session info',
        data: null
      });
    }
  }

  // Admin login
  static async adminLogin(req, res) {
    try {
      const { username, password } = req.body;
      const ipAddress = req.ip;

      // Simple admin credentials check - in production, this should be more secure
      const validUsername = process.env.ADMIN_USERNAME || 'admin';
      const validPassword = process.env.ADMIN_PASSWORD || 'admin123';

      if (username !== validUsername || password !== validPassword) {
        logWarn('Admin login attempt with invalid credentials', {
          username,
          ip: ipAddress
        });

        return res.status(401).json({
          code: 401,
          message: 'Invalid admin credentials',
          data: null
        });
      }

      // Return the admin token
      const adminToken = process.env.ADMIN_TOKEN || 'admin-anniversary-2025-secret';

      logAudit('ADMIN_LOGIN', 'admin', {
        ip: ipAddress,
        username
      });

      logInfo('Admin logged in successfully', {
        username,
        ip: ipAddress
      });

      res.json({
        code: 200,
        message: 'Admin login successful',
        data: {
          token: adminToken,
          user: {
            username: validUsername,
            role: 'admin'
          }
        }
      });

    } catch (error) {
      logError('Admin login failed', error, {
        username: req.body.username,
        ip: req.ip
      });

      res.status(500).json({
        code: 500,
        message: 'Admin login failed',
        data: null
      });
    }
  }
}

module.exports = AuthController;