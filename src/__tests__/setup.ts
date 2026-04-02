import { execSync } from "child_process";

const TEST_DB_URL = "postgresql://postgres:postgres@localhost:5433/reliefcher_test";

export default async function setup() {
  // Create test DB if not exists
  try {
    execSync(
      `PGPASSWORD=postgres psql -h localhost -p 5433 -U postgres -c "CREATE DATABASE reliefcher_test;" 2>/dev/null`,
      { stdio: "pipe" }
    );
  } catch {
    // DB may already exist, that's fine
  }

  // Run migrations against test DB
  execSync("npx prisma migrate deploy", {
    env: { ...process.env, DATABASE_URL: TEST_DB_URL, DIRECT_URL: TEST_DB_URL },
    stdio: "pipe",
  });
}
