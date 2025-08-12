const { query, withTransaction } = require('../config/database');

class Vote {
  constructor(data = {}) {
    this.id = data.id;
    this.eventId = data.event_id;
    this.programId = data.program_id;
    this.employeeId = data.employee_id;
    this.stagePresence = data.stage_presence;
    this.performance = data.performance;
    this.popularity = data.popularity;
    this.teamwork = data.teamwork;
    this.creativity = data.creativity;
    this.compositeScore = data.composite_score;
    this.submittedAt = data.submitted_at;
    this.ipAddress = data.ip_address;
    this.userAgent = data.user_agent;
    this.deviceId = data.device_id;
  }

  // Find vote by ID
  static async findById(id) {
    const result = await query(
      'SELECT * FROM votes WHERE id = $1',
      [id]
    );
    return result.rows.length > 0 ? new Vote(result.rows[0]) : null;
  }

  // Find existing vote
  static async findExisting(eventId, programId, employeeId) {
    const result = await query(
      'SELECT * FROM votes WHERE event_id = $1 AND program_id = $2 AND employee_id = $3',
      [eventId, programId, employeeId]
    );
    return result.rows.length > 0 ? new Vote(result.rows[0]) : null;
  }

  // Get votes for a program
  static async findByProgramId(programId) {
    const result = await query(
      `SELECT v.*, e.name as employee_name, e.department 
       FROM votes v 
       JOIN employees e ON v.employee_id = e.id 
       WHERE v.program_id = $1 
       ORDER BY v.submitted_at DESC`,
      [programId]
    );
    return result.rows.map(row => new Vote(row));
  }

  // Get votes for an event
  static async findByEventId(eventId) {
    const result = await query(
      `SELECT v.*, e.name as employee_name, e.department, p.title as program_title 
       FROM votes v 
       JOIN employees e ON v.employee_id = e.id 
       JOIN programs p ON v.program_id = p.id 
       WHERE v.event_id = $1 
       ORDER BY v.submitted_at DESC`,
      [eventId]
    );
    return result.rows.map(row => new Vote(row));
  }

  // Get votes by employee
  static async findByEmployeeId(employeeId, eventId = null) {
    const whereClause = eventId ? 
      'WHERE v.employee_id = $1 AND v.event_id = $2' : 
      'WHERE v.employee_id = $1';
    const params = eventId ? [employeeId, eventId] : [employeeId];

    const result = await query(
      `SELECT v.*, p.title as program_title, p.performer 
       FROM votes v 
       JOIN programs p ON v.program_id = p.id 
       ${whereClause}
       ORDER BY v.submitted_at DESC`,
      params
    );
    return result.rows.map(row => new Vote(row));
  }

  // Create new vote with statistics update
  static async create(voteData, metaData = {}) {
    const {
      eventId,
      programId,
      employeeId,
      stagePresence,
      performance,
      popularity,
      teamwork,
      creativity
    } = voteData;

    const { ipAddress, userAgent, deviceId } = metaData;

    return await withTransaction(async (client) => {
      // Insert the vote
      const voteResult = await client.query(
        `INSERT INTO votes (
          event_id, program_id, employee_id, 
          stage_presence, performance, popularity, teamwork, creativity,
          ip_address, user_agent, device_id, submitted_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP) 
        RETURNING *`,
        [
          eventId, programId, employeeId,
          stagePresence, performance, popularity, teamwork, creativity,
          ipAddress, userAgent, deviceId
        ]
      );

      const vote = new Vote(voteResult.rows[0]);

      // Update statistics for each dimension
      const dimensions = {
        stage_presence: stagePresence,
        performance: performance,
        popularity: popularity,
        teamwork: teamwork,
        creativity: creativity
      };

      for (const [dimension, score] of Object.entries(dimensions)) {
        await client.query(
          `UPDATE program_statistics SET 
            total_stars = total_stars + $1,
            vote_count = vote_count + 1,
            five_star_count = five_star_count + $2,
            avg_score = (total_stars + $1) / (vote_count + 1),
            updated_at = CURRENT_TIMESTAMP
          WHERE event_id = $3 AND program_id = $4 AND dimension = $5`,
          [score, score === 5 ? 1 : 0, eventId, programId, dimension]
        );
      }

      return vote;
    });
  }

  // Batch create votes (for testing or data import)
  static async batchCreate(voteList) {
    return await withTransaction(async (client) => {
      const votes = [];

      for (const voteData of voteList) {
        const vote = await Vote.create(voteData, {});
        votes.push(vote);
      }

      return votes;
    });
  }

