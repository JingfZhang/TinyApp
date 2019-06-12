const cookieSession = require("cookie-session");
const bcrypt = require("bcrypt");
const bodyParser = require("body-parser");
const express = require("express");
const app = express();
const PORT = 8080; // default port 8080


app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ["key1", "key2"],

  maxAge: 24 * 60 * 60 * 1000
}))

app.set("view engine", "ejs");


//generate a random string for shortURLs and user IDs
function generateRandomString() {
  return Math.random().toString(36).substr(2, 6);
}

//helper function that checks if an email address is already registered
function isRegistered(email) {
  let userArray = Object.values(users);
  for(user of userArray) {
    if (user["email"] === email) {
      return user;
    }
  }
  return false;
}

//helper function that check if the user has the URL in there account by matching IDs
function urlsForUser(id) {
  let urls =[];
  for (shortURL in urlDatabase) {
    if (urlDatabase[shortURL]["userID"] === id) {
      urls.push(shortURL);
    }
  }

  return urls;
}

const urlDatabase = {
  "b2xVn2": {longURL: "http://www.lighthouselabs.ca", userID: "aJ48lW"},
  "9sm5xK": {longURL: "http://www.google.com", userID: "aJ48lW"}
};
const users = {
  "aJ48lW": {
    id: "aJ48lW",
    email: "user@example.com",
    //purple-monkey-dinosaur
    password: "$2b$10$CKO/ZjvMkJCV7GcnZdz9MuhlEAD9qQnR4QBqvEis7ro56Gb0aEBPG"
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    //dishwasher-funk
    password: "$2b$10$Aw3Keor3AzfUq7WeSDhxQOP2xKvLhTUFXpJR4BkYYDDAI.k2cSdMC"
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

//renders urls page
app.get("/urls", (req, res) => {
  let templetVars = { urls: urlDatabase, userId: req.session.user_id, shortURLs: urlsForUser(req.session.user_id), user: users[req.session.user_id]};
  res.render("urls_index", templetVars);
});

//if login render the urls_new page for creating new URLs, if not login redirect the user to login page
app.get("/urls/new", (req, res) => {
  if (req.session.user_id) {
    let templetVars = {user: users[req.session.user_id]};
    res.render("urls_new", templetVars);
  } else {
    res.redirect("/login");
  }
});

//render the URL page for specific URL by the shorURL
app.get("/urls/:shortURL", (req, res) => {
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL]["longURL"], user: users[req.session.user_id] };
  if (req.session.user_id === urlDatabase[req.params.shortURL]["userID"]) {
    res.render("urls_show", templateVars);
  }
  res.redirect("/login");
});

//update the urls page after new URL is created and assign a random short URL for the new URL
app.post("/urls", (req, res) => {
  let newId = generateRandomString()
  urlDatabase[newId] = {longURL: req.body.longURL, userID: req.session.user_id};
  res.redirect("/urls");
});

//redirect to the corresponding long URL page by short URL
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL]["longURL"];
  res.redirect(longURL);
});

//delete URL
app.post("/urls/:shortURL/delete", (req,res) => {
  if (req.session.user_id === urlDatabase[req.params.shortURL]["userID"]) {
    delete urlDatabase[req.params.shortURL];
  }
  res.redirect("/urls");
});

//change the long URL of a short URL
app.post("/urls/:shortURL/update", (req,res) => {
  if (req.session.user_id === urlDatabase[req.params.shortURL]["userID"]) {
    urlDatabase[req.params.shortURL] = {
      longURL: req.body.newURL,
      userID: req.session.user_id
    }
  }
  res.redirect("/urls");
});

//renders the urls_login page for login
app.get("/login", (req, res) => {
  let templetVars = { user: users[req.session.user_id]};
  res.render("urls_login", templetVars);
})

//Check if user is registered and if password is correct when login when
app.post("/login", (req, res) => {
  let user = isRegistered(req.body.email);

  //if user is registered compare password. if not registered send an error indicating not registered
  if (user) {
    //if password is correct redirect to the users urls page. if not send an error indicating wrong password
    if (bcrypt.compareSync(req.body.password, user["password"])) {
      req.session.user_id = user["id"];
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

//logout
app.post("/logout", (req, res) => {
  req.session = null
  res.redirect("/urls");
});

//renders register page
app.get("/register", (req, res) => {
  let templetVars = { user: users[req.session.user_id]};
  res.render("urls_registration", templetVars);
});

//check if information entered is valid for registration
app.post("/register", (req, res) => {

  //if one of the field is blank send an error indicating the problem. if email is already registered send error
  //inform the user that the email is already registered
  if(!req.body.email || !req.body.password) {
    res.statusCode = 400;
    res.send("Enter info");
  } else if (isRegistered(req.body.email)) {
    res.statusCode = 400;
    res.send("Already registered");
  } else {
    //generate random string as user ID
    let userId = generateRandomString();
    users[userId] = {
      id: userId,
      email: req.body.email,
      //encrypt and store the encrypted password
      password: bcrypt.hashSync(req.body.password, 10)
    };
    req.session.user_id = userId;
    res.redirect("/urls");
  }
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});