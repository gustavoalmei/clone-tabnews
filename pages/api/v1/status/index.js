function status(req, res) {
  res.status(200).json({ status: "os alunos do curso.dev são os melhores" });
}

export default status;
