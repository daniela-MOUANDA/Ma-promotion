import cors from "cors";
import express from "express";
import crypto from "node:crypto";
import { apiPort, dbConfig, pingDatabase, pool } from "./db.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "25mb" }));

const sessions = new Map();

function publicAdmin(row) {
  return {
    id: row.id,
    login: row.login,
    email: row.email,
    fullName: row.full_name,
    isPrincipal: Boolean(row.is_principal),
    role: row.role_code,
    mustChangePassword: Boolean(row.must_change_password),
  };
}

function requireAdmin(req, res, next) {
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const admin = token ? sessions.get(token) : null;
  if (!admin) {
    res.status(401).json({ error: "Session administrateur requise." });
    return;
  }
  req.admin = admin;
  next();
}

function mapCategory(row) {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description ?? "",
    sortOrder: Number(row.sort_order),
    active: Boolean(row.active),
  };
}

function mapRegie(row) {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description ?? "",
  };
}

function mapFiliere(row, categoryIds) {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description ?? "",
    regieId: row.regie_id,
    categoryIds,
  };
}

function mapPromotion(row) {
  return {
    id: row.id,
    number: Number(row.number),
    label: row.label,
    academicYear: row.academic_year,
    status: row.status,
    studentCount: Number(row.student_count ?? 0),
    summary: row.summary ?? "",
  };
}

function mapStudent(row) {
  const pendingEmail = row.contact_pending_email || "";
  const pendingPhone = row.contact_pending_phone || "";
  return {
    id: row.id,
    promotionId: row.promotion_id,
    categoryId: row.category_id,
    filiereId: row.filiere_id,
    fullName: row.full_name,
    birthDate: row.birth_date || "",
    status: row.status,
    origin: row.origin,
    photoLabel: "Portrait",
    photoUrl: row.photo_url || undefined,
    photoPending: row.photo_pending || undefined,
    photoSubmittedAt: row.photo_submitted_at || undefined,
    careerTitle: row.career_title || undefined,
    careerOrganization: row.career_organization || undefined,
    published: Boolean(row.published),
    email: row.email || undefined,
    phone: row.phone || undefined,
    contactPending:
      pendingEmail || pendingPhone ? { email: pendingEmail, phone: pendingPhone } : undefined,
    contactSubmittedAt: row.contact_submitted_at || undefined,
  };
}

function mapAlumni(row) {
  return {
    id: row.id,
    studentId: row.student_id,
    fullName: row.full_name,
    email: row.email,
    promotionId: row.promotion_id,
    categoryId: row.category_id,
    filiereId: row.filiere_id,
    trainingYears: row.training_years ?? "",
    careerTitle: row.career_title ?? "",
    careerOrganization: row.career_organization ?? "",
    careerPath: row.career_path ?? "",
    experience: row.experience ?? "",
    status: row.status,
    createdAt: toIso(row.created_at),
  };
}

function mapPhoto(row) {
  return {
    id: row.id,
    title: row.title,
    caption: row.caption ?? "",
    event: row.event_name,
    eventDate: row.event_date,
    src: row.src,
    published: Boolean(row.published),
    createdAt: toIso(row.created_at),
  };
}

function mapFaq(row) {
  return {
    id: row.id,
    question: row.question,
    answer: row.answer,
  };
}

function toIso(value) {
  if (!value) return new Date().toISOString();
  if (value instanceof Date) return value.toISOString();
  const text = String(value);
  return text.includes("T") ? text : text.replace(" ", "T") + "Z";
}

function inList(ids) {
  return ids.map(() => "?").join(",");
}

