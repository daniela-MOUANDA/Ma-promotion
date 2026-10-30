# EPCA — Phase 0 : architecture

**Statut :** en attente de validation — aucune implémentation majeure avant feu vert.

**Produit :** portail officiel de candidature et système de gestion académique de l’École de Préparation aux Carrières Administratives (Gabon).

**Périmètre V1 :** web uniquement. L’application mobile enseignants / surveillants n’est pas développée, mais le modèle de données, l’auth, le storage et les Edge Functions sont conçus pour qu’elle consomme la même API Supabase plus tard.

---

## 0. Constat du dépôt existant

| Élément | État |
|---|---|
| Code applicatif | Absent (projet greenfield) |
| Logo officiel | `logo-epca.png` — blason marine, lettres EPCA, couronne de laurier |
| Backend Spring Boot | Interdit pour cette version |
| Projet Supabase **retenu** | `https://bqgtlqvzfcoerkxvrehc.supabase.co` |
| Schéma distant | Vide (confirmé) — greenfield, adapté à la Phase 1 |
| MCP Cursor actuellement connecté | `https://udkihsxottqenfmorucm.supabase.co` — **mauvais projet**, à reconnecter |

Le logo existe et **doit** être utilisé (header, footer, auth, documents, cartes). Le fichier actuel est sur fond noir : prévoir une variante transparente (ou un traitement CSS) sans remplacer le blason par un carré de couleur.

Les textes, filières, dates, chiffres et coordonnées officiels **ne seront pas inventés**. Les seeds initiaux (catégories C2–A2, régies d’exemple) seront clairement marqués comme données de configuration, pas comme communication officielle.

---

## 1. Architecture frontend

Application unique **Vite + React + TypeScript strict**.

Pas de Next.js. Pas de monorepo mobile. Une SPA professionnelle, multi-routes, avec zones clairement séparées.

```
src/
├── app/                    # bootstrap, providers, router
├── assets/                 # logo, photos institutionnelles remplaçables
├── components/
│   ├── ui/                 # design system (Button, Input, DataTable…)
│   ├── brand/              # Logo (sm / md / lg / document)
│   └── feedback/           # EmptyState, LoadingState, ErrorState, skeletons
├── layouts/
│   ├── PublicLayout
│   ├── CandidateLayout
│   ├── AdminLayout
│   ├── StaffLayout
│   └── StudentLayout
├── pages/                  # pages minces (composition)
├── features/               # logique métier par domaine
│   ├── auth/
│   ├── competitions/
│   ├── applications/
│   ├── candidates/
│   ├── students/
│   ├── promotions/
│   ├── categories/
│   ├── regies/
│   ├── filieres/
│   ├── classes/
│   ├── groups/
│   ├── courses/
│   ├── teachers/
│   ├── schedules/
│   ├── attendance/
│   ├── convocations/
│   ├── councils/
│   ├── documents/
│   ├── cards/
│   ├── audit/
│   ├── notifications/
│   └── statistics/
├── hooks/
├── lib/
│   ├── supabase/           # client, queries, mutations — seule porte d’accès
│   ├── validations/        # schémas Zod
│   ├── permissions/        # helpers UI (jamais source de vérité)
│   └── utils/
├── mocks/                  # démo uniquement, jamais importée en prod
├── types/                  # réexport des types générés database.types.ts
├── constants/
└── styles/                 # tokens Tailwind (identité EPCA)
```

**Règles :**

- Les pages ne parlent pas à Supabase directement.
- Chaque feature expose des hooks TanStack Query + des schémas Zod.
- Lazy loading des zones (`admin`, `student`, `staff`).
- Types générés depuis le schéma (`supabase gen types`) — pas de types métier contradictoires.
- `any` interdit. Données mockées isolées dans `src/mocks/`.

**État serveur :** TanStack Query.  
**Formulaires :** React Hook Form + Zod.  
**Routing :** React Router, layouts par zone.  
**Icônes :** Lucide React, avec parcimonie.

