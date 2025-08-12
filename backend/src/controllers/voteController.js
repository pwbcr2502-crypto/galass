const Vote = require('../models/Vote');
const Program = require('../models/Program');
const Employee = require('../models/Employee');
const { query } = require('../config/database');
const { logInfo, logWarn, logError, logAudit } = require('../config/logger');

class VoteController {
  // Submit a vote
  static async submitVote(req, res) {
    try {
      const { programId, scores } = req.body;
      const { employeeId, eventId } = req.user;
      const ipAddress = req.ip;
      const userAgent = req.headers['user-agent'];
      const deviceId = req.deviceId;

      // Find program and validate
      const program = await Program.findById(programId);
      if (!program) {
        return res.status(404).json({
          code: 404,
          message: 'Program not found',
          data: null
        });
      }

      // Check if program belongs to the same event
      if (program.eventId !== eventId) {
        return res.status(400).json({
          code: 400,
          message: 'Program does not belong to current event',
          data: null
        });
      }

      // Check if voting is active for this program
      if (!program.isVotingActive()) {
        const statusMap = {
          0: '投票尚未开始',
          1: '投票时间已结束',
          2: '投票已结束'
        };
        
        const statusText = program.status === 1 ? statusMap[1] : statusMap[program.status] || '投票状态异常';
        const remainingTime = program.getRemainingVoteTime();
        
        // 计算时间差异以便调试
        const now = new Date();
        const endTime = program.voteEndAt ? new Date(program.voteEndAt) : null;
        const timeDiffSeconds = endTime ? Math.floor((now - endTime) / 1000) : null;
        
        console.log('投票窗口检查失败:', {
          programId: program.id,
          programTitle: program.title,
          status: program.status,
          statusText,
          remainingTime,
          voteEndAt: program.voteEndAt,
          now: now.toISOString(),
          timeDiffSeconds: timeDiffSeconds, // 正值表示超时多少秒
          explanation: timeDiffSeconds > 0 && timeDiffSeconds <= 60 ? 
            `超时${timeDiffSeconds}秒，但应在60秒缓冲期内` : '正常超时'
        });
        
        return res.status(400).json({
          code: 400,
          message: `${statusText}，无法提交投票`,
          data: {
            programId: program.id,
            programTitle: program.title,
            programStatus: program.status,
            statusText,
            remainingTime,
            voteEndAt: program.voteEndAt,
            debugInfo: {
              serverTime: now.toISOString(),
              isVotingActive: false,
              timeDiffSeconds,
              bufferTimeUsed: 60
            }
          }
        });
      }

      // Check if user has already voted for this program
      const existingVote = await Vote.findExisting(eventId, programId, employeeId);
      if (existingVote) {
        logWarn('Duplicate vote attempt', {
          employeeId,
          programId,
          programTitle: program.title,
          eventId,
          ip: ipAddress,
          existingVoteTime: existingVote.submittedAt
        });

        return res.status(400).json({
          code: 400,
          message: '您已为此节目投过票了',
          data: {
            programTitle: program.title,
            voteSubmittedAt: existingVote.submittedAt,
            existingVote: {
              id: existingVote.id,
              scores: {
                stagePresence: existingVote.stagePresence,
                performance: existingVote.performance,
                popularity: existingVote.popularity,
                teamwork: existingVote.teamwork,
                creativity: existingVote.creativity
              },
              submittedAt: existingVote.submittedAt
            }
          }
        });
      }

      // Create vote
      const voteData = {
        eventId,
        programId,
        employeeId,
        stagePresence: scores.stagePresence,
        performance: scores.performance,
        popularity: scores.popularity,
        teamwork: scores.teamwork,
        creativity: scores.creativity
      };

      const metaData = {
        ipAddress,
        userAgent,
        deviceId
      };

      const vote = await Vote.create(voteData, metaData);

      // Log audit
      logAudit('VOTE_SUBMIT', employeeId, {
        programId,
        eventId,
        scores: scores,
        ip: ipAddress,
        deviceId
      });

      logInfo('Vote submitted successfully', {
        voteId: vote.id,
        employeeId,
        programId,
        programTitle: program.title,
        eventId,
        scores: {
          stagePresence: vote.stagePresence,
          performance: vote.performance,
          popularity: vote.popularity,
          teamwork: vote.teamwork,
          creativity: vote.creativity
        },
        compositeScore: vote.compositeScore,
        submittedAt: vote.submittedAt
      });

      // Get updated program statistics
      const statistics = await program.getStatistics();

      // Find next program to vote (if any)
      const nextProgram = await Program.getNextProgram(eventId, program.seqNo);

      res.json({
        code: 200,
        message: '投票提交成功！感谢您的参与',
        data: {
          vote: vote.toJSON(),
          program: {
            id: program.id,
            title: program.title,
            performer: program.performer
          },
          statistics,
          nextProgram: nextProgram ? nextProgram.toJSON() : null,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      logError('Vote submission failed', error, {
        userId: req.user?.employeeId,
        programId: req.body.programId,
        ip: req.ip
      });

      // Handle specific database errors
      if (error.code === '23505') { // Unique constraint violation
        return res.status(400).json({
          code: 400,
          message: 'Duplicate vote detected',
          data: null
        });
      }

      res.status(500).json({
        code: 500,
        message: 'Vote submission failed',
        data: null
      });
    }
  }

  // Get user's votes for current event
  static async getMyVotes(req, res) {
    try {
      const { employeeId, eventId } = req.user;

      const votes = await Vote.findByEmployeeId(employeeId, eventId);

      res.json({
        code: 200,
        message: 'Votes retrieved successfully',
        data: {
          votes,
          totalVotes: votes.length
        }
      });

    } catch (error) {
      logError('Failed to get user votes', error, {
        userId: req.user?.employeeId,
        ip: req.ip
      });

      res.status(500).json({
        code: 500,
        message: 'Failed to retrieve votes',
        data: null
      });
    }
  }

  // Get votes for a specific program (admin or public stats)
  static async getProgramVotes(req, res) {
    try {
      const programId = parseInt(req.params.programId);
      const { eventId } = req.user;

      // Verify program belongs to current event
      const program = await Program.findById(programId);
      if (!program || program.eventId !== eventId) {
        return res.status(404).json({
          code: 404,
          message: 'Program not found',
          data: null
        });
      }

      // Get vote statistics (public info)
      const statistics = await program.getStatistics();

      // Get voting progress
      const progressResult = await query(
        `SELECT 
          COUNT(v.id) as current_votes,
          (SELECT COUNT(*) FROM employees WHERE status = 1) as total_employees
         FROM votes v 
         WHERE v.program_id = $1`,
        [programId]
      );

      const progress = progressResult.rows[0];

      res.json({
        code: 200,
        message: 'Program votes retrieved successfully',
        data: {
          program: program.toJSON(),
          statistics,
          progress: {
            currentVotes: parseInt(progress.current_votes),
            totalEmployees: parseInt(progress.total_employees),
            participationRate: progress.total_employees > 0 ? 
              (progress.current_votes / progress.total_employees * 100).toFixed(2) : 0
          }
        }
      });

    } catch (error) {
      logError('Failed to get program votes', error, {
        programId: req.params.programId,
        userId: req.user?.employeeId,
        ip: req.ip
      });

      res.status(500).json({
        code: 500,
        message: 'Failed to retrieve program votes',
        data: null
      });
    }
  }

  // Get overall voting statistics
  static async getVotingStatistics(req, res) {
    try {
      const { eventId } = req.user;

      // Get overall statistics
      const overallStats = await Vote.getVoteStatistics(eventId);

      // Get voting progress by program
      const progressStats = await Vote.getVotingProgress(eventId);

      // Get top programs by different dimensions
      const topPrograms = {
        composite: await Vote.getTopPrograms(eventId, 'composite', 5),
        stagePresence: await Vote.getTopPrograms(eventId, 'stage_presence', 3),
        performance: await Vote.getTopPrograms(eventId, 'performance', 3),
        popularity: await Vote.getTopPrograms(eventId, 'popularity', 3),
        teamwork: await Vote.getTopPrograms(eventId, 'teamwork', 3),
        creativity: await Vote.getTopPrograms(eventId, 'creativity', 3)
      };

      // Calculate participation rate
      const totalEmployeesResult = await query(
        'SELECT COUNT(*) as total FROM employees WHERE status = 1'
      );
      const totalEmployees = parseInt(totalEmployeesResult.rows[0].total);
      
      const participationRate = totalEmployees > 0 ? 
        (overallStats.unique_voters / totalEmployees * 100).toFixed(2) : 0;

      res.json({
        code: 200,
        message: 'Voting statistics retrieved successfully',
        data: {
          overall: {
            ...overallStats,
            totalEmployees,
            participationRate
          },
          programProgress: progressStats,
          rankings: topPrograms
        }
      });

    } catch (error) {
      logError('Failed to get voting statistics', error, {
        userId: req.user?.employeeId,
        ip: req.ip
      });

      res.status(500).json({
        code: 500,
        message: 'Failed to retrieve voting statistics',
        data: null
      });
    }
  }

  // Get real-time leaderboard
  static async getLeaderboard(req, res) {
    try {
      const { eventId } = req.user;
      const { dimension = 'composite', limit = 10 } = req.query;

      const topPrograms = await Vote.getTopPrograms(eventId, dimension, parseInt(limit));

      res.json({
        code: 200,
        message: 'Leaderboard retrieved successfully',
        data: {
          dimension,
          programs: topPrograms,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      logError('Failed to get leaderboard', error, {
        userId: req.user?.employeeId,
        ip: req.ip
      });

      res.status(500).json({
        code: 500,
        message: 'Failed to retrieve leaderboard',
        data: null
      });
    }
  }

  // Check if user can vote for a program
  static async canVote(req, res) {
    try {
      const programId = parseInt(req.params.programId);
      const { employeeId, eventId } = req.user;

      // Find program
      const program = await Program.findById(programId);
      if (!program || program.eventId !== eventId) {
        return res.status(404).json({
          code: 404,
          message: 'Program not found',
          data: null
        });
      }

      // Check if already voted
      const hasVoted = await Vote.findExisting(eventId, programId, employeeId) !== null;

      // Check if voting is active
      const isVotingActive = program.isVotingActive();

      res.json({
        code: 200,
        message: 'Vote eligibility checked',
        data: {
          canVote: !hasVoted && isVotingActive,
          hasVoted,
          isVotingActive,
          programStatus: program.status,
          remainingTime: program.getRemainingVoteTime(),
          program: program.toJSON()
        }
      });

    } catch (error) {
      logError('Failed to check vote eligibility', error, {
        programId: req.params.programId,
        userId: req.user?.employeeId,
        ip: req.ip
      });

      res.status(500).json({
        code: 500,
        message: 'Failed to check vote eligibility',
        data: null
      });
    }
  }

  // Get voting summary for user dashboard
  static async getVotingSummary(req, res) {
    try {
      const { employeeId, eventId } = req.user;

      // Get user's votes
      const myVotes = await Vote.findByEmployeeId(employeeId, eventId);

      // Get all programs for the event
      const allPrograms = await Program.findByEventId(eventId);

      // Get current voting program
      const currentProgram = await Program.getCurrentVotingProgram(eventId);

      // Calculate summary
      const summary = {
        totalPrograms: allPrograms.length,
        votedPrograms: myVotes.length,
        remainingPrograms: allPrograms.length - myVotes.length,
        currentProgram: currentProgram ? currentProgram.toJSON() : null,
        completedPrograms: allPrograms.filter(p => p.status === 2).length,
        upcomingPrograms: allPrograms.filter(p => p.status === 0).length
      };

      res.json({
        code: 200,
        message: 'Voting summary retrieved successfully',
        data: {
          summary,
          myVotes,
          programs: allPrograms.map(p => ({
            ...p.toJSON(),
            hasVoted: myVotes.some(v => v.program_id === p.id)
          }))
        }
      });

    } catch (error) {
      logError('Failed to get voting summary', error, {
        userId: req.user?.employeeId,
        ip: req.ip
      });

      res.status(500).json({
        code: 500,
        message: 'Failed to retrieve voting summary',
        data: null
      });
    }
  }
}

module.exports = VoteController;