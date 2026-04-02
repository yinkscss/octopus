ALTER TABLE alarms ADD COLUMN tier INTEGER NOT NULL DEFAULT 1;
ALTER TABLE alarms ADD COLUMN fired_at TEXT;
ALTER TABLE alarms ADD COLUMN snoozed_until TEXT;
ALTER TABLE alarms ADD COLUMN snooze_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE alarms ADD COLUMN escalated_from_alarm_id INTEGER;
ALTER TABLE alarms ADD COLUMN delivery_token TEXT;
ALTER TABLE alarms ADD COLUMN last_action TEXT;

CREATE TABLE IF NOT EXISTS alarm_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  alarm_id INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  event_at TEXT NOT NULL DEFAULT (datetime('now')),
  metadata_json TEXT,
  FOREIGN KEY (alarm_id) REFERENCES alarms(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_alarms_status_scheduled ON alarms(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_alarms_snoozed_until ON alarms(snoozed_until);
CREATE INDEX IF NOT EXISTS idx_alarms_escalation ON alarms(escalated_from_alarm_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_alarms_delivery_token ON alarms(delivery_token);
CREATE INDEX IF NOT EXISTS idx_alarm_events_alarm_id ON alarm_events(alarm_id, event_at);