---

## 2. Architecture Supabase

Supabase est le backend. PostgreSQL est la source de vérité.

| Service | Usage |
|---|---|
| Auth | Comptes admin, staff, enseignants, étudiants. Candidat : compte optionnel (décision D1). |
| PostgreSQL | Toutes les données métier, historiques, jobs, audit |
| Storage | Photos, cartes, documents, exports — buckets séparés + RLS |
| Realtime | Présences en cours, notifications in-app (pas le portail public) |
| Edge Functions | Soumission candidature, numérotation, admission→étudiant, PDF, Excel async, sync présence |
| RLS | Obligatoire sur toutes les tables sensibles |

**Ce qui ne va pas dans le frontend :**

- `SUPABASE_SERVICE_ROLE_KEY`
- génération des numéros officiels
- changement de statut « sensible » (admission, validation dossier, publication de listes)
- génération PDF / Excel lourde

**Edge Functions prévues (Phase 1 n’en implémente qu’une partie) :**

1. `submit-application` — validation, anti-doublon, rate-limit, numéro unique, statut initial
2. `admit-candidate` — transaction : résultat ADMIS → étudiant + historique (pas de compte auto)
3. `create-student-account` — création Auth + lien `student_accounts` sur demande admin
4. `generate-document` — convocations, PV, cartes
5. `generate-export` — registres Excel, job asynchrone si volume
6. `sync-attendance` — upsert batch compatible offline (`client_generated_id`)

Les lectures publiques (concours publiés, promotions publiées, FAQ) passent par le client anon + RLS / vues `public_*`.

---

## 3. Schéma de base de données

UUID partout en PK. Timestamps `created_at` / `updated_at`. Soft delete (`deleted_at`) sur les entités de référence et les personnes. Pas de suppression physique des étudiants historiques.

### 3.1 Identité et autorisation

- `profiles` — 1–1 avec `auth.users`
- `roles` — codes système : `SUPER_ADMIN`, `ADMIN`, `SURVEILLANT_GENERAL`, `SURVEILLANT`, `ENSEIGNANT`, `ETUDIANT`, `CANDIDAT`
- `permissions` — `module.action`
- `role_permissions`
- `user_roles` — un utilisateur peut avoir plusieurs rôles
- `audit_logs` — append-only

### 3.2 Référentiel académique

- `academic_years`
- `categories` — seed C2, C1, B2, B1, A2 (administrable)
- `regies`
- `filieres` — `regie_id NOT NULL`
- `category_filieres` — une filière peut servir plusieurs catégories
- `time_slots` — matin, soir, autres créneaux administrables (pas d’enum figé métier)
- `system_settings` — formats de numéros, seuils d’absence, champs extra candidature, statuts de présence activés (P/A et optionnellement R/E)

### 3.3 Concours et candidatures

- `competitions`
- `competition_categories`
- `competition_category_filieres`
- `candidates` — personne, `user_id` nullable
- `applications`
- `application_status_history`
- `physical_dossiers`
- `competition_list_publications` — listes publiques configurables
- `competition_results`
- `number_sequences` — numérotation atomique

Statuts de candidature (codes, table de référence + transitions autorisées) :

`BROUILLON` → `SOUMISE` → `DOSSIER_PHYSIQUE_ATTENDU` → `DOSSIER_PHYSIQUE_DEPOSE` → `DOSSIER_PHYSIQUE_VALIDE` | `DOSSIER_PHYSIQUE_REJETE` → `AUTORISE_CONCOURS` | `NON_AUTORISE` → `ADMIS` | `NON_ADMIS`  
Également : `ANNULEE`.

### 3.4 Étudiants et promotions

- `promotions`
- `public_promotion_settings` — champs exposés publiquement
- `students` — snapshot civil + pointeurs *courants* (promotion, catégorie, régie, filière, classe, groupe, statut)
- `student_status_history`
- `student_assignment_history` — tout mouvement académique
- `student_accounts` — créé uniquement sur action admin

