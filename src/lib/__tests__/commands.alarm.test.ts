import { describe, expect, it } from "vitest";
import { COMMANDS } from "../commands";

describe("alarm command constants", () => {
  it("defines all phase 2 alarm commands", () => {
    expect(COMMANDS.scheduleWeekAlarms).toBe("schedule_week_alarms");
    expect(COMMANDS.reschedulePendingAlarms).toBe("reschedule_pending_alarms");
    expect(COMMANDS.acknowledgeAlarm).toBe("acknowledge_alarm");
    expect(COMMANDS.snoozeAlarmOnce).toBe("snooze_alarm_once");
    expect(COMMANDS.escalateAlarmIfUnacked).toBe("escalate_alarm_if_unacked");
    expect(COMMANDS.getAlarmTimeline).toBe("get_alarm_timeline");
    expect(COMMANDS.getAlarmDaemonStatus).toBe("get_alarm_daemon_status");
    expect(COMMANDS.ensureAlarmLaunchAgent).toBe("ensure_alarm_launch_agent");
  });
});
