import email from "infra/email";
import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForEmailServices();
});

describe("infra/email.js", () => {
  test("send()", async () => {
    orchestrator.clearAllEmails();

    await email.send({
      from: "Fininfo <fininfo@fininfos.com.br>",
      to: "fininfo@destinatario.com",
      subject: "Teste de assunto",
      text: "Teste de corpo.", // text/plain
      //html: "<h1>Teste de corpo.</h1>" //text/html
    });

    await email.send({
      from: "Fininfo <fininfo@fininfos.com.br>",
      to: "fininfo@destinatario.com",
      subject: "Teste de assunto do e-mail 2",
      text: "Teste de corpo do email 2.", // text/plain
      //html: "<h1>Teste de corpo.</h1>" //text/html
    });

    const lastEmail = await orchestrator.getLastEmail();

    expect(lastEmail.sender).toBe("<fininfo@fininfos.com.br>");
    expect(lastEmail.recipients[0]).toBe("<fininfo@destinatario.com>");
    expect(lastEmail.subject).toBe("Teste de assunto do e-mail 2");
    expect(lastEmail.text).toBe("Teste de corpo do email 2.\n");
  });
});