Statuts étudiants : `EN_FORMATION`, `DIPLOME`, `ABANDON`, `EXCLU`.

### 3.5 Classes, groupes, pédagogie

- `groups` — promotion + catégorie + time_slot + numéro de groupe + kind (`tronc_commun` | `specialisation`) + régie/filière si spécialisation
- `classes` — entité opérationnelle (nom, code, capacité, `group_id`, année, kind)
- `class_students` — inscription datée, `left_at` pour l’historique
- `class_teachers`
- `teachers` — `user_id` nullable jusqu’à création du compte
- `courses`
- `course_classes`
- `rooms` (optionnel V1, salle en texte si pas encore de référentiel)
- `schedule_sessions` — séance planifiée

### 3.6 Assiduité (compatible offline)

Champs communs sync : `id` UUID, `client_generated_id`, `device_id`, `sync_status` (`pending` | `synced` | `conflict`), `synced_at`, `created_at`, `updated_at`.

- `attendance_sessions`
- `attendance_records` — unique `(attendance_session_id, student_id)` **et** unique `client_generated_id`
- `absence_justifications`
- `absence_alert_rules`

Statuts de présence : `P` et `A` actifs par défaut. `R` et `E` existent en base, activés seulement via `system_settings`.

### 3.7 Documents, conseils, cartes, notifications

- `convocations`
- `class_councils`
- `class_council_observations`
- `class_council_reports`
- `school_cards`
- `documents`
- `notifications`
- `jobs` — exports / PDF asynchrones

---

## 4. Relations entre tables

```
auth.users 1—1 profiles 1—* user_roles *—1 roles *—* permissions

competitions 1—* applications *—1 candidates
competitions 1—* competition_categories *—1 categories
competition_categories 1—* competition_category_filieres *—1 filieres
filieres *—1 regies
categories *—* filieres  (category_filieres)

applications 1—* application_status_history
applications 1—0..1 physical_dossiers
applications 1—0..1 competition_results
applications 1—0..1 students          (via admission, jamais automatique hors action admin)

promotions 1—* students
promotions 1—* groups 1—* classes
classes 1—* class_students *—1 students
classes 1—* class_teachers *—1 teachers
classes *—* courses
courses 1—* schedule_sessions *—1 teachers
schedule_sessions 1—0..1 attendance_sessions
attendance_sessions 1—* attendance_records *—1 students
```

**Invariants :**

1. Un candidat n’est pas un étudiant.
2. Seule l’administration transforme un `ADMIS` en `students`.
3. Une filière a toujours une régie.
4. Tronc commun : `filiere_id` et `regie_id` nuls sur le groupe/classe.
5. Spécialisation : `filiere_id` et `regie_id` obligatoires, cohérents (`filiere.regie_id = groupe.regie_id`).
6. Un mouvement de classe ferme l’inscription précédente (`left_at`) et ouvre une ligne d’historique.
7. Les photos de carte et les photos publiques sont des objets distincts.

---

## 5. Rôles

| Rôle | Intention |
|---|---|
| `SUPER_ADMIN` | Configuration critique, rôles, tout audit, tout paramètre |
| `ADMIN` | Exploitation quotidienne (concours, académique, documents, comptes hors super-admin) |
| `SURVEILLANT_GENERAL` | Assiduité globale, registres, exports, convocations, conseils, appels |
| `SURVEILLANT` | Appels et consultation selon périmètre (à valider D8) |
| `ENSEIGNANT` | Ses classes, ses séances, ses appels |
| `ETUDIANT` | Son espace |
| `CANDIDAT` | Suivi de ses dossiers s’il a un compte |

Le frontend masque. PostgreSQL RLS + Edge Functions décident.

---

## 6. Permissions

Modèle `module.action`, pas un booléen unique par rôle.

Exemples : `applications.view`, `applications.validate_physical`, `competitions.publish_list`, `students.admit`, `students.create_account`, `attendance.take`, `attendance.correct`, `attendance.export`, `cards.generate`, `audit.view`, `settings.manage`.

