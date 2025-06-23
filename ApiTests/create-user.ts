import bcrypt from "bcrypt";
import { db } from "../server/db";
import { users } from "../shared/schema"; // <-- your Drizzle schema

async function createUser() {
  const username = "newadmin";
  const password = "securepass123";
  const hashed = await bcrypt.hash(password, 10);

  await db.insert(users).values({
    username,
    password: hashed,
    isAdmin: true,
  }).execute();

  console.log("User created.");
}
createUser();
if (require.main === module) {
  createUser();
}