async function loadBootstrap(conn) {
  const [categories] = await conn.query(
    "SELECT * FROM categories WHERE deleted_at IS NULL ORDER BY sort_order, code",
  );
  const [regies] = await conn.query("SELECT * FROM regies WHERE deleted_at IS NULL ORDER BY name");
  const [filieres] = await conn.query("SELECT * FROM filieres WHERE deleted_at IS NULL ORDER BY name");
  const [links] = await conn.query("SELECT category_id, filiere_id FROM category_filieres");
  const byFiliere = new Map();
  for (const link of links) {
    const list = byFiliere.get(link.filiere_id) ?? [];
    list.push(link.category_id);
    byFiliere.set(link.filiere_id, list);
  }
  const [promotions] = await conn.query(`
    SELECT p.*,
      (SELECT COUNT(*) FROM students s
        WHERE s.promotion_id = p.id AND s.deleted_at IS NULL AND s.published = 1) AS student_count
    FROM promotions p
    WHERE p.deleted_at IS NULL
    ORDER BY p.number DESC
  `);
  const [students] = await conn.query(`
    SELECT id, promotion_id, category_id, filiere_id, full_name,
           DATE_FORMAT(birth_date, '%Y-%m-%d') AS birth_date,
           status, origin, photo_url, photo_pending,
           photo_submitted_at, career_title, career_organization,
           email, phone, contact_pending_email, contact_pending_phone,
           contact_submitted_at, published
    FROM students
    WHERE deleted_at IS NULL
    ORDER BY full_name
  `);
  const [alumni] = await conn.query(
    "SELECT * FROM alumni_feedback ORDER BY created_at DESC",
  );
  const [gallery] = await conn.query(
    "SELECT id, title, caption, event_name, DATE_FORMAT(event_date, '%Y-%m-%d') AS event_date, src, published, created_at FROM gallery_photos WHERE deleted_at IS NULL ORDER BY event_date DESC, created_at DESC",
  );
  const [faqs] = await conn.query(
    "SELECT * FROM faq_items WHERE published = 1 ORDER BY sort_order, created_at",
  );

  return {
    categories: categories.map(mapCategory),
    regies: regies.map(mapRegie),
    filieres: filieres.map((row) => mapFiliere(row, byFiliere.get(row.id) ?? [])),
    promotions: promotions.map(mapPromotion),
    students: students.map(mapStudent),
    alumni: alumni.map(mapAlumni),
    gallery: gallery.map(mapPhoto),
    faqs: faqs.map(mapFaq),
  };
}

async function yearIdFor(conn, academicYear) {
  if (!academicYear) return null;
  const [rows] = await conn.execute("SELECT id FROM academic_years WHERE label = ? LIMIT 1", [
    academicYear,
  ]);
  return rows[0]?.id ?? null;
}

async function softDeleteMissing(conn, table, keepIds) {
  if (keepIds.length === 0) {
    await conn.query(`UPDATE ${table} SET deleted_at = NOW(3) WHERE deleted_at IS NULL`);
    return;
  }
  await conn.query(
    `UPDATE ${table} SET deleted_at = NOW(3) WHERE deleted_at IS NULL AND id NOT IN (${inList(keepIds)})`,
    keepIds,
  );
}

