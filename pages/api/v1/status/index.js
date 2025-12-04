import database from "infra/database";

async function status(req, res) {
  const result = await database.query("select 1 + 1 as sum;");
  console.log(result.rows);
  res.status(200).json({ status: "os alunos do curso.dev são os melhores" });
}

export default status;
