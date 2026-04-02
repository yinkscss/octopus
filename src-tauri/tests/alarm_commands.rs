use sqlx::sqlite::SqliteConnectOptions;
use sqlx::{Row, SqlitePool};
use std::path::PathBuf;
use std::str::FromStr;
use std::sync::atomic::{AtomicU64, Ordering};
use std::time::{SystemTime, UNIX_EPOCH};

static DB_COUNTER: AtomicU64 = AtomicU64::new(0);

async fn create_temp_pool() -> SqlitePool {
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("time")
        .as_nanos();
    let sequence = DB_COUNTER.fetch_add(1, Ordering::Relaxed);
    let path = PathBuf::from(format!("/tmp/octopus-phase2-test-{nanos}-{sequence}.db"));

    let options = SqliteConnectOptions::from_str(path.to_str().expect("path"))
        .expect("sqlite options")
        .create_if_missing(true)
        .foreign_keys(true);

    let pool = SqlitePool::connect_with(options).await.expect("connect");
    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .expect("migrate");

    pool
}

#[tokio::test]
async fn phase2_alarm_columns_exist() {
    let pool = create_temp_pool().await;

    let rows = sqlx::query("PRAGMA table_info(alarms)")
        .fetch_all(&pool)
        .await
        .expect("pragma");

    let columns = rows
        .iter()
        .map(|row| row.get::<String, _>("name"))
        .collect::<Vec<_>>();

    assert!(columns.contains(&"tier".to_string()));
    assert!(columns.contains(&"fired_at".to_string()));
    assert!(columns.contains(&"snoozed_until".to_string()));
    assert!(columns.contains(&"snooze_count".to_string()));
    assert!(columns.contains(&"escalated_from_alarm_id".to_string()));
    assert!(columns.contains(&"delivery_token".to_string()));
    assert!(columns.contains(&"last_action".to_string()));
}

#[tokio::test]
async fn phase2_alarm_events_table_exists() {
    let pool = create_temp_pool().await;

    sqlx::query(
        "INSERT INTO weekly_goals (week_start, raw_text, identity_statement) VALUES (?1, ?2, ?3)",
    )
    .bind("2026-04-06")
    .bind("Ship phase 2")
    .bind("I am someone who ships")
    .execute(&pool)
    .await
    .expect("insert goal");

    sqlx::query("INSERT INTO tasks (goal_id, day, title, time_block, duration_min, status) VALUES (?1, ?2, ?3, ?4, ?5, ?6)")
        .bind(1_i64)
        .bind("monday")
        .bind("Ship phase 2")
        .bind("09:00")
        .bind(90_i64)
        .bind("pending")
        .execute(&pool)
        .await
        .expect("insert task");

    sqlx::query("INSERT INTO alarms (scheduled_at, label, task_id, status, day, time, alarm_type, tier) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)")
        .bind("2026-04-06 08:50:00")
        .bind("You said you'd ship phase 2")
        .bind(1_i64)
        .bind("scheduled")
        .bind("monday")
        .bind("08:50")
        .bind("transition")
        .bind(1_i64)
        .execute(&pool)
        .await
        .expect("insert alarm");

    sqlx::query("INSERT INTO alarm_events (alarm_id, event_type, metadata_json) VALUES (?1, ?2, ?3)")
        .bind(1_i64)
        .bind("fired")
        .bind("{\"tier\":1}")
        .execute(&pool)
        .await
        .expect("insert event");

    let event_count = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM alarm_events WHERE alarm_id = 1")
        .fetch_one(&pool)
        .await
        .expect("count");

    assert_eq!(event_count, 1);
}

#[tokio::test]
async fn delivery_token_is_unique() {
    let pool = create_temp_pool().await;

    sqlx::query("INSERT INTO alarms (scheduled_at, label, status, alarm_type, tier, delivery_token) VALUES (?1, ?2, ?3, ?4, ?5, ?6)")
        .bind("2026-04-06 08:50:00")
        .bind("first")
        .bind("scheduled")
        .bind("transition")
        .bind(1_i64)
        .bind("alarm:1:tier:1")
        .execute(&pool)
        .await
        .expect("first alarm");

    let duplicate = sqlx::query("INSERT INTO alarms (scheduled_at, label, status, alarm_type, tier, delivery_token) VALUES (?1, ?2, ?3, ?4, ?5, ?6)")
        .bind("2026-04-06 08:55:00")
        .bind("second")
        .bind("scheduled")
        .bind("transition")
        .bind(1_i64)
        .bind("alarm:1:tier:1")
        .execute(&pool)
        .await;

    assert!(duplicate.is_err());
}
