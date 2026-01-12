import { FastifyReply, FastifyRequest } from "fastify";

export async function checkSessionIdExists(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const session_id = request.cookies.sessionId;

  if (!session_id) {
    return reply.status(401).send({ error: "Unauthorized" });
  }
}
