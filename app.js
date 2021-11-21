import express from "express";
import { engine } from "express-handlebars";

const port = process.env.PORT || 3033;

const app = express();
app.engine("handlebars", engine());
app.set("view engine", "handlebars");
app.set("views", "./views");

app.use(express.static('build'))

app.get("/", (req, res) => res.render("home"));

app.get("/about", (req, res) => res.render("about"));

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