Les matrices rôle × permission sont seedées, ensuite administrables par `SUPER_ADMIN`.

Portée métier en plus du verbe :

- enseignant → `class_teachers`
- étudiant → `students.user_id` / `student_accounts`
- surveillant (si périmètre) → table de scope à valider

---

## 7. RLS

Principe : **deny by default**. `ENABLE ROW LEVEL SECURITY` + policies explicites. Aucune table sensible en `GRANT` anon large.

Helpers SQL (security definer, `search_path` figé) :

- `is_authenticated()`
- `has_role(code)`
- `has_permission(code)`
- `current_student_id()`
- `teacher_class_ids()`

**Public (anon) :**

- concours `is_public = true`
- listes dont la publication est active
- promotions publiques + étudiants dont `is_public_profile` et statut autorisé
- contenus CMS (école, FAQ, contact) s’ils existent en table

**Authenticated :**

- admin / surveillant général : selon permissions
- enseignant : classes affectées, séances, appels de ces séances
- étudiant : soi-même, ses convocations, sa carte, son emploi du temps
- candidat authentifié : ses `candidates` / `applications` uniquement

Storage : pas d’URL publique pour photos d’identité ni documents admin. URL signée. Copie dérivée dans un bucket public **uniquement** pour les portraits de promotion explicitement validés.

---

## 8. Routes

### Public

| Route | Intention |
|---|---|
| `/` | Portail de candidature — narration, pas one-page métier |
| `/concours` | Ouverts / à venir / terminés |
| `/concours/:id` | Détail + candidater |
| `/candidature` | Wizard |
| `/candidature/suivi` | Suivi par numéro |
| `/promotions` | Liste |
| `/promotions/:promotionId` | Catégories |
| `/promotions/:promotionId/:categoryId` | Filières |
| `/promotions/:promotionId/:categoryId/:filiereId` | Étudiants paginés |
| `/ecole` | Présentation |
| `/resultats` | Résultats publiés |
| `/faq` | FAQ |
| `/contact` | Contact |
| `/admin/login` | Connexion administration / staff |

### Administration (`/admin`, `AdminLayout`)

Tableau de bord · Concours · Candidats · Candidatures · Résultats · Promotions · Catégories · Régies · Filières · Classes · Groupes · Cours · Enseignants · Emploi du temps · Séances · Appels · Présences · Absences · Convocations · Cartes · PV · Exports · Utilisateurs · Audit · Permissions · Paramètres.

### Étudiant (`/espace`, `StudentLayout`)

Profil, emploi du temps, assiduité, convocations, carte scolaire.

### Staff / enseignant web (`/staff`, `/enseignant`)

Routes et gardes préparées. UI enseignant web volontairement minimale en V1 (la priorité mobile viendra plus tard). Données et RLS prêtes.

Gardes : layout + loader de session + `has_permission`. Un écran « permission refusée » dédié, jamais une page blanche.

---

## 9. Structure des composants

- **Design system** dans `components/ui` : petits, documentés par usage, sans logique métier.
- **Composants métier** dans chaque feature : `CompetitionCard`, `StudentCard`, `ApplicationStepper`, etc.
- **Pages** = assemblage + états (loading / empty / error / forbidden / not found).
- **DataTable** unique pour l’admin : recherche, filtres, tri, pagination, actions, export déclenché.
- Pas de composant de plusieurs centaines de lignes sans extraction.

---

## 10. Design system — direction artistique

**Objectif :** institution moderne gabonaise de formation administrative. Pas un dashboard SaaS, pas un template Bootstrap, pas une landing « IA ».

**Logo :** composant `Logo` avec variantes `mark` / `lockup`, tailles `sm | md | lg | xl`, fond `on-dark` | `on-light`. Source : `logo-epca.png`.

**Couleur :**

- Primaire : bleu profond du blason (navy).
- Surfaces : papier cassé / encre, pas du blanc clinique partout.
- Gabon (vert, jaune, bleu) : filet d’accent, états de succès, jamais drapeau plein écran.

