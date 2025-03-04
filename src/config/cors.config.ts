export const allowedOrigins = ["http://localhost:3000"];

export const corsOptions = {
  credentials: true,
  origin: allowedOrigins,
  allowedHeaders: ["Authorization", "Cookie", "Content-Type"],
  methods: ["GET", "POST", "PUT", "DELETE"],
};
