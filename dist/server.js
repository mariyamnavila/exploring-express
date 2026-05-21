
        import { createRequire } from 'module';
        const require = createRequire(import.meta.url);
        

// src/app.ts
import express from "express";

// src/modules/user/user.route.ts
import { Router } from "express";

// src/db/index.ts
import { Pool } from "pg";

// src/config/index.ts
import dotenv from "dotenv";
import path from "path";
dotenv.config({
  path: path.join(process.cwd(), ".env")
});
var config = {
  connection_string: process.env.CONNECTIONSTRING,
  port: process.env.PORT,
  secret: process.env.JWT_SECRET,
  refresh_secret: process.env.JWT_REFRESH_SECRET
};
var config_default = config;

// src/db/index.ts
var pool = new Pool({
  connectionString: config_default.connection_string,
  ssl: {
    rejectUnauthorized: false
  }
});
var initDB = async () => {
  try {
    await pool.query(`
                CREATE TABLE IF NOT EXISTS users(
                id SERIAL PRIMARY KEY,
                name VARCHAR(20),
                email VARCHAR(225) UNIQUE NOT NULL,
                password TEXT NOT NULL,
                is_active BOOLEAN DEFAULT true,
                age INT,
                role VARCHAR DEFAULT 'user',

                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
                ) 
            `);
    await pool.query(`
                CREATE TABLE IF NOT EXISTS profiles(
                id SERIAL PRIMARY KEY,
                user_id INT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
                bio TEXT,
                address TEXT,
                phone VARCHAR(15),
                gender VARCHAR(10),
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
                )`);
    console.log("Database connected successfully");
  } catch (error) {
    console.log(error);
  }
};

// src/modules/user/user.service.ts
import bcrypt from "bcryptjs";
var createUserIntoDB = async (payload) => {
  const { name, email, password, age, role } = payload;
  const hashPassword = await bcrypt.hash(password, 10);
  const result = await pool.query(`
        INSERT INTO users (name,email,password,age,role) VALUES($1,$2,$3,$4,COALESCE($5,'user'))
        RETURNING *
        `, [name, email, hashPassword, age, role]);
  delete result.rows[0].password;
  return result;
};
var getAllUsersFromDB = async () => {
  const result = await pool.query(`
    SELECT * FROM users
    `);
  result.rows.map((user) => delete user.password);
  return result;
};
var getSingleUserFromDB = async (id) => {
  const result = await pool.query(`
            SELECT * FROM users
            WHERE id  = $1
            `, [id]);
  delete result.rows[0].password;
  return result;
};
var updateUserFromDB = async (payload, id) => {
  const { name, password, age, is_active } = payload;
  const hashPassword = await bcrypt.hash(password, 10);
  const result = await pool.query(`
            UPDATE users
            SET name = COALESCE($1, name), 
                password = COALESCE($2, password), 
                age = COALESCE($3, age), 
                is_active = COALESCE($4, is_active)
            WHERE id = $5
            RETURNING *
        `, [name, hashPassword, age, is_active, id]);
  delete result.rows[0].password;
  return result;
};
var deleteUserFromDB = async (id) => {
  const result = await pool.query(`
            DELETE FROM users 
            WHERE id = $1
            `, [id]);
  return result;
};
var userService = {
  createUserIntoDB,
  getAllUsersFromDB,
  getSingleUserFromDB,
  updateUserFromDB,
  deleteUserFromDB
};

// src/utility/sendResponses.ts
var sendResponse = (res, data) => {
  const { status, success, message, data: result, error } = data;
  res.status(status).json({
    success,
    message,
    data: result,
    error
  });
};
var sendResponses_default = sendResponse;

// src/modules/user/user.controller.ts
var createUser = async (req, res) => {
  try {
    const result = await userService.createUserIntoDB(req.body);
    sendResponses_default(res, {
      status: 201,
      success: true,
      message: "User created successfully",
      data: result.rows[0]
    });
  } catch (error) {
    sendResponses_default(res, {
      status: 500,
      success: false,
      message: error.message,
      error
    });
  }
};
var getAllUser = async (req, res) => {
  try {
    const result = await userService.getAllUsersFromDB();
    res.status(200).json({
      success: true,
      message: "Users retrieved successfully",
      data: result.rows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error
    });
  }
};
var getSingleUser = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await userService.getSingleUserFromDB(id);
    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "User not found",
        data: {}
      });
    }
    res.status(200).json({
      success: true,
      message: "User retrieved successfully",
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error
    });
  }
};
var updateSingleUser = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await userService.updateUserFromDB(req.body, id);
    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "User not found",
        data: {}
      });
    }
    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error
    });
  }
};
var deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await userService.deleteUserFromDB(id);
    if (result.rowCount === 0) {
      res.status(404).json({
        success: false,
        message: "User not found",
        data: {}
      });
    }
    res.status(200).json({
      success: true,
      message: "User deleted successfully",
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error
    });
  }
};
var userController = {
  createUser,
  getAllUser,
  getSingleUser,
  updateSingleUser,
  deleteUser
};

