const dotenv = require("dotenv");
dotenv.config();

const port = process.env.PORT;

const express = require("express");
const app = express();
app.use(express.json());

const { Client } = require("pg");

const MAX_CHUNK_SIZE = 4096;

app.use((req, res, next) => {
  res.append("Access-Control-Allow-Origin", ["*"]);
  res.append("Access-Control-Allow-Methods", "GET");
  res.append("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Content-Type", "application/json");
  next();
});

app.get("/chunk/:x/:y/:z", (req, res) => {
  const x = parseInt(req.params.x);
  const y = parseInt(req.params.y);
  const z = parseInt(req.params.z);

  res.set("");

  const client = new Client();
  client.connect();

  client
    .query(`SELECT voxels FROM "chunk" where x = ${x} and y = ${y} and z = ${z}`)
    .then((result) => {
      if (result.rows.length === 1) {
        res.send({ x: x, y: y, z: z, voxels: result.rows[0].voxels });
      } else {
        res.status("500").send("duplicate chunks found");
      }
    })
    .catch((err) => {
      console.log(err);
      res.status("500").send("Internal Server Error");
    })
    .then(() => client.end());
});

app.post("/chunk/:x/:y/:z", (req, res) => {
  const x = req.params.x;
  const y = req.params.y;
  const z = req.params.z;
  const voxels = req.body.voxels;
  res.set("");

  const client = new Client();
  client.connect();

  const attempt = `INSERT into chunk VALUES (${x}, ${y}, ${z}, ARRAY[${voxels}])`;
  console.log(attempt);
  console.log(req.body);
  //   console.log(voxels);

  if (voxels == null) {
    res.status(500).send("i ned voxels");
    return;
  }

  client
    .query(attempt)
    .then((result) => {
      res.send("Success");
    })
    .catch((err) => {
      console.log(err);
      res.status("500").send("Internal Server Error");
    })
    .then(() => client.end());
});

app.get("/test/:x/:y/:z", (req, res) => {
  console.log(req.params);
  res.send("Test");
});

app.put("/chunk/gen", (req, res) => {
  const x = Math.floor(Math.random() * 25000);
  const y = Math.floor(Math.random() * 25000);
  const z = Math.floor(Math.random() * 25000);
  let voxels = [];
  for (let i = 0; i < MAX_CHUNK_SIZE; i++) {
    voxels.push(Math.floor(Math.random() * (256 - 0)));
  }

  const client = new Client();
  client.connect();

  const attempt = `INSERT into chunk VALUES (${x}, ${y}, ${z}, ARRAY[${voxels}]) ON CONFLICT (x,y,z) DO UPDATE SET voxels = ARRAY[${voxels}]`;
  console.log(attempt);

  if (voxels == null) {
    res.status(500).send("i ned voxels");
    return;
  }

  client
    .query(attempt)
    .then((result) => {
      res.send("Success");
    })
    .catch((err) => {
      console.log(err);
      res.status("500").send("Internal Server Error");
    })
    .then(() => client.end());
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
