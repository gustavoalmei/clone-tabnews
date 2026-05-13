import bcryptjs from "bcryptjs";

async function hash(password) {
  const rounds = getNumberOfRound();
  return await bcryptjs.hash(password, rounds);
}

function getNumberOfRound() {
  return process.env.NODE_ENV == "production" ? 14 : 1;
}

async function compare(providePassword, storedPassword) {
  return await bcryptjs.compare(providePassword, storedPassword);
}

const password = {
  hash,
  compare
};

export default password;