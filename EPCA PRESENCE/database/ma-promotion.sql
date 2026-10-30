-- =============================================================================
-- Ma Promotion — EPCA (Gabon)
-- Schéma MySQL 8.0+  ·  à importer sur une base VIDE
-- =============================================================================
--
-- Créer la base puis importer :
--   CREATE DATABASE ma_promotion CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
--   mysql -u root -p ma_promotion < database/ma-promotion.sql
--
-- phpMyAdmin / TablePlus / DBngin : ouvrir la base vide → Importer ce fichier.
-- (pas de commande DELIMITER : le fichier est compatible avec les outils graphiques)
--
-- Compte administrateur principal (à changer dès la première connexion) :
--   identifiant :  principal
--   e-mail      :  principal@epca.ga
--   mot de passe :  EPCA-Principal-2026
--
-- Ce schéma suit le portail tel qu’il est aujourd’hui :
--   · promotions 29e–31e, année académique (31e = 2024-2026)
--   · cohorte : une promotion est EN FORMATION ou DIPLÔMÉE, jamais les deux
--   · élèves : interne/externe, photo et contact relationnel (validation admin)
--   · une fois validés, photo et contact ne sont plus modifiables par l’élève
--   · témoignages rattachés à un profil
--   · galerie d’événements (albums dont Remise des diplômes)
--   · pas de concours, pas de scolarité (classes, EDT, appels)
--
-- Tables : roles, permissions, role_permissions, admins, audit_logs,
--          academic_years, categories, regies, filieres, category_filieres,
--          system_settings, promotions, students, student_photo_requests,
--          student_contact_requests, student_status_history, alumni_feedback,
--          gallery_events, gallery_photos, faq_items
-- =============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
SET sql_notes = 0;

-- -----------------------------------------------------------------------------
-- Nettoyage
-- -----------------------------------------------------------------------------
DROP VIEW IF EXISTS v_admin_alerts;
DROP VIEW IF EXISTS v_promotion_counts;
DROP VIEW IF EXISTS v_public_students;
DROP VIEW IF EXISTS v_admins;

DROP FUNCTION IF EXISTS verify_admin_password;
DROP FUNCTION IF EXISTS hash_password;

DROP TABLE IF EXISTS attendance_records;
DROP TABLE IF EXISTS attendance_sessions;
DROP TABLE IF EXISTS timetable_entries;
DROP TABLE IF EXISTS timetables;
DROP TABLE IF EXISTS teaching_assignment_classrooms;
DROP TABLE IF EXISTS teaching_assignments;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS teachers;
DROP TABLE IF EXISTS class_students;
DROP TABLE IF EXISTS classrooms;
DROP TABLE IF EXISTS publication_applications;
DROP TABLE IF EXISTS publications;
DROP TABLE IF EXISTS application_status_history;
DROP TABLE IF EXISTS applications;
DROP TABLE IF EXISTS number_sequences;
DROP TABLE IF EXISTS competition_filieres;
DROP TABLE IF EXISTS competition_categories;
DROP TABLE IF EXISTS competitions;
DROP TABLE IF EXISTS time_slots;
DROP TABLE IF EXISTS gallery_photos;
DROP TABLE IF EXISTS gallery_events;
DROP TABLE IF EXISTS alumni_feedback;
DROP TABLE IF EXISTS student_status_history;
DROP TABLE IF EXISTS student_contact_requests;
DROP TABLE IF EXISTS student_photo_requests;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS promotions;
DROP TABLE IF EXISTS faq_items;
DROP TABLE IF EXISTS system_settings;
DROP TABLE IF EXISTS category_filieres;
DROP TABLE IF EXISTS filieres;
DROP TABLE IF EXISTS regies;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS academic_years;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS admins;
DROP TABLE IF EXISTS role_permissions;
DROP TABLE IF EXISTS permissions;
DROP TABLE IF EXISTS roles;

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- 1. Identité et administration
-- =============================================================================

