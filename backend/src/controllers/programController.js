const Program = require('../models/Program');
const { query } = require('../config/database');
const { logInfo, logWarn, logError, logAudit } = require('../config/logger');

class ProgramController {
  // Get all programs for current event
  static async getPrograms(req, res) {
    try {
      const { eventId } = req.user;

      const programs = await Program.findActiveByEventId(eventId);

      // Add statistics to each program
      const programsWithStats = await Promise.all(
        programs.map(async (program) => {
          const stats = await program.getStatistics();
          return {
            ...program.toJSON(),
            statistics: stats
          };
        })
      );

      res.json({
        code: 200,
        message: 'Programs retrieved successfully',
        data: {
          programs: programsWithStats,
          totalPrograms: programs.length
        }
      });

    } catch (error) {
      logError('Failed to get programs', error, {
        userId: req.user?.employeeId,
        eventId: req.user?.eventId,
        ip: req.ip
      });

      res.status(500).json({
        code: 500,
        message: 'Failed to retrieve programs',
        data: null
      });
    }
  }

  // Get single program details
  static async getProgram(req, res) {
    try {
      const programId = parseInt(req.params.id);
      const { eventId } = req.user;

      const program = await Program.findById(programId);

      if (!program) {
        return res.status(404).json({
          code: 404,
          message: 'Program not found',
          data: null
        });
      }

      // Verify program belongs to current event
      if (program.eventId !== eventId) {
        return res.status(403).json({
          code: 403,
          message: 'Access denied to this program',
          data: null
        });
      }

      // Get program statistics
      const statistics = await program.getStatistics();

      // Get vote count
      const voteCountResult = await query(
        'SELECT COUNT(*) as count FROM votes WHERE program_id = $1',
        [programId]
      );
      const voteCount = parseInt(voteCountResult.rows[0].count);

      res.json({
        code: 200,
        message: 'Program retrieved successfully',
        data: {
          program: program.toJSON(),
          statistics,
          voteCount
        }
      });

    } catch (error) {
      logError('Failed to get program', error, {
        programId: req.params.id,
        userId: req.user?.employeeId,
        ip: req.ip
      });

      res.status(500).json({
        code: 500,
        message: 'Failed to retrieve program',
        data: null
      });
    }
  }

  // Get current voting program
  static async getCurrentProgram(req, res) {
    try {
      const { eventId } = req.user;

      const currentProgram = await Program.getCurrentVotingProgram(eventId);

      if (!currentProgram) {
        return res.json({
          code: 200,
          message: 'No program is currently open for voting',
          data: {
            currentProgram: null,
            hasActiveVoting: false
          }
        });
      }

      const statistics = await currentProgram.getStatistics();

      res.json({
        code: 200,
        message: 'Current program retrieved successfully',
        data: {
          currentProgram: currentProgram.toJSON(),
          statistics,
          hasActiveVoting: true
        }
      });

    } catch (error) {
      logError('Failed to get current program', error, {
        userId: req.user?.employeeId,
        eventId: req.user?.eventId,
        ip: req.ip
      });

      res.status(500).json({
        code: 500,
        message: 'Failed to retrieve current program',
        data: null
      });
    }
  }

  // Get next program in sequence
  static async getNextProgram(req, res) {
    try {
      const { eventId } = req.user;

      // Get current program first
      const currentProgram = await Program.getCurrentVotingProgram(eventId);
      let currentSeqNo = 0;

      if (currentProgram) {
        currentSeqNo = currentProgram.seqNo;
      } else {
        // If no current program, get the last completed program
        const lastCompletedResult = await query(
          'SELECT seq_no FROM programs WHERE event_id = $1 AND status = 2 ORDER BY seq_no DESC LIMIT 1',
          [eventId]
        );
        if (lastCompletedResult.rows.length > 0) {
          currentSeqNo = lastCompletedResult.rows[0].seq_no;
        }
      }

      const nextProgram = await Program.getNextProgram(eventId, currentSeqNo);

      res.json({
        code: 200,
        message: 'Next program retrieved successfully',
        data: {
          nextProgram: nextProgram ? nextProgram.toJSON() : null,
          hasNextProgram: nextProgram !== null
        }
      });

    } catch (error) {
      logError('Failed to get next program', error, {
        userId: req.user?.employeeId,
        eventId: req.user?.eventId,
        ip: req.ip
      });

      res.status(500).json({
        code: 500,
        message: 'Failed to retrieve next program',
        data: null
      });
    }
  }

