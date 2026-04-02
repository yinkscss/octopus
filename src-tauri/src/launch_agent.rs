use std::fs;
use std::path::PathBuf;

const LABEL: &str = "com.daniel.octopus.alarmd";

fn launch_agents_dir() -> Result<PathBuf, String> {
    let home = std::env::var("HOME").map_err(|err| err.to_string())?;
    Ok(PathBuf::from(home).join("Library").join("LaunchAgents"))
}

fn build_plist(executable: &str) -> String {
    format!(
                r#"<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>{label}</string>
    <key>ProgramArguments</key>
    <array>
        <string>{exe}</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
</dict>
</plist>
"#,
        label = LABEL,
        exe = executable
    )
}

pub fn ensure_alarm_launch_agent() -> Result<String, String> {
    let exe = std::env::current_exe().map_err(|err| err.to_string())?;
    let exe_str = exe.to_string_lossy().replace('&', "&amp;");

    let dir = launch_agents_dir()?;
    fs::create_dir_all(&dir).map_err(|err| err.to_string())?;

    let plist_path = dir.join(format!("{LABEL}.plist"));
    fs::write(&plist_path, build_plist(&exe_str)).map_err(|err| err.to_string())?;

    Ok(plist_path.to_string_lossy().to_string())
}
