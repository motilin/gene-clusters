const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const hb = require("express-handlebars");
const handlebars = require("handlebars");
const handlers = require("./lib/handlers.js");

const port = process.env.PORT || 3033;
const app = express();
app.engine("handlebars", hb.engine());
app.set("view engine", "handlebars");
app.set("views", "./views");
app.disable("x-powered-by");

handlers.connectToRedis();
handlers.connectToDB((err) => {
  if (err) {
    app.use((err, req, res, next) => {
      console.log(err.message);
      res.status(500);
      res.render("500");
    });
  } else {
    app.use(express.static("build"));
    app.use("/api", cors());
    app.use(bodyParser.json({ extended: true }));

    app.get("/about", (req, res) => res.render("about"));
    app.get("/headers", (req, res) => {
      res.type("text/plain");
      const headers = Object.entries(req.headers).map(
        ([key, value]) => `${key}: ${value}`
      );
      res.send(headers.join("\n"));
    });

    app.get("/api/numberOfPatients", handlers.getNumberOfPatients());
    app.get("/api/numberOfGenes", handlers.getNumberOfGenes());
    app.get("/api/groupedByPatient", handlers.getGroupedByPatient());
    app.get("/api/patientByIndex", handlers.getPatientByIndex());
    app.get("/api/indexByPatient", handlers.getIndexByPatient());
    app.get("/api/indexByGene", handlers.getIndexByGene());
    app.get("/api/geneByIndex", handlers.getGeneByIndex());
    app.get("/api/maxValue", handlers.getMaxValue());
    app.get("/api/matrix", handlers.getMatrix());
    app.get("/api/flattened", handlers.getFlattened());
    app.get("/api/currentPatient", handlers.getCurrentPatient());
    app.post("/api/submit", handlers.submitForm);
    app.post("/api/cancel", handlers.cancelJobs);

    app.use((req, res) => {
      res.status(404);
      res.render("404");
    });

    app.use((err, req, res, next) => {
      console.log(err.message);
      res.status(500);
      res.render("500");
    });

    app.listen(port, () => {
      console.log(
        `Express started on http://localhost:${port}; press Ctrl+C to terminate`
      );
    });
  }
});