  // Get program schedule/timeline
  static async getSchedule(req, res) {
    try {
      const { eventId } = req.user;

      const programs = await Program.findByEventId(eventId, 'seq_no ASC');

      const schedule = programs.map(program => ({
        id: program.id,
        seqNo: program.seqNo,
        title: program.title,
        performer: program.performer,
        durationMinutes: program.durationMinutes,
        status: program.status,
        voteStartAt: program.voteStartAt,
        voteEndAt: program.voteEndAt,
        remainingTime: program.getRemainingVoteTime(),
        isVotingActive: program.isVotingActive()
      }));

      // Calculate overall progress
      const completedPrograms = programs.filter(p => p.status === 2).length;
      const totalPrograms = programs.length;
      const progress = totalPrograms > 0 ? (completedPrograms / totalPrograms * 100).toFixed(2) : 0;

      res.json({
        code: 200,
        message: 'Program schedule retrieved successfully',
        data: {
          schedule,
          progress: {
            completed: completedPrograms,
            total: totalPrograms,
            percentage: parseFloat(progress)
          }
        }
      });

    } catch (error) {
      logError('Failed to get program schedule', error, {
        userId: req.user?.employeeId,
        eventId: req.user?.eventId,
        ip: req.ip
      });

      res.status(500).json({
        code: 500,
        message: 'Failed to retrieve program schedule',
        data: null
      });
    }
  }

  // Get program voting status
  static async getVotingStatus(req, res) {
    try {
      const programId = parseInt(req.params.id);
      const { eventId, employeeId } = req.user;

      const program = await Program.findById(programId);

      if (!program || program.eventId !== eventId) {
        return res.status(404).json({
          code: 404,
          message: 'Program not found',
          data: null
        });
      }

      // Check if user has voted
      const hasVotedResult = await query(
        'SELECT id FROM votes WHERE program_id = $1 AND employee_id = $2',
        [programId, employeeId]
      );
      const hasVoted = hasVotedResult.rows.length > 0;

      // Get vote statistics
      const statistics = await program.getStatistics();

      res.json({
        code: 200,
        message: 'Program voting status retrieved',
        data: {
          program: program.toJSON(),
          hasVoted,
          canVote: !hasVoted && program.isVotingActive(),
          statistics,
          remainingTime: program.getRemainingVoteTime()
        }
      });

    } catch (error) {
      logError('Failed to get program voting status', error, {
        programId: req.params.id,
        userId: req.user?.employeeId,
        ip: req.ip
      });

      res.status(500).json({
        code: 500,
        message: 'Failed to retrieve program voting status',
        data: null
      });
    }
  }

  // Admin: Create new program
  static async createProgram(req, res) {
    try {
      if (!req.isAdmin) {
        return res.status(403).json({
          code: 403,
          message: 'Admin access required',
          data: null
        });
      }

      const program = await Program.create(req.body);

      logAudit('PROGRAM_CREATE', null, {
        programId: program.id,
        programData: req.body,
        ip: req.ip
      });

      res.status(201).json({
        code: 201,
        message: 'Program created successfully',
        data: {
          program: program.toJSON()
        }
      });

    } catch (error) {
      logError('Failed to create program', error, {
        programData: req.body,
        ip: req.ip
      });

      // Handle unique constraint violation
      if (error.code === '23505') {
        return res.status(400).json({
          code: 400,
          message: 'Program with this sequence number already exists',
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

  // Admin: Update program
  static async updateProgram(req, res) {
    try {
      if (!req.isAdmin) {
        return res.status(403).json({
          code: 403,
          message: 'Admin access required',
          data: null
        });
      }

      const programId = parseInt(req.params.id);
      const program = await Program.findById(programId);

      if (!program) {
        return res.status(404).json({
          code: 404,
          message: 'Program not found',
          data: null
        });
      }

      await program.update(req.body);

      logAudit('PROGRAM_UPDATE', null, {
        programId,
        updateData: req.body,
        ip: req.ip
      });

      res.json({
        code: 200,
        message: 'Program updated successfully',
        data: {
          program: program.toJSON()
        }
      });

    } catch (error) {
      logError('Failed to update program', error, {
        programId: req.params.id,
        updateData: req.body,
        ip: req.ip
      });

      res.status(500).json({
        code: 500,
        message: 'Failed to update program',
        data: null
      });
    }
  }

  // Admin: Delete program
  static async deleteProgram(req, res) {
    try {
      if (!req.isAdmin) {
        return res.status(403).json({
          code: 403,
          message: 'Admin access required',
          data: null
        });
      }

      const programId = parseInt(req.params.id);
      const program = await Program.findById(programId);

      if (!program) {
        return res.status(404).json({
          code: 404,
          message: 'Program not found',
          data: null
        });
      }

      // Check if program has votes
      const voteCountResult = await query(
        'SELECT COUNT(*) as count FROM votes WHERE program_id = $1',
        [programId]
      );
      const voteCount = parseInt(voteCountResult.rows[0].count);

      if (voteCount > 0) {
        return res.status(400).json({
          code: 400,
          message: 'Cannot delete program with existing votes',
          data: { voteCount }
        });
      }

      await program.delete();

      logAudit('PROGRAM_DELETE', null, {
        programId,
        programTitle: program.title,
        ip: req.ip
      });

      res.json({
        code: 200,
        message: 'Program deleted successfully',
        data: null
      });

    } catch (error) {
      logError('Failed to delete program', error, {
        programId: req.params.id,
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

module.exports = ProgramController;