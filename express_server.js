const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieParser = require('cookie-parser');

const bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

app.set("view engine", "ejs");

function generateRandomString() {
  return Math.random().toString(36).substr(2, 6);
}

function isRegistered(email) {
  let userArray = Object.values(users);
  for(user of userArray) {
    if (user["email"] === email) {
      return user;
    }
  }
  return false;
}

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
}

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  let templetVars = { urls: urlDatabase, user: users[req.cookies["user_id"]]};
  res.render("urls_index", templetVars);
});

app.get("/urls/new", (req, res) => {
  let templetVars = {user: users[req.cookies["user_id"]]};
  res.render("urls_new", templetVars);
});

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user: users[req.cookies["user_id"]] };
  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
  urlDatabase[generateRandomString()] = req.body.longURL;
  res.redirect("/urls");
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.post("/urls/:shortURL/delete", (req,res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

app.post("/urls/:shortURL/update", (req,res) => {
  urlDatabase[req.params.shortURL] = req.body.newURL;
  res.redirect("/urls");
});

app.get("/login", (req, res) => {
  let templetVars = { user: users[req.cookies["user_id"]]};
  res.render("urls_login", templetVars);
})

app.post("/login", (req, res) => {
  let user = isRegistered(req.body.email);
  if (user) {
    if (req.body.password === user["password"]) {
      res.cookie("user_id", user["id"]);
      res.redirect("/urls");
    } else {
      res.statusCode = 403;
      res.send("Incorrect password");
    }
  } else {
    res.statusCode = 403;
    res.send("Not registered");
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  let templetVars = { user: users[req.cookies["user_id"]]};
  res.render("urls_registration", templetVars);
});

app.post("/register", (req, res) => {
  if(!req.body.email || !req.body.password) {
    res.statusCode = 400;
    res.send("Enter info");
  }
   else if (isRegistered(req.body.email)) {
    res.statusCode = 400;
    res.send("Already registered");
  } else {
    let userId = generateRandomString();
    users[userId] = {
      id: userId,
      email: req.body.email,
      password: req.body.password
    };
    res.cookie("user_id", userId);
    res.redirect("/urls");
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});