CREATE TABLE roles (
  id          CHAR(36)     NOT NULL DEFAULT (UUID()),
  code        VARCHAR(40)  NOT NULL,
  name        VARCHAR(120) NOT NULL,
  description TEXT         NOT NULL,
  is_system   TINYINT(1)   NOT NULL DEFAULT 1,
  created_at  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY roles_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE permissions (
  id          CHAR(36)     NOT NULL DEFAULT (UUID()),
  code        VARCHAR(80)  NOT NULL,
  module      VARCHAR(40)  NOT NULL,
  action      VARCHAR(40)  NOT NULL,
  description VARCHAR(255) NOT NULL DEFAULT '',
  PRIMARY KEY (id),
  UNIQUE KEY permissions_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE role_permissions (
  role_id       CHAR(36) NOT NULL,
  permission_id CHAR(36) NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  CONSTRAINT rp_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  CONSTRAINT rp_perm FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE admins (
  id                   CHAR(36)     NOT NULL DEFAULT (UUID()),
  role_id              CHAR(36)     NOT NULL,
  login                VARCHAR(80)  NOT NULL,
  email                VARCHAR(180) NOT NULL,
  full_name            VARCHAR(180) NOT NULL,
  phone                VARCHAR(40)  DEFAULT NULL,
  password_hash        CHAR(64)     NOT NULL COMMENT 'SHA-256 hex',
  is_principal         TINYINT(1)   NOT NULL DEFAULT 0,
  is_active            TINYINT(1)   NOT NULL DEFAULT 1,
  must_change_password TINYINT(1)   NOT NULL DEFAULT 1,
  last_login_at        TIMESTAMP(3) NULL DEFAULT NULL,
  created_by           CHAR(36)     DEFAULT NULL,
  created_at           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deleted_at           TIMESTAMP(3) NULL DEFAULT NULL,
  principal_lock       CHAR(1)
    GENERATED ALWAYS AS (IF(is_principal = 1 AND deleted_at IS NULL, 'Y', NULL)) STORED,
  PRIMARY KEY (id),
  UNIQUE KEY admins_login (login),
  UNIQUE KEY admins_email (email),
  UNIQUE KEY admins_one_principal (principal_lock),
  KEY admins_role (role_id),
  KEY admins_active (is_active),
  CONSTRAINT admins_role FOREIGN KEY (role_id) REFERENCES roles(id),
  CONSTRAINT admins_created_by FOREIGN KEY (created_by) REFERENCES admins(id),
  CONSTRAINT admins_created_by_required CHECK (is_principal = 1 OR created_by IS NOT NULL)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TRIGGER admins_bu_protect_principal
BEFORE UPDATE ON admins
FOR EACH ROW
SET
  NEW.is_principal = IF(OLD.is_principal = 1, 1, NEW.is_principal),
  NEW.is_active    = IF(OLD.is_principal = 1, 1, NEW.is_active),
  NEW.deleted_at   = IF(OLD.is_principal = 1, NULL, NEW.deleted_at);

CREATE TABLE audit_logs (
  id         CHAR(36)     NOT NULL DEFAULT (UUID()),
  actor_id   CHAR(36)     DEFAULT NULL,
  action     VARCHAR(80)  NOT NULL,
  entity     VARCHAR(80)  NOT NULL,
  entity_id  CHAR(36)     DEFAULT NULL,
  payload    JSON         NOT NULL,
  ip_address VARCHAR(45)  DEFAULT NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY audit_actor (actor_id, created_at),
  KEY audit_entity (entity, entity_id),
  CONSTRAINT audit_actor FOREIGN KEY (actor_id) REFERENCES admins(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 2. Référentiel : années, catégories, régies, filières
-- =============================================================================

CREATE TABLE academic_years (
  id           CHAR(36)     NOT NULL DEFAULT (UUID()),
  label        VARCHAR(40)  NOT NULL COMMENT 'Ex. 2024-2026',
  starts_on    DATE         NOT NULL,
  ends_on      DATE         NOT NULL,
  is_current   TINYINT(1)   NOT NULL DEFAULT 0,
  current_lock CHAR(1)
    GENERATED ALWAYS AS (IF(is_current = 1, 'Y', NULL)) STORED,
  created_at   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY academic_years_label (label),
  UNIQUE KEY academic_years_one_current (current_lock),
  CONSTRAINT academic_years_span CHECK (ends_on > starts_on)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE categories (
  id          CHAR(36)     NOT NULL DEFAULT (UUID()),
  code        VARCHAR(10)  NOT NULL,
  name        VARCHAR(40)  NOT NULL COMMENT 'Affiche le code (C2, C1, B2…)',
  description TEXT         NOT NULL,
  sort_order  INT          NOT NULL DEFAULT 0,
  active      TINYINT(1)   NOT NULL DEFAULT 1,
  created_at  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deleted_at  TIMESTAMP(3) NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY categories_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE regies (
  id          CHAR(36)     NOT NULL DEFAULT (UUID()),
  code        VARCHAR(20)  NOT NULL,
  name        VARCHAR(160) NOT NULL,
  description TEXT         NOT NULL,
  created_at  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deleted_at  TIMESTAMP(3) NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY regies_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE filieres (
  id          CHAR(36)     NOT NULL DEFAULT (UUID()),
  regie_id    CHAR(36)     NOT NULL,
  code        VARCHAR(20)  NOT NULL COMMENT 'Code auto-généré depuis le nom',
  name        VARCHAR(160) NOT NULL,
  description TEXT         NOT NULL,
  created_at  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deleted_at  TIMESTAMP(3) NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY filieres_code (code),
  KEY filieres_regie (regie_id),
  CONSTRAINT filieres_regie FOREIGN KEY (regie_id) REFERENCES regies(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE category_filieres (
  category_id CHAR(36) NOT NULL,
  filiere_id  CHAR(36) NOT NULL,
  PRIMARY KEY (category_id, filiere_id),
  CONSTRAINT cf_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
  CONSTRAINT cf_filiere  FOREIGN KEY (filiere_id)  REFERENCES filieres(id)  ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE system_settings (
  setting_key   VARCHAR(80)  NOT NULL,
  setting_value JSON         NOT NULL,
  description   VARCHAR(255) NOT NULL DEFAULT '',
  updated_at    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  updated_by    CHAR(36)     DEFAULT NULL,
  PRIMARY KEY (setting_key),
  CONSTRAINT settings_admin FOREIGN KEY (updated_by) REFERENCES admins(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 3. Promotions et élèves
-- =============================================================================
-- Une promotion n’est jamais à la fois en formation et diplômée.
-- L’admin bascule le statut (en_cours / terminee) ; les élèves suivent
-- (EN_FORMATION ou DIPLOME), hors ABANDON / EXCLU.

CREATE TABLE promotions (
  id                CHAR(36)     NOT NULL DEFAULT (UUID()),
  number            INT          NOT NULL,
  label             VARCHAR(80)  NOT NULL,
  academic_year     VARCHAR(20)  NOT NULL COMMENT 'Ex. 2024-2026 — cycle de 2 ans',
  academic_year_id  CHAR(36)     DEFAULT NULL,
  status            VARCHAR(20)  NOT NULL DEFAULT 'en_cours',
  summary           TEXT         NOT NULL,
  created_at        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deleted_at        TIMESTAMP(3) NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY promotions_number (number),
  KEY promotions_year (academic_year_id),
  CONSTRAINT promotions_year   FOREIGN KEY (academic_year_id) REFERENCES academic_years(id),
  CONSTRAINT promotions_status CHECK (status IN ('en_cours', 'terminee')),
  CONSTRAINT promotions_year_fmt CHECK (academic_year REGEXP '^[0-9]{4}-[0-9]{4}$')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE students (
  id                    CHAR(36)     NOT NULL DEFAULT (UUID()),
  promotion_id          CHAR(36)     NOT NULL,
  category_id           CHAR(36)     NOT NULL,
  filiere_id            CHAR(36)     NOT NULL,
  full_name             VARCHAR(180) NOT NULL,
  birth_date            DATE         DEFAULT NULL,
  status                VARCHAR(20)  NOT NULL DEFAULT 'EN_FORMATION',
  origin                VARCHAR(20)  NOT NULL DEFAULT 'INTERNE',
  photo_url             LONGTEXT,
  photo_pending         LONGTEXT,
  photo_submitted_at    TIMESTAMP(3) NULL DEFAULT NULL,
  photo_locked          TINYINT(1)   NOT NULL DEFAULT 0 COMMENT '1 = photo validée, l’élève ne peut plus la changer',
  career_title          VARCHAR(180) DEFAULT NULL,
  career_organization   VARCHAR(180) DEFAULT NULL,
  email                 VARCHAR(180) DEFAULT NULL,
  phone                 VARCHAR(40)  DEFAULT NULL,
  contact_pending_email VARCHAR(180) DEFAULT NULL,
  contact_pending_phone VARCHAR(40)  DEFAULT NULL,
  contact_submitted_at  TIMESTAMP(3) NULL DEFAULT NULL,
  contact_locked        TINYINT(1)   NOT NULL DEFAULT 0 COMMENT '1 = contact validé, l’élève ne peut plus le changer',
  published             TINYINT(1)   NOT NULL DEFAULT 1,
  created_at            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deleted_at            TIMESTAMP(3) NULL DEFAULT NULL,
  PRIMARY KEY (id),
  KEY students_promo (promotion_id),
  KEY students_cat (category_id),
  KEY students_filiere (filiere_id),
  KEY students_status (status),
  KEY students_origin (origin),
  KEY students_name (full_name),
  KEY students_photo_pending (photo_submitted_at),
  KEY students_contact_pending (contact_submitted_at),
  CONSTRAINT students_promo   FOREIGN KEY (promotion_id) REFERENCES promotions(id),
  CONSTRAINT students_cat     FOREIGN KEY (category_id)  REFERENCES categories(id),
  CONSTRAINT students_filiere FOREIGN KEY (filiere_id)   REFERENCES filieres(id),
  CONSTRAINT students_status  CHECK (status IN ('EN_FORMATION', 'DIPLOME', 'ABANDON', 'EXCLU')),
  CONSTRAINT students_origin  CHECK (origin IN ('INTERNE', 'EXTERNE'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE student_photo_requests (
  id           CHAR(36)     NOT NULL DEFAULT (UUID()),
  student_id   CHAR(36)     NOT NULL,
  photo_url    TEXT         NOT NULL,
  status       VARCHAR(20)  NOT NULL DEFAULT 'pending',
  submitted_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  reviewed_by  CHAR(36)     DEFAULT NULL,
  reviewed_at  TIMESTAMP(3) NULL DEFAULT NULL,
  review_note  TEXT,
  PRIMARY KEY (id),
  KEY photo_req_student (student_id),
  KEY photo_req_status (status, submitted_at),
  CONSTRAINT photo_req_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  CONSTRAINT photo_req_admin   FOREIGN KEY (reviewed_by) REFERENCES admins(id),
  CONSTRAINT photo_req_status  CHECK (status IN ('pending', 'approved', 'rejected'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE student_contact_requests (
  id           CHAR(36)     NOT NULL DEFAULT (UUID()),
  student_id   CHAR(36)     NOT NULL,
  email        VARCHAR(180) DEFAULT NULL,
  phone        VARCHAR(40)  DEFAULT NULL,
  status       VARCHAR(20)  NOT NULL DEFAULT 'pending',
  submitted_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  reviewed_by  CHAR(36)     DEFAULT NULL,
  reviewed_at  TIMESTAMP(3) NULL DEFAULT NULL,
  review_note  TEXT,
  PRIMARY KEY (id),
  KEY contact_req_student (student_id),
  KEY contact_req_status (status, submitted_at),
  CONSTRAINT contact_req_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  CONSTRAINT contact_req_admin   FOREIGN KEY (reviewed_by) REFERENCES admins(id),
  CONSTRAINT contact_req_status  CHECK (status IN ('pending', 'approved', 'rejected')),
  CONSTRAINT contact_req_filled  CHECK (email IS NOT NULL OR phone IS NOT NULL)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE student_status_history (
  id          CHAR(36)     NOT NULL DEFAULT (UUID()),
  student_id  CHAR(36)     NOT NULL,
  from_status VARCHAR(20)  DEFAULT NULL,
  to_status   VARCHAR(20)  NOT NULL,
  changed_by  CHAR(36)     DEFAULT NULL,
  note        TEXT,
  created_at  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY ssh_student (student_id),
  CONSTRAINT ssh_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  CONSTRAINT ssh_admin   FOREIGN KEY (changed_by) REFERENCES admins(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 4. Témoignages (rattachés à un profil)
-- =============================================================================
-- Les années de formation ne sont pas saisies : on stocke academic_year
-- de la promotion au moment de l’envoi (training_years).

CREATE TABLE alumni_feedback (
  id                  CHAR(36)     NOT NULL DEFAULT (UUID()),
  student_id          CHAR(36)     NOT NULL,
  full_name           VARCHAR(180) NOT NULL,
  email               VARCHAR(180) NOT NULL,
  promotion_id        CHAR(36)     DEFAULT NULL,
  category_id         CHAR(36)     DEFAULT NULL,
  filiere_id          CHAR(36)     DEFAULT NULL,
  training_years      VARCHAR(20)  NOT NULL DEFAULT '' COMMENT 'Copie de promotions.academic_year',
  career_title        VARCHAR(180) NOT NULL DEFAULT '',
  career_organization VARCHAR(180) NOT NULL DEFAULT '',
  career_path         TEXT         NOT NULL,
  experience          TEXT         NOT NULL,
  status              VARCHAR(20)  NOT NULL DEFAULT 'pending',
  reviewed_by         CHAR(36)     DEFAULT NULL,
  reviewed_at         TIMESTAMP(3) NULL DEFAULT NULL,
  created_at          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY alumni_student (student_id),
  KEY alumni_status (status, created_at),
  CONSTRAINT alumni_student FOREIGN KEY (student_id)   REFERENCES students(id) ON DELETE CASCADE,
  CONSTRAINT alumni_promo   FOREIGN KEY (promotion_id) REFERENCES promotions(id),
  CONSTRAINT alumni_cat     FOREIGN KEY (category_id)  REFERENCES categories(id),
  CONSTRAINT alumni_filiere FOREIGN KEY (filiere_id)   REFERENCES filieres(id),
  CONSTRAINT alumni_admin   FOREIGN KEY (reviewed_by)  REFERENCES admins(id),
  CONSTRAINT alumni_status  CHECK (status IN ('pending', 'published', 'hidden'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 5. Galerie
-- =============================================================================

CREATE TABLE gallery_events (
  id         CHAR(36)     NOT NULL DEFAULT (UUID()),
  name       VARCHAR(180) NOT NULL,
  sort_order INT          NOT NULL DEFAULT 0,
  active     TINYINT(1)   NOT NULL DEFAULT 1,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY gallery_events_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE gallery_photos (
  id         CHAR(36)     NOT NULL DEFAULT (UUID()),
  title      VARCHAR(180) NOT NULL,
  caption    TEXT         NOT NULL,
  event_name VARCHAR(180) NOT NULL,
  event_date DATE         NOT NULL,
  src        LONGTEXT     NOT NULL,
  published  TINYINT(1)   NOT NULL DEFAULT 1,
  created_by CHAR(36)     DEFAULT NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deleted_at TIMESTAMP(3) NULL DEFAULT NULL,
  PRIMARY KEY (id),
  KEY gallery_event (event_name, event_date),
  KEY gallery_pub (published, event_date),
  CONSTRAINT gallery_admin FOREIGN KEY (created_by) REFERENCES admins(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 6. Contenu public
-- =============================================================================

CREATE TABLE faq_items (
  id         CHAR(36)     NOT NULL DEFAULT (UUID()),
  question   TEXT         NOT NULL,
  answer     TEXT         NOT NULL,
  sort_order INT          NOT NULL DEFAULT 0,
  published  TINYINT(1)   NOT NULL DEFAULT 1,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 7. Vues
-- =============================================================================

CREATE VIEW v_admins AS
SELECT
  a.id,
  a.login,
  a.email,
  a.full_name,
  a.phone,
  a.is_principal,
  a.is_active,
  a.must_change_password,
  a.last_login_at,
  a.created_at,
  r.code AS role_code,
  r.name AS role_name,
  creator.full_name AS created_by_name
FROM admins a
JOIN roles r ON r.id = a.role_id
LEFT JOIN admins creator ON creator.id = a.created_by
WHERE a.deleted_at IS NULL;

CREATE VIEW v_public_students AS
SELECT
  s.id,
  s.full_name,
  s.status,
  s.origin,
  s.photo_url,
  s.email,
  s.phone,
  s.career_title,
  s.career_organization,
  p.number AS promotion_number,
  p.label  AS promotion_label,
  p.academic_year,
  c.code   AS category_code,
  f.name   AS filiere_name
FROM students s
JOIN promotions p ON p.id = s.promotion_id
JOIN categories c ON c.id = s.category_id
JOIN filieres   f ON f.id = s.filiere_id
WHERE s.published = 1
  AND s.deleted_at IS NULL
  AND p.deleted_at IS NULL;

CREATE VIEW v_promotion_counts AS
SELECT
  p.id,
  p.number,
  p.label,
  p.academic_year,
  p.status,
  COUNT(s.id) AS student_count,
  SUM(s.status IN ('EN_FORMATION', 'DIPLOME')) AS cohort_count,
  SUM(s.status = 'ABANDON') AS abandon_count,
  SUM(s.status = 'EXCLU') AS exclu_count,
  SUM(s.origin = 'INTERNE') AS interne_count,
  SUM(s.origin = 'EXTERNE') AS externe_count
FROM promotions p
LEFT JOIN students s
  ON s.promotion_id = p.id
 AND s.deleted_at IS NULL
 AND s.published = 1
WHERE p.deleted_at IS NULL
GROUP BY p.id, p.number, p.label, p.academic_year, p.status;

CREATE VIEW v_admin_alerts AS
SELECT
  (SELECT COUNT(*) FROM students
    WHERE deleted_at IS NULL AND photo_pending IS NOT NULL AND photo_pending <> '') AS photos_pending,
  (SELECT COUNT(*) FROM students
    WHERE deleted_at IS NULL
      AND (contact_pending_email IS NOT NULL AND contact_pending_email <> ''
        OR contact_pending_phone IS NOT NULL AND contact_pending_phone <> '')) AS contacts_pending,
  (SELECT COUNT(*) FROM alumni_feedback WHERE status = 'pending') AS testimonials_pending;

-- =============================================================================
-- 8. Fonctions : mot de passe
-- =============================================================================

CREATE FUNCTION hash_password(p_password VARCHAR(255))
RETURNS CHAR(64)
DETERMINISTIC
NO SQL
RETURN SHA2(CONCAT('ma-promotion::', p_password), 256);

CREATE FUNCTION verify_admin_password(p_login VARCHAR(80), p_password VARCHAR(255))
RETURNS CHAR(36)
READS SQL DATA
RETURN (
  SELECT a.id
  FROM admins a
  WHERE a.login = p_login
    AND a.is_active = 1
    AND a.deleted_at IS NULL
    AND a.password_hash = SHA2(CONCAT('ma-promotion::', p_password), 256)
  LIMIT 1
);

-- =============================================================================
-- 9. Données de référence
-- =============================================================================

INSERT INTO roles (id, code, name, description, is_system) VALUES
  ('11111111-0000-4000-8000-000000000001', 'SUPER_ADMIN', 'Administrateur principal',
   'Cree les comptes administrateurs, gere les roles et toute la plateforme.', 1),
  ('11111111-0000-4000-8000-000000000002', 'ADMIN', 'Administrateur',
   'Travaille au quotidien : eleves, galerie, temoignages, promotions, contacts.', 1);

INSERT INTO permissions (id, code, module, action, description) VALUES
  ('12111111-0000-4000-8000-000000000001', 'admins.view',              'admins',     'view',             'Voir les comptes administrateurs'),
  ('12111111-0000-4000-8000-000000000002', 'admins.create',            'admins',     'create',           'Creer un compte administrateur'),
  ('12111111-0000-4000-8000-000000000003', 'admins.update',            'admins',     'update',           'Modifier un compte administrateur'),
  ('12111111-0000-4000-8000-000000000004', 'admins.deactivate',        'admins',     'deactivate',       'Desactiver un compte administrateur'),
  ('12111111-0000-4000-8000-000000000005', 'students.manage',          'students',   'manage',           'Gerer les profils eleves'),
  ('12111111-0000-4000-8000-000000000006', 'students.import',          'students',   'import',           'Importer des eleves depuis Excel'),
  ('12111111-0000-4000-8000-000000000007', 'students.moderate_photo',  'students',   'moderate_photo',   'Valider ou refuser une photo'),
  ('12111111-0000-4000-8000-000000000010', 'students.moderate_contact','students',   'moderate_contact', 'Valider ou refuser un contact'),
  ('12111111-0000-4000-8000-000000000008', 'promotions.manage',        'promotions', 'manage',           'Gerer les promotions et la cohorte'),
  ('12111111-0000-4000-8000-000000000009', 'catalog.manage',           'catalog',    'manage',           'Gerer categories, regies et filieres'),
  ('12111111-0000-4000-8000-00000000000a', 'alumni.moderate',          'alumni',     'moderate',         'Valider les temoignages'),
  ('12111111-0000-4000-8000-00000000000b', 'gallery.manage',           'gallery',    'manage',           'Alimenter et modifier la galerie'),
  ('12111111-0000-4000-8000-00000000000e', 'audit.view',               'audit',      'view',             'Consulter le journal d''audit'),
  ('12111111-0000-4000-8000-00000000000f', 'settings.manage',          'settings',   'manage',           'Modifier les parametres');

INSERT INTO role_permissions (role_id, permission_id)
SELECT '11111111-0000-4000-8000-000000000001', id FROM permissions;

INSERT INTO role_permissions (role_id, permission_id)
SELECT '11111111-0000-4000-8000-000000000002', id FROM permissions
WHERE code NOT IN ('admins.create', 'admins.deactivate', 'settings.manage');

INSERT INTO admins (
  id, role_id, login, email, full_name, password_hash,
  is_principal, is_active, must_change_password, created_by
) VALUES (
  '13111111-0000-4000-8000-000000000001',
  '11111111-0000-4000-8000-000000000001',
  'principal',
  'principal@epca.ga',
  'Administrateur principal',
  SHA2(CONCAT('ma-promotion::', 'EPCA-Principal-2026'), 256),
  1, 1, 1, NULL
);

-- Cycle EPCA : 31e = 2024-2026, puis -2 ans par promotion.
INSERT INTO academic_years (id, label, starts_on, ends_on, is_current) VALUES
  ('14111111-0000-4000-8000-000000000029', '2020-2022', '2020-10-01', '2022-07-31', 0),
  ('14111111-0000-4000-8000-000000000030', '2022-2024', '2022-10-01', '2024-07-31', 0),
  ('14111111-0000-4000-8000-000000000031', '2024-2026', '2024-10-01', '2026-07-31', 1);

INSERT INTO categories (id, code, name, description, sort_order, active) VALUES
  ('15111111-0000-4000-8000-000000000001', 'C2', 'C2', 'Categorie C2.', 1, 1),
  ('15111111-0000-4000-8000-000000000002', 'C1', 'C1', 'Categorie C1.', 2, 1),
  ('15111111-0000-4000-8000-000000000003', 'B2', 'B2', 'Categorie B2.', 3, 1),
  ('15111111-0000-4000-8000-000000000004', 'B1', 'B1', 'Categorie B1.', 4, 1),
  ('15111111-0000-4000-8000-000000000005', 'A2', 'A2', 'Categorie A2.', 5, 1);

INSERT INTO regies (id, code, name, description) VALUES
  ('16111111-0000-4000-8000-000000000001', 'FIN', 'Regie financiere', 'Douanes, impots et assimiles.'),
  ('16111111-0000-4000-8000-000000000002', 'ADM', 'Gestion administrative', 'Administration generale et ressources humaines.');

INSERT INTO filieres (id, regie_id, code, name, description) VALUES
  ('17111111-0000-4000-8000-000000000001', '16111111-0000-4000-8000-000000000001', 'DOU', 'Douanes', 'Filiere Douanes.'),
  ('17111111-0000-4000-8000-000000000002', '16111111-0000-4000-8000-000000000001', 'IMP', 'Impots', 'Filiere Impots.'),
  ('17111111-0000-4000-8000-000000000003', '16111111-0000-4000-8000-000000000002', 'GAD', 'Administration generale', 'Filiere Administration generale.'),
  ('17111111-0000-4000-8000-000000000004', '16111111-0000-4000-8000-000000000002', 'RH',  'Ressources humaines', 'Filiere Ressources humaines.');

INSERT INTO category_filieres (category_id, filiere_id) VALUES
  ('15111111-0000-4000-8000-000000000004', '17111111-0000-4000-8000-000000000001'),
  ('15111111-0000-4000-8000-000000000005', '17111111-0000-4000-8000-000000000001'),
  ('15111111-0000-4000-8000-000000000004', '17111111-0000-4000-8000-000000000002'),
  ('15111111-0000-4000-8000-000000000003', '17111111-0000-4000-8000-000000000002'),
  ('15111111-0000-4000-8000-000000000005', '17111111-0000-4000-8000-000000000002'),
  ('15111111-0000-4000-8000-000000000001', '17111111-0000-4000-8000-000000000003'),
  ('15111111-0000-4000-8000-000000000002', '17111111-0000-4000-8000-000000000003'),
  ('15111111-0000-4000-8000-000000000003', '17111111-0000-4000-8000-000000000003'),
  ('15111111-0000-4000-8000-000000000004', '17111111-0000-4000-8000-000000000003'),
  ('15111111-0000-4000-8000-000000000002', '17111111-0000-4000-8000-000000000004'),
  ('15111111-0000-4000-8000-000000000003', '17111111-0000-4000-8000-000000000004'),
  ('15111111-0000-4000-8000-000000000004', '17111111-0000-4000-8000-000000000004');

INSERT INTO promotions (id, number, label, academic_year, academic_year_id, status, summary) VALUES
  ('19111111-0000-4000-8000-000000000031', 31, '31e promotion', '2024-2026',
   '14111111-0000-4000-8000-000000000031', 'en_cours',
   'Promotion actuellement en formation a l''EPCA.'),
  ('19111111-0000-4000-8000-000000000030', 30, '30e promotion', '2022-2024',
   '14111111-0000-4000-8000-000000000030', 'terminee',
   'Promotion sortie diplomee.'),
  ('19111111-0000-4000-8000-000000000029', 29, '29e promotion', '2020-2022',
   '14111111-0000-4000-8000-000000000029', 'terminee',
   'Promotion historique diplomee.');

INSERT INTO gallery_events (id, name, sort_order, active) VALUES
  ('1a111111-0000-4000-8000-000000000001', 'Remise des diplomes',     1, 1),
  ('1a111111-0000-4000-8000-000000000002', 'Ceremonie',               2, 1),
  ('1a111111-0000-4000-8000-000000000003', 'Visite institutionnelle', 3, 1),
  ('1a111111-0000-4000-8000-000000000004', 'Vie de l''ecole',         4, 1),
  ('1a111111-0000-4000-8000-000000000005', 'Conference',              5, 1),
  ('1a111111-0000-4000-8000-000000000006', 'Photo de groupe',         6, 1),
  ('1a111111-0000-4000-8000-000000000007', 'Seminaire',               7, 1);

INSERT INTO faq_items (id, question, answer, sort_order, published) VALUES
  (UUID(), 'A quoi sert ce portail ?',
   'Ma Promotion presente les promotions de l''EPCA, les profils des eleves par categorie et filiere, les temoignages et le carnet d''adresses relationnel de la famille EPCA.',
   1, 1),
  (UUID(), 'Comment consulter une promotion ?',
   'Ouvrez la page Promotions, choisissez une promotion, puis la categorie et la filiere. Chaque fiche affiche le parcours et, s''il a ete valide, le contact de l''eleve.',
   2, 1),
  (UUID(), 'Je suis un ancien eleve : comment temoigner ?',
   'Ouvrez votre profil dans une promotion, puis deposez votre temoignage depuis cette page. Il est publie apres validation par l''administration. Les annees de formation sont celles de votre promotion.',
   3, 1),
  (UUID(), 'Comment laisser mon contact ?',
   'Depuis votre fiche, proposez un e-mail ou un telephone. L''administration valide avant publication. Une fois valide, ce contact n''est plus modifiable depuis le profil.',
   4, 1),
  (UUID(), 'Les informations sont-elles officielles ?',
   'Les contenus sont renseignes et publies par l''administration de l''EPCA.',
   5, 1);

INSERT INTO system_settings (setting_key, setting_value, description) VALUES
  ('site.name',              CAST('"Ma Promotion"' AS JSON), 'Nom public du portail'),
  ('site.school',            CAST('"Ecole de Preparation aux Carrieres Administratives"' AS JSON), 'Nom de l''ecole'),
  ('site.country',           CAST('"Gabon"' AS JSON), 'Pays'),
  ('latest_promotion',       CAST('31' AS JSON), 'Numero de la derniere promotion'),
  ('stats.promotions',       CAST('31' AS JSON), 'Chiffre affiche : promotions'),
  ('stats.trained',          CAST('3000' AS JSON), 'Chiffre affiche : personnes formees'),
  ('students.photo_lock',    CAST('true' AS JSON), 'Photo verrouillee apres validation'),
  ('students.contact_lock',  CAST('true' AS JSON), 'Contact verrouille apres validation');

SET sql_notes = 1;

-- Exemple : creer un administrateur (uniquement avec created_by = id du principal)
-- INSERT INTO admins (
--   role_id, login, email, full_name, phone, password_hash,
--   is_principal, is_active, must_change_password, created_by
-- ) VALUES (
--   '11111111-0000-4000-8000-000000000002',
--   'j.mbadinga',
--   'j.mbadinga@epca.ga',
--   'Jean Mbadinga',
--   '+241 00 00 00 00',
--   SHA2(CONCAT('ma-promotion::', 'MotDePasseTemporaire1'), 256),
--   0, 1, 1,
--   '13111111-0000-4000-8000-000000000001'
-- );
