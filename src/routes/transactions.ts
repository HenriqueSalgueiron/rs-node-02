import { FastifyInstance } from "fastify";
import { knex } from "../database";
import { check, z } from "zod";
import crypto, { randomUUID } from "node:crypto";
import { checkSessionIdExists } from "../middlewares/check-session-id-exists";

export async function transactionsRoutes(app: FastifyInstance) {
  // Get all
  app.get(
    "/",
    {
      preHandler: [checkSessionIdExists],
    },
    async (request, reply) => {
      const session_id = request.cookies.sessionId;

      const transactions = await knex("transactions")
        .where({ session_id })
        .select();
      return reply.send({ transactions });
    }
  );

  // Get all master
  app.get("/master", async (request, reply) => {
    const transactions = await knex("transactions").select();
    return reply.send({ transactions });
  });

  // Get by ID
  app.get(
    "/:id",
    {
      preHandler: [checkSessionIdExists],
    },
    async (request, reply) => {
      const paramsSchema = z.object({
        id: z.uuid(),
      });

      const { id } = paramsSchema.parse(request.params);
      const session_id = request.cookies.sessionId;

      const transaction = await knex("transactions")
        .where({ id, session_id })
        .first();

      if (!transaction) {
        return reply.status(404).send({ message: "Transaction not found" });
      }

      return reply.send(transaction);
    }
  );

  // Get summary
  app.get(
    "/summary",
    {
      preHandler: [checkSessionIdExists],
    },
    async (request, reply) => {
      const session_id = request.cookies.sessionId;

      const summary = await knex("transactions")
        .where({ session_id })
        .sum("amount", { as: "total" })
        .first();

      return summary;
    }
  );

  // Create new
  app.post("/", async (request, reply) => {
    const bodySchema = z.object({
      title: z.string(),
      amount: z.number(),
      type: z.enum(["credit", "debit"]),
    });

    const { title, amount, type } = bodySchema.parse(request.body);

    let sessionId = request.cookies.sessionId;

    if (!sessionId) {
      sessionId = randomUUID();

      reply.cookie("sessionId", sessionId, {
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days, in seconds
      });
    }

    const transaction = {
      id: crypto.randomUUID(),
      title,
      amount: type === "credit" ? amount : -amount,
      session_id: sessionId,
    };

    await knex("transactions").insert(transaction);

    return reply.status(201).send(transaction);
  });
}
