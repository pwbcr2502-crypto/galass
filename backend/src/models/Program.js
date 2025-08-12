const { query } = require('../config/database');

class Program {
  constructor(data = {}) {
    this.id = data.id;
    this.eventId = data.event_id;
    this.seqNo = data.seq_no;
    this.title = data.title;
    this.performer = data.performer;
    this.description = data.description;
    this.durationMinutes = data.duration_minutes;
    this.voteStartAt = data.vote_start_at;
    this.voteEndAt = data.vote_end_at;
    this.status = data.status || 0; // 0: not started, 1: voting, 2: ended
    this.createdAt = data.created_at;
  }

  // Find program by ID
  static async findById(id) {
    const result = await query(
      'SELECT * FROM programs WHERE id = $1',
      [id]
    );
    return result.rows.length > 0 ? new Program(result.rows[0]) : null;
  }

  // Get programs for an event
  static async findByEventId(eventId, orderBy = 'seq_no ASC') {
    const result = await query(
      `SELECT * FROM programs WHERE event_id = $1 ORDER BY ${orderBy}`,
      [eventId]
    );
    return result.rows.map(row => new Program(row));
  }

    // Get all programs for an event (not just active ones) for mobile display
  static async findActiveByEventId(eventId) {
    const result = await query(
      `SELECT * FROM programs 
       WHERE event_id = $1 
       ORDER BY seq_no ASC`,
      [eventId]
    );
    return result.rows.map(row => new Program(row));
  }

  // Get current voting program for an event
  static async getCurrentVotingProgram(eventId) {
    const result = await query(
      'SELECT * FROM programs WHERE event_id = $1 AND status = 1 ORDER BY seq_no LIMIT 1',
      [eventId]
    );
    return result.rows.length > 0 ? new Program(result.rows[0]) : null;
  }

  // Get next program to vote
  static async getNextProgram(eventId, currentSeqNo) {
    const result = await query(
      'SELECT * FROM programs WHERE event_id = $1 AND seq_no > $2 AND status = 0 ORDER BY seq_no LIMIT 1',
      [eventId, currentSeqNo]
    );
    return result.rows.length > 0 ? new Program(result.rows[0]) : null;
  }

  // Create new program
  static async create(programData) {
    const { eventId, seqNo, title, performer, description, durationMinutes } = programData;
    const result = await query(
      `INSERT INTO programs (event_id, seq_no, title, performer, description, duration_minutes, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP) 
       RETURNING *`,
      [eventId, seqNo, title, performer, description, durationMinutes || 5]
    );

    const program = new Program(result.rows[0]);
    
    // Initialize statistics for this program
    await program.initializeStatistics();
    
    return program;
  }

  // Batch create programs
  static async batchCreate(eventId, programList) {
    const values = programList.map((prog, index) => {
      const baseIndex = index * 6;
      return `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5}, $${baseIndex + 6})`;
    }).join(', ');

    const params = programList.flatMap(prog => [
      eventId,
      prog.seqNo,
      prog.title,
      prog.performer,
      prog.description || null,
      prog.durationMinutes || 5
    ]);

    const result = await query(
      `INSERT INTO programs (event_id, seq_no, title, performer, description, duration_minutes) 
       VALUES ${values} 
       RETURNING *`,
      params
    );

    const programs = result.rows.map(row => new Program(row));
    
    // Initialize statistics for all programs
    await Promise.all(programs.map(program => program.initializeStatistics()));
    
    return programs;
  }

  // Initialize statistics for this program
  async initializeStatistics() {
    const dimensions = ['stage_presence', 'performance', 'popularity', 'teamwork', 'creativity'];
    
    const values = dimensions.map((dim, index) => {
      const baseIndex = index * 3;
      return `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3})`;
    }).join(', ');

    const params = dimensions.flatMap(dim => [this.eventId, this.id, dim]);

    await query(
      `INSERT INTO program_statistics (event_id, program_id, dimension) 
       VALUES ${values} 
       ON CONFLICT (event_id, program_id, dimension) DO NOTHING`,
      params
    );
  }

  // Update program
  async update(updateData) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id') {
        const dbKey = key === 'eventId' ? 'event_id' :
                      key === 'seqNo' ? 'seq_no' :
                      key === 'durationMinutes' ? 'duration_minutes' :
                      key === 'voteStartAt' ? 'vote_start_at' :
                      key === 'voteEndAt' ? 'vote_end_at' : key;
        fields.push(`${dbKey} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      return this;
    }

    values.push(this.id);
    const result = await query(
      `UPDATE programs SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    if (result.rows.length > 0) {
      Object.assign(this, new Program(result.rows[0]));
    }

    return this;
  }

