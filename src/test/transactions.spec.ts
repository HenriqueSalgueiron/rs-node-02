import { expect, it, beforeAll, afterAll, describe } from "vitest";
import request from "supertest";
import { app } from "../app";
import { beforeEach } from "vitest";
import { execSync } from "node:child_process";

describe("Transactions Routes", () => {
  // antes de todos os testes, garante que o app está rodando
  beforeAll(async () => {
    await app.ready();
  });

  // depois de todos os testes, fecha o app. serve para evitar vazamento de memória
  afterAll(async () => {
    await app.close();
  });

  // a cada teste, apaga e cria o banco novamente. faz isso para um teste não influenciar o outro
  beforeEach(async () => {
    execSync("npm run knex migrate:rollback --all");
    execSync("npm run knex migrate:latest");
  });

  // testes
  it("should create a transaction", async () => {
    const response = await request(app.server).post("/transactions").send({
      title: "New Transaction",
      amount: 5000,
      type: "credit",
    });
    expect(response.statusCode).toEqual(201);
  });

  it("should list all transactions for a session", async () => {
    const createTransactionResponse = await request(app.server)
      .post("/transactions")
      .send({
        title: "New Transaction",
        amount: 5000,
        type: "credit",
      });

    const cookies = createTransactionResponse.get("Set-Cookie");

    if (!cookies) {
      throw new Error("No cookies set in the response");
    }

    const listTransactionsResponse = await request(app.server)
      .get("/transactions")
      .set("Cookie", cookies)
      .expect(200);

    expect(listTransactionsResponse.body.transactions).toEqual([
      expect.objectContaining({
        title: "New Transaction",
        amount: 5000,
      }),
    ]);
  });

  it("should get a specific transaction", async () => {
    const newTransactionData = {
      title: "New Transaction",
      amount: 5000,
      type: "credit",
    };

    const createTransactionResponse = await request(app.server)
      .post("/transactions")
      .send(newTransactionData)
      .expect(201);

    const cookies = createTransactionResponse.get("Set-Cookie");

    if (!cookies) throw new Error("No cookies set in the response");

    const listTransactionsResponse = await request(app.server)
      .get("/transactions")
      .set("Cookie", cookies)
      .expect(200);

    const transactionId = listTransactionsResponse.body.transactions[0].id;

    const getTransactionByIdResponse = await request(app.server)
      .get(`/transactions/${transactionId}`)
      .set("Cookie", cookies)
      .expect(200);

    expect(getTransactionByIdResponse.body).toEqual(
      expect.objectContaining({
        title: newTransactionData.title,
        amount: newTransactionData.amount,
      })
    );
  });

  it("should get the summary", async () => {
    const firstTransactionData = {
      title: "First Transaction",
      amount: 123,
      type: "credit",
    };

    const secondTransactionData = {
      title: "Second Transaction",
      amount: 456,
      type: "credit",
    };

    const createFirstTransactionResponse = await request(app.server)
      .post("/transactions")
      .send(firstTransactionData)
      .expect(201);

    const cookies = createFirstTransactionResponse.get("Set-Cookie");

    if (!cookies) throw new Error("No cookies set in the response");

    const createSecondTransactionResponse = await request(app.server)
      .post("/transactions")
      .send(secondTransactionData)
      .set("Cookie", cookies)
      .expect(201);

    const summaryResponse = await request(app.server)
      .get("/transactions/summary")
      .set("Cookie", cookies)
      .expect(200);

    expect(summaryResponse.body).toEqual({
      total: firstTransactionData.amount + secondTransactionData.amount,
    });
  });
});
