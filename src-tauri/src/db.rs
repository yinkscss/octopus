use sqlx::sqlite::SqliteConnectOptions;
use sqlx::SqlitePool;
use std::fs;
use std::path::PathBuf;

fn app_db_path() -> Result<PathBuf, Box<dyn std::error::Error>> {
    let home = std::env::var("HOME")?;
    Ok(PathBuf::from(home)
        .join("Library")
        .join("Application Support")
        .join("octopus")
        .join("octopus.db"))
}

pub async fn init_db() -> Result<SqlitePool, Box<dyn std::error::Error>> {
    let db_path = app_db_path()?;
    if let Some(parent) = db_path.parent() {
        fs::create_dir_all(parent)?;
    }

    let options = SqliteConnectOptions::new()
        .filename(&db_path)
        .create_if_missing(true)
        .foreign_keys(true);

    let pool = SqlitePool::connect_with(options).await?;
    sqlx::migrate!("./migrations").run(&pool).await?;

    Ok(pool)
}
