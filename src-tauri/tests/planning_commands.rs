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
    let path = PathBuf::from(format!("/tmp/octopus-phase1-test-{nanos}-{sequence}.db"));

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
async fn phase1_task_columns_exist() {
    let pool = create_temp_pool().await;

    let rows = sqlx::query("PRAGMA table_info(tasks)")
        .fetch_all(&pool)
        .await
        .expect("pragma");

    let columns = rows
        .iter()
        .map(|row| row.get::<String, _>("name"))
        .collect::<Vec<_>>();

    assert!(columns.contains(&"implementation_intention".to_string()));
    assert!(columns.contains(&"two_minute_start".to_string()));
    assert!(columns.contains(&"task_type".to_string()));
    assert!(columns.contains(&"app_rules".to_string()));
}

#[tokio::test]
async fn transaction_rolls_back_on_invalid_task_insert() {
    let pool = create_temp_pool().await;

    let mut tx = pool.begin().await.expect("tx");

    sqlx::query(
        "INSERT INTO weekly_goals (week_start, raw_text, identity_statement) VALUES (?1, ?2, ?3)",
    )
    .bind("2026-04-06")
    .bind("raw")
    .bind("identity")
    .execute(&mut *tx)
    .await
    .expect("insert goal");

    let invalid = sqlx::query(
        "INSERT INTO tasks (goal_id, day, title, time_block, duration_min, status) VALUES (?1, NULL, ?2, ?3, ?4, ?5)",
    )
    .bind(1_i64)
    .bind("Broken task")
    .bind("09:00")
    .bind(30_i64)
    .bind("pending")
    .execute(&mut *tx)
    .await;

    assert!(invalid.is_err());
    tx.rollback().await.expect("rollback");

    let goal_count = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM weekly_goals")
        .fetch_one(&pool)
        .await
        .expect("count");

    assert_eq!(goal_count, 0);
}