  // Get vote statistics summary
  static async getVoteStatistics(eventId, programId = null) {
    const whereClause = programId ? 
      'WHERE event_id = $1 AND program_id = $2' : 
      'WHERE event_id = $1';
    const params = programId ? [eventId, programId] : [eventId];

    const result = await query(
      `SELECT 
        COUNT(*) as total_votes,
        AVG(stage_presence) as avg_stage_presence,
        AVG(performance) as avg_performance,
        AVG(popularity) as avg_popularity,
        AVG(teamwork) as avg_teamwork,
        AVG(creativity) as avg_creativity,
        AVG(composite_score) as avg_composite_score,
        COUNT(DISTINCT employee_id) as unique_voters
       FROM votes 
       ${whereClause}`,
      params
    );

    return result.rows[0];
  }

  // Get top programs by dimension
  static async getTopPrograms(eventId, dimension = 'composite', limit = 10) {
    const validDimensions = ['stage_presence', 'performance', 'popularity', 'teamwork', 'creativity', 'composite'];
    if (!validDimensions.includes(dimension)) {
      throw new Error('Invalid dimension');
    }

    const orderBy = dimension === 'composite' ? 
      'avg_composite_score' : 
      `avg_${dimension}`;

    const result = await query(
      `SELECT 
        p.id, p.title, p.performer, p.seq_no,
        AVG(v.${dimension === 'composite' ? 'composite_score' : dimension}) as avg_score,
        COUNT(v.id) as vote_count
       FROM programs p
       LEFT JOIN votes v ON p.id = v.program_id
       WHERE p.event_id = $1
       GROUP BY p.id, p.title, p.performer, p.seq_no
       ORDER BY ${orderBy} DESC NULLS LAST, vote_count DESC
       LIMIT $2`,
      [eventId, limit]
    );

    return result.rows;
  }

  // Get voting progress for an event
  static async getVotingProgress(eventId) {
    const result = await query(
      `SELECT 
        p.id as program_id,
        p.title,
        p.status as program_status,
        COUNT(v.id) as vote_count,
        (SELECT COUNT(*) FROM employees WHERE status = 1) as total_employees
       FROM programs p
       LEFT JOIN votes v ON p.id = v.program_id
       WHERE p.event_id = $1
       GROUP BY p.id, p.title, p.status
       ORDER BY p.seq_no`,
      [eventId]
    );

    return result.rows;
  }

  // Delete vote (rarely used, for data correction)
  async delete() {
    return await withTransaction(async (client) => {
      // First, decrease the statistics
      const dimensions = {
        stage_presence: this.stagePresence,
        performance: this.performance,
        popularity: this.popularity,
        teamwork: this.teamwork,
        creativity: this.creativity
      };

      for (const [dimension, score] of Object.entries(dimensions)) {
        await client.query(
          `UPDATE program_statistics SET 
            total_stars = GREATEST(0, total_stars - $1),
            vote_count = GREATEST(0, vote_count - 1),
            five_star_count = GREATEST(0, five_star_count - $2),
            avg_score = CASE 
              WHEN vote_count - 1 > 0 
              THEN (total_stars - $1) / (vote_count - 1) 
              ELSE 0 
            END,
            updated_at = CURRENT_TIMESTAMP
          WHERE event_id = $3 AND program_id = $4 AND dimension = $5`,
          [score, score === 5 ? 1 : 0, this.eventId, this.programId, dimension]
        );
      }

      // Then delete the vote
      await client.query('DELETE FROM votes WHERE id = $1', [this.id]);
      return true;
    });
  }

  // Export vote data
  static async exportData(eventId, format = 'json') {
    const result = await query(
      `SELECT 
        v.*,
        e.emp_no, e.name as employee_name, e.department,
        p.title as program_title, p.performer, p.seq_no
       FROM votes v
       JOIN employees e ON v.employee_id = e.id
       JOIN programs p ON v.program_id = p.id
       WHERE v.event_id = $1
       ORDER BY p.seq_no, v.submitted_at`,
      [eventId]
    );

    if (format === 'csv') {
      const headers = [
        'vote_id', 'program_seq', 'program_title', 'performer',
        'emp_no', 'employee_name', 'department',
        'stage_presence', 'performance', 'popularity', 'teamwork', 'creativity',
        'composite_score', 'submitted_at'
      ];

      const csvData = result.rows.map(row => [
        row.id, row.seq_no, row.program_title, row.performer,
        row.emp_no, row.employee_name, row.department,
        row.stage_presence, row.performance, row.popularity, row.teamwork, row.creativity,
        row.composite_score, row.submitted_at
      ]);

      return { headers, data: csvData };
    }

    return result.rows;
  }

  // Convert to JSON
  toJSON() {
    return {
      id: this.id,
      eventId: this.eventId,
      programId: this.programId,
      employeeId: this.employeeId,
      scores: {
        stagePresence: this.stagePresence,
        performance: this.performance,
        popularity: this.popularity,
        teamwork: this.teamwork,
        creativity: this.creativity
      },
      compositeScore: this.compositeScore,
      submittedAt: this.submittedAt,
      ipAddress: this.ipAddress,
      userAgent: this.userAgent,
      deviceId: this.deviceId
    };
  }
}

module.exports = Vote;