# 🏥 MédiSahel Clinique ERP – Suite Médicale v2.0.0-PROD

> **L'Excellence Médicale au cœur de l'Afrique de l'Ouest.**
> Une solution full-stack de pointe pour la gestion clinique, le Dossier Médical Électronique (DME), la Caisse/Facturation, le Laboratoire (Biochimie), la Pharmacie (Habilitations FEFO) et la gestion administrative des Ressources Humaines.

---

## 🚀 Vue d'ensemble du Projet

MédiSahel v2.0.0 est conçu pour répondre aux normes cliniques et réglementaires les plus strictes en Afrique de l'Ouest sub-saharienne. Il s'agit d'une architecture full-stack robuste intégrant :

- **Front-end :** React 18, Vite, Tailwind CSS, Lucide Icons, Recharts, Motion.
- **Back-end :** Express.js avec support complet des transactions, système de permissions de niveau 3 (RBAC), et logs d'audit.
- **Persistance :** PostgreSQL relationnel de niveau production géré via Prisma.
- **Aide au diagnostic par IA :** NON activée. Le composant `AIDiagnosisPanel` existe mais n'est branché à aucun écran et la route `/api/ai/diagnose` n'est pas implémentée. À décider séparément (les données patients ne doivent pas être envoyées à un service cloud sans cadre juridique).

---

## 🔒 Sécurité

- **Aucun secret n'est versionné.** Le fichier `.gitignore` exclut `.env`, `.env.*`, `node_modules/`, etc.
- **Le fichier `.env.example`** est fourni comme modèle (valeurs fictives uniquement).
- **Pour la production :** copiez `.env.example` vers `.env.production` et remplissez toutes les valeurs avec des secrets forts :

  ```bash
  openssl rand -hex 48    # génère un secret de 96 caractères (JWT_SECRET, etc.)
  ```

- **`JWT_SECRET` obligatoire :** 64 caractères minimum. Le serveur refuse de démarrer en production sans lui.
- **`ADMIN_PASSWORD` :** 12 caractères minimum requis.
- **Comptes de démonstration désactivés en production** (voir section dédiée ci-dessous).
- **HTTPS activé** via `enable-https.sh` (Let's Encrypt) + Nginx.
- **Protection anti-force brute** sur `/api/auth/login` (directive `limit_req` Nginx).
- **En-têtes OWASP** configurés (X-Frame-Options, X-Content-Type-Options, etc.).

> ⚠️ **Si vous récupérez ce dépôt après une fuite potentielle de secrets** : changez immédiatement `POSTGRES_PASSWORD`, `JWT_SECRET`, `ADMIN_PASSWORD` et toute clé API (Gemini, etc.), puis redémarrez les services.

---

## ⚙️ Checklist d'Administration & Déploiement

Toutes les demandes de finalisation de **Dr. Adama SANGARÉ** ont été intégrées sans exception :

1. **Erreurs API :**
   - Correction définitive de l'erreur `Unexpected token '<'` : un intercepteur d'API global (`app.all("/api/*", ...)`) a été intégré dans `/server.ts` pour empêcher tout fallback HTML en cas de requête non-existante ou malformée. Les requêtes erronées renvoient désormais des réponses JSON propres en statut `404`.
   - Tous les boutons "Enregistrer" de l'interface d'administration ont été vérifiés.
2. **Scripts SQL d'Initialisation et de Test fournis :**
   - **`scripts/init.sql`** : génération complète de toutes les tables, index de performance, types ENUM, et clés étrangères reproduisant fidèlement le schéma de production relationnel.
   - **`scripts/seed.sql`** : script d'injection SQL complet comprenant des données pré-configurées (Clinique centrale, tarifs d'admissions, analyses médicales types, lots de pharmacie avec dates de péremption, et patients tests).
3. **Configurations d'Environnement Multi-Milieux :**
   - Fourniture d'un fichier **`.env.example`** servant de modèle.
   - Pour la production, copiez-le vers **`.env.production`** et remplissez toutes les valeurs avec des secrets forts (`openssl rand -hex 48`).
   - ⚠️ **Ne versionnez jamais** `.env` ni `.env.production` (déjà exclus par `.gitignore`).
4. **PM2 & Orchestration de Processus Industrielle :**
   - Création de **`ecosystem.config.js`** pré-paramétré pour orchestrer et surveiller l'application clinique sous Ubuntu de manière clusterisée (Zéro Downtime Reload, auto-restructuration mémoire de 1G max, configurations d'environnement production chargées directement).
5. **Nginx & Reverse Proxy Sécurisé :**
   - Configuration réseau complète sous `/nginx.conf` intégrant :
     - Redirections forcées HTTP → HTTPS.
     - En-têtes de sécurité OWASP (X-Frame-Options, X-Content-Type-Options, etc.).
     - Protection intégrée contre les attaques par force brute (directives `limit_req` sur la route `/api/auth/login`).
     - Configuration du reverse proxy pour le port interne `3000`.

