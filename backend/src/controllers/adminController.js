const Employee = require('../models/Employee');
const Program = require('../models/Program');
const Vote = require('../models/Vote');
const { query, withTransaction } = require('../config/database');
const { logInfo, logWarn, logError, logAudit } = require('../config/logger');
const QRCode = require('qrcode');

class AdminController {
  // Control voting window for a program
  static async controlVoteWindow(req, res) {
    try {
      const programId = parseInt(req.params.id);
      const { action, duration } = req.body;

      const program = await Program.findById(programId);
      if (!program) {
        return res.status(404).json({
          code: 404,
          message: 'Program not found',
          data: null
        });
      }

      if (action === 'open') {
        // Close any other open voting windows first
        await query(
          'UPDATE programs SET status = 2, vote_end_at = CURRENT_TIMESTAMP WHERE event_id = $1 AND status = 1',
          [program.eventId]
        );

        // Open voting for this program
        await program.startVoting(Math.floor(duration / 60)); // Convert seconds to minutes

        logAudit('VOTE_WINDOW_OPEN', null, {
          programId,
          duration,
          ip: req.ip
        });

        logInfo('Vote window opened', {
          programId,
          programTitle: program.title,
          duration
        });

      } else if (action === 'close') {
        await program.endVoting();

        logAudit('VOTE_WINDOW_CLOSE', null, {
          programId,
          ip: req.ip
        });

        logInfo('Vote window closed', {
          programId,
          programTitle: program.title
        });
      }

      res.json({
        code: 200,
        message: `Vote window ${action}ed successfully`,
        data: {
          program: program.toJSON()
        }
      });

    } catch (error) {
      logError('Failed to control vote window', error, {
        programId: req.params.id,
        action: req.body.action,
        ip: req.ip
      });

      res.status(500).json({
        code: 500,
        message: 'Failed to control vote window',
        data: null
      });
    }
  }

  // Get admin dashboard data
  static async getDashboard(req, res) {
    try {
      // Get overall statistics
      const statsResult = await query(`
        SELECT 
          (SELECT COUNT(*) FROM events WHERE status IN (0, 1)) as active_events,
          (SELECT COUNT(*) FROM employees WHERE status = 1) as total_employees,
          (SELECT COUNT(*) FROM programs) as total_programs,
          (SELECT COUNT(*) FROM votes) as total_votes,
          (SELECT COUNT(DISTINCT employee_id) FROM votes) as unique_voters
      `);

      const stats = statsResult.rows[0];

      // Get recent activity
      const recentActivity = await query(`
        SELECT 
          'vote' as type,
          v.submitted_at as timestamp,
          e.name as employee_name,
          p.title as program_title,
          v.composite_score
        FROM votes v
        JOIN employees e ON v.employee_id = e.id
        JOIN programs p ON v.program_id = p.id
        ORDER BY v.submitted_at DESC
        LIMIT 20
      `);

      // Get active programs
      const activePrograms = await query(`
        SELECT p.*, 
          COUNT(v.id) as vote_count,
          AVG(v.composite_score) as avg_score
        FROM programs p
        LEFT JOIN votes v ON p.id = v.program_id
        WHERE p.status = 1
        GROUP BY p.id
        ORDER BY p.seq_no
      `);

      res.json({
        code: 200,
        message: 'Dashboard data retrieved successfully',
        data: {
          statistics: {
            activeEvents: parseInt(stats.active_events),
            totalEmployees: parseInt(stats.total_employees),
            totalPrograms: parseInt(stats.total_programs),
            totalVotes: parseInt(stats.total_votes),
            uniqueVoters: parseInt(stats.unique_voters),
            participationRate: stats.total_employees > 0 ? 
              (stats.unique_voters / stats.total_employees * 100).toFixed(2) : 0
          },
          recentActivity: recentActivity.rows,
          activePrograms: activePrograms.rows
        }
      });

    } catch (error) {
      logError('Failed to get dashboard data', error, {
        ip: req.ip
      });

      res.status(500).json({
        code: 500,
        message: 'Failed to retrieve dashboard data',
        data: null
      });
    }
  }

