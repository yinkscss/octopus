PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS weekly_goals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  week_start TEXT NOT NULL,
  raw_text TEXT NOT NULL,
  identity_statement TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  goal_id INTEGER,
  day TEXT NOT NULL,
  title TEXT NOT NULL,
  time_block TEXT,
  duration_min INTEGER,
  status TEXT NOT NULL DEFAULT 'pending',
  FOREIGN KEY (goal_id) REFERENCES weekly_goals(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS time_blocks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  week_start TEXT NOT NULL,
  day TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  mode TEXT NOT NULL,
  app_rules TEXT
);

CREATE TABLE IF NOT EXISTS alarms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scheduled_at TEXT NOT NULL,
  label TEXT NOT NULL,
  task_id INTEGER,
  status TEXT NOT NULL DEFAULT 'scheduled',
  acknowledged_at TEXT,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS checkins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  logged_at TEXT NOT NULL DEFAULT (datetime('now')),
  energy INTEGER NOT NULL,
  mood INTEGER NOT NULL,
  note TEXT
);

CREATE TABLE IF NOT EXISTS block_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  app_name TEXT NOT NULL,
  blocked_at TEXT NOT NULL DEFAULT (datetime('now')),
  intent_gate_response TEXT,
  override INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS completions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER,
  completed_at TEXT NOT NULL DEFAULT (datetime('now')),
  duration_actual INTEGER,
  drift_minutes INTEGER,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS patterns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  week_start TEXT NOT NULL,
  insights_json TEXT NOT NULL,
  config_adjustments_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS test_responses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  response TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
