const args = process.argv.slice(2);

if (args[0] === "--help" || args[0] === "-h" || args.length === 0) {
  console.log("stax - Stakpak CLI");
  console.log("");
  console.log("Usage: stax <command>");
  console.log("");
  console.log("Commands:");
  console.log("  version   Show version");
  process.exit(0);
}

if (args[0] === "version") {
  console.log("stax 0.0.1");
  process.exit(0);
}

console.error(`Unknown command: ${args[0]}`);
process.exit(1);
