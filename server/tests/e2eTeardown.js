import mongoose from "mongoose";

export default async function e2eTeardown() {
  const uri = process.env.E2E_MONGO_URI;
  if (!uri) return;

  const databaseName = new URL(uri).pathname.replace(/^\//, "");
  if (!databaseName.startsWith("phreddit_e2e")) {
    throw new Error(`Refusing to drop non-e2e database: ${databaseName}`);
  }

  await mongoose.connect(uri);
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
}
