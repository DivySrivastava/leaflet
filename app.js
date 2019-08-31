var createError = require("http-errors");
const compression = require('compression');
var express = require("express");
const helmet = require('helmet');
var path = require("path");
var expressSession = require("express-session");
var bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");

const protection = require('./utils/middleware/protection');

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
var accountRouter = require("./routes/auth");
var meRouter = require("./routes/settings");
var extraRouter = require("./routes/extras/wordbeater/main");
var categoryRouter = require("./routes/category");
var restApi = require("./routes/api/v1/index");
var publicApiRouter = require("./routes/developer/api");
var chatRouter = require("./routes/chat");

var app = express();
app.conf = require("./config/app");
// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
/*
var cooky = {
  secret: app.conf.cookie.secret,
  resave: app.conf.cookie.resave,
  expires: app.conf.cookie.expiresIn,
  saveUninitialized: app.conf.cookie.saveUninitialized
};

app.sessionMiddleware = expressSession(cooky);*/

app.set("trust proxy", 1); // trust first proxy
//app.use(app.sessionMiddleware);

const NODE_ENV = process.env.NODE_ENV || app.conf.env || 'development';
const isDev = NODE_ENV === 'development';

// Setup session environment
if (isDev) {
  var morgan = require("morgan");
  app.use(morgan('dev'));
  // SESSION - Use FileStore in development mode.
  const FileStore = require('session-file-store')(expressSession);
  app.use(expressSession ({
    resave: app.conf.cookie.resave,
    saveUninitialized: app.conf.cookie.saveUninitialized,
    secret: app.conf.cookie.secret,
    expires: app.conf.cookie.expiresIn,
    store: new FileStore(),
  }));
} else {
  // SESSION - Use RedisStore in production mode.
  const RedisStore = require('connect-redis')(expressSession);
  app.use(expressSession({
    resave: app.conf.cookie.resave,
    saveUninitialized: app.conf.cookie.saveUninitialized,
    secret: app.conf.cookie.secret,
    expires: app.conf.cookie.expiresIn,
    store: new RedisStore({
      host: app.config.redis.host,
      port: app.config.redis.port,
    }),
  }));
  app.use(compression());
  app.use(helmet());
  // APP - render from static
  server.use(express.static('dist'));
}
//app.use(morgan("tiny"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/account", accountRouter);
// Secure routes
app.use(protection.isAuthenticated);
app.use("/u", usersRouter);
app.use("/me", meRouter);
app.use("/api", restApi);
app.use("/category", categoryRouter);
app.use("/products", extraRouter);
app.use("/chat", chatRouter);
app.use("/developer", publicApiRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error", {
    title: req.app.conf.name,
  });
});

module.exports = app;