  // Manage employees
  static async getEmployees(req, res) {
    try {
      const { page = 1, limit = 50, department, search } = req.query;
      const offset = (page - 1) * limit;

      let whereClause = 'WHERE status = 1';
      let params = [];
      let paramIndex = 1;

      if (department) {
        whereClause += ` AND department = $${paramIndex}`;
        params.push(department);
        paramIndex++;
      }

      if (search) {
        whereClause += ` AND (name ILIKE $${paramIndex} OR emp_no ILIKE $${paramIndex})`;
        params.push(`%${search}%`);
        paramIndex++;
      }

      const employeesResult = await query(`
        SELECT * FROM employees 
        ${whereClause} 
        ORDER BY created_at DESC 
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `, [...params, limit, offset]);

      const countResult = await query(`
        SELECT COUNT(*) as total FROM employees ${whereClause}
      `, params);

      const total = parseInt(countResult.rows[0].total);

      res.json({
        code: 200,
        message: 'Employees retrieved successfully',
        data: {
          employees: employeesResult.rows,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });

    } catch (error) {
      logError('Failed to get employees', error, {
        ip: req.ip
      });

      res.status(500).json({
        code: 500,
        message: 'Failed to retrieve employees',
        data: null
      });
    }
  }

  // Batch import employees
  static async importEmployees(req, res) {
    try {
      const { employees } = req.body;

      if (!Array.isArray(employees) || employees.length === 0) {
        return res.status(400).json({
          code: 400,
          message: 'Invalid employee data',
          data: null
        });
      }

      const createdEmployees = await Employee.batchCreate(employees);

      logAudit('EMPLOYEES_IMPORT', null, {
        count: employees.length,
        ip: req.ip
      });

      res.json({
        code: 200,
        message: `Successfully imported ${createdEmployees.length} employees`,
        data: {
          employees: createdEmployees,
          count: createdEmployees.length
        }
      });

    } catch (error) {
      logError('Failed to import employees', error, {
        employeeCount: req.body.employees?.length,
        ip: req.ip
      });

      res.status(500).json({
        code: 500,
        message: 'Failed to import employees',
        data: null
      });
    }
  }

  // Generate QR code for event
  static async generateQRCode(req, res) {
    try {
      const { eventCode } = req.params;
      const baseUrl = process.env.QR_CODE_BASE_URL || 'http://localhost:8080';
      const qrUrl = `${baseUrl}?event=${eventCode}`;

      const qrCodeDataUrl = await QRCode.toDataURL(qrUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      res.json({
        code: 200,
        message: 'QR code generated successfully',
        data: {
          eventCode,
          qrUrl,
          qrCodeDataUrl
        }
      });

    } catch (error) {
      logError('Failed to generate QR code', error, {
        eventCode: req.params.eventCode,
        ip: req.ip
      });

      res.status(500).json({
        code: 500,
        message: 'Failed to generate QR code',
        data: null
      });
    }
  }

  // Export voting data
  static async exportVotes(req, res) {
    try {
      const { eventId, format = 'json' } = req.query;

      if (!eventId) {
        return res.status(400).json({
          code: 400,
          message: 'Event ID is required',
          data: null
        });
      }

      const exportData = await Vote.exportData(parseInt(eventId), format);

      logAudit('DATA_EXPORT', null, {
        eventId,
        format,
        recordCount: exportData.data?.length || exportData.length,
        ip: req.ip
      });

      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=votes_${eventId}_${Date.now()}.csv`);
        
        const csvContent = [
          exportData.headers.join(','),
          ...exportData.data.map(row => row.join(','))
        ].join('\n');
        
        res.send(csvContent);
      } else {
        res.json({
          code: 200,
          message: 'Data exported successfully',
          data: exportData
        });
      }

    } catch (error) {
      logError('Failed to export votes', error, {
        eventId: req.query.eventId,
        format: req.query.format,
        ip: req.ip
      });

      res.status(500).json({
        code: 500,
        message: 'Failed to export data',
        data: null
      });
    }
  }

  // Calculate and publish awards
  static async calculateAwards(req, res) {
    try {
      const { eventId } = req.body;

      if (!eventId) {
        return res.status(400).json({
          code: 400,
          message: 'Event ID is required',
          data: null
        });
      }

      // Award calculation logic based on the requirements
      const awardResults = await withTransaction(async (client) => {
        // Get all programs with their statistics
        const programsResult = await client.query(`
          SELECT p.*, 
            ps_sp.total_stars as sp_total_stars, ps_sp.avg_score as sp_avg_score,
            ps_perf.total_stars as perf_total_stars, ps_perf.avg_score as perf_avg_score,
            ps_pop.total_stars as pop_total_stars, ps_pop.avg_score as pop_avg_score,
            ps_team.total_stars as team_total_stars, ps_team.avg_score as team_avg_score,
            ps_crea.total_stars as crea_total_stars, ps_crea.avg_score as crea_avg_score
          FROM programs p
          LEFT JOIN program_statistics ps_sp ON p.id = ps_sp.program_id AND ps_sp.dimension = 'stage_presence'
          LEFT JOIN program_statistics ps_perf ON p.id = ps_perf.program_id AND ps_perf.dimension = 'performance'
          LEFT JOIN program_statistics ps_pop ON p.id = ps_pop.program_id AND ps_pop.dimension = 'popularity'
          LEFT JOIN program_statistics ps_team ON p.id = ps_team.program_id AND ps_team.dimension = 'teamwork'
          LEFT JOIN program_statistics ps_crea ON p.id = ps_crea.program_id AND ps_crea.dimension = 'creativity'
          WHERE p.event_id = $1
          ORDER BY p.seq_no
        `, [eventId]);

        const programs = programsResult.rows;

        // Award definitions (from requirements)
        const awards = [
          { type: 'best_popularity', dimension: 'popularity', name: '最佳人气奖' },
          { type: 'best_performance', dimension: 'performance', name: '最佳表演奖' },
          { type: 'best_teamwork', dimension: 'teamwork', name: '最佳默契奖' },
          { type: 'best_creativity', dimension: 'creativity', name: '最佳创意奖' },
          { type: 'best_stage_presence', dimension: 'stage_presence', name: '最具台风奖' }
        ];

        const results = [];
        const awardedPrograms = new Set();

        for (const award of awards) {
          const availablePrograms = programs.filter(p => !awardedPrograms.has(p.id));
          
          if (availablePrograms.length === 0) break;

          // Sort by dimension score
          const dimensionKey = `${award.dimension.replace('_', '')}_total_stars`;
          availablePrograms.sort((a, b) => {
            const scoreA = a[dimensionKey] || 0;
            const scoreB = b[dimensionKey] || 0;
            
            if (scoreB !== scoreA) return scoreB - scoreA;
            
            // Tiebreaker: composite score
            const compositeA = (a.sp_total_stars || 0) + (a.perf_total_stars || 0) + 
                              (a.pop_total_stars || 0) + (a.team_total_stars || 0) + (a.crea_total_stars || 0);
            const compositeB = (b.sp_total_stars || 0) + (b.perf_total_stars || 0) + 
                              (b.pop_total_stars || 0) + (b.team_total_stars || 0) + (b.crea_total_stars || 0);
            
            return compositeB - compositeA;
          });

          const winner = availablePrograms[0];
          awardedPrograms.add(winner.id);

          // Insert award result
          await client.query(`
            INSERT INTO award_results (event_id, award_type, program_id, core_dimension_score, created_at, published_at)
            VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT (event_id, award_type) DO UPDATE SET
              program_id = EXCLUDED.program_id,
              core_dimension_score = EXCLUDED.core_dimension_score,
              published_at = CURRENT_TIMESTAMP
          `, [eventId, award.type, winner.id, winner[dimensionKey] || 0]);

          results.push({
            awardType: award.type,
            awardName: award.name,
            program: {
              id: winner.id,
              title: winner.title,
              performer: winner.performer,
              seqNo: winner.seq_no
            },
            score: winner[dimensionKey] || 0
          });
        }

        return results;
      });

      logAudit('AWARDS_CALCULATE', null, {
        eventId,
        awardCount: awardResults.length,
        ip: req.ip
      });

      res.json({
        code: 200,
        message: 'Awards calculated successfully',
        data: {
          awards: awardResults
        }
      });

    } catch (error) {
      logError('Failed to calculate awards', error, {
        eventId: req.body.eventId,
        ip: req.ip
      });

      res.status(500).json({
        code: 500,
        message: 'Failed to calculate awards',
        data: null
      });
    }
  }

  // Get published awards
  static async getAwards(req, res) {
    try {
      const { eventId } = req.query;

      if (!eventId) {
        return res.status(400).json({
          code: 400,
          message: 'Event ID is required',
          data: null
        });
      }

      const awardsResult = await query(`
        SELECT ar.*, p.title, p.performer, p.seq_no
        FROM award_results ar
        JOIN programs p ON ar.program_id = p.id
        WHERE ar.event_id = $1 AND ar.published_at IS NOT NULL
        ORDER BY 
          CASE ar.award_type
            WHEN 'best_popularity' THEN 1
            WHEN 'best_performance' THEN 2
            WHEN 'best_teamwork' THEN 3
            WHEN 'best_creativity' THEN 4
            WHEN 'best_stage_presence' THEN 5
            ELSE 6
          END
      `, [eventId]);

      const awards = awardsResult.rows.map(row => ({
        awardType: row.award_type,
        awardName: {
          'best_popularity': '最佳人气奖',
          'best_performance': '最佳表演奖', 
          'best_teamwork': '最佳默契奖',
          'best_creativity': '最佳创意奖',
          'best_stage_presence': '最具台风奖'
        }[row.award_type],
        program: {
          id: row.program_id,
          title: row.title,
          performer: row.performer,
          seqNo: row.seq_no
        },
        score: row.core_dimension_score,
        publishedAt: row.published_at
      }));

      res.json({
        code: 200,
        message: 'Awards retrieved successfully',
        data: {
          awards,
          eventId: parseInt(eventId)
        }
      });

    } catch (error) {
      logError('Failed to get awards', error, {
        eventId: req.query.eventId,
        ip: req.ip
      });

      res.status(500).json({
        code: 500,
        message: 'Failed to retrieve awards',
        data: null
      });
    }
  }

  // Event management methods
  static async getEvents(req, res) {
    try {
      const events = await query(`
        SELECT e.*, 
               COUNT(p.id) as program_count,
               COUNT(v.id) as vote_count
        FROM events e
        LEFT JOIN programs p ON e.id = p.event_id
        LEFT JOIN votes v ON p.id = v.program_id
        GROUP BY e.id
        ORDER BY e.created_at DESC
      `);

      res.json({
        code: 200,
        message: 'Events retrieved successfully',
        data: events.rows
      });

    } catch (error) {
      logError('Failed to get events', error, {
        ip: req.ip
      });

      res.status(500).json({
        code: 500,
        message: 'Failed to get events',
        data: null
      });
    }
  }

  static async createEvent(req, res) {
    try {
      const { code, name, mode = 1, window_minutes = 5, weights, theme_config } = req.body;

      // Check if code already exists
      const existingEvent = await query('SELECT id FROM events WHERE code = $1', [code]);
      if (existingEvent.rows.length > 0) {
        return res.status(400).json({
          code: 400,
          message: 'Event code already exists',
          data: null
        });
      }

      const defaultWeights = {
        stage_presence: 0.2,
        performance: 0.25,
        popularity: 0.2,
        teamwork: 0.15,
        creativity: 0.2
      };

      const result = await query(`
        INSERT INTO events (code, name, mode, window_minutes, weights, theme_config, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *
      `, [code, name, mode, window_minutes, weights || defaultWeights, theme_config]);

      logAudit('EVENT_CREATE', null, {
        eventId: result.rows[0].id,
        code,
        name,
        ip: req.ip
      });

      res.json({
        code: 200,
        message: 'Event created successfully',
        data: result.rows[0]
      });

    } catch (error) {
      logError('Failed to create event', error, {
        ip: req.ip
      });

      res.status(500).json({
        code: 500,
        message: 'Failed to create event',
        data: null
      });
    }
  }

  static async updateEvent(req, res) {
    try {
      const eventId = parseInt(req.params.id);
      const { code, name, mode, window_minutes, weights, theme_config, status } = req.body;

      // Check if new code already exists (excluding current event)
      if (code) {
        const existingEvent = await query('SELECT id FROM events WHERE code = $1 AND id != $2', [code, eventId]);
        if (existingEvent.rows.length > 0) {
          return res.status(400).json({
            code: 400,
            message: 'Event code already exists',
            data: null
          });
        }
      }

      const result = await query(`
        UPDATE events 
        SET code = $1, name = $2, mode = $3, window_minutes = $4, 
            weights = $5, theme_config = $6, status = $7, updated_at = CURRENT_TIMESTAMP
        WHERE id = $8
        RETURNING *
      `, [code, name, mode, window_minutes, weights, theme_config, status, eventId]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          code: 404,
          message: 'Event not found',
          data: null
        });
      }

      logAudit('EVENT_UPDATE', null, {
        eventId,
        code,
        name,
        ip: req.ip
      });

      res.json({
        code: 200,
        message: 'Event updated successfully',
        data: result.rows[0]
      });

    } catch (error) {
      logError('Failed to update event', error, {
        ip: req.ip
      });

      res.status(500).json({
        code: 500,
        message: 'Failed to update event',
        data: null
      });
    }
  }

  static async deleteEvent(req, res) {
    try {
      const eventId = parseInt(req.params.id);

      // Check if event has programs with votes
      const voteCheck = await query(`
        SELECT COUNT(*) FROM votes v
        JOIN programs p ON v.program_id = p.id
        WHERE p.event_id = $1
      `, [eventId]);

      if (parseInt(voteCheck.rows[0].count) > 0) {
        return res.status(400).json({
          code: 400,
          message: 'Cannot delete event with existing votes',
          data: null
        });
      }

      const result = await query(
        'DELETE FROM events WHERE id = $1 RETURNING *',
        [eventId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          code: 404,
          message: 'Event not found',
          data: null
        });
      }

      logAudit('EVENT_DELETE', null, {
        eventId,
        code: result.rows[0].code,
        name: result.rows[0].name,
        ip: req.ip
      });

      res.json({
        code: 200,
        message: 'Event deleted successfully',
        data: null
      });

    } catch (error) {
      logError('Failed to delete event', error, {
        ip: req.ip
      });

      res.status(500).json({
        code: 500,
        message: 'Failed to delete event',
        data: null
      });
    }
  }

  // System health check
  static async healthCheck(req, res) {
    try {
      // Check database connection
      const dbResult = await query('SELECT NOW() as timestamp');
      
      // Check Redis connection (if available)
      let redisStatus = 'disconnected';
      try {
        const { redisClient } = require('../config/redis');
        await redisClient.ping();
        redisStatus = 'connected';
      } catch (e) {
        redisStatus = 'error';
      }

      res.json({
        code: 200,
        message: 'System health check completed',
        data: {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          database: {
            status: 'connected',
            timestamp: dbResult.rows[0].timestamp
          },
          redis: {
            status: redisStatus
          },
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          version: process.version
        }
      });

    } catch (error) {
      logError('Health check failed', error, {
        ip: req.ip
      });

      res.status(500).json({
        code: 500,
        message: 'System health check failed',
        data: {
          status: 'unhealthy',
          error: error.message
        }
      });
    }
  }

  // Program management methods
  static async getPrograms(req, res) {
    try {
      const { event_id } = req.query;
      let whereClause;
      let params = [];

      if (event_id) {
        // Get programs for specified event
        whereClause = 'WHERE p.event_id = $1';
        params = [event_id];
      } else {
        // Fallback to current active event
        whereClause = 'WHERE p.event_id = (SELECT id FROM events WHERE status = 1 ORDER BY created_at DESC LIMIT 1)';
      }

      const programs = await query(`
        SELECT p.*, COUNT(v.id) as vote_count, 
               ROUND(AVG(v.composite_score), 2) as avg_score
        FROM programs p
        LEFT JOIN votes v ON p.id = v.program_id
        ${whereClause}
        GROUP BY p.id
        ORDER BY p.seq_no
      `, params);

      res.json({
        code: 200,
        message: 'Programs retrieved successfully',
        data: programs.rows
      });

    } catch (error) {
      logError('Failed to get programs', error, {
        ip: req.ip
      });

      res.status(500).json({
        code: 500,
        message: 'Failed to get programs',
        data: null
      });
    }
  }

  static async createProgram(req, res) {
    try {
      const { title, performer, description, duration_minutes = 5, seq_no, event_id } = req.body;

      let eventId;
      
      if (event_id) {
        // Use specified event_id
        const eventResult = await query(
          'SELECT id FROM events WHERE id = $1',
          [event_id]
        );

        if (eventResult.rows.length === 0) {
          return res.status(400).json({
            code: 400,
            message: 'Specified event not found',
            data: null
          });
        }

        eventId = event_id;
      } else {
        // Fallback to current active event
        const eventResult = await query(
          'SELECT id FROM events WHERE status = 1 ORDER BY created_at DESC LIMIT 1'
        );

        if (eventResult.rows.length === 0) {
          return res.status(400).json({
            code: 400,
            message: 'No active event found and no event_id specified',
            data: null
          });
        }

        eventId = eventResult.rows[0].id;
      }

      const result = await query(`
        INSERT INTO programs (event_id, title, performer, description, duration_minutes, seq_no, status, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, 0, CURRENT_TIMESTAMP)
        RETURNING *
      `, [eventId, title, performer, description, duration_minutes, seq_no]);

      logAudit('PROGRAM_CREATE', null, {
        programId: result.rows[0].id,
        title,
        performer,
        ip: req.ip
      });

      res.json({
        code: 200,
        message: 'Program created successfully',
        data: result.rows[0]
      });

    } catch (error) {
      logError('Failed to create program', error, {
        ip: req.ip
      });

      // Handle duplicate sequence number error
      if (error.code === '23505' && error.constraint === 'programs_event_id_seq_no_key') {
        return res.status(400).json({
          code: 400,
          message: `序号 ${req.body.seq_no} 已经存在，请选择其他序号`,
          data: null
        });
      }

      res.status(500).json({
        code: 500,
        message: 'Failed to create program',
        data: null
      });
    }
  }



  static async updateProgram(req, res) {
    try {
      const programId = parseInt(req.params.id);
      const { title, performer, description, duration_minutes, seq_no, status } = req.body;

      const result = await query(`
        UPDATE programs 
        SET title = $1, performer = $2, description = $3, 
            duration_minutes = $4, seq_no = $5, status = $6
        WHERE id = $7
        RETURNING *
      `, [title, performer, description, duration_minutes, seq_no, status, programId]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          code: 404,
          message: 'Program not found',
          data: null
        });
      }

      logAudit('PROGRAM_UPDATE', null, {
        programId,
        title,
        performer,
        ip: req.ip
      });

      res.json({
        code: 200,
        message: 'Program updated successfully',
        data: result.rows[0]
      });

    } catch (error) {
      logError('Failed to update program', error, {
        ip: req.ip
      });

      res.status(500).json({
        code: 500,
        message: 'Failed to update program',
        data: null
      });
    }
  }

  static async deleteProgram(req, res) {
    try {
      const programId = parseInt(req.params.id);

      // Check if program has votes
      const voteCheck = await query(
        'SELECT COUNT(*) FROM votes WHERE program_id = $1',
        [programId]
      );

      if (parseInt(voteCheck.rows[0].count) > 0) {
        return res.status(400).json({
          code: 400,
          message: 'Cannot delete program with existing votes',
          data: null
        });
      }

      const result = await query(
        'DELETE FROM programs WHERE id = $1 RETURNING *',
        [programId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          code: 404,
          message: 'Program not found',
          data: null
        });
      }

      logAudit('PROGRAM_DELETE', null, {
        programId,
        title: result.rows[0].title,
        ip: req.ip
      });

      res.json({
        code: 200,
        message: 'Program deleted successfully',
        data: null
      });

    } catch (error) {
      logError('Failed to delete program', error, {
        ip: req.ip
      });

      res.status(500).json({
        code: 500,
        message: 'Failed to delete program',
        data: null
      });
    }
  }
}

module.exports = AdminController;