**Typographie (proposition) :**

- Public éditorial : serif de titrage (héritage du blason).
- Interface et admin : sans humaniste, lisible, dense sans être serré.
- Éviter Inter + violet + glassmorphism.

**Mouvement :** reveal court, fade-up, hover de carte, compteurs, transitions de page. `prefers-reduced-motion: reduce`. Pas de particules, pas de blobs, pas de glow.

**Homepage (narration, pas stack de sections) :**

1. Identité : qui est l’EPCA, ce portail sert à candidater.
2. Preuve : concours en cours.
3. Action : comment candidater.
4. Confiance : école, filières en aperçu, promotions en aperçu (lien, pas la galerie complète).
5. Fermeture : CTA + footer institutionnel.

Promotions : navigation réelle `/promotions` → catégorie → filière → cartes. Breadcrumb. Cartes ABANDON / EXCLU désaturées, DIPLÔMÉ badge, EN FORMATION nominale.

---

## 11. Workflow candidature

1. Consulter le concours publié.
2. Saisir les informations (champs de base + champs extra configurés).
3. Choisir une catégorie **ouverte pour ce concours**.
4. Choisir une filière **ouverte pour cette catégorie et ce concours**.
5. Vérifier.
6. Valider → Edge Function → numéro unique (format configurable, défaut `EPCA-{YYYY}-CAND-{SEQ:6}`) → `SOUMISE`.

Le dépôt physique n’est pas remplacé. L’admin fait : liste → convocation au dépôt → `DOSSIER_PHYSIQUE_*` → publication des autorisés → épreuve → résultats → admis.

Listes publiques : uniquement si le concours a la publication correspondante activée.

Protection : Zod client + contrainte SQL + Edge Function, idempotency key, rate-limit, unicité (décision D2), Turnstile proposé (D12). Le frontend ne « bloque » pas un pic de charge.

---

## 12. Workflow étudiant

1. Résultat `ADMIS` publié ou interne.
2. Action admin `admit-candidate` : crée `students` + numéro + promotion/catégorie/filière/régie + historiques. **Pas de compte.**
3. Affectation classe / groupe plus tard, historisée.
4. Sur décision admin : `create-student-account` → e-mail d’activation.
5. L’étudiant complète les champs autorisés, dépose une photo.
6. L’admin valide la photo, génère / régénère / imprime la carte.

Statuts publics configurables. Abandon et exclu restent dans la promotion historique.

---

## 13. Workflow académique

```
Catégorie
  → Tronc commun (plusieurs groupes matin/soir selon effectif)
    → Régie
      → Spécialisation
        → Filière (+ catégorie)
          → Classes / groupes
```

L’administration crée autant de groupes que l’effectif l’exige. Aucun plafond technique.

Une classe porte : promotion, année, catégorie, kind, régie/filière optionnelles, time slot, groupe, capacité, statut, effectif calculé.

---

## 14. Workflow présence

1. Séance planifiée (`schedule_sessions`).
2. Ouverture d’un appel (`attendance_sessions`) par enseignant, surveillant, ou surveillant général.
3. Une ligne par étudiant de la classe à cette date : `P` / `A` (+ `R`/`E` si activés).
4. Justifications d’absence distinctes.
5. Corrections = nouvelle écriture d’audit + update traçable.
6. Registres filtrables + exports Excel.
7. Alertes si seuils configurés.

Mobile futur : même tables, `client_generated_id`, sync Edge Function, premier enregistrement finalisé gagne, second → `conflict`.

---

## 15. Workflow documents

Tout document officiel : logo, titre, numéro, date, corps, zone de signature, métadonnées dans `documents`.

| Type | Déclencheur | Sortie |
|---|---|---|
| Convocation | Admin / surveillant général | PDF privé |
| PV conseil | Clôture de conseil | PDF privé |
| Carte scolaire | Photo validée + étudiant inscrit | PDF / image privée |
| Registre | Demande d’export | XLSX, async si lourd |

