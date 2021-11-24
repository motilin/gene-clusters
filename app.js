import express from "express";
import cors from "cors";
import { engine } from "express-handlebars";
import {
  connectToDB,
  getNumberOfPatients,
  getNumberOfGenes,
  getGroupedByPatient,
  getPatientByIndex,
  getIndexByPatient,
  getIndexByGene,
  getGeneByIndex,
  getMaxValue,
  getMatrix,
  getFlattened,
} from "./lib/handlers.js";

const port = process.env.PORT || 3033;
const app = express();
app.engine("handlebars", engine());
app.set("view engine", "handlebars");
app.set("views", "./views");
app.disable("x-powered-by");

connectToDB((err) => {
  if (err) {
    app.use((err, req, res, next) => {
      console.log(err.message);
      res.status(500);
      res.render("500");
    });
  } else {
    app.use(express.static("build"));
    app.use("/api", cors());
    app.get("/about", (req, res) => res.render("about"));

    app.get("/headers", (req, res) => {
      res.type("text/plain");
      const headers = Object.entries(req.headers).map(
        ([key, value]) => `${key}: ${value}`
      );
      res.send(headers.join("\n"));
    });

    app.get("/api/numberOfPatients", getNumberOfPatients());
    app.get("/api/numberOfGenes", getNumberOfGenes());
    app.get("/api/groupedByPatient", getGroupedByPatient());
    app.get("/api/patientByIndex", getPatientByIndex());
    app.get("/api/indexByPatient", getIndexByPatient());
    app.get("/api/indexByGene", getIndexByGene());
    app.get("/api/geneByIndex", getGeneByIndex());
    app.get("/api/maxValue", getMaxValue());
    app.get("/api/matrix", getMatrix());
    app.get("/api/flattened", getFlattened());

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