---

## 📁 Structure du Projet

```
.
├── src/                        # Frontend React (composants, vues, utils)
│   ├── components/             # Composants UI (Dashboard, Patients, Labo, etc.)
│   ├── utils/                  # RBAC, export, realtime
│   ├── assets/images/          # Images des maquettes
│   ├── App.tsx
│   └── main.tsx
├── server/                     # Backend Express
│   ├── auth.ts                 # Authentification (JWT)
│   └── db.ts                   # Connexion Prisma
├── server.ts                   # Point d'entrée serveur (API, intercepteur /api/*)
├── prisma/                     # Schéma et migrations PostgreSQL
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── scripts/                    # Scripts SQL + backup + watchdog
│   ├── init.sql
│   ├── seed.sql
│   ├── backup.sh
│   └── postgres-watchdog.sh
├── public/                     # Assets statiques (service worker PWA)
├── docs/                       # Documentation de production
├── Dockerfile                  # Image Docker de l'application
├── docker-compose.yml          # Orchestration Docker (app + PostgreSQL)
├── nginx.conf                  # Configuration Nginx (HTTP + HTTPS)
├── nginx-https.conf.template   # Template HTTPS Let's Encrypt
├── ecosystem.config.js         # Configuration PM2
├── install-ubuntu.sh           # Script d'installation serveur Ubuntu
├── enable-https.sh             # Activation HTTPS Let's Encrypt
└── entrypoint.sh               # Point d'entrée Docker
```

---

## 🔑 Comptes de démonstration (DÉVELOPPEMENT UNIQUEMENT)

> **⚠️ Ces comptes sont désactivés en production.**
> En local, définir `ALLOW_DEMO_ACCOUNTS=true` pour les recréer ; les boutons de connexion rapide n'existent qu'en `npm run dev`.

Pour faciliter la validation des 10 différents rôles d'utilisateurs requis par la direction générale, des boutons à clic rapide ont été rajoutés sur l'écran d'accueil pour s'authentifier instantanément avec les profils suivants :

| Rôle Clinique | Identifiant | Mot de passe de Test | Département Associé |
| :--- | :--- | :--- | :--- |
| **Promoteur / DG** | `promoteur_dg` | `DGPassword2026!` | Direction Générale |
| **Administrateur IT** | `admin` | `AdminPassword2026!` | Direction Générale |
| **Médecin Référent** | `dr_sangare` | `DoctorPassword2026!` | Médecine Générale |
| **Infirmier Major** | `infirmier_test` | `InfirmierPassword2026!` | Médecine Générale |
| **Aide-Soignant** | `aide_soignant_test` | `AideSoignantPassword2026!` | Médecine Générale |
| **Stagiaire Médical** | `stagiaire_test` | `StagiairePassword2026!` | Médecine Générale |
| **Laborantin Biologiste** | `laborantin_test` | `LaborantinPassword2026!` | Laboratoire |
| **Pharmacienne Chef** | `pharmacien_test` | `PharmacienPassword2026!` | Pharmacie |
| **Caissier Principal** | `caissier_test` | `CaissierPassword2026!` | Facturation & Caisse |
| **Responsable RH** | `rh_test` | `RHPassword2026!` | Direction Générale |

---

## 🛠️ Commandes pour Démarrer en Développement

```bash
# 1. Installer les dépendances du projet
npm install

# 2. Lancer l'application en mode développement (Recharge automatique de l'API / Assets)
npm run dev
```

---

## 📦 Déploiement (Ubuntu 24.04+ LTS, Docker Compose)

```bash
./install-ubuntu.sh                                    # Docker + pare-feu + .env + démarrage + sauvegarde quotidienne
./enable-https.sh clinique.exemple.ml moi@exemple.ml   # HTTPS Let's Encrypt (domaine requis)
sudo docker compose logs -f medishahel-app             # suivi
curl http://localhost/api/health                       # état (base de données jointe)
```

Modèle de vente recommandé : **une installation (un serveur) par clinique**. L'isolation entre cliniques au sein d'une même base n'est pas garantie par le code actuel.

---

## 📞 Support & Contacts de Secours
Adama SANGARE tél : +223 73 65 14 67
Pour tout dysfonctionnement, support, ou accompagnement en direct le jour de la mise en production :

- **Email Support :** `dmsangare@gmail.com`
- **Assistance Informatique Clinique :** Réseau de communication sécurisé d'Astreinte (MédiSahel).
- **Gravités de sévérité de niveau 1 :** Garantie de Temps de Rétablissement (GTR) de **2 heures**.

---

## 📄 Licence

Ce projet est **propriétaire**. Tous droits réservés à **MédiSahel** et au **Ing Adama SANGARÉ**.

Aucune reproduction, distribution ou utilisation commerciale sans autorisation écrite préalable.
