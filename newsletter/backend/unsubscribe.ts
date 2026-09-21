import { Router, type IRouter } from "express";
import { pool } from "@workspace/db";

const router: IRouter = Router();

router.get("/unsubscribe", async (req, res) => {
  const token = String(req.query.token || "").trim();
  if (!token) {
    res.status(400).type("html").send("<p>Missing unsubscribe token.</p>");
    return;
  }

  const result = await pool.query(
    `update subscribers
     set status = 'unsubscribed',
         unsubscribed_at = now(),
         updated_at = now()
     where unsubscribe_token = $1
     returning email`,
    [token],
  );
  const ok = Boolean(result.rowCount);
  res.type("html").send(
    `<!doctype html><html><body style="font-family:Arial;padding:40px;"><h1>${ok ? "You've been unsubscribed." : "This link is invalid or already used."}</h1><p>AI News Scout will no longer email this address.</p></body></html>`,
  );
});

export default router;
