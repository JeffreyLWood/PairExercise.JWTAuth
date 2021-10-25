const Sequelize = require("sequelize");
const jwt = require("jsonwebtoken");
const { STRING } = Sequelize;
const bcrypt = require("bcrypt");
const config = {
  logging: false,
};

if (process.env.LOGGING) {
  delete config.logging;
}
const conn = new Sequelize(
  process.env.DATABASE_URL || "postgres://localhost/acme_db",
  config
);

const SECRET_KEY = "jwtkey";

const User = conn.define("user", {
  username: STRING,
  password: STRING,
});

User.byToken = async (token) => {
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    console.log("TEST");
    if (decoded) {
      const user = await User.findByPk(decoded.userId);
      return user;
    }
    // const error = Error("bad credentials");
    // error.status = 401;
    // throw error;
  } catch (ex) {
    const error = Error("bad credentials, line 36");
    error.status = 401;
    throw error;
  }
};

User.authenticate = async ({ username, password }) => {
  const user = await User.findOne({
    where: {
      username,
      // password,
    },
  });

  const result = await bcrypt.compare(password, user.dataValues.password);
  //
  if (result) {
    // if (user) {
    const token = jwt.sign({ userId: user.id }, SECRET_KEY);
    console.log("TOKEN", token);
    return token;
    // }
  } else {
    const error = Error("bad credentials");
    error.status = 604;
    throw error;
  }
};

// Hook
User.beforeCreate(async (user, options) => {
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(user.password, saltRounds);
  // function (err, hash) {
  //   user.password = hashedPassword;
  // }

  user.password = hashedPassword;

  console.log(user.password);
});

const syncAndSeed = async () => {
  await conn.sync({ force: true });
  const credentials = [
    { username: "lucy", password: "lucy_pw" },
    { username: "moe", password: "moe_pw" },
    { username: "larry", password: "larry_pw" },
  ];
  const [lucy, moe, larry] = await Promise.all(
    credentials.map((credential) => User.create(credential))
  );
  return {
    users: {
      lucy,
      moe,
      larry,
    },
  };
};

module.exports = {
  syncAndSeed,
  models: {
    User,
  },
};
