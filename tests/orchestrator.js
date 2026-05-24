import { faker } from "@faker-js/faker/.";
import retry from "async-retry";
import database from "infra/database";
import migrator from "models/migrator";
import session from "models/session";
import user from "models/user";

async function waitForAllServices() {
  await waitForWebServer();
}

async function waitForWebServer() {
  return retry(fetchStatusPage, {
    retries: 100,
    naxTimeout: 1000,
  });

  async function fetchStatusPage() {
    const response = await fetch("http://localhost:3000/api/v1/status");

    if (response.status !== 200) {
      throw Error();
    }
  }
}

async function runPendingMigrations() {
  await migrator.runPendingMigrations();
}

async function clearDatabase() {
  await database.query("drop schema public cascade; create schema public");
}

async function createUser(objectUser) {
  return await user.create({
    username:
      objectUser.username || faker.internet.username().replace(/[_.-]/g, ""),
    email: objectUser.email || faker.internet.email(),
    password: objectUser.password || faker.internet.password(),
  });
}

async function createSession(userId){
  return await session.create(userId)
}

const orchestrator = {
  waitForAllServices,
  clearDatabase,
  runPendingMigrations,
  createUser,
  createSession,
};

export default orchestrator;