async function saveCatalog(conn, payload) {
  const categories = payload.categories ?? [];
  const regies = payload.regies ?? [];
  const filieres = payload.filieres ?? [];
  const promotions = payload.promotions ?? [];
  const students = payload.students ?? [];

  await conn.beginTransaction();
  try {
    for (const item of categories) {
      await conn.execute(
        `INSERT INTO categories (id, code, name, description, sort_order, active, deleted_at)
         VALUES (?, ?, ?, ?, ?, ?, NULL)
         ON DUPLICATE KEY UPDATE
           code = VALUES(code), name = VALUES(name), description = VALUES(description),
           sort_order = VALUES(sort_order), active = VALUES(active), deleted_at = NULL`,
        [item.id, item.code, item.name, item.description ?? "", item.sortOrder ?? 0, item.active === false ? 0 : 1],
      );
    }
    await softDeleteMissing(
      conn,
      "categories",
      categories.map((item) => item.id),
    );

    for (const item of regies) {
      await conn.execute(
        `INSERT INTO regies (id, code, name, description, deleted_at)
         VALUES (?, ?, ?, ?, NULL)
         ON DUPLICATE KEY UPDATE
           code = VALUES(code), name = VALUES(name), description = VALUES(description), deleted_at = NULL`,
        [item.id, item.code, item.name, item.description ?? ""],
      );
    }
    await softDeleteMissing(
      conn,
      "regies",
      regies.map((item) => item.id),
    );

    for (const item of filieres) {
      await conn.execute(
        `INSERT INTO filieres (id, regie_id, code, name, description, deleted_at)
         VALUES (?, ?, ?, ?, ?, NULL)
         ON DUPLICATE KEY UPDATE
           regie_id = VALUES(regie_id), code = VALUES(code), name = VALUES(name),
           description = VALUES(description), deleted_at = NULL`,
        [item.id, item.regieId, item.code, item.name, item.description ?? ""],
      );
    }
    await softDeleteMissing(
      conn,
      "filieres",
      filieres.map((item) => item.id),
    );

    await conn.query("DELETE FROM category_filieres");
    for (const item of filieres) {
      for (const categoryId of item.categoryIds ?? []) {
        await conn.execute(
          "INSERT INTO category_filieres (category_id, filiere_id) VALUES (?, ?)",
          [categoryId, item.id],
        );
      }
    }

    for (const item of promotions) {
      const academicYearId = await yearIdFor(conn, item.academicYear);
      await conn.execute(
        `INSERT INTO promotions (id, number, label, academic_year, academic_year_id, status, summary, deleted_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, NULL)
         ON DUPLICATE KEY UPDATE
           number = VALUES(number), label = VALUES(label), academic_year = VALUES(academic_year),
           academic_year_id = VALUES(academic_year_id), status = VALUES(status),
           summary = VALUES(summary), deleted_at = NULL`,
        [
          item.id,
          item.number,
          item.label,
          item.academicYear,
          academicYearId,
          item.status,
          item.summary ?? "",
        ],
      );
    }
    await softDeleteMissing(
      conn,
      "promotions",
      promotions.map((item) => item.id),
    );

    for (const item of students) {
      const pending = item.contactPending ?? {};
      await conn.execute(
        `INSERT INTO students (
           id, promotion_id, category_id, filiere_id, full_name, birth_date, status, origin,
           photo_url, photo_pending, photo_submitted_at, photo_locked,
           career_title, career_organization, email, phone,
           contact_pending_email, contact_pending_phone, contact_submitted_at, contact_locked,
           published, deleted_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)
         ON DUPLICATE KEY UPDATE
           promotion_id = VALUES(promotion_id), category_id = VALUES(category_id),
           filiere_id = VALUES(filiere_id), full_name = VALUES(full_name),
           birth_date = VALUES(birth_date), status = VALUES(status), origin = VALUES(origin),
           photo_url = VALUES(photo_url), photo_pending = VALUES(photo_pending),
           photo_submitted_at = VALUES(photo_submitted_at), photo_locked = VALUES(photo_locked),
           career_title = VALUES(career_title), career_organization = VALUES(career_organization),
           email = VALUES(email), phone = VALUES(phone),
           contact_pending_email = VALUES(contact_pending_email),
           contact_pending_phone = VALUES(contact_pending_phone),
           contact_submitted_at = VALUES(contact_submitted_at),
           contact_locked = VALUES(contact_locked), published = VALUES(published), deleted_at = NULL`,
        [
          item.id,
          item.promotionId,
          item.categoryId,
          item.filiereId,
          item.fullName,
          item.birthDate || null,
          item.status,
          item.origin,
          item.photoUrl || null,
          item.photoPending || null,
          item.photoSubmittedAt || null,
          item.photoUrl ? 1 : 0,
          item.careerTitle || null,
          item.careerOrganization || null,
          item.email || null,
          item.phone || null,
          pending.email || null,
          pending.phone || null,
          item.contactSubmittedAt || null,
          item.email || item.phone ? 1 : 0,
          item.published === false ? 0 : 1,
        ],
      );
    }
    await softDeleteMissing(
      conn,
      "students",
      students.map((item) => item.id),
    );

    await conn.commit();
  } catch (error) {
    await conn.rollback();
    throw error;
  }
}

