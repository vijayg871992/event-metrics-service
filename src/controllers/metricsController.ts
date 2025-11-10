import { FastifyReply, FastifyRequest } from "fastify";
import { DailyMetricsModel } from "../models/DailyMetrics";

export async function getMetrics(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { date, from, to, event_type } = request.query as {
      date?: string;
      from?: string;
      to?: string;
      event_type?: string;
    };

    let filter: any = {};

    if (date) filter.date = date;
    //else if (from && to) filter.date = { $gte: from, $lte: to };
    else if (from && to) {
      // Normalize dates to YYYY-MM-DD format with zero-padding
      const fromDate = new Date(from).toISOString().split("T")[0];
      const toDate = new Date(to).toISOString().split("T")[0];
      filter.date = { $gte: fromDate, $lte: toDate };
    } 

    else if (from) {
      // Normalize dates to YYYY-MM-DD format with zero-padding
      const fromDate = new Date(from).toISOString().split("T")[0];
      filter.date = { $gte: fromDate };
    }
    
    else if (event_type) filter["metrics.event_type"] = event_type;

    const metrics = await DailyMetricsModel.find(filter).sort({ date: 1 });

    if (!metrics.length)
      return reply.code(404).send({ message: "No metrics found" });

    const data = metrics.map((doc) => ({
      date: doc.date,
      metrics: doc.metrics.filter(
        (m) => !event_type || m.event_type === event_type
      ),
    }));

    reply.send({ count: data.length, data });

    //reply.send({ count: metrics.length, data: metrics });
  } catch (err: any) {
    request.log.error({ err }, "Error fetching metrics");
    reply.code(500).send({ error: "Internal server error" });
  }
}
