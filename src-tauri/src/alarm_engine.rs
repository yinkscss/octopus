use crate::notifications::send_alarm_notification;
use chrono::{Datelike, Duration, NaiveDateTime, Utc};
use serde::Serialize;
use serde_json::json;
use sqlx::{Row, SqlitePool};
use std::collections::HashMap;
use std::sync::Arc;
use tauri::async_runtime::JoinHandle;
use tauri::{AppHandle, Emitter};
use tokio::sync::Mutex;

const DATETIME_FMT: &str = "%Y-%m-%d %H:%M:%S";

#[derive(Clone)]
pub struct AlarmEngine {
    app: AppHandle,
    pool: SqlitePool,
    scheduled_jobs: Arc<Mutex<HashMap<String, JoinHandle<()>>>>,
}

#[derive(Debug, Clone, Serialize)]
pub struct AlarmScheduleReport {
    pub scheduled_count: i64,
    pub failed_count: i64,
    pub last_sync_at: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct AlarmActionReport {
    pub alarm_id: i64,
    pub status: String,
    pub last_action: String,
    pub acted_at: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct AlarmDaemonStatus {
    pub running: bool,
    pub scheduled_jobs: usize,
}

#[derive(Debug, Clone, Serialize)]
pub struct AlarmTimelineEvent {
    pub event_type: String,
    pub event_at: String,
    pub metadata_json: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct AlarmTimelineItem {
    pub alarm_id: i64,
    pub day: Option<String>,
    pub time: Option<String>,
    pub label: String,
    pub status: String,
    pub tier: i64,
    pub events: Vec<AlarmTimelineEvent>,
}

impl AlarmEngine {
    pub fn new(app: AppHandle, pool: SqlitePool) -> Self {
        Self {
            app,
            pool,
            scheduled_jobs: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    pub async fn daemon_status(&self) -> AlarmDaemonStatus {
        let jobs = self.scheduled_jobs.lock().await;
        AlarmDaemonStatus {
            running: true,
            scheduled_jobs: jobs.len(),
        }
    }

    pub async fn schedule_week_alarms(&self, week_start: &str) -> Result<AlarmScheduleReport, String> {
        let rows = sqlx::query(
            "SELECT id FROM alarms WHERE scheduled_at LIKE (?1 || '%') AND status IN ('scheduled', 'snoozed')",
        )
        .bind(week_start)
        .fetch_all(&self.pool)
        .await
        .map_err(|err| err.to_string())?;

        let mut scheduled_count = 0_i64;
        let mut failed_count = 0_i64;

        for row in rows {
            let alarm_id: i64 = row.get("id");
            match self.schedule_alarm_internal(alarm_id, true).await {
                Ok(true) => scheduled_count += 1,
                Ok(false) => {}
                Err(_) => failed_count += 1,
            }
        }

        Ok(AlarmScheduleReport {
            scheduled_count,
            failed_count,
            last_sync_at: now_string(),
        })
    }

    pub async fn reschedule_pending_alarms(&self) -> Result<AlarmScheduleReport, String> {
        let rows = sqlx::query("SELECT id FROM alarms WHERE status IN ('scheduled', 'snoozed')")
            .fetch_all(&self.pool)
            .await
            .map_err(|err| err.to_string())?;

        let mut scheduled_count = 0_i64;
        let mut failed_count = 0_i64;

        for row in rows {
            let alarm_id: i64 = row.get("id");
            match self.schedule_alarm_internal(alarm_id, true).await {
                Ok(true) => scheduled_count += 1,
                Ok(false) => {}
                Err(_) => failed_count += 1,
            }
        }

        Ok(AlarmScheduleReport {
            scheduled_count,
            failed_count,
            last_sync_at: now_string(),
        })
    }

    pub async fn recover_pending_after_restart(&self) -> Result<(), String> {
        let _ = self.reschedule_pending_alarms().await?;
        Ok(())
    }

    pub async fn schedule_alarm(&self, alarm_id: i64) -> Result<bool, String> {
        self.schedule_alarm_internal(alarm_id, false).await
    }

    async fn schedule_alarm_internal(&self, alarm_id: i64, force: bool) -> Result<bool, String> {
        let row = sqlx::query(
            "SELECT id, status, COALESCE(tier, 1) AS tier, COALESCE(snoozed_until, scheduled_at) AS due_at
             FROM alarms WHERE id = ?1",
        )
        .bind(alarm_id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|err| err.to_string())?;

        let Some(row) = row else {
            return Ok(false);
        };

        let status: String = row.get("status");
        if matches!(
            status.as_str(),
            "acknowledged" | "dismissed" | "missed" | "completed"
        ) {
            return Ok(false);
        }

        let tier: i64 = row.get("tier");
        let due_at: String = row.get("due_at");
        let due = parse_datetime(&due_at)?;

        let token = format!("alarm:{alarm_id}:tier:{tier}");
        {
            let mut jobs = self.scheduled_jobs.lock().await;
            if let Some(existing) = jobs.remove(&token) {
                if force {
                    existing.abort();
                } else {
                    jobs.insert(token.clone(), existing);
                    return Ok(false);
                }
            }
        }

        let now = Utc::now().naive_utc();
        let wait = (due - now).to_std().unwrap_or_else(|_| std::time::Duration::from_secs(0));

        let engine = self.clone();
        let token_for_remove = token.clone();
        let jobs_for_remove = self.scheduled_jobs.clone();

        let handle = tauri::async_runtime::spawn(async move {
            tokio::time::sleep(wait).await;
            let _ = engine.fire_alarm(alarm_id, tier).await;
            let mut jobs = jobs_for_remove.lock().await;
            jobs.remove(&token_for_remove);
        });

        let mut jobs = self.scheduled_jobs.lock().await;
        jobs.insert(token, handle);
        Ok(true)
    }

    pub async fn fire_alarm(&self, alarm_id: i64, tier: i64) -> Result<(), String> {
        let mut tx = self.pool.begin().await.map_err(|err| err.to_string())?;

        let row = sqlx::query("SELECT label, status FROM alarms WHERE id = ?1")
            .bind(alarm_id)
            .fetch_optional(&mut *tx)
            .await
            .map_err(|err| err.to_string())?;

        let Some(row) = row else {
            tx.rollback().await.map_err(|err| err.to_string())?;
            return Ok(());
        };

        let status: String = row.get("status");
        if matches!(
            status.as_str(),
            "acknowledged" | "dismissed" | "missed" | "completed"
        ) {
            tx.rollback().await.map_err(|err| err.to_string())?;
            return Ok(());
        }

        let label: String = row.get("label");

        let fire_time = now_string();
        sqlx::query("UPDATE alarms SET status = 'fired', fired_at = ?1, tier = ?2 WHERE id = ?3")
            .bind(&fire_time)
            .bind(tier)
            .bind(alarm_id)
            .execute(&mut *tx)
            .await
            .map_err(|err| err.to_string())?;

        self.insert_event_tx(
            &mut tx,
            alarm_id,
            "fired",
            Some(json!({ "tier": tier }).to_string()),
        )
        .await?;

        tx.commit().await.map_err(|err| err.to_string())?;

        let notification_result = send_alarm_notification(&self.app, alarm_id, "Octopus", &label);
        match notification_result {
            Ok(()) => {
                let _ = sqlx::query(
                    "INSERT INTO alarm_events (alarm_id, event_type, metadata_json) VALUES (?1, ?2, ?3)",
                )
                .bind(alarm_id)
                .bind("notification_dispatched")
                .bind(Some(json!({ "tier": tier }).to_string()))
                .execute(&self.pool)
                .await;
            }
            Err(err) => {
                let _ = sqlx::query(
                    "INSERT INTO alarm_events (alarm_id, event_type, metadata_json) VALUES (?1, ?2, ?3)",
                )
                .bind(alarm_id)
                .bind("notification_failed")
                .bind(Some(json!({ "error": err }).to_string()))
                .execute(&self.pool)
                .await;
            }
        }
        let _ = self.app.emit(
            "alarm-fired",
            json!({
                "alarm_id": alarm_id,
                "tier": tier,
                "label": label,
                "fired_at": fire_time,
            }),
        );

        if tier == 1 {
            let escalator = self.clone();
            tauri::async_runtime::spawn(async move {
                tokio::time::sleep(std::time::Duration::from_secs(5 * 60)).await;
                let _ = escalator.escalate_alarm_if_unacked(alarm_id).await;
            });
        }

        Ok(())
    }

    pub async fn acknowledge_alarm(&self, alarm_id: i64) -> Result<AlarmActionReport, String> {
        self.transition_alarm(alarm_id, "acknowledged", "i_am_on_it", None)
            .await
    }

    pub async fn snooze_alarm_once(&self, alarm_id: i64) -> Result<AlarmActionReport, String> {
        let row = sqlx::query("SELECT COALESCE(snooze_count, 0) AS snooze_count FROM alarms WHERE id = ?1")
            .bind(alarm_id)
            .fetch_optional(&self.pool)
            .await
            .map_err(|err| err.to_string())?;

        let Some(row) = row else {
            return Err("Alarm not found".to_string());
        };

        let snooze_count: i64 = row.get("snooze_count");
        if snooze_count >= 1 {
            return Err("SNOOZE ONCE already used for this alarm".to_string());
        }

        let snoozed_until = Utc::now().naive_utc() + Duration::minutes(5);
        let snoozed_until = snoozed_until.format(DATETIME_FMT).to_string();

        let mut tx = self.pool.begin().await.map_err(|err| err.to_string())?;

        sqlx::query(
            "UPDATE alarms
             SET status = 'snoozed',
                 snooze_count = snooze_count + 1,
                 snoozed_until = ?1,
                 last_action = 'snooze_once'
             WHERE id = ?2",
        )
        .bind(&snoozed_until)
        .bind(alarm_id)
        .execute(&mut *tx)
        .await
        .map_err(|err| err.to_string())?;

        self.insert_event_tx(
            &mut tx,
            alarm_id,
            "snoozed",
            Some(json!({ "snoozed_until": snoozed_until }).to_string()),
        )
        .await?;

        tx.commit().await.map_err(|err| err.to_string())?;

        self.queue_alarm_schedule(alarm_id);

        Ok(AlarmActionReport {
            alarm_id,
            status: "snoozed".to_string(),
            last_action: "snooze_once".to_string(),
            acted_at: now_string(),
        })
    }

    pub async fn escalate_alarm_if_unacked(&self, alarm_id: i64) -> Result<AlarmActionReport, String> {
        let row = sqlx::query(
            "SELECT task_id, day, time, label, status FROM alarms WHERE id = ?1",
        )
        .bind(alarm_id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|err| err.to_string())?;

        let Some(row) = row else {
            return Err("Alarm not found".to_string());
        };

        let status: String = row.get("status");
        if status == "acknowledged" {
            return Ok(AlarmActionReport {
                alarm_id,
                status,
                last_action: "already_acknowledged".to_string(),
                acted_at: now_string(),
            });
        }

        let existing = sqlx::query(
            "SELECT id FROM alarms WHERE escalated_from_alarm_id = ?1 LIMIT 1",
        )
        .bind(alarm_id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|err| err.to_string())?;

        if existing.is_some() {
            return Ok(AlarmActionReport {
                alarm_id,
                status: "escalated".to_string(),
                last_action: "already_escalated".to_string(),
                acted_at: now_string(),
            });
        }

        let task_id: Option<i64> = row.try_get("task_id").ok();
        let day: Option<String> = row.try_get("day").ok();
        let time: Option<String> = row.try_get("time").ok();
        let label: String = row.get("label");

        let now = now_string();
        let date_part = now.split(' ').next().unwrap_or_default().to_string();
        let time_part = now.split(' ').nth(1).unwrap_or("00:00:00");
        let hhmm = time_part.chars().take(5).collect::<String>();
        let escalation_label = format!("Still pending: {label}");
        let delivery_token = format!("alarm:{alarm_id}:tier:2");

        let mut tx = self.pool.begin().await.map_err(|err| err.to_string())?;

        let insert = sqlx::query(
            "INSERT INTO alarms (
                scheduled_at, label, task_id, status, acknowledged_at, day, time, alarm_type,
                tier, escalated_from_alarm_id, delivery_token
             ) VALUES (?1, ?2, ?3, 'scheduled', NULL, ?4, ?5, 'intervention', 2, ?6, ?7)",
        )
        .bind(&now)
        .bind(&escalation_label)
        .bind(task_id)
        .bind(day.or(Some(day_name_from_date(&date_part))))
        .bind(time.unwrap_or(hhmm))
        .bind(alarm_id)
        .bind(delivery_token)
        .execute(&mut *tx)
        .await
        .map_err(|err| err.to_string())?;

        let escalated_alarm_id = insert.last_insert_rowid();

        sqlx::query("UPDATE alarms SET status = 'escalated', last_action = 'escalated' WHERE id = ?1")
            .bind(alarm_id)
            .execute(&mut *tx)
            .await
            .map_err(|err| err.to_string())?;

        self.insert_event_tx(
            &mut tx,
            alarm_id,
            "escalated",
            Some(json!({ "new_alarm_id": escalated_alarm_id }).to_string()),
        )
        .await?;
        self.insert_event_tx(
            &mut tx,
            escalated_alarm_id,
            "created",
            Some(json!({ "from_alarm_id": alarm_id }).to_string()),
        )
        .await?;

        tx.commit().await.map_err(|err| err.to_string())?;

        self.queue_alarm_schedule(escalated_alarm_id);

        Ok(AlarmActionReport {
            alarm_id: escalated_alarm_id,
            status: "scheduled".to_string(),
            last_action: "escalated".to_string(),
            acted_at: now_string(),
        })
    }

    pub async fn get_alarm_timeline(&self, week_start: &str) -> Result<Vec<AlarmTimelineItem>, String> {
        let alarms = sqlx::query(
            "SELECT id, day, time, label, status, COALESCE(tier, 1) AS tier
             FROM alarms
             WHERE scheduled_at LIKE (?1 || '%')
             ORDER BY scheduled_at, id",
        )
        .bind(week_start)
        .fetch_all(&self.pool)
        .await
        .map_err(|err| err.to_string())?;

        let mut items = Vec::with_capacity(alarms.len());
        for alarm in alarms {
            let alarm_id: i64 = alarm.get("id");
            let events = sqlx::query(
                "SELECT event_type, event_at, metadata_json
                 FROM alarm_events WHERE alarm_id = ?1 ORDER BY event_at, id",
            )
            .bind(alarm_id)
            .fetch_all(&self.pool)
            .await
            .map_err(|err| err.to_string())?
            .into_iter()
            .map(|event| AlarmTimelineEvent {
                event_type: event.get("event_type"),
                event_at: event.get("event_at"),
                metadata_json: event.try_get::<Option<String>, _>("metadata_json").ok().flatten(),
            })
            .collect::<Vec<_>>();

            items.push(AlarmTimelineItem {
                alarm_id,
                day: alarm.try_get::<Option<String>, _>("day").ok().flatten(),
                time: alarm.try_get::<Option<String>, _>("time").ok().flatten(),
                label: alarm.get("label"),
                status: alarm.get("status"),
                tier: alarm.get("tier"),
                events,
            });
        }

        Ok(items)
    }

    async fn transition_alarm(
        &self,
        alarm_id: i64,
        status: &str,
        action: &str,
        metadata: Option<String>,
    ) -> Result<AlarmActionReport, String> {
        let now = now_string();

        let mut tx = self.pool.begin().await.map_err(|err| err.to_string())?;

        sqlx::query(
            "UPDATE alarms
             SET status = ?1,
                 acknowledged_at = CASE WHEN ?1 = 'acknowledged' THEN ?2 ELSE acknowledged_at END,
                 last_action = ?3
             WHERE id = ?4",
        )
        .bind(status)
        .bind(&now)
        .bind(action)
        .bind(alarm_id)
        .execute(&mut *tx)
        .await
        .map_err(|err| err.to_string())?;

        self.insert_event_tx(&mut tx, alarm_id, status, metadata).await?;

        tx.commit().await.map_err(|err| err.to_string())?;

        Ok(AlarmActionReport {
            alarm_id,
            status: status.to_string(),
            last_action: action.to_string(),
            acted_at: now,
        })
    }

    async fn insert_event_tx(
        &self,
        tx: &mut sqlx::Transaction<'_, sqlx::Sqlite>,
        alarm_id: i64,
        event_type: &str,
        metadata_json: Option<String>,
    ) -> Result<(), String> {
        sqlx::query(
            "INSERT INTO alarm_events (alarm_id, event_type, metadata_json) VALUES (?1, ?2, ?3)",
        )
        .bind(alarm_id)
        .bind(event_type)
        .bind(metadata_json)
        .execute(&mut **tx)
        .await
        .map_err(|err| err.to_string())?;

        Ok(())
    }

    fn queue_alarm_schedule(&self, alarm_id: i64) {
        let engine = self.clone();
        tauri::async_runtime::spawn(async move {
            let _ = engine.schedule_alarm(alarm_id).await;
        });
    }
}

fn now_string() -> String {
    Utc::now().naive_utc().format(DATETIME_FMT).to_string()
}

fn parse_datetime(value: &str) -> Result<NaiveDateTime, String> {
    NaiveDateTime::parse_from_str(value, DATETIME_FMT)
        .or_else(|_| NaiveDateTime::parse_from_str(value, "%Y-%m-%d %H:%M"))
        .map_err(|err| format!("invalid datetime '{value}': {err}"))
}

fn day_name_from_date(date: &str) -> String {
    chrono::NaiveDate::parse_from_str(date, "%Y-%m-%d")
        .ok()
        .map(|d| match d.weekday().number_from_monday() {
            1 => "monday".to_string(),
            2 => "tuesday".to_string(),
            3 => "wednesday".to_string(),
            4 => "thursday".to_string(),
            5 => "friday".to_string(),
            6 => "saturday".to_string(),
            _ => "sunday".to_string(),
        })
        .unwrap_or_else(|| "monday".to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_datetime_formats() {
        assert!(parse_datetime("2026-04-08 10:30:00").is_ok());
        assert!(parse_datetime("2026-04-08 10:30").is_ok());
    }

    #[test]
    fn maps_day_name_from_date() {
        assert_eq!(day_name_from_date("2026-04-06"), "monday");
    }
}
