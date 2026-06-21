import dotenv from "dotenv";
import { httpServer } from "./app";

dotenv.config({ path: ".env.local" });
dotenv.config(); // Also load from .env

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

