--
-- PostgreSQL database dump
--

-- Dumped from database version 15.13
-- Dumped by pg_dump version 15.13

-- Started on 2025-08-12 02:20:52 UTC

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 230 (class 1255 OID 16568)
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 227 (class 1259 OID 16522)
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    id bigint NOT NULL,
    event_id bigint,
    user_id bigint,
    action_type character varying(50) NOT NULL,
    action_detail jsonb,
    ip_address inet,
    request_id character varying(64),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 16521)
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.audit_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.audit_logs_id_seq OWNER TO postgres;

--
-- TOC entry 3552 (class 0 OID 0)
-- Dependencies: 226
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;


--
-- TOC entry 225 (class 1259 OID 16500)
-- Name: award_results; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.award_results (
    id bigint NOT NULL,
    event_id bigint NOT NULL,
    award_type character varying(32) NOT NULL,
    program_id bigint NOT NULL,
    core_dimension_score integer NOT NULL,
    aux_dimension_score integer,
    decision_log jsonb,
    award_speech text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    published_at timestamp without time zone
);


ALTER TABLE public.award_results OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 16499)
-- Name: award_results_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.award_results_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.award_results_id_seq OWNER TO postgres;

--
-- TOC entry 3553 (class 0 OID 0)
-- Dependencies: 224
-- Name: award_results_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.award_results_id_seq OWNED BY public.award_results.id;