Pas d’accès public aux buckets `documents/*`.

---

## 16. Architecture future mobile

**Non développé maintenant.** Contrat :

- Même projet Supabase, même Auth, mêmes RLS.
- Pas de second backend.
- Appels : pull séances du jour / push `attendance_*` par lots.
- SQLite locale plus tard ; colonnes de sync déjà en V1.
- Notifications : table `notifications` + Realtime ; push natif plus tard.
- Offline : queue locale → `sync-attendance`.

Pas d’Expo, pas de React Native dans ce dépôt V1.

---

## 17. Stratégie sécurité

Ordre des priorités : sécurité → intégrité → UX → UI → maintenabilité → performance → scalabilité.

- Secrets : `.env.local` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` uniquement côté client).
- Service role : Edge Functions / CI seulement.
- RLS partout.
- Validation Zod alignée sur les contraintes SQL.
- Storage : buckets, MIME, taille, pas d’URL publique identité.
- Audit des actions sensibles (auth, CRUD critique, statuts, appels, exports, permissions).
- Bruteforce : throttling Auth + lockout applicatif si besoin.
- DDoS : CDN / WAF (Cloudflare). L’app ne prétend pas s’en charger.
- Photos : données sensibles, copies publiques séparées et consenties.

---

## 18. Stratégie performance

Le pic est la **fenêtre d’ouverture du concours**.

- Pagination obligatoire (admin et listes publiques d’étudiants).
- Index : FKs, `application_number`, `(competition_id, status)`, `email`, dates de séance, `client_generated_id`.
- Numérotation : une ligne de séquence verrouillée, pas un `COUNT(*)`.
- Soumission uniquement via Edge Function (pas N inserts client).
- Cache HTTP / CDN sur pages publiques ; TanStack Query sur le client.
- Rate-limit soumission et suivi.
- Pas de Realtime sur le funnel de candidature.
- Exports lourds → `jobs`.
- Images : variantes, lazy loading.

---

## Décisions à valider avant Phase 1

| ID | Sujet | Proposition |
|---|---|---|
| D1 | Compte candidat | Candidature sans compte Auth ; suivi par numéro + e-mail |
| D2 | Unicité | 1 candidature active par e-mail et par concours |
| D3 | N° candidature | `EPCA-{YYYY}-CAND-{SEQ:6}` configurable |
| D4 | N° étudiant | `EPCA-{YYYY}-ETU-{SEQ:6}` configurable |
| D5 | Catégories seed | C2, C1, B2, B1, A2 — désactivables, pas hardcodées ensuite |
| D6 | Régies / filières seed | Placeholders non officiels, clairement marqués |
| D7 | Groupes | Table `groups` + `classes.group_id` |
| D8 | Périmètre surveillant | V1 : surveillant général = global ; surveillant = même périmètre ou restriction plus tard |
| D9 | Dossier physique | Workflow de statuts V1, pas de scan obligatoire |
| D10 | Photos publiques | Opt-in étudiant + validation admin |
| D11 | Espace enseignant web | Routes + RLS ; UI volontairement minimale |
| D12 | CAPTCHA | Cloudflare Turnstile à la soumission |
| D13 | Projet Supabase | **Validé** : `https://bqgtlqvzfcoerkxvrehc.supabase.co` — base vide |
| D14 | Logo | Utiliser `logo-epca.png` ; fournir un PNG transparent dès que possible |
| D15 | Langue | Français uniquement en V1 |
| D16 | Promotion vs année | Une promotion peut couvrir plusieurs `academic_years` |
| D17 | MFA | Disponible, imposé à `SUPER_ADMIN` |

---

## Phase 1 proposée (après validation)

Socle uniquement : dépôt Vite/React/TS, design tokens + Logo, Auth admin, tables identité / RBAC / audit / settings, RLS de base, layouts public + admin, homepage institutionnelle (contenu placeholder), pas encore le wizard complet ni l’académique complet.
