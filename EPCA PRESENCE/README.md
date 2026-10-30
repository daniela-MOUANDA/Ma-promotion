# EPCA — Portail de candidature et gestion scolaire

Portail officiel de candidature aux concours de l’**École de Préparation aux Carrières Administratives** (Gabon), et back-office de gestion de la scolarité.

> Version de démonstration : les données sont générées et stockées dans le navigateur (`localStorage`). Le branchement Supabase est prévu, l’architecture cible est décrite dans [`docs/architecture/PHASE-0.md`](docs/architecture/PHASE-0.md).

## Stack

| Domaine | Choix |
|---|---|
| Build | Vite 7 |
| UI | React 19 + TypeScript strict |
| Styles | Tailwind CSS 4 (tokens dans `src/styles/index.css`) |
| Routage | React Router 7 |
| État serveur | TanStack Query |
| Formulaires | React Hook Form + Zod |
| Icônes | Lucide React |
| Documents | jsPDF + jspdf-autotable (PDF), export XML (Excel) |
| Backend cible | Supabase |

## Démarrage

```bash
npm install
npm run dev      # serveur de développement
npm run build    # vérification TypeScript + build de production
npm run preview  # prévisualisation du build
```

Variables d’environnement : copier `.env.example` vers `.env.local`. Tant que `VITE_USE_MOCKS=true`, l’application fonctionne sans backend.

Accès au back-office de démonstration : `/administration`, identifiant `admin`, mot de passe `epca-demo`.

## Fonctionnalités

### Portail public

- Page d’accueil institutionnelle avec la session de concours en cours.
- Sessions de concours publiées : conditions, pièces demandées, calendrier, catégories et filières.
- Dépôt de candidature en quatre étapes (identité, catégorie, filière, validation) avec attribution d’un numéro unique.
- Suivi de dossier par numéro, avec la frise du parcours et le créneau de dépôt physique.
- Listes officielles (dépôt, candidats autorisés) et résultats d’admission, exportables en PDF et Excel.
- Promotions publiques, présentation de l’école, FAQ et contact.

### Administration

- Tableau de bord analytique : répartition par catégorie, pyramide des âges des candidats, répartition par sexe, âge moyen par catégorie, flux des dépôts sur 14 jours, entonnoir de conversion, filières les plus demandées.
- Réception et traitement des candidatures, gestion des dossiers physiques, convocations au dépôt, publication des listes et des résultats.
- Sessions de concours : création, modification, suppression, changement de statut.
- Scolarité : classes et quotas, répartition des admis, cours et enseignants, attributions.
- Emplois du temps : génération par classe ou par filière, détection des conflits d’enseignants, édition créneau par créneau, impression.
- Appel du surveillant général avec statistiques de présence et historique.
- Cartes scolaires et fichier des étudiants.

## Organisation du code

```
src/
├── app/            # routeur
├── components/     # design system (ui), graphiques, briques admin, feedback
├── constants/      # libellés, identité du site
├── layouts/        # PublicLayout, AdminLayout, gardes
├── lib/            # stores localStorage, catalogue, exports, helpers
├── mocks/          # jeux de données de référence
├── pages/          # pages publiques et administration
├── styles/         # thème et utilitaires CSS
└── types/          # types métier
```

Les données transitent par des stores dédiés (`applications-store`, `publications-store`, `school-store`, `competitions-store`) qui notifient l’interface via `use-live-data`.

## Direction artistique

Thème principal **bleu marine et blanc**. Les autres couleurs sont réservées au sens : vert pour les validations, rouge pour les actions destructives, ambre pour les avertissements. Les graphiques utilisent une échelle monochrome du marine au bleu clair.

## Licence

Projet interne — tous droits réservés.