--
-- TOC entry 217 (class 1259 OID 16404)
-- Name: employees; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employees (
    id bigint NOT NULL,
    emp_no character varying(32) NOT NULL,
    name character varying(64) NOT NULL,
    department character varying(64),
    mobile character varying(20),
    status smallint DEFAULT 1,
    last_login_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.employees OWNER TO postgres;

--
-- TOC entry 216 (class 1259 OID 16403)
-- Name: employees_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.employees_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.employees_id_seq OWNER TO postgres;

--
-- TOC entry 3554 (class 0 OID 0)
-- Dependencies: 216
-- Name: employees_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.employees_id_seq OWNED BY public.employees.id;


--
-- TOC entry 215 (class 1259 OID 16386)
-- Name: events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.events (
    id bigint NOT NULL,
    code character varying(32) NOT NULL,
    name character varying(128) NOT NULL,
    mode smallint DEFAULT 1 NOT NULL,
    window_minutes integer DEFAULT 5,
    weights jsonb NOT NULL,
    theme_config jsonb,
    status smallint DEFAULT 0,
    start_time timestamp without time zone,
    end_time timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.events OWNER TO postgres;

--
-- TOC entry 214 (class 1259 OID 16385)
-- Name: events_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.events_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.events_id_seq OWNER TO postgres;

--
-- TOC entry 3555 (class 0 OID 0)
-- Dependencies: 214
-- Name: events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.events_id_seq OWNED BY public.events.id;


--
-- TOC entry 223 (class 1259 OID 16474)
-- Name: program_statistics; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.program_statistics (
    id bigint NOT NULL,
    event_id bigint NOT NULL,
    program_id bigint NOT NULL,
    dimension character varying(32) NOT NULL,
    total_stars integer DEFAULT 0,
    avg_score numeric(3,2) DEFAULT 0,
    vote_count integer DEFAULT 0,
    five_star_count integer DEFAULT 0,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.program_statistics OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 16473)
-- Name: program_statistics_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.program_statistics_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.program_statistics_id_seq OWNER TO postgres;

--
-- TOC entry 3556 (class 0 OID 0)
-- Dependencies: 222
-- Name: program_statistics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.program_statistics_id_seq OWNED BY public.program_statistics.id;


--
-- TOC entry 219 (class 1259 OID 16417)
-- Name: programs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.programs (
    id bigint NOT NULL,
    event_id bigint NOT NULL,
    seq_no integer NOT NULL,
    title character varying(128) NOT NULL,
    performer character varying(256) NOT NULL,
    description text,
    duration_minutes integer DEFAULT 5,
    vote_start_at timestamp without time zone,
    vote_end_at timestamp without time zone,
    status smallint DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.programs OWNER TO postgres;

--
-- TOC entry 218 (class 1259 OID 16416)
-- Name: programs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.programs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.programs_id_seq OWNER TO postgres;

--
-- TOC entry 3557 (class 0 OID 0)
-- Dependencies: 218
-- Name: programs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.programs_id_seq OWNED BY public.programs.id;


--
-- TOC entry 229 (class 1259 OID 16545)
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_sessions (
    id bigint NOT NULL,
    employee_id bigint NOT NULL,
    event_id bigint NOT NULL,
    token_hash character varying(255) NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    ip_address inet,
    user_agent character varying(512),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.user_sessions OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 16544)
-- Name: user_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_sessions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.user_sessions_id_seq OWNER TO postgres;

--
-- TOC entry 3558 (class 0 OID 0)
-- Dependencies: 228
-- Name: user_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_sessions_id_seq OWNED BY public.user_sessions.id;


--
-- TOC entry 221 (class 1259 OID 16438)
-- Name: votes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.votes (
    id bigint NOT NULL,
    event_id bigint NOT NULL,
    program_id bigint NOT NULL,
    employee_id bigint NOT NULL,
    stage_presence smallint NOT NULL,
    performance smallint NOT NULL,
    popularity smallint NOT NULL,
    teamwork smallint NOT NULL,
    creativity smallint NOT NULL,
    composite_score numeric(5,2) GENERATED ALWAYS AS (((((stage_presence + performance) + popularity) + teamwork) + creativity)) STORED,
    submitted_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ip_address inet,
    user_agent character varying(512),
    device_id character varying(128),
    CONSTRAINT votes_creativity_check CHECK (((creativity >= 1) AND (creativity <= 5))),
    CONSTRAINT votes_performance_check CHECK (((performance >= 1) AND (performance <= 5))),
    CONSTRAINT votes_popularity_check CHECK (((popularity >= 1) AND (popularity <= 5))),
    CONSTRAINT votes_stage_presence_check CHECK (((stage_presence >= 1) AND (stage_presence <= 5))),
    CONSTRAINT votes_teamwork_check CHECK (((teamwork >= 1) AND (teamwork <= 5)))
);


ALTER TABLE public.votes OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 16437)
-- Name: votes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.votes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.votes_id_seq OWNER TO postgres;

--
-- TOC entry 3559 (class 0 OID 0)
-- Dependencies: 220
-- Name: votes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.votes_id_seq OWNED BY public.votes.id;


--
-- TOC entry 3320 (class 2604 OID 16525)
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- TOC entry 3318 (class 2604 OID 16503)
-- Name: award_results id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.award_results ALTER COLUMN id SET DEFAULT nextval('public.award_results_id_seq'::regclass);


--
-- TOC entry 3302 (class 2604 OID 16407)
-- Name: employees id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees ALTER COLUMN id SET DEFAULT nextval('public.employees_id_seq'::regclass);


--
-- TOC entry 3296 (class 2604 OID 16389)
-- Name: events id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.events ALTER COLUMN id SET DEFAULT nextval('public.events_id_seq'::regclass);


--
-- TOC entry 3312 (class 2604 OID 16477)
-- Name: program_statistics id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.program_statistics ALTER COLUMN id SET DEFAULT nextval('public.program_statistics_id_seq'::regclass);


--
-- TOC entry 3305 (class 2604 OID 16420)
-- Name: programs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.programs ALTER COLUMN id SET DEFAULT nextval('public.programs_id_seq'::regclass);


--
-- TOC entry 3322 (class 2604 OID 16548)
-- Name: user_sessions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions ALTER COLUMN id SET DEFAULT nextval('public.user_sessions_id_seq'::regclass);


--
-- TOC entry 3309 (class 2604 OID 16441)
-- Name: votes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.votes ALTER COLUMN id SET DEFAULT nextval('public.votes_id_seq'::regclass);


--
-- TOC entry 3544 (class 0 OID 16522)
-- Dependencies: 227
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_logs (id, event_id, user_id, action_type, action_detail, ip_address, request_id, created_at) FROM stdin;
\.


--
-- TOC entry 3542 (class 0 OID 16500)
-- Dependencies: 225
-- Data for Name: award_results; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.award_results (id, event_id, award_type, program_id, core_dimension_score, aux_dimension_score, decision_log, award_speech, created_at, published_at) FROM stdin;
1	2	best_popularity	30	0	\N	\N	\N	2025-08-10 16:49:22.427645	2025-08-10 16:49:22.427645
2	2	best_performance	31	0	\N	\N	\N	2025-08-10 16:49:22.427645	2025-08-10 16:49:22.427645
\.


--
-- TOC entry 3534 (class 0 OID 16404)
-- Dependencies: 217
-- Data for Name: employees; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.employees (id, emp_no, name, department, mobile, status, last_login_at, created_at) FROM stdin;
8	E008	吴十	设计部	\N	1	\N	2025-08-09 21:07:31.279889
9	E009	郑一	产品部	\N	1	\N	2025-08-09 21:07:31.279889
10	E010	冯二	销售部	\N	1	\N	2025-08-09 21:07:31.279889
2	E002	李四	市场部	\N	1	2025-08-10 09:03:21.228113	2025-08-09 21:07:31.279889
3	E003	王五	人事部	\N	1	2025-08-12 01:50:23.109067	2025-08-09 21:07:31.279889
4	E004	赵六	财务部	\N	1	2025-08-10 16:13:25.693405	2025-08-09 21:07:31.279889
5	E005	钱七	运营部	\N	1	2025-08-10 16:45:53.678173	2025-08-09 21:07:31.279889
6	E006	孙八	技术部	\N	1	2025-08-10 16:48:31.985842	2025-08-09 21:07:31.279889
7	E007	周九	市场部	\N	1	2025-08-11 09:32:23.836684	2025-08-09 21:07:31.279889
1	E001	张三	技术部	\N	1	2025-08-11 09:42:22.738516	2025-08-09 21:07:31.279889
\.


--
-- TOC entry 3532 (class 0 OID 16386)
-- Dependencies: 215
-- Data for Name: events; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.events (id, code, name, mode, window_minutes, weights, theme_config, status, start_time, end_time, created_at, updated_at) FROM stdin;
1	ANNIV2025	公司一周年庆典晚会	1	5	{"teamwork": 0.15, "creativity": 0.20, "popularity": 0.20, "performance": 0.25, "stage_presence": 0.20}	\N	0	\N	\N	2025-08-09 21:07:31.276212	2025-08-09 21:07:31.276212
3	PWB222	pwb周年庆典2	0	5	{"teamwork": 0.15, "creativity": 0.2, "popularity": 0.2, "performance": 0.25, "stage_presence": 0.2}	\N	0	\N	\N	2025-08-10 04:22:17.69242	2025-08-10 16:44:23.011861
2	PWB111	PWB周年庆典	0	5	{"teamwork": 0.15, "creativity": 0.2, "popularity": 0.2, "performance": 0.25, "stage_presence": 0.2}	\N	1	\N	\N	2025-08-10 04:20:50.316444	2025-08-11 08:26:01.203688
\.


--
-- TOC entry 3540 (class 0 OID 16474)
-- Dependencies: 223
-- Data for Name: program_statistics; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.program_statistics (id, event_id, program_id, dimension, total_stars, avg_score, vote_count, five_star_count, updated_at) FROM stdin;
6	1	2	stage_presence	0	0.00	0	0	2025-08-09 21:07:31.288351
7	1	2	performance	0	0.00	0	0	2025-08-09 21:07:31.288351
8	1	2	popularity	0	0.00	0	0	2025-08-09 21:07:31.288351
9	1	2	teamwork	0	0.00	0	0	2025-08-09 21:07:31.288351
10	1	2	creativity	0	0.00	0	0	2025-08-09 21:07:31.288351
11	1	3	stage_presence	0	0.00	0	0	2025-08-09 21:07:31.288351
12	1	3	performance	0	0.00	0	0	2025-08-09 21:07:31.288351
13	1	3	popularity	0	0.00	0	0	2025-08-09 21:07:31.288351
14	1	3	teamwork	0	0.00	0	0	2025-08-09 21:07:31.288351
15	1	3	creativity	0	0.00	0	0	2025-08-09 21:07:31.288351
16	1	4	stage_presence	0	0.00	0	0	2025-08-09 21:07:31.288351
17	1	4	performance	0	0.00	0	0	2025-08-09 21:07:31.288351
18	1	4	popularity	0	0.00	0	0	2025-08-09 21:07:31.288351
19	1	4	teamwork	0	0.00	0	0	2025-08-09 21:07:31.288351
20	1	4	creativity	0	0.00	0	0	2025-08-09 21:07:31.288351
21	1	5	stage_presence	0	0.00	0	0	2025-08-09 21:07:31.288351
22	1	5	performance	0	0.00	0	0	2025-08-09 21:07:31.288351
23	1	5	popularity	0	0.00	0	0	2025-08-09 21:07:31.288351
24	1	5	teamwork	0	0.00	0	0	2025-08-09 21:07:31.288351
25	1	5	creativity	0	0.00	0	0	2025-08-09 21:07:31.288351
26	1	6	stage_presence	0	0.00	0	0	2025-08-09 21:07:31.288351
27	1	6	performance	0	0.00	0	0	2025-08-09 21:07:31.288351
28	1	6	popularity	0	0.00	0	0	2025-08-09 21:07:31.288351
29	1	6	teamwork	0	0.00	0	0	2025-08-09 21:07:31.288351
30	1	6	creativity	0	0.00	0	0	2025-08-09 21:07:31.288351
31	1	7	stage_presence	0	0.00	0	0	2025-08-09 21:07:31.288351
32	1	7	performance	0	0.00	0	0	2025-08-09 21:07:31.288351
33	1	7	popularity	0	0.00	0	0	2025-08-09 21:07:31.288351
34	1	7	teamwork	0	0.00	0	0	2025-08-09 21:07:31.288351
35	1	7	creativity	0	0.00	0	0	2025-08-09 21:07:31.288351
36	1	8	stage_presence	0	0.00	0	0	2025-08-09 21:07:31.288351
37	1	8	performance	0	0.00	0	0	2025-08-09 21:07:31.288351
38	1	8	popularity	0	0.00	0	0	2025-08-09 21:07:31.288351
39	1	8	teamwork	0	0.00	0	0	2025-08-09 21:07:31.288351
40	1	8	creativity	0	0.00	0	0	2025-08-09 21:07:31.288351
1	1	1	stage_presence	5	5.00	1	1	2025-08-09 21:24:55.999543
2	1	1	performance	4	4.00	1	0	2025-08-09 21:24:55.999543
3	1	1	popularity	5	5.00	1	1	2025-08-09 21:24:55.999543
4	1	1	teamwork	4	4.00	1	0	2025-08-09 21:24:55.999543
5	1	1	creativity	5	5.00	1	1	2025-08-09 21:24:55.999543
\.


--
-- TOC entry 3536 (class 0 OID 16417)
-- Dependencies: 219
-- Data for Name: programs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.programs (id, event_id, seq_no, title, performer, description, duration_minutes, vote_start_at, vote_end_at, status, created_at) FROM stdin;
5	1	5	乐器演奏《卡农》	运营部乐团	经典钢琴与小提琴合奏	5	\N	\N	0	2025-08-09 21:07:31.283158
6	1	6	现代舞《未来之光》	设计部舞团	科技感十足的现代舞	5	\N	\N	0	2025-08-09 21:07:31.283158
7	1	7	相声《说学逗唱》	产品部相声组	传统相声表演	5	\N	\N	0	2025-08-09 21:07:31.283158
8	1	8	歌曲《我和我的祖国》	销售部独唱	深情演唱爱国歌曲	5	\N	\N	0	2025-08-09 21:07:31.283158
14	1	9	新增测试节目	测试表演团队	这是一个测试新增的节目	4	\N	\N	0	2025-08-10 03:41:05.717974
1	1	1	测试更新标题	测试表演者	测试描述更新	6	2025-08-09 21:24:24.34	2025-08-09 21:29:24.34	2	2025-08-09 21:07:31.283158
2	1	2	歌曲串烧《经典回忆》	市场部合唱团	怀旧金曲大联唱	5	2025-08-10 03:45:19.846	2025-08-10 03:47:06.645	2	2025-08-09 21:07:31.283158
3	1	3	小品《办公室趣事》	技术部剧组	幽默诙谐的职场小品	5	2025-08-10 03:47:13.681	2025-08-10 03:47:35.215	2	2025-08-09 21:07:31.283158
4	1	4	民族舞《茉莉花》	财务部舞蹈队	优雅的中国古典舞	5	2025-08-10 03:47:41.333	2025-08-10 03:52:41.333	1	2025-08-09 21:07:31.283158
22	3	2	吃瓜	瓜瓜	群众吃瓜	5	\N	\N	0	2025-08-10 11:46:33.666641
24	3	3	喝酒	久久	茅台酒	5	\N	\N	0	2025-08-10 11:47:21.025713
27	3	5	开场舞蹈	市场部舞蹈队	热情洋溢的开场舞蹈	5	\N	\N	0	2025-08-10 16:35:17.716949
30	2	1	开场舞蹈	市场部舞蹈队	热情洋溢的开场舞蹈	5	2025-08-10 16:47:28.217	2025-08-10 16:48:48.586802	2	2025-08-10 16:44:46.835624
15	3	1	开场霹雳舞	张三	丰收的季节	3	2025-08-11 08:19:12.837	2025-08-11 08:24:12.837	1	2025-08-10 10:18:00.221974
32	3	10	测试节目	测试表演者	这是一个测试节目	3	\N	\N	0	2025-08-11 08:45:29.081376
38	1	10	测试正常序号	测试表演者	使用可用序号测试	3	\N	\N	0	2025-08-11 08:59:20.198611
39	1	11	测试节目11	张三+ 李四	测试节目1测试节目1测试节目1测试节目1	5	\N	\N	0	2025-08-11 09:00:16.610329
31	2	2	歌曲串烧	技术部合唱团	经典流行歌曲串烧	5	2025-08-10 16:48:48.588	2025-08-11 14:43:22.191	2	2025-08-10 16:44:51.267351
33	2	11	测试节目2	测试表演者2	这是第二个测试节目	4	2025-08-11 14:43:27.266	2025-08-11 14:48:27.266	1	2025-08-11 08:46:16.549982
\.


--
-- TOC entry 3546 (class 0 OID 16545)
-- Dependencies: 229
-- Data for Name: user_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_sessions (id, employee_id, event_id, token_hash, expires_at, ip_address, user_agent, created_at) FROM stdin;
2	2	1	765b3e990d2439adb79938f1c0d60116bc0d1ee5b08f1a23f9150628af2aebb4	2025-08-10 11:03:21.223	172.20.0.1	curl/8.5.0	2025-08-10 09:03:21.223952
9	3	1	cd3ea8606993df33de22a7de155a7c712d07aeedf76c621398f42f7fe190537c	2025-08-12 03:50:23.103	172.20.0.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	2025-08-12 01:50:23.103687
22	4	2	6e243231f94aeca52fe9d0df46caeb86d805ccce742e43da13064f06d015ed0f	2025-08-10 18:13:25.682	::ffff:172.20.0.1	curl/8.5.0	2025-08-10 16:13:25.682995
23	5	2	35417ec224948a42521250e18899f6a7ef61959387ea834ecdeab22df5b7bd4d	2025-08-10 18:45:53.674	::ffff:172.20.0.1	curl/8.5.0	2025-08-10 16:45:53.674625
24	6	2	6703cf2137127062c4c58407921dd56855119a76831e053d19e16f0e3d5989b9	2025-08-10 18:48:31.982	::ffff:172.20.0.1	curl/8.5.0	2025-08-10 16:48:31.983158
28	7	1	15fdff7d1538ae131a6141493e25e5a880e8f645ab85bea3a3dce9cfa2f3b301	2025-08-11 11:32:23.827	::ffff:172.20.0.1	curl/8.5.0	2025-08-11 09:32:23.828017
1	1	1	4fe602360c5befdc8334fe3df221b55ae5bcc80ea0247fa790251e7bdc75dfb1	2025-08-11 11:42:22.735	::ffff:172.20.0.1	curl/8.5.0	2025-08-11 09:42:22.7356
\.


--
-- TOC entry 3538 (class 0 OID 16438)
-- Dependencies: 221
-- Data for Name: votes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.votes (id, event_id, program_id, employee_id, stage_presence, performance, popularity, teamwork, creativity, submitted_at, ip_address, user_agent, device_id) FROM stdin;
1	1	1	2	5	4	5	4	5	2025-08-09 21:24:55.999543	::ffff:172.20.0.1	TestBrowser/1.0	VGVzdEJyb3dzZXIvMS4wLS0=
2	2	30	4	4	5	5	4	3	2025-08-10 16:45:39.061851	::ffff:172.20.0.1	curl/8.5.0	Y3VybC84LjUuMC0t
3	2	30	5	5	4	4	5	4	2025-08-10 16:46:03.562779	::ffff:172.20.0.1	curl/8.5.0	Y3VybC84LjUuMC0t
4	2	30	6	3	4	5	3	5	2025-08-10 16:48:01.644141	::ffff:172.20.0.1	curl/8.5.0	Y3VybC84LjUuMC0t
\.


--
-- TOC entry 3560 (class 0 OID 0)
-- Dependencies: 226
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.audit_logs_id_seq', 1, false);


--
-- TOC entry 3561 (class 0 OID 0)
-- Dependencies: 224
-- Name: award_results_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.award_results_id_seq', 2, true);


--
-- TOC entry 3562 (class 0 OID 0)
-- Dependencies: 216
-- Name: employees_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.employees_id_seq', 15, true);


--
-- TOC entry 3563 (class 0 OID 0)
-- Dependencies: 214
-- Name: events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.events_id_seq', 5, true);


--
-- TOC entry 3564 (class 0 OID 0)
-- Dependencies: 222
-- Name: program_statistics_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.program_statistics_id_seq', 40, true);


--
-- TOC entry 3565 (class 0 OID 0)
-- Dependencies: 218
-- Name: programs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.programs_id_seq', 39, true);


--
-- TOC entry 3566 (class 0 OID 0)
-- Dependencies: 228
-- Name: user_sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_sessions_id_seq', 78, true);


--
-- TOC entry 3567 (class 0 OID 0)
-- Dependencies: 220
-- Name: votes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.votes_id_seq', 4, true);


--
-- TOC entry 3365 (class 2606 OID 16530)
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 3361 (class 2606 OID 16510)
-- Name: award_results award_results_event_id_award_type_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.award_results
    ADD CONSTRAINT award_results_event_id_award_type_key UNIQUE (event_id, award_type);


--
-- TOC entry 3363 (class 2606 OID 16508)
-- Name: award_results award_results_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.award_results
    ADD CONSTRAINT award_results_pkey PRIMARY KEY (id);


--
-- TOC entry 3336 (class 2606 OID 16413)
-- Name: employees employees_emp_no_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_emp_no_key UNIQUE (emp_no);


--
-- TOC entry 3338 (class 2606 OID 16411)
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (id);


--
-- TOC entry 3330 (class 2606 OID 16400)
-- Name: events events_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_code_key UNIQUE (code);


--
-- TOC entry 3332 (class 2606 OID 16398)
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- TOC entry 3357 (class 2606 OID 16486)
-- Name: program_statistics program_statistics_event_id_program_id_dimension_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.program_statistics
    ADD CONSTRAINT program_statistics_event_id_program_id_dimension_key UNIQUE (event_id, program_id, dimension);


--
-- TOC entry 3359 (class 2606 OID 16484)
-- Name: program_statistics program_statistics_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.program_statistics
    ADD CONSTRAINT program_statistics_pkey PRIMARY KEY (id);


--
-- TOC entry 3344 (class 2606 OID 16429)
-- Name: programs programs_event_id_seq_no_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.programs
    ADD CONSTRAINT programs_event_id_seq_no_key UNIQUE (event_id, seq_no);


--
-- TOC entry 3346 (class 2606 OID 16427)
-- Name: programs programs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.programs
    ADD CONSTRAINT programs_pkey PRIMARY KEY (id);


--
-- TOC entry 3372 (class 2606 OID 16555)
-- Name: user_sessions user_sessions_employee_id_event_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_employee_id_event_id_key UNIQUE (employee_id, event_id);


--
-- TOC entry 3374 (class 2606 OID 16553)
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (id);


--
-- TOC entry 3351 (class 2606 OID 16454)
-- Name: votes votes_event_id_program_id_employee_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.votes
    ADD CONSTRAINT votes_event_id_program_id_employee_id_key UNIQUE (event_id, program_id, employee_id);


--
-- TOC entry 3353 (class 2606 OID 16452)
-- Name: votes votes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.votes
    ADD CONSTRAINT votes_pkey PRIMARY KEY (id);


--
-- TOC entry 3366 (class 1259 OID 16543)
-- Name: idx_audit_logs_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_created_at ON public.audit_logs USING btree (created_at);


--
-- TOC entry 3367 (class 1259 OID 16541)
-- Name: idx_audit_logs_event_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_event_id ON public.audit_logs USING btree (event_id);


--
-- TOC entry 3368 (class 1259 OID 16542)
-- Name: idx_audit_logs_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_user_id ON public.audit_logs USING btree (user_id);


--
-- TOC entry 3339 (class 1259 OID 16415)
-- Name: idx_employees_department; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_employees_department ON public.employees USING btree (department);


--
-- TOC entry 3340 (class 1259 OID 16414)
-- Name: idx_employees_emp_no; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_employees_emp_no ON public.employees USING btree (emp_no);


--
-- TOC entry 3333 (class 1259 OID 16401)
-- Name: idx_events_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_events_code ON public.events USING btree (code);


--
-- TOC entry 3334 (class 1259 OID 16402)
-- Name: idx_events_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_events_status ON public.events USING btree (status);


--
-- TOC entry 3354 (class 1259 OID 16498)
-- Name: idx_program_statistics_dimension_stars; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_program_statistics_dimension_stars ON public.program_statistics USING btree (dimension, total_stars DESC);


--
-- TOC entry 3355 (class 1259 OID 16497)
-- Name: idx_program_statistics_event_program; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_program_statistics_event_program ON public.program_statistics USING btree (event_id, program_id);


--
-- TOC entry 3341 (class 1259 OID 16435)
-- Name: idx_programs_event_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_programs_event_id ON public.programs USING btree (event_id);


--
-- TOC entry 3342 (class 1259 OID 16436)
-- Name: idx_programs_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_programs_status ON public.programs USING btree (status);


--
-- TOC entry 3369 (class 1259 OID 16567)
-- Name: idx_user_sessions_expires_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_sessions_expires_at ON public.user_sessions USING btree (expires_at);


--
-- TOC entry 3370 (class 1259 OID 16566)
-- Name: idx_user_sessions_token_hash; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_sessions_token_hash ON public.user_sessions USING btree (token_hash);


--
-- TOC entry 3347 (class 1259 OID 16471)
-- Name: idx_votes_employee_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_votes_employee_id ON public.votes USING btree (employee_id);


--
-- TOC entry 3348 (class 1259 OID 16470)
-- Name: idx_votes_program_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_votes_program_id ON public.votes USING btree (program_id);


--
-- TOC entry 3349 (class 1259 OID 16472)
-- Name: idx_votes_submitted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_votes_submitted_at ON public.votes USING btree (submitted_at);


--
-- TOC entry 3387 (class 2620 OID 16569)
-- Name: events update_events_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 3388 (class 2620 OID 16570)
-- Name: program_statistics update_program_statistics_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_program_statistics_updated_at BEFORE UPDATE ON public.program_statistics FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 3383 (class 2606 OID 16531)
-- Name: audit_logs audit_logs_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id);


--
-- TOC entry 3384 (class 2606 OID 16536)
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.employees(id);


--
-- TOC entry 3381 (class 2606 OID 16511)
-- Name: award_results award_results_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.award_results
    ADD CONSTRAINT award_results_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- TOC entry 3382 (class 2606 OID 16516)
-- Name: award_results award_results_program_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.award_results
    ADD CONSTRAINT award_results_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id) ON DELETE CASCADE;


--
-- TOC entry 3379 (class 2606 OID 16487)
-- Name: program_statistics program_statistics_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.program_statistics
    ADD CONSTRAINT program_statistics_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- TOC entry 3380 (class 2606 OID 16492)
-- Name: program_statistics program_statistics_program_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.program_statistics
    ADD CONSTRAINT program_statistics_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id) ON DELETE CASCADE;


--
-- TOC entry 3375 (class 2606 OID 16430)
-- Name: programs programs_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.programs
    ADD CONSTRAINT programs_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- TOC entry 3385 (class 2606 OID 16556)
-- Name: user_sessions user_sessions_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- TOC entry 3386 (class 2606 OID 16561)
-- Name: user_sessions user_sessions_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- TOC entry 3376 (class 2606 OID 16465)
-- Name: votes votes_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.votes
    ADD CONSTRAINT votes_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- TOC entry 3377 (class 2606 OID 16455)
-- Name: votes votes_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.votes
    ADD CONSTRAINT votes_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- TOC entry 3378 (class 2606 OID 16460)
-- Name: votes votes_program_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.votes
    ADD CONSTRAINT votes_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id) ON DELETE CASCADE;


-- Completed on 2025-08-12 02:20:52 UTC

--
-- PostgreSQL database dump complete
--

