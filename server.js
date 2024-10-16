import express from "express";
import envLoader from './utils/env_loader.js';
import router from './routes/index.js';


envLoader();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

app.use("/", router);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});