// src/middleware/auth.ts
import jwt from "jsonwebtoken";
var auth = (...roles) => {
  return async (req, res, next) => {
    try {
      const token = req.headers.authorization;
      if (!token) {
        res.status(401).json({
          success: false,
          message: "Unauthorized access!"
        });
      }
      const decoded = jwt.verify(token, config_default.secret);
      const userData = await pool.query(`
            SELECT * FROM users
            WHERE email=$1
            `, [decoded.email]);
      const user = userData.rows[0];
      if (userData.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: "User not found"
        });
      }
      if (!user?.is_active) {
        res.status(403).json({
          success: false,
          message: "Forbidden!!"
        });
      }
      if (roles.length && !roles.includes(user.role)) {
        res.status(403).json({
          success: false,
          message: "Forbidden!!, this role have no access"
        });
      }
      req.user = decoded;
      next();
    } catch (error) {
      next(error);
    }
  };
};
var auth_default = auth;

// src/types/index.ts
var USER_ROLE = {
  admin: "admin",
  agent: "agent",
  user: "user"
};

// src/modules/user/user.route.ts
var router = Router();
router.post("/", userController.createUser);
router.get("/", auth_default(USER_ROLE.admin, USER_ROLE.agent), userController.getAllUser);
router.get("/:id", userController.getSingleUser);
router.put("/:id", userController.updateSingleUser);
router.delete("/:id", userController.deleteUser);
var userRoute = router;

// src/modules/profile/profile.route.ts
import { Router as Router2 } from "express";

// src/modules/profile/profile.service.ts
var createProfileIntoDB = async (payload) => {
  const { user_id, bio, address, phone, gender } = payload;
  const user = await pool.query(`
        SELECT * FROM users 
        WHERE id=$1
        `, [user_id]);
  if (user.rows.length === 0) {
    throw new Error("User not exists!");
  }
  const result = await pool.query(`
        INSERT INTO 
        profiles(user_id, bio, address, phone, gender) 
        VALUES($1,$2,$3,$4,$5)
        RETURNING *
        `, [user_id, bio, address, phone, gender]);
  return result;
};
var getAllProfilesFromDB = async () => {
  const profiles = await pool.query(`
        SELECT * FROM profiles
        `);
  return profiles;
};
var getSingleProfileFromDB = async (id) => {
  const profile = await pool.query(`
        SELECT * FROM profiles
        WHERE id = $1
        `, [id]);
  return profile;
};
var updateProfileFromDB = async (payload, id) => {
  const { bio, address, gender, phone } = payload;
  const updatedProfile = await pool.query(`
        UPDATE profiles
        SET bio = COALESCE($1,bio),
            address = COALESCE($2,address),
            gender = COALESCE($3,gender),
            phone = COALESCE($4,phone),
            updated_at = NOW()
        WHERE id = $5
        RETURNING *
        `, [bio, address, gender, phone, id]);
  return updatedProfile;
};
var deleteProfileFromDB = async (id) => {
  const result = await pool.query(`
        DELETE FROM profiles
        WHERE id = $1
        `, [id]);
  return result;
};
var profileService = {
  createProfileIntoDB,
  getAllProfilesFromDB,
  getSingleProfileFromDB,
  updateProfileFromDB,
  deleteProfileFromDB
};

// src/modules/profile/profile.controller.ts
var createProfile = async (req, res) => {
  try {
    const result = await profileService.createProfileIntoDB(req.body);
    res.status(201).json({
      success: true,
      message: "Profile created successfully",
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error
    });
  }
};
var getAllProfiles = async (req, res) => {
  try {
    const result = await profileService.getAllProfilesFromDB();
    res.status(200).json({
      success: true,
      message: "All profiles retrieved successfully",
      data: result.rows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error
    });
  }
};
var getSingleProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await profileService.getSingleProfileFromDB(id);
    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "Profile not found!",
        data: {}
      });
    }
    res.status(200).json({
      success: true,
      message: "Profile retrieved successfully",
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error
    });
  }
};
var updateProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body;
    const result = await profileService.updateProfileFromDB(payload, id);
    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "Profile not found!",
        data: {}
      });
    }
    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error
    });
  }
};
var deleteProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await profileService.deleteProfileFromDB(id);
    if (result.rowCount === 0) {
      res.status(404).json({
        success: false,
        message: "Profile not found!",
        data: {}
      });
    }
    res.status(200).json({
      success: true,
      message: "Profile deleted successfully",
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error
    });
  }
};
var profileController = {
  createProfile,
  getAllProfiles,
  getSingleProfile,
  updateProfile,
  deleteProfile
};