async function saveAlumni(conn, items) {
  await conn.beginTransaction();
  try {
    const keep = [];
    for (const item of items ?? []) {
      keep.push(item.id);
      await conn.execute(
        `INSERT INTO alumni_feedback (
           id, student_id, full_name, email, promotion_id, category_id, filiere_id,
           training_years, career_title, career_organization, career_path, experience,
           status, created_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           student_id = VALUES(student_id), full_name = VALUES(full_name), email = VALUES(email),
           promotion_id = VALUES(promotion_id), category_id = VALUES(category_id),
           filiere_id = VALUES(filiere_id), training_years = VALUES(training_years),
           career_title = VALUES(career_title), career_organization = VALUES(career_organization),
           career_path = VALUES(career_path), experience = VALUES(experience),
           status = VALUES(status)`,
        [
          item.id,
          item.studentId,
          item.fullName,
          item.email,
          item.promotionId || null,
          item.categoryId || null,
          item.filiereId || null,
          item.trainingYears ?? "",
          item.careerTitle ?? "",
          item.careerOrganization ?? "",
          item.careerPath ?? "",
          item.experience ?? "",
          item.status,
          item.createdAt ? new Date(item.createdAt) : new Date(),
        ],
      );
    }
    if (keep.length === 0) {
      await conn.query("DELETE FROM alumni_feedback");
    } else {
      await conn.query(`DELETE FROM alumni_feedback WHERE id NOT IN (${inList(keep)})`, keep);
    }
    await conn.commit();
  } catch (error) {
    await conn.rollback();
    throw error;
  }
}

async function saveGallery(conn, items) {
  await conn.beginTransaction();
  try {
    const keep = [];
    for (const item of items ?? []) {
      keep.push(item.id);
      await conn.execute(
        `INSERT INTO gallery_photos (id, title, caption, event_name, event_date, src, published, deleted_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?)
         ON DUPLICATE KEY UPDATE
           title = VALUES(title), caption = VALUES(caption), event_name = VALUES(event_name),
           event_date = VALUES(event_date), src = VALUES(src), published = VALUES(published),
           deleted_at = NULL`,
        [
          item.id,
          item.title,
          item.caption ?? "",
          item.event,
          item.eventDate,
          item.src,
          item.published === false ? 0 : 1,
          item.createdAt ? new Date(item.createdAt) : new Date(),
        ],
      );
    }
    await softDeleteMissing(conn, "gallery_photos", keep);
    await conn.commit();
  } catch (error) {
    await conn.rollback();
    throw error;
  }
}

const GALLERY_SEED = [
  [10, "Savoir · Rigueur · Intégrité", "Allocution devant la bannière de l’EPCA.", "Cérémonie", "2026-09-26"],
  [9, "Une délégation, un souvenir", "Photo de groupe aux couleurs de l’école.", "Visite institutionnelle", "2026-09-18"],
  [6, "Remise de dossier", "Un moment d’échange officiel, sous les couleurs du Gabon.", "Visite institutionnelle", "2026-09-18"],
  [7, "Séance de travail", "Autour de la table, la délégation de l’EPCA échange avec ses hôtes.", "Visite institutionnelle", "2026-09-18"],
  [8, "Écoute et réflexion", "Chaque mot compte pendant l’audience.", "Visite institutionnelle", "2026-09-18"],
  [11, "Salle comble", "Une salle de cours pleine, des élèves studieux.", "Vie de l’école", "2026-06-12"],
  [1, "Un regard attentif", "Concentration et élégance dans l’auditoire.", "Conférence", "2026-06-05"],
  [2, "Sourires dans l’auditoire", "Les bons moments se partagent aussi entre deux interventions.", "Conférence", "2026-06-05"],
  [3, "La parole est à vous", "Les questions fusent, les échanges sont riches.", "Conférence", "2026-06-05"],
  [5, "La question qui compte", "Quand l’assemblée prend la parole.", "Conférence", "2026-06-05"],
  [4, "Un échange sincère", "Une intervention marquante devant l’assemblée.", "Conférence", "2026-06-05"],
  [16, "Photo de famille", "Toute l’assemblée réunie devant le bâtiment.", "Photo de groupe", "2026-05-22"],
  [17, "L’ouverture", "Prise de parole devant l’assemblée, sous les bannières de l’EPCA.", "Cérémonie", "2026-05-22"],
  [15, "Face aux médias", "Une interview devant les bannières de l’école.", "Cérémonie", "2026-05-22"],
  [14, "Séance de travail", "Carnets ouverts et regards concentrés.", "Séminaire", "2026-04-16"],
  [18, "Attention soutenue", "Chacune et chacun suit les échanges avec sérieux.", "Séminaire", "2026-04-16"],
  [19, "Chacun prend ses notes", "Les idées s’écrivent au fil des interventions.", "Séminaire", "2026-04-16"],
  [20, "Une salle pleine", "Des carnets ouverts du premier au dernier rang.", "Vie de l’école", "2026-03-10"],
  [12, "Cours en salle", "Les élèves suivent attentivement les enseignements.", "Vie de l’école", "2026-03-10"],
  [13, "Visite en salle de classe", "Une rencontre au cœur de la formation.", "Vie de l’école", "2026-03-10"],
];

