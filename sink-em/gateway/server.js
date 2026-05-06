import dotenv from 'dotenv'
import express from 'express'
import { createServer } from 'http'
import { createProxyMiddleware } from 'http-proxy-middleware'
import {MongoClient, ObjectId, ServerApiVersion} from 'mongodb'
import cors from 'cors'
import rateLimit, { ipKeyGenerator } from 'express-rate-limit'
import jwt from 'jsonwebtoken'

dotenv.config()

const SERVICES = {
  game: 'ws://localhost:3001',
  matching: 'http://localhost:3002',
  leaderboard: 'http://localhost:3003'
};

const use_stats = {
  totalRequests: 0,
  requestsPerRoute: {},
  requestsPerMethod: {},
  requestsPerUser: {},
  errors: 0,
  recentLogs: [],
  startedAt: new Date(),
};

const JWT_SECRET = process.env.JWT_SECRET || 'sinkem-secret';

const app = express()

app.use(express.json());

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}))

const server = createServer(app)

const retrieveUser = async (username, password) => {
  const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_URL}/?appName=Cluster0`;
  const client = new MongoClient(uri, {
      serverApi: {
          version: ServerApiVersion.v1, strict: true, deprecationErrors: true,
      }
  });
  const userData = client.db("webware-sink-em").collection("users")

  var retrievedUser = await userData.findOne({
      username: username, 
      password: password
  })

  if(!retrievedUser) {
    //try to create a user for them 
    const userWithUsername = await userData.findOne({
      username: username
    })

    if(userWithUsername) {
      //return incorrect password
      return -1;
    }
    else {
      //create user
      const id = await userData.insertOne({
        username: username, 
        password: password,
        role: "user",
        gamesPlayed: 0,
        wins: 0,
      })

      //retrieve them
      retrievedUser = await userData.findOne({
        _id: id.insertedId
      })
    }
  }
  
  return retrievedUser
}

// --------- Stats & Action Logging
 
app.use((req, res, next) => {
  use_stats.totalRequests++;
 
  // log per route
  console.log("route", req.path)
  const route = req.path;
  use_stats.requestsPerRoute[route] = (use_stats.requestsPerRoute[route] || 0) + 1;
 
  // log per method
  use_stats.requestsPerMethod[req.method] = (use_stats.requestsPerMethod[req.method] || 0) + 1;
 
  // create log entry
  const log = {
    method: req.method,
    path: req.path,
    timestamp: new Date().toISOString(),
    ip: req.ip,
    user: null
  };
 
  // track errors from response
  const originalSend = res.json.bind(res); //create "copy" of res
  res.json = (body) => {
    log.status = res.statusCode;

    if (res.statusCode >= 400) {
      use_stats.errors++;
      console.log("error", res)
    }

    use_stats.recentLogs.unshift(log);

    if (use_stats.recentLogs.length > 100) {
      use_stats.recentLogs.pop();
    }

    return originalSend(body);
  };
 
  next();
});

const adminClients = new Set()

// On every response send stats to admin clients 
app.use((req, res, next) => {
  console.log('Pushing stats to', adminClients.size, 'clients')

  res.on('finish', () => {
    if (req.path === '/admin/stream') {
      return
    }

    const data = JSON.stringify({
      totalRequests: use_stats.totalRequests,
      errors: use_stats.errors,
      requestsPerRoute: use_stats.requestsPerRoute,
      requestsPerMethod: use_stats.requestsPerMethod,
      requestsPerUser: use_stats.requestsPerUser,
      recentLogs: use_stats.recentLogs.slice(0, 50),
    })

    for (const client of adminClients) {
      client.write(`data: ${data}\n\n`)
    }
  })
  next()
})


// --------- Authentication & Authorization

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];
 
  if (!token) return res.status(401).json({ error: 'No token provided' });
 
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    // Track per-user requests
    const uid = req.user.username;
    use_stats.requestsPerUser[uid] = (use_stats.requestsPerUser[uid] || 0) + 1;
    next();
  } catch {
    use_stats.errors++;
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
 
const isAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};


// ---------  Rate limiters

const standardLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  //keyGenerator: (req) => ipKeyGenerator(req),
  message: { error: 'Too many requests, please slow down' },
});
 
const loginLimiter = rateLimit({
  windowMs: 2 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts, please try again later' },
});


// ---------  Proxy Middleware for microservices

const proxyMiddlewareGameService = createProxyMiddleware({
  target: SERVICES.game,
  changeOrigin: true,
  ws: true,
  pathRewrite: { '^/game': '' },
  on: {
    proxyReqWs: (proxyReq, req, socket, options, head) => {
        socket.on('error', (err) => console.error('Socket error:', err))
        socket.on('close', () => console.log('Socket closed game service'))
    },
    error: (err, req, socket) => {
        console.error('Proxy WS error:', err.message)
    }
    }
})

const proxyMiddlewareMatchingService = createProxyMiddleware({
  target: SERVICES.matching,
  changeOrigin: true,
  pathRewrite: { '^/matching': '' },
})

const proxyMiddlewareLeaderboardService = createProxyMiddleware({
  target: SERVICES.leaderboard,
  changeOrigin: true,
  pathRewrite: { 
    '^/leaderboardPrivate': '',
  },
  on: {
    error: (err, req, res) => {
      res.status(502).json({ error: 'Leaderboard service unavailable' });
    }
  }
});


// ---------  Set up routes 

// --------- Auth routes 

app.post('/auth/login', loginLimiter, async (req, res) => {
  
  const username = req.body.user;
  const password = req.body.pass;
 
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  try {
    const user = await retrieveUser(username, password)
    console.log(user)
  
    if (user == -1) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
  
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '2h' }
    );
  
    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  }
  catch (e) {
    console.log("invalid credentials", e)
    res.status(400).json({error: e});
  }

});

// --------- Admin routes 

// use server sent events to push admin stats updates to adminclients
app.get('/admin/stream', verifyToken, isAdmin, (req, res) => {

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  adminClients.add(res)
  console.log('Admin client just connected, current total is:', adminClients.size)

  const data = JSON.stringify({
    totalRequests: use_stats.totalRequests,
    errors: use_stats.errors,
    requestsPerRoute: use_stats.requestsPerRoute,
    requestsPerMethod: use_stats.requestsPerMethod,
    requestsPerUser: use_stats.requestsPerUser,
    recentLogs: use_stats.recentLogs.slice(0, 50),
  })
  res.write(`data: ${data}\n\n`)

  //when client disconnects remove them from list
  req.on('close', () => {
    adminClients.delete(res)
    console.log('Admin client disconnected')
  })
});

// --------- Protected proxy routes 

app.use('/game', standardLimiter, verifyToken, proxyMiddlewareGameService)
app.use('/matching', standardLimiter, verifyToken, proxyMiddlewareMatchingService)
app.use('/leaderboardPrivate', standardLimiter, verifyToken, proxyMiddlewareLeaderboardService)

// --------- Public proxy routes 
app.use('/leaderboard', standardLimiter, proxyMiddlewareLeaderboardService)

// ---------  Listen

server.on('upgrade', (req, socket, head) => {
  //log ws connections
  use_stats.totalRequests++
  const route = req.url.split('?')[0]
  use_stats.requestsPerRoute[route] = (use_stats.requestsPerRoute[route] || 0) + 1
  use_stats.requestsPerMethod['WS'] = (use_stats.requestsPerMethod['WS'] || 0) + 1

  use_stats.recentLogs.unshift({
    method: 'WS',
    path: route,
    timestamp: new Date().toISOString(),
    ip: req.socket.remoteAddress,
    user: null
  })

  if (req.url.startsWith('/game')) {
    proxyMiddlewareGameService.upgrade(req, socket, head)
  } else if (req.url.startsWith('/matching')) {
    proxyMiddlewareMatchingService.upgrade(req, socket, head)
  }
})

server.listen(8080, () => console.log('Gateway running on :8080'))