// src/modules/profile/profile.route.ts
var router2 = Router2();
router2.post("/", profileController.createProfile);
router2.get("/", profileController.getAllProfiles);
router2.get("/:id", profileController.getSingleProfile);
router2.put("/:id", profileController.updateProfile);
router2.delete("/:id", profileController.deleteProfile);
var profileRoute = router2;

// src/modules/auth/auth.route.ts
import { Router as Router3 } from "express";

// src/modules/auth/auth.service.ts
import bcrypt2 from "bcryptjs";
import jwt2 from "jsonwebtoken";
var loginUserIntoDB = async (payload) => {
  const { email, password } = payload;
  const userData = await pool.query(`
        SELECT * FROM users 
        WHERE email=$1
        `, [email]);
  if (userData.rows[0] === 0) {
    throw new Error("Invalid credentials");
  }
  const user = userData.rows[0];
  const matchedPassword = await bcrypt2.compare(password, user.password);
  if (!matchedPassword) {
    throw new Error("Invalid credentials");
  }
  const jwtPayload = {
    id: user.id,
    name: user.name,
    role: user.role,
    is_active: user.is_active,
    email: user.email
  };
  const accessToken = jwt2.sign(jwtPayload, config_default.secret, {
    expiresIn: "1d"
  });
  const refreshToken2 = jwt2.sign(jwtPayload, config_default.refresh_secret, {
    expiresIn: "1d"
  });
  return { accessToken, refreshToken: refreshToken2 };
};
var generatedRefreshToken = async (token) => {
  if (!token) {
    throw new Error("ForbiddenUnauthorized access!");
  }
  const decoded = jwt2.verify(token, config_default.refresh_secret);
  const userData = await pool.query(`
            SELECT * FROM users
            WHERE email=$1
            `, [decoded.email]);
  const user = userData.rows[0];
  if (userData.rows.length === 0) {
    throw new Error("User not found");
  }
  if (!user?.is_active) {
    throw new Error("Forbidden");
  }
  const jwtPayload = {
    id: user.id,
    name: user.name,
    role: user.role,
    is_active: user.is_active,
    email: user.email
  };
  const accessToken = jwt2.sign(jwtPayload, config_default.secret, {
    expiresIn: "1d"
  });
  return { accessToken };
};
var authService = {
  loginUserIntoDB,
  generatedRefreshToken
};

// src/modules/auth/auth.controller.ts
var loginUser = async (req, res) => {
  try {
    const result = await authService.loginUserIntoDB(req.body);
    const { refreshToken: refreshToken2 } = result;
    res.cookie("refreshToken", refreshToken2, {
      secure: false,
      //In production => true
      httpOnly: true,
      sameSite: "lax"
    });
    res.status(200).json({
      success: true,
      message: "User login successfully",
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error
    });
  }
};
var refreshToken = async (req, res) => {
  try {
    const result = await authService.generatedRefreshToken(req.cookies.refreshToken);
    res.status(200).json({
      success: true,
      message: "Access token generated",
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error
    });
  }
};
var authController = {
  loginUser,
  refreshToken
};

// src/modules/auth/auth.route.ts
var router3 = Router3();
router3.post("/login", authController.loginUser);
router3.post("/refresh-token", authController.refreshToken);
var authRoute = router3;

// src/middleware/logger.ts
import fs from "fs";
var logger = (req, res, next) => {
  console.log("Method - URL - Time:", req.method, req.url, Date.now());
  const log = `
Method -> ${req.method} - Time -> ${Date.now()} - URL -> ${req.url}
`;
  fs.appendFile("logger.txt", log, (err) => {
  });
  next();
};
var logger_default = logger;

// src/app.ts
import CookieParser from "cookie-parser";
import cors from "cors";

// src/middleware/globalErrorHandler.ts
var globalErrorHandler = (err, req, res, next) => {
  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error"
  });
};
var globalErrorHandler_default = globalErrorHandler;

// src/app.ts
var app = express();
app.use(CookieParser());
app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: "http://localhost:8000"
  // origin: "https://express-server-ashy-eta.vercel.app"
}));
app.use(logger_default);
app.get("/", (req, res) => {
  res.status(200).json({
    "message": "Express Server",
    "author": "Next Level"
  });
});
app.use("/api/users", userRoute);
app.use("/api/profile", profileRoute);
app.use("/api/auth", authRoute);
app.use(globalErrorHandler_default);
var app_default = app;

// src/server.ts
var main = () => {
  initDB();
  app_default.listen(config_default.port, () => {
    console.log(`Example app listening on port ${config_default.port}`);
  });
};
main();
//# sourceMappingURL=server.js.map