async function ensureReady() {
  const conn = await pool.getConnection();
  try {
    await conn.query("ALTER TABLE students MODIFY photo_url LONGTEXT, MODIFY photo_pending LONGTEXT");
    await conn.query("ALTER TABLE gallery_photos MODIFY src LONGTEXT");
    const [countRows] = await conn.query(
      "SELECT COUNT(*) AS n FROM gallery_photos WHERE deleted_at IS NULL",
    );
    if (Number(countRows[0]?.n) === 0) {
      for (const [n, title, caption, event, date] of GALLERY_SEED) {
        const id = String(n).padStart(2, "0");
        await conn.execute(
          `INSERT INTO gallery_photos (id, title, caption, event_name, event_date, src, published)
           VALUES (?, ?, ?, ?, ?, ?, 1)`,
          [
            `1b111111-0000-4000-8000-0000000000${id}`,
            title,
            caption,
            event,
            date,
            `/gallery/evt-${id}.jpg`,
          ],
        );
      }
    }
  } finally {
    conn.release();
  }
}

app.get("/api/health", async (_req, res) => {
  try {
    const status = await pingDatabase();
    if (!status.hasSchema) {
      res.status(503).json({
        ok: false,
        error: "La base est joignable mais le schéma manque. Importez database/ma-promotion.sql.",
      });
      return;
    }
    res.json({ ok: true, database: dbConfig.database });
  } catch (error) {
    res.status(503).json({
      ok: false,
      error: `MySQL injoignable (${dbConfig.host}:${dbConfig.port} / ${dbConfig.database}). ${error.message}`,
    });
  }
});

app.get("/api/bootstrap", async (_req, res) => {
  const conn = await pool.getConnection();
  try {
    res.json(await loadBootstrap(conn));
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    conn.release();
  }
});

app.put("/api/catalog", async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await saveCatalog(conn, req.body ?? {});
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    conn.release();
  }
});

app.put("/api/alumni", async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await saveAlumni(conn, req.body ?? []);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    conn.release();
  }
});

app.put("/api/gallery", async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await saveGallery(conn, req.body ?? []);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    conn.release();
  }
});

app.post("/api/admin/login", async (req, res) => {
  const login = String(req.body?.login ?? "").trim();
  const password = String(req.body?.password ?? "");
  if (!login || !password) {
    res.status(400).json({ error: "Identifiant et mot de passe requis." });
    return;
  }
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.execute(
      `SELECT a.id, a.login, a.email, a.full_name, a.is_principal, a.must_change_password, r.code AS role_code
       FROM admins a
       JOIN roles r ON r.id = a.role_id
       WHERE a.login = ?
         AND a.is_active = 1
         AND a.deleted_at IS NULL
         AND a.password_hash = SHA2(CONCAT('ma-promotion::', ?), 256)
       LIMIT 1`,
      [login, password],
    );
    const admin = rows[0];
    if (!admin) {
      res.status(401).json({ error: "Identifiant ou mot de passe incorrect." });
      return;
    }
    await conn.execute("UPDATE admins SET last_login_at = NOW(3) WHERE id = ?", [admin.id]);
    const token = crypto.randomBytes(32).toString("hex");
    sessions.set(token, publicAdmin(admin));
    res.json({ token, admin: publicAdmin(admin) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    conn.release();
  }
});

app.post("/api/admin/logout", requireAdmin, (req, res) => {
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  sessions.delete(token);
  res.json({ ok: true });
});

ensureReady()
  .then(() => {
    app.listen(apiPort, () => {
      console.log(
        `API Ma Promotion → http://127.0.0.1:${apiPort}  ·  MySQL ${dbConfig.user}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`,
      );
    });
  })
  .catch((error) => {
    console.error("Impossible de préparer MySQL :", error.message);
    console.error(
      `Vérifiez DBngin / TablePlus, puis importez database/ma-promotion.sql dans ${dbConfig.database}.`,
    );
    app.listen(apiPort, () => {
      console.log(`API démarrée sans base (santé 503) → http://127.0.0.1:${apiPort}`);
    });
  });
