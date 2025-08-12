-- Company Anniversary Voting System Database Schema
-- PostgreSQL version

-- Create database (run as superuser)
-- CREATE DATABASE anniversary_voting;

-- Connect to the database and create tables

-- Events table (support multiple events)
CREATE TABLE events (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(32) NOT NULL UNIQUE,
    name VARCHAR(128) NOT NULL,
    mode SMALLINT NOT NULL DEFAULT 1, -- 1: per program, 2: unified
    window_minutes INTEGER DEFAULT 5,
    weights JSONB NOT NULL, -- dimension weights configuration
    theme_config JSONB,
    status SMALLINT DEFAULT 0, -- 0: not started, 1: in progress, 2: ended
    start_time TIMESTAMP NULL,
    end_time TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for events
CREATE INDEX idx_events_code ON events(code);
CREATE INDEX idx_events_status ON events(status);

-- Employees table
CREATE TABLE employees (
    id BIGSERIAL PRIMARY KEY,
    emp_no VARCHAR(32) NOT NULL UNIQUE,
    name VARCHAR(64) NOT NULL,
    department VARCHAR(64),
    mobile VARCHAR(20),
    status SMALLINT DEFAULT 1, -- 1: active, 0: inactive
    last_login_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for employees
CREATE INDEX idx_employees_emp_no ON employees(emp_no);
CREATE INDEX idx_employees_department ON employees(department);

-- Programs table
CREATE TABLE programs (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    seq_no INTEGER NOT NULL,
    title VARCHAR(128) NOT NULL,
    performer VARCHAR(256) NOT NULL,
    description TEXT,
    duration_minutes INTEGER DEFAULT 5,
    vote_start_at TIMESTAMP NULL,
    vote_end_at TIMESTAMP NULL,
    status SMALLINT DEFAULT 0, -- 0: not started, 1: voting, 2: ended
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_id, seq_no)
);

-- Create indexes for programs
CREATE INDEX idx_programs_event_id ON programs(event_id);
CREATE INDEX idx_programs_status ON programs(status);

-- Votes table (core table)
CREATE TABLE votes (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    program_id BIGINT NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    stage_presence SMALLINT NOT NULL CHECK (stage_presence BETWEEN 1 AND 5),
    performance SMALLINT NOT NULL CHECK (performance BETWEEN 1 AND 5),
    popularity SMALLINT NOT NULL CHECK (popularity BETWEEN 1 AND 5),
    teamwork SMALLINT NOT NULL CHECK (teamwork BETWEEN 1 AND 5),
    creativity SMALLINT NOT NULL CHECK (creativity BETWEEN 1 AND 5),
    composite_score DECIMAL(5,2) GENERATED ALWAYS AS (
        stage_presence + performance + popularity + teamwork + creativity
    ) STORED,
    submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent VARCHAR(512),
    device_id VARCHAR(128),
    UNIQUE(event_id, program_id, employee_id)
);

-- Create indexes for votes
CREATE INDEX idx_votes_program_id ON votes(program_id);
CREATE INDEX idx_votes_employee_id ON votes(employee_id);
CREATE INDEX idx_votes_submitted_at ON votes(submitted_at);

-- Statistics cache table (improve query performance)
CREATE TABLE program_statistics (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    program_id BIGINT NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    dimension VARCHAR(32) NOT NULL,
    total_stars INTEGER DEFAULT 0,
    avg_score DECIMAL(3,2) DEFAULT 0,
    vote_count INTEGER DEFAULT 0,
    five_star_count INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_id, program_id, dimension)
);

-- Create indexes for statistics
CREATE INDEX idx_program_statistics_event_program ON program_statistics(event_id, program_id);
CREATE INDEX idx_program_statistics_dimension_stars ON program_statistics(dimension, total_stars DESC);

-- Award results table
CREATE TABLE award_results (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    award_type VARCHAR(32) NOT NULL,
    program_id BIGINT NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    core_dimension_score INTEGER NOT NULL,
    aux_dimension_score INTEGER,
    decision_log JSONB,
    award_speech TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP NULL,
    UNIQUE(event_id, award_type)
);

-- Audit log table
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT REFERENCES events(id),
    user_id BIGINT REFERENCES employees(id),
    action_type VARCHAR(50) NOT NULL,
    action_detail JSONB,
    ip_address INET,
    request_id VARCHAR(64),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for audit logs
CREATE INDEX idx_audit_logs_event_id ON audit_logs(event_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- User sessions table (for JWT token management)
CREATE TABLE user_sessions (
    id BIGSERIAL PRIMARY KEY,
    employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    ip_address INET,
    user_agent VARCHAR(512),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, event_id)
);

-- Create index for sessions
CREATE INDEX idx_user_sessions_token_hash ON user_sessions(token_hash);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);

-- Create trigger function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_program_statistics_updated_at BEFORE UPDATE ON program_statistics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();