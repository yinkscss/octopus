use chrono::{Datelike, Duration, NaiveDate, NaiveDateTime};
use serde::{Deserialize, Serialize};
use sqlx::{Row, SqlitePool};
use std::collections::HashMap;
use tauri::State;

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct TaskInput {
    pub id: Option<i64>,
    pub day: String,
    pub title: String,
    pub implementation_intention: String,
    pub time_block: String,
    pub duration_minutes: i64,
    pub r#type: String,
    pub app_rules: Vec<String>,
    pub two_minute_start: String,
    pub status: Option<String>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct TimeBlockInput {
    pub day: String,
    pub start_time: String,
    pub end_time: String,
    pub mode: String,
    pub app_rules: Vec<String>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct AlarmInput {
    pub id: Option<i64>,
    pub day: String,
    pub time: String,
    pub label: String,
    pub r#type: String,
    pub status: Option<String>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct TaskPlanPayload {
    pub identity_statement: String,
    pub week_start: String,
    pub tasks: Vec<TaskInput>,
    pub time_blocks: Vec<TimeBlockInput>,
    pub alarms: Vec<AlarmInput>,
}

#[tauri::command]
pub async fn create_weekly_goal(
    pool: State<'_, SqlitePool>,
    week_start: String,
    raw_text: String,
    identity_statement: String,
) -> Result<i64, String> {
    let result = sqlx::query(
        "INSERT INTO weekly_goals (week_start, raw_text, identity_statement) VALUES (?1, ?2, ?3)",
    )
    .bind(week_start)
    .bind(raw_text)
    .bind(identity_statement)
    .execute(&*pool)
    .await
    .map_err(|err| err.to_string())?;

    Ok(result.last_insert_rowid())
}

#[tauri::command]
pub async fn store_task_plan(
    pool: State<'_, SqlitePool>,
    goal_id: i64,
    plan: TaskPlanPayload,
) -> Result<i64, String> {
    let mut tx = pool.begin().await.map_err(|err| err.to_string())?;

    sqlx::query("UPDATE weekly_goals SET identity_statement = ?1 WHERE id = ?2")
        .bind(&plan.identity_statement)
        .bind(goal_id)
        .execute(&mut *tx)
        .await
        .map_err(|err| err.to_string())?;

    sqlx::query("DELETE FROM alarms WHERE task_id IN (SELECT id FROM tasks WHERE goal_id = ?1)")
        .bind(goal_id)
        .execute(&mut *tx)
        .await
        .map_err(|err| err.to_string())?;

    sqlx::query("DELETE FROM tasks WHERE goal_id = ?1")
        .bind(goal_id)
        .execute(&mut *tx)
        .await
        .map_err(|err| err.to_string())?;

    sqlx::query("DELETE FROM time_blocks WHERE week_start = ?1")
        .bind(&plan.week_start)
        .execute(&mut *tx)
        .await
        .map_err(|err| err.to_string())?;

    let mut task_id_by_day: HashMap<String, i64> = HashMap::new();

    for task in &plan.tasks {
        let result = sqlx::query(
            "INSERT INTO tasks (
                goal_id, day, title, time_block, duration_min, status,
                implementation_intention, two_minute_start, task_type, app_rules
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
        )
        .bind(goal_id)
        .bind(&task.day)
        .bind(&task.title)
        .bind(&task.time_block)
        .bind(task.duration_minutes)
        .bind(task.status.clone().unwrap_or_else(|| "pending".to_string()))
        .bind(&task.implementation_intention)
        .bind(&task.two_minute_start)
        .bind(&task.r#type)
        .bind(serialize_app_rules(&task.app_rules))
        .execute(&mut *tx)
        .await
        .map_err(|err| err.to_string())?;

        task_id_by_day.entry(task.day.clone()).or_insert(result.last_insert_rowid());
    }

    for block in &plan.time_blocks {
        sqlx::query(
            "INSERT INTO time_blocks (week_start, day, start_time, end_time, mode, app_rules)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        )
        .bind(&plan.week_start)
        .bind(&block.day)
        .bind(&block.start_time)
        .bind(&block.end_time)
        .bind(&block.mode)
        .bind(serialize_app_rules(&block.app_rules))
        .execute(&mut *tx)
        .await
        .map_err(|err| err.to_string())?;
    }

    for alarm in &plan.alarms {
        let scheduled_at = build_scheduled_at(&plan.week_start, &alarm.day, &alarm.time)?;
        let task_id = task_id_by_day.get(&alarm.day).copied();

        sqlx::query(
            "INSERT INTO alarms (scheduled_at, label, task_id, status, acknowledged_at, day, time, alarm_type)
             VALUES (?1, ?2, ?3, ?4, NULL, ?5, ?6, ?7)",
        )
        .bind(scheduled_at)
        .bind(&alarm.label)
        .bind(task_id)
        .bind(alarm.status.clone().unwrap_or_else(|| "scheduled".to_string()))
        .bind(&alarm.day)
        .bind(&alarm.time)
        .bind(&alarm.r#type)
        .execute(&mut *tx)
        .await
        .map_err(|err| err.to_string())?;
    }

    tx.commit().await.map_err(|err| err.to_string())?;

    Ok(goal_id)
}

#[tauri::command]
pub async fn get_week_plan(
    pool: State<'_, SqlitePool>,
    week_start: String,
) -> Result<Option<TaskPlanPayload>, String> {
    let goal_row = sqlx::query(
        "SELECT id, identity_statement FROM weekly_goals WHERE week_start = ?1 ORDER BY id DESC LIMIT 1",
    )
    .bind(&week_start)
    .fetch_optional(&*pool)
    .await
    .map_err(|err| err.to_string())?;

    let Some(goal_row) = goal_row else {
        return Ok(None);
    };

    let goal_id: i64 = goal_row.get("id");
    let identity_statement: String = goal_row
        .try_get::<Option<String>, _>("identity_statement")
        .map_err(|err| err.to_string())?
        .unwrap_or_default();

    let plan = load_plan_by_goal(&pool, goal_id, &week_start, &identity_statement).await?;
    Ok(Some(plan))
}

#[tauri::command]
pub async fn shift_last_plan_forward(
    pool: State<'_, SqlitePool>,
    target_week_start: String,
) -> Result<TaskPlanPayload, String> {
    let source_row = sqlx::query(
        "SELECT id, week_start, raw_text, identity_statement
         FROM weekly_goals
         WHERE week_start <> ?1
         ORDER BY week_start DESC, id DESC
         LIMIT 1",
    )
    .bind(&target_week_start)
    .fetch_optional(&*pool)
    .await
    .map_err(|err| err.to_string())?;

    let Some(source_row) = source_row else {
        return Err("No previous plan available for fallback".to_string());
    };

    let source_goal_id: i64 = source_row.get("id");
    let source_week_start: String = source_row.get("week_start");
    let raw_text: String = source_row.get("raw_text");
    let identity_statement: String = source_row
        .try_get::<Option<String>, _>("identity_statement")
        .map_err(|err| err.to_string())?
        .unwrap_or_default();

    let source_plan = load_plan_by_goal(&pool, source_goal_id, &source_week_start, &identity_statement).await?;

    let mut tx = pool.begin().await.map_err(|err| err.to_string())?;

    let new_goal = sqlx::query(
        "INSERT INTO weekly_goals (week_start, raw_text, identity_statement) VALUES (?1, ?2, ?3)",
    )
    .bind(&target_week_start)
    .bind(raw_text)
    .bind(&source_plan.identity_statement)
    .execute(&mut *tx)
    .await
    .map_err(|err| err.to_string())?;

    let new_goal_id = new_goal.last_insert_rowid();
    let mut new_task_id_by_day: HashMap<String, i64> = HashMap::new();

    for task in &source_plan.tasks {
        let result = sqlx::query(
            "INSERT INTO tasks (
                goal_id, day, title, time_block, duration_min, status,
                implementation_intention, two_minute_start, task_type, app_rules
            ) VALUES (?1, ?2, ?3, ?4, ?5, 'pending', ?6, ?7, ?8, ?9)",
        )
        .bind(new_goal_id)
        .bind(&task.day)
        .bind(&task.title)
        .bind(&task.time_block)
        .bind(task.duration_minutes)
        .bind(&task.implementation_intention)
        .bind(&task.two_minute_start)
        .bind(&task.r#type)
        .bind(serialize_app_rules(&task.app_rules))
        .execute(&mut *tx)
        .await
        .map_err(|err| err.to_string())?;

        new_task_id_by_day
            .entry(task.day.clone())
            .or_insert(result.last_insert_rowid());
    }

    for block in &source_plan.time_blocks {
        sqlx::query(
            "INSERT INTO time_blocks (week_start, day, start_time, end_time, mode, app_rules)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        )
        .bind(&target_week_start)
        .bind(&block.day)
        .bind(&block.start_time)
        .bind(&block.end_time)
        .bind(&block.mode)
        .bind(serialize_app_rules(&block.app_rules))
        .execute(&mut *tx)
        .await
        .map_err(|err| err.to_string())?;
    }

    for alarm in &source_plan.alarms {
        let scheduled_at = build_scheduled_at(&target_week_start, &alarm.day, &alarm.time)?;
        let mapped_task_id = new_task_id_by_day.get(&alarm.day).copied();

        sqlx::query(
            "INSERT INTO alarms (scheduled_at, label, task_id, status, acknowledged_at, day, time, alarm_type)
             VALUES (?1, ?2, ?3, 'scheduled', NULL, ?4, ?5, ?6)",
        )
        .bind(scheduled_at)
        .bind(&alarm.label)
        .bind(mapped_task_id)
        .bind(&alarm.day)
        .bind(&alarm.time)
        .bind(&alarm.r#type)
        .execute(&mut *tx)
        .await
        .map_err(|err| err.to_string())?;
    }

    tx.commit().await.map_err(|err| err.to_string())?;

    let plan = load_plan_by_goal(&pool, new_goal_id, &target_week_start, &source_plan.identity_statement).await?;
    Ok(plan)
}

#[tauri::command]
pub async fn mark_task_completed(
    pool: State<'_, SqlitePool>,
    task_id: i64,
    duration_actual: Option<i64>,
    drift_minutes: Option<i64>,
) -> Result<i64, String> {
    let mut tx = pool.begin().await.map_err(|err| err.to_string())?;

    let completion = sqlx::query(
        "INSERT INTO completions (task_id, duration_actual, drift_minutes) VALUES (?1, ?2, ?3)",
    )
    .bind(task_id)
    .bind(duration_actual)
    .bind(drift_minutes)
    .execute(&mut *tx)
    .await
    .map_err(|err| err.to_string())?;

    sqlx::query("UPDATE tasks SET status = 'done' WHERE id = ?1")
        .bind(task_id)
        .execute(&mut *tx)
        .await
        .map_err(|err| err.to_string())?;

    tx.commit().await.map_err(|err| err.to_string())?;

    Ok(completion.last_insert_rowid())
}

async fn load_plan_by_goal(
    pool: &SqlitePool,
    goal_id: i64,
    week_start: &str,
    identity_statement: &str,
) -> Result<TaskPlanPayload, String> {
    let task_rows = sqlx::query(
        "SELECT id, day, title, implementation_intention, time_block, duration_min, task_type, app_rules, two_minute_start, status
         FROM tasks
         WHERE goal_id = ?1
         ORDER BY day, time_block",
    )
    .bind(goal_id)
    .fetch_all(pool)
    .await
    .map_err(|err| err.to_string())?;

    let tasks = task_rows
        .into_iter()
        .map(|row| TaskInput {
            id: row.try_get::<i64, _>("id").ok(),
            day: row.get("day"),
            title: row.get("title"),
            implementation_intention: row
                .try_get::<Option<String>, _>("implementation_intention")
                .ok()
                .flatten()
                .unwrap_or_default(),
            time_block: row.get("time_block"),
            duration_minutes: row.get::<i64, _>("duration_min"),
            r#type: row
                .try_get::<Option<String>, _>("task_type")
                .ok()
                .flatten()
                .unwrap_or_else(|| "admin".to_string()),
            app_rules: parse_app_rules(
                row.try_get::<Option<String>, _>("app_rules")
                    .ok()
                    .flatten(),
            ),
            two_minute_start: row
                .try_get::<Option<String>, _>("two_minute_start")
                .ok()
                .flatten()
                .unwrap_or_default(),
            status: row.try_get::<Option<String>, _>("status").ok().flatten(),
        })
        .collect::<Vec<_>>();

    let block_rows = sqlx::query(
        "SELECT day, start_time, end_time, mode, app_rules
         FROM time_blocks
         WHERE week_start = ?1
         ORDER BY day, start_time",
    )
    .bind(week_start)
    .fetch_all(pool)
    .await
    .map_err(|err| err.to_string())?;

    let time_blocks = block_rows
        .into_iter()
        .map(|row| TimeBlockInput {
            day: row.get("day"),
            start_time: row.get("start_time"),
            end_time: row.get("end_time"),
            mode: row.get("mode"),
            app_rules: parse_app_rules(
                row.try_get::<Option<String>, _>("app_rules")
                    .ok()
                    .flatten(),
            ),
        })
        .collect::<Vec<_>>();

    let alarm_rows = sqlx::query(
        "SELECT id, day, time, label, alarm_type, status, scheduled_at
         FROM alarms
         WHERE task_id IN (SELECT id FROM tasks WHERE goal_id = ?1)
            OR scheduled_at LIKE (?2 || '%')
         ORDER BY scheduled_at",
    )
    .bind(goal_id)
    .bind(week_start)
    .fetch_all(pool)
    .await
    .map_err(|err| err.to_string())?;

    let alarms = alarm_rows
        .into_iter()
        .map(|row| {
            let scheduled_at = row
                .try_get::<Option<String>, _>("scheduled_at")
                .ok()
                .flatten()
                .unwrap_or_default();
            let fallback_day = day_from_scheduled_at(&scheduled_at);
            let fallback_time = time_from_scheduled_at(&scheduled_at);

            AlarmInput {
                id: row.try_get::<i64, _>("id").ok(),
                day: row
                    .try_get::<Option<String>, _>("day")
                    .ok()
                    .flatten()
                    .unwrap_or(fallback_day),
                time: row
                    .try_get::<Option<String>, _>("time")
                    .ok()
                    .flatten()
                    .unwrap_or(fallback_time),
                label: row.get("label"),
                r#type: row
                    .try_get::<Option<String>, _>("alarm_type")
                    .ok()
                    .flatten()
                    .unwrap_or_else(|| "transition".to_string()),
                status: row.try_get::<Option<String>, _>("status").ok().flatten(),
            }
        })
        .collect::<Vec<_>>();

    Ok(TaskPlanPayload {
        identity_statement: identity_statement.to_string(),
        week_start: week_start.to_string(),
        tasks,
        time_blocks,
        alarms,
    })
}

fn serialize_app_rules(rules: &[String]) -> String {
    serde_json::to_string(rules).unwrap_or_else(|_| "[]".to_string())
}

fn parse_app_rules(value: Option<String>) -> Vec<String> {
    let Some(value) = value else {
        return Vec::new();
    };

    serde_json::from_str::<Vec<String>>(&value).unwrap_or_default()
}

fn day_to_offset(day: &str) -> Result<i64, String> {
    match day.to_ascii_lowercase().as_str() {
        "monday" => Ok(0),
        "tuesday" => Ok(1),
        "wednesday" => Ok(2),
        "thursday" => Ok(3),
        "friday" => Ok(4),
        "saturday" => Ok(5),
        "sunday" => Ok(6),
        _ => Err(format!("Unsupported day value: {day}")),
    }
}

fn build_scheduled_at(week_start: &str, day: &str, time: &str) -> Result<String, String> {
    let week = NaiveDate::parse_from_str(week_start, "%Y-%m-%d")
        .map_err(|err| format!("Invalid week_start: {err}"))?;
    let offset = day_to_offset(day)?;
    let date = week + Duration::days(offset);

    Ok(format!("{} {}:00", date.format("%Y-%m-%d"), time))
}

fn day_from_scheduled_at(scheduled_at: &str) -> String {
    parse_scheduled_at(scheduled_at)
        .map(|dt| match dt.weekday().number_from_monday() {
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

fn time_from_scheduled_at(scheduled_at: &str) -> String {
    parse_scheduled_at(scheduled_at)
        .map(|dt| dt.format("%H:%M").to_string())
        .unwrap_or_else(|| "09:00".to_string())
}

fn parse_scheduled_at(scheduled_at: &str) -> Option<NaiveDateTime> {
    NaiveDateTime::parse_from_str(scheduled_at, "%Y-%m-%d %H:%M:%S")
        .ok()
        .or_else(|| NaiveDateTime::parse_from_str(scheduled_at, "%Y-%m-%d %H:%M").ok())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn builds_scheduled_datetime_from_week_and_day() {
        let scheduled = build_scheduled_at("2026-04-06", "wednesday", "09:30").expect("scheduled");
        assert_eq!(scheduled, "2026-04-08 09:30:00");
    }

    #[test]
    fn extracts_day_and_time_from_scheduled_datetime() {
        assert_eq!(day_from_scheduled_at("2026-04-09 18:05:00"), "thursday");
        assert_eq!(time_from_scheduled_at("2026-04-09 18:05:00"), "18:05");
    }
}
