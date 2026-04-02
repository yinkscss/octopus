import { invoke } from "@tauri-apps/api/core";

console.log("invoke function:", invoke);
console.log("invoke type:", typeof invoke);

async function testInvoke() {
  try {
    const result = await invoke("get_api_key", { provider: "claude" });
    console.log("Result:", result);
  } catch (error) {
    console.error("Error:", error);
  }
}

testInvoke();