  // Start voting for this program
  async startVoting(durationMinutes = null) {
    const duration = durationMinutes || this.durationMinutes || 5;
    const voteEndAt = new Date(Date.now() + duration * 60 * 1000);

    await this.update({
      status: 1,
      voteStartAt: new Date(),
      voteEndAt: voteEndAt
    });

    return this;
  }

  // End voting for this program
  async endVoting() {
    await this.update({
      status: 2,
      voteEndAt: new Date()
    });

    return this;
  }

  // Check if voting is active
  isVotingActive() {
    if (this.status !== 1) return false;
    
    // 如果没有设置结束时间，只依赖状态判断
    if (!this.voteEndAt) {
      return true;
    }
    
    const now = new Date();
    const endTime = new Date(this.voteEndAt);
    
    // 增加60秒的缓冲时间，避免网络延迟和用户提交延迟造成的边界问题
    const bufferTime = 60 * 1000; // 60秒
    const bufferedEndTime = new Date(endTime.getTime() + bufferTime);
    
    const isActive = now < bufferedEndTime;
    
    // 记录详细的时间信息用于调试
    if (!isActive) {
      console.log('投票窗口检查:', {
        programId: this.id,
        status: this.status,
        now: now.toISOString(),
        endTime: endTime.toISOString(),
        bufferedEndTime: bufferedEndTime.toISOString(),
        bufferSeconds: bufferTime / 1000,
        isActive
      });
    }
    
    return isActive;
  }

  // Get remaining voting time in seconds
  getRemainingVoteTime() {
    if (this.status !== 1 || !this.voteEndAt) return 0;
    
    const now = new Date();
    const endTime = new Date(this.voteEndAt);
    
    // 考虑缓冲时间的剩余时间计算
    const remainingTime = Math.floor((endTime - now) / 1000);
    
    // 如果剩余时间在缓冲范围内，返回小的正值而不是0，让前端知道投票即将结束
    // 现在缓冲时间为60秒
    if (remainingTime <= 60 && remainingTime > -60) {
      return Math.max(1, remainingTime + 60);
    }
    
    return Math.max(0, remainingTime);
  }

  // Get vote statistics for this program
  async getStatistics() {
    const result = await query(
      `SELECT dimension, total_stars, avg_score, vote_count, five_star_count 
       FROM program_statistics 
       WHERE event_id = $1 AND program_id = $2`,
      [this.eventId, this.id]
    );

    const stats = {};
    result.rows.forEach(row => {
      stats[row.dimension] = {
        totalStars: parseInt(row.total_stars),
        avgScore: parseFloat(row.avg_score),
        voteCount: parseInt(row.vote_count),
        fiveStarCount: parseInt(row.five_star_count)
      };
    });

    // Calculate composite score
    const dimensions = ['stage_presence', 'performance', 'popularity', 'teamwork', 'creativity'];
    let totalScore = 0;
    let totalVotes = 0;

    dimensions.forEach(dim => {
      if (stats[dim]) {
        totalScore += stats[dim].totalStars;
        totalVotes = Math.max(totalVotes, stats[dim].voteCount);
      }
    });

    stats.composite = {
      totalScore: totalScore,
      avgScore: totalVotes > 0 ? (totalScore / (totalVotes * 5)) * 5 : 0,
      voteCount: totalVotes
    };

    return stats;
  }

  // Get all votes for this program
  async getVotes() {
    const result = await query(
      `SELECT v.*, e.name as employee_name, e.department 
       FROM votes v 
       JOIN employees e ON v.employee_id = e.id 
       WHERE v.event_id = $1 AND v.program_id = $2 
       ORDER BY v.submitted_at DESC`,
      [this.eventId, this.id]
    );
    return result.rows;
  }

  // Delete program (and related data)
  async delete() {
    await query('DELETE FROM program_statistics WHERE program_id = $1', [this.id]);
    await query('DELETE FROM votes WHERE program_id = $1', [this.id]);
    await query('DELETE FROM programs WHERE id = $1', [this.id]);
    return true;
  }

  // Convert to JSON
  toJSON() {
    return {
      id: this.id,
      eventId: this.eventId,
      seqNo: this.seqNo,
      title: this.title,
      performer: this.performer,
      description: this.description,
      durationMinutes: this.durationMinutes,
      voteStartAt: this.voteStartAt,
      voteEndAt: this.voteEndAt,
      status: this.status,
      remainingTime: this.getRemainingVoteTime(),
      isVotingActive: this.isVotingActive(),
      createdAt: this.createdAt
    };
  }
}

module.exports = Program;