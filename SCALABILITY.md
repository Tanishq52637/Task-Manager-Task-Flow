# Scalability Notes

Some thoughts on how this app could be scaled if it needed to handle real production load.

---

## Current Architecture

Right now it's a monolith — one Express server talking to one MongoDB instance. That's fine for small traffic, but won't hold up under heavy load.

---

## Database

**Indexing** — Already added compound indexes on tasks (`owner + status`, `owner + createdAt`). For heavier query patterns, you'd want to review slow query logs and index accordingly.

**Read replicas** — MongoDB Atlas supports read replicas out of the box. Route read-heavy queries to secondaries to take load off the primary.

**Connection pooling** — Mongoose handles a connection pool by default. For high concurrency, tune `maxPoolSize` in the connection options.

---

## Caching (Redis)

The most obvious win would be caching `/api/v1/tasks` responses per user. A GET request hitting the DB every time is wasteful if the data doesn't change often.

```
User requests /tasks
  → check Redis cache (key: tasks:{userId}:{filters})
  → cache hit: return cached response (~1ms)
  → cache miss: query MongoDB, store in Redis with TTL, return
```

On task create/update/delete, invalidate the relevant cache key.

Other things worth caching: user sessions/profiles, admin dashboard counts.

---

## Horizontal Scaling

Since the app is stateless (JWT, no server-side sessions), you can just run multiple instances behind a load balancer (Nginx, AWS ALB, etc.) and they'll work fine without any extra coordination.

```
Client → Load Balancer → [App Instance 1]
                      → [App Instance 2]
                      → [App Instance 3]
         All instances connect to → MongoDB (shared)
                                  → Redis (shared)
```

---

## Microservices (if it grows)

If the app expanded significantly, a natural split would be:

- **Auth Service** — registration, login, token verification
- **Task Service** — CRUD for tasks
- **User Service** — user management, admin operations
- **Notification Service** — email/push for due dates etc.

Each service would have its own database and communicate via a message queue (RabbitMQ, Kafka) for async operations, or direct HTTP for sync.

That said, microservices add a LOT of overhead. I'd keep it as a monolith until there's a concrete reason to split (team scaling, performance bottleneck in a specific domain, etc.).

---

## Current Folder Structure Supports Growth

The way the code is organized (controllers, routes, models, middleware all separate), adding a new resource like "projects" or "comments" is just:

1. Add `models/Project.js`
2. Add `controllers/project.controller.js`
3. Add `validators/project.validator.js`
4. Add `routes/v1/project.routes.js`
5. Register the router in `app.js`

No existing code needs to change.

---

## Docker

A basic `docker-compose.yml` would spin up the app + MongoDB + Redis together:

```yaml
services:
  api:
    build: ./backend
    ports: ["5000:5000"]
    environment:
      - MONGODB_URI=mongodb://mongo:27017/taskflow
      - REDIS_URL=redis://redis:6379
    depends_on: [mongo, redis]
  
  frontend:
    build: ./frontend
    ports: ["3000:3000"]
  
  mongo:
    image: mongo:7
    volumes: [mongo_data:/data/db]
  
  redis:
    image: redis:alpine
```

---

## Logging & Monitoring

In production you'd want:
- Structured logging (Winston or Pino instead of console.log)
- Centralized log aggregation (Datadog, Loki, CloudWatch)
- Error tracking (Sentry)
- Uptime monitoring (Better Uptime, Pingdom)
- APM to catch slow queries before users notice

---

## Summary

The current codebase is already structured to scale cleanly. Main next steps would be: add Redis caching, containerize with Docker, and deploy behind a load balancer. Microservices can wait until there's an actual team or scale problem that justifies the complexity.
