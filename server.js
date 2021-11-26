if (process.env.Node_ENV !== "production") {
  require("dotenv").config();
}
if (typeof localStorage === "undefined" || localStorage === null) {
  var LocalStorage = require("node-localstorage").LocalStorage;
  localStorage = new LocalStorage("./database");
}

//require everything I need
const express = require("express");
const app = express();
let bcrypt = require("bcrypt");
const passport = require("passport");
const flash = require("express-flash");
const sessions = require("express-session");
const methodOverride = require("method-override");

const initializePassport = require("./models/passport-config");
initializePassport(
  passport,
  (email) => users.find((user) => user.email === email),
  (id) => users.find((user) => user.id === id)
);

//user
const users = [];

//travels array
const todbarray = [];

//So I can use ejs to frontend
app.set("view-engine", "ejs");

//Make a public foldel so my css and pictures work
app.use("/public", express.static("public"));

//put the diffetent librarys at work
app.use(express.urlencoded({ extended: false }));
app.use(flash());
app.use(
  sessions({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride("_method"));

app.get("/", checkNotAuthenticated, (req, res) => {
  res.render("index.ejs");
});
//.get is mostly used to render the ejs files
app.get("/menu", checkAuthenticated, (req, res) => {
  res.render("menu.ejs");
});

app.post("/menu", checkAuthenticated, (req, res) => {
  try {
    const gruppe = [
      {
        id: "1",
        name: "patrick",
        email: "p@p",
        destination: "sao paulo",
        package: "gold",
      },
      {
        id: "2",
        name: "milla",
        email: "m@m",
        destination: "budapest",
        package: "silver",
      },
      {
        id: "3",
        name: "jen",
        email: "j@j",
        destination: "moskow",
        package: "bronze",
      },
    ];
    todbarray.push(gruppe[0]);
    todbarray.push(gruppe[1]);
    todbarray.push(gruppe[2]);
    console.log(todbarray);
    res.redirect("/menu");
  } catch {}
  localStorage.setItem("reservations", JSON.stringify(todbarray));
});

app.get("/register", checkAuthenticated, (req, res) => {
  res.render("register.ejs");
});

function findallreservations(reservatione) {
  let result = "";
  //console.log(reservatione);
  for (i = 0; i < Object.keys(reservatione).length; i++) {
    //console.log(reservatione[i]);
    //console.log("test");
    result +=
      i +
      1 +
      "." +
      "<br>" +
      "ID: " +
      reservatione[i].id +
      "<br>" +
      "Name: " +
      reservatione[i].name +
      "<br>" +
      "Email: " +
      reservatione[i].email +
      "<br>" +
      "Destination: " +
      reservatione[i].destination +
      "<br>" +
      "Package: " +
      reservatione[i].package +
      "<br>" +
      "<br>";
  }
  return result;
}

app.get("/allreservations", checkAuthenticated, async (req, res) => {
  const reservationdb = JSON.parse(localStorage.getItem("reservations"));
  //console.log(reservationdb);
  //console.log(findallreservations(reservationdb));
  const reservation = findallreservations(reservationdb);
  console.log(reservation);
  res.render("allreservations.ejs", { reservation: reservation });
});

app.get("/singlereservation", checkAuthenticated, (req, res) => {
  res.render("singlereservation.ejs", { reservation: "" });
});

//register process - working fine
app.post("/register", checkAuthenticated, async (req, res) => {
  try {
    //encrypt the Uses password, so "we" cant see it
    const travel = {
      id: Date.now().toString(),
      name: req.body.name,
      email: req.body.email,
      destination: req.body.destination,
      package: req.body.package,
    };
    todbarray.push(travel);

    //if all the above is right, than redirect the user to login page
    res.redirect("/menu");
    console.log(todbarray);
  } catch {
    //if for some reason there is a failure, redirect back to register
    res.redirect("/register");
  }
  localStorage.setItem("reservations", JSON.stringify(todbarray));
});

function findsinglereservations(reservatione, id) {
  let result = "";
  //console.log(reservatione);
  for (i = 0; i < Object.keys(reservatione).length; i++) {
    if (id === reservatione[i].id) {
      result +=
        i +
        1 +
        "." +
        "<br>" +
        "ID: " +
        reservatione[i].id +
        "<br>" +
        "Name: " +
        reservatione[i].name +
        "<br>" +
        "Email: " +
        reservatione[i].email +
        "<br>" +
        "Destination: " +
        reservatione[i].destination +
        "<br>" +
        "Package: " +
        reservatione[i].package +
        "<br>" +
        "<br>";
    }
  }
  return result;
}

app.post("/singlereservation", checkAuthenticated, (req, res) => {
  try {
    const reservationdb = JSON.parse(localStorage.getItem("reservations"));
    const reservationid = req.body.id;
    const reservation = findsinglereservations(reservationdb, reservationid);
    res.render("singlereservation.ejs", { reservation: reservation });
  } catch {
    res.redirect("/");
  }
});

//---------------------------------------------USER Part-----------------------------------------------------------------
app.get("/registeruser", checkNotAuthenticated, (req, res) => {
  res.render("registeruser.ejs");
});

app.get("/autocomplete", checkNotAuthenticated, (req, res) => {
  res.render("autocomplete.ejs");
});

app.post("/registeruser", checkNotAuthenticated, async (req, res) => {
  try {
    //encrypt the Uses password, so "we" cant see it
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const person = {
      id: Date.now().toString(),
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword,
    };
    users.push(person);

    //if all the above is right, than redirect the user to login page
    res.redirect("/login");
    console.log(users);
  } catch {
    //if for some reason there is a failure, redirect back to register
    res.redirect("/registeruser");
  }
  localStorage.setItem("users", JSON.stringify(users));
});

app.get("/login", checkNotAuthenticated, (req, res) => {
  res.render("login.ejs");
});

app.post(
  "/login",
  checkNotAuthenticated,
  passport.authenticate("local", {
    successRedirect: "/menu",
    failureRedirect: "/login",
    failureFlash: true,
  })
);

app.delete("/logout", async (req, res) => {
  req.logOut();
  res.redirect("/login");
});

function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/");
}

function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect("/menu");
  }
  next();
}

//Listen on port 3000... "localhost:3000/"
app.listen(3000);
