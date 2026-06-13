import { faker } from "@faker-js/faker/.";
import retry from "async-retry";
import database from "infra/database";
import migrator from "models/migrator";
import session from "models/session";
import user from "models/user";
import activation from "models/activation";

const EMAIL_HOST = `${process.env.EMAIL_HTTP_HOST}:${process.env.EMAIL_HTTP_PORT}`;

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

async function waitForEmailServices() {
  await waitForEmailServer();
}

async function waitForEmailServer() {
  return retry(fetchStatusPage, {
    retries: 100,
    naxTimeout: 1000,
  });

  async function fetchStatusPage() {
    const response = await fetch(`http://${EMAIL_HOST}/messages`);

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
      objectUser?.username || faker.internet.username().replace(/[_.-]/g, ""),
    email: objectUser?.email || faker.internet.email(),
    password: objectUser?.password || faker.internet.password(),
  });
}

async function createSession(userId) {
  return await session.create(userId);
}

async function clearAllEmails() {
  await fetch(`http://${EMAIL_HOST}/messages`, {
    method: "DELETE",
  });
}

async function getLastEmail() {
  const listEmails = await fetch(`http://${EMAIL_HOST}/messages`);
  const listEmailsReponse = await listEmails.json();
  const lastEmailItem = listEmailsReponse.pop();

  const getDetailsEmail = await fetch(
    `http://${EMAIL_HOST}/messages/${lastEmailItem.id}.plain`,
  );
  const getDetailsEmailResponse = await getDetailsEmail.text();
  lastEmailItem.text = getDetailsEmailResponse;
  return lastEmailItem;
}

async function activateUser(objectUser) {
  return await activation.activateUserByUserId(objectUser.id);
}

async function addFeaturesToUser(objectUser, features) {
  return await user.addFeatures(objectUser.id, features);
}

const orchestrator = {
  waitForAllServices,
  clearDatabase,
  runPendingMigrations,
  createUser,
  createSession,
  clearAllEmails,
  waitForEmailServices,
  getLastEmail,
  activateUser,
  addFeaturesToUser,
};

export default orchestrator;
