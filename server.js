import express from "express";
import envLoader from './utils/env_loader.js';
import injectRoutes from './routes/index.js';


envLoader();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

injectRoutes(app);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

export default app;