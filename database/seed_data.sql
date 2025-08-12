-- Seed data for testing
-- Insert sample event
INSERT INTO events (code, name, weights, status) VALUES 
('ANNIV2025', '公司一周年庆典晚会', '{
    "stage_presence": 0.20,
    "performance": 0.25, 
    "popularity": 0.20,
    "teamwork": 0.15,
    "creativity": 0.20
}'::jsonb, 0);

-- Insert sample employees
INSERT INTO employees (emp_no, name, department) VALUES 
('E001', '张三', '技术部'),
('E002', '李四', '市场部'),
('E003', '王五', '人事部'),
('E004', '赵六', '财务部'),
('E005', '钱七', '运营部'),
('E006', '孙八', '技术部'),
('E007', '周九', '市场部'),
('E008', '吴十', '设计部'),
('E009', '郑一', '产品部'),
('E010', '冯二', '销售部');

-- Insert sample programs
INSERT INTO programs (event_id, seq_no, title, performer, description) VALUES 
(1, 1, '开场舞蹈《青春律动》', '人事部舞蹈队', '充满活力的现代舞表演'),
(1, 2, '歌曲串烧《经典回忆》', '市场部合唱团', '怀旧金曲大联唱'),
(1, 3, '小品《办公室趣事》', '技术部剧组', '幽默诙谐的职场小品'),
(1, 4, '民族舞《茉莉花》', '财务部舞蹈队', '优雅的中国古典舞'),
(1, 5, '乐器演奏《卡农》', '运营部乐团', '经典钢琴与小提琴合奏'),
(1, 6, '现代舞《未来之光》', '设计部舞团', '科技感十足的现代舞'),
(1, 7, '相声《说学逗唱》', '产品部相声组', '传统相声表演'),
(1, 8, '歌曲《我和我的祖国》', '销售部独唱', '深情演唱爱国歌曲');

-- Initialize program statistics (empty initially)
INSERT INTO program_statistics (event_id, program_id, dimension, total_stars, avg_score, vote_count, five_star_count)
SELECT 
    p.event_id,
    p.id as program_id,
    d.dimension,
    0 as total_stars,
    0 as avg_score,
    0 as vote_count,
    0 as five_star_count
FROM programs p
CROSS JOIN (
    VALUES 
    ('stage_presence'),
    ('performance'),
    ('popularity'),
    ('teamwork'),
    ('creativity')
) AS d(dimension)
WHERE p.event_id = 1;