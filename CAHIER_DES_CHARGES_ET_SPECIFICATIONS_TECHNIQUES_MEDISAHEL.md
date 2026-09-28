# CAHIER DES CHARGES & DOCUMENTATION TECHNIQUE INTÉGRALE
## MÉDISAHEL CLINIQUE BAMAKO V2 – SYSTÈME D'INFORMATION HOSPITALIER (HIS)

**Auteur & Architecte Référent :** Direction de l'Ingénierie Clinique & Système MédiSahel  
**Promoteur :** M. Adama SANGARÉ  
**Version Système :** 2.0.0 (Prêt pour Déploiement Production)  
**Date d'homologation :** 2026  
**Établissement cible :** Clinique Sahel Bamako & Réseau Hospitalier Malien / UEMOA  

---

## 1. VISION STRATÉGIQUE & OBJECTIFS MÉTIERS

### 1.1. Contexte & Problématique
Le projet **MédiSahel** est un Système d'Information Sanitaire Intégré (**HIS - Hospital Information System / DME - Dossier Médical Électronique**) conçu sur mesure pour répondre aux exigences médico-économiques, réglementaires et organisationnelles des cliniques privées, cabinets médicaux et centres médico-chirurgicaux en République du Mali et dans l'espace UEMOA/Sahélien.

### 1.2. Piliers Fondamentaux du Système
1. **Zéro Papier & Dossier Unique Permanent :** Chaque patient dispose d'un Identifiant Permanent Patient (IPP) unique centralisant son historique à vie.
2. **Cloisonnement Économique & Zéro Fraude :** Séparation stricte des pouvoirs (le clinicien prescrit, le caissier encaisse, le pharmacien stocke, le laborantin analyse).
3. **Workflow Bloquant Anti-Impayés :** Aucun examen de biologie ou acte de soins n'est réalisable sans encaissement préalable à la caisse centrale, sauf déclaration d'urgence vitale tracée.
4. **Traçabilité Médico-Légale Immuable :** Chaque clic, consultation, modification de diagnostic ou encaissement est consigné avec Horodatage, Utilisateur, Rôle, IP, Poste, Ancienne valeur et Nouvelle valeur.
5. **Conformité Réglementaire Malienne :** Prise en charge native de l'**AMO (CANAM)**, de l'**INPS**, des mutuelles privées, et génération des fiches de déclaration sanitaire obligatoire (**SNIS / MDO**).

---

## 2. ARCHITECTURE TECHNIQUE & STACK TECHNOLOGIQUE

### 2.1. Vue d'Ensemble de l'Infrastructure
Le système est architecturé en **Full-Stack unifié haute performance**, packagé pour une robustesse maximale sur environnement Linux Ubuntu LTS avec conteneurisation Docker ou exécution managée PM2.

```
┌────────────────────────────────────────────────────────────────────────┐
│                          NAVIGATEURS CLIENTS                           │
│     Postes Praticiens / Guichets Caisses / Tablettes Infirmières       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTPS (Port 443) / WSS / SSE
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    REVERSE PROXY NGINX (SSL / Gzip)                    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Proxy Pass (Port 3000)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     SERVEUR D'APPLICATION NODE.JS                      │
│  - Express REST API (6 200+ lignes de logique métier médicale)          │
│  - Middleware Sécurité JWT + RBAC Granulaire                          │
│  - Pipeline Server-Sent Events (SSE) pour synchronisation temps réel   │
│  - Concurrency Lock Manager (Verrouillage simultané des dossiers)     │
│  - Moteur de Déstockage FEFO & Calculateur de Prise en Charge AMO     │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
                    ▼                                ▼
┌───────────────────────────────────┐ ┌──────────────────────────────────┐
│   BASE DE DONNÉES POSTGRESQL 15   │ │     STOCKAGE DOCUMENTS GECD    │
│  - 24+ Modèles Relationnels       │ │  - Dossiers PDF Horodatés        │
│  - Prisma ORM & Migrations SQL    │ │  - Imagerie & Pièces d'Identité  │
│  - Sauvegardes automatisées CRON  │ │  - Signatures & Cachets Digitaux │
└───────────────────────────────────┘ └──────────────────────────────────┘
```

### 2.2. Spécifications du Stack
* **Frontend SPA :** React 18.3+, TypeScript 5.4+, Tailwind CSS v4, Motion (animations fluides), Lucide Icons, Recharts (tableaux de bord décisionnels).
* **Backend API :** Node.js 20 LTS, Express 4.19, TypeScript (exécuté via TSX en dev, compilé via esbuild en bundle CJS optimisé pour la production).
* **Base de Données :** PostgreSQL 15+ avec Prisma ORM (Prisma Client 5.14).
* **Mécanisme de Résilience (High-Availability Fallback) :** En cas d'indisponibilité momentanée ou de maintenance du serveur PostgreSQL, le serveur bascule automatiquement sur un moteur transactionnel en mémoire miroir (`memoryDb`) garantissant la continuité absolue du service sans plantage utilisateur.
* **Temps Réel :** Pipeline natif **Server-Sent Events (SSE)** avec reconnexion automatique pour la diffusion instantanée des notifications d'arrivée de patients, alertes laboratoire et messages d'urgence.
* **Sécurité & Hashage :** Mots de passe hashés avec `bcryptjs` (salt rounds 10), jetons de session signés avec `jsonwebtoken` (JWT), politique de verrouillage après tentatives infructueuses.

---

## 3. LE WORKFLOW CLINIQUE MAÎTRE (CYCLE DE SOINS EN 7 ÉTAPES)

Le fonctionnement opérationnel de la clinique suit un flux hermétique et transactionnel :

```
[1. Arrivée & Triage] ────► [2. Caisse : Paiement Consultation]
                                            │
                                            ▼
[4. Labo : Exécution] ◄──── [3. Consultation DMG (Médecin)]
       │                      - Prescrit NFS, TDR
       │                      - Statut : EN ATTENTE DE PAIEMENT
       ▼                                    │
[5. Caisse : Encaissement Examens] ◄────────┘ (Blocage absolu Labo)
       │
       ▼
[6. LabStation : Validation & Signature Biologiste]
       │
       ▼
[7. Réinjection Automatique DME & Notification Médecin]
       │
       ▼
[8. Ordonnance Médicale & Guichet Pharmacie FEFO]
```

### Étape 1 : Arrivée du Patient & Triage (Accueil / Secrétariat)
* **Recherche Globale / Création :** L'agent d'accueil recherche le patient par Nom, Téléphone ou N° IPP. Si nouveau, création du dossier avec N° National, NINA, AMO, INPS, Ethnie, Nationalité, Contact d'urgence.
* **Triage Infirmier :** Enregistrement des premières constantes vitales : Tension Artérielle (TA), Pouls, Température (°C), Saturation SpO2, Poids (kg).
* **Génération de l'Acte :** Attribution automatique d'un numéro de consultation (ex: `C-2026-00125`).

### Étape 2 : Encaissement de la Consultation (Caisse Centrale)
* Le patient est orienté vers la caisse.
* Le caissier sélectionne le ticket d'admission, applique le taux de couverture conventionnelle (ex: AMO 70%, Part Patient 30%).
* Règlement par **Espèces, Orange Money, Moov Money, Wave, Chèque ou Carte Bancaire**.
* Le système génère : Facture numérotée, Reçu de paiement et écriture au Journal de Caisse.
* **Statut :** Passe à `✅ Consultation payée`.
* **Événement Système :** Notification temps réel transmise à la file d'attente du cabinet médical.

### Étape 3 : Consultation Médicale (Module DMG - Médecine Générale)
* Le praticien ouvre sa file d'attente et clique sur le patient (verrou de concurrence activé).
* Accès unifié au **DME complet** : Antécédents médico-chirurgicaux, allergies déclarées, antécédents familiaux, constantes de triage.
* Examen clinique, saisie des observations, orientation diagnostique codifiée (CIM-10) et détection des Maladies à Déclaration Obligatoire (MDO).
* **Prescription d'Analyses Biologiques :** Le médecin sélectionne les examens (ex: NFS, TDR Paludisme, Goutte Épaisse, Glycémie).
* **Comportement Système Crucial :** La demande est enregistrée avec le statut `⏳ En attente de paiement`.
* **Règle de Cloisonnement :** Le laboratoire **ne voit pas** cette demande dans sa liste de travail. Aucun technicien ne peut prélever un examen impayé.

### Étape 4 : Retour Caisse & Règlement des Examens
* Le patient retourne au guichet de facturation.
* Le caissier visualise instantanément la ligne de prestation d'analyses en attente (montant calculé selon la nomenclature officielle).
* Encaissement et édition de la quittance d'analyses.
* Le statut bascule sur `✅ Analyses payées`.

### Étape 5 : Réception & Exécution au Laboratoire (LabStation)
* Dès validation du paiement, la demande apparaît instantanément sur la paillasse du laborantin avec signal sonore/visuel.
* Le technicien réceptionne les tubes, procède aux analyses (ou import machine) et saisit les valeurs numériques.
* Le système surligne automatiquement en rouge les valeurs pathologiques hors bornes physiologiques.
* **Validation & Signature Électronique :** Le biologiste ou médecin chef appose sa signature numérique certifiée.
* Le statut passe à `✅ Validé & Signé`.

### Étape 6 : Retour Automatique au Médecin & Intégration DME
* Dès la signature, le rapport d'analyse complet est **injecté automatiquement** dans le dossier DME du patient.
* Le médecin traitant reçoit une notification push : *« Résultats disponibles pour [Nom Patient] »*.
* Le praticien réouvre la consultation en 1 clic pour interpréter les résultats sans perte de temps.

### Étape 7 : Prescription Thérapeutique & Guichet Unique Pharmacie
* Le médecin rédige l'ordonnance médicale informatisée (médicaments, posologie, durée, précautions).
* Le patient se présente au guichet de dispensation d'officine.
* **Séparation stricte Pharmacien / Caissier :**
  - Le caissier d'officine encaisse la facture de médicaments.
  - Le moteur d'inventaire applique l'algorithme **FEFO (First Expired, First Out)** : le système déstocke automatiquement les boîtes du numéro de lot dont la date de péremption est la plus proche.
  - Impression du ticket d'officine avec QR-Code et possibilité d'envoi par SMS/WhatsApp.

---

## 4. MATRICE RBAC & SÉCURITÉ DES ACCÈS (12 RÔLES DÉFINIS)

Le système implémente une matrice de contrôle d'accès basée sur les rôles (RBAC) interdisant toute élévation de privilèges non autorisée.

| Rôle Métier | Modules Autorisés | Statut Écriture | Permissions Principales | Interdictions Strictes |
| :--- | :--- | :--- | :--- | :--- |
| **ADMINISTRATEUR IT** | Tous les modules (1 à 21) | `*:ADMIN` | Gestion des comptes, attribution des droits, configuration branding, audit système | Modification des données cliniques/diagnostics |
| **PROMOTEUR / DG** | Tous les modules (Vue Stratégique) | `ACTIVE` (Supervision) | Audit d'activité, KPIs financiers, clôtures de caisse, validation générale | Pratique d'actes médicaux directs |
| **MÉDECIN CHEF** | DME, DMG, Hospitalisation, Labo, Urgences, GECD, Agenda | `ACTIVE` | Direction clinique, prescriptions tous niveaux, validation biologique, avis d'admission | Écritures comptables directes de caisse |
| **MÉDECIN** | DME, DMG, Hospitalisation, Agenda, Téléconsultation, GECD | `ACTIVE` | Consultations, diagnostics, prescriptions labo et pharmacie, certificats | Encaissement d'argent, gestion des stocks |
| **INFIRMIER** | Patients, Hospitalisation, DMG (Soins délégués), Agenda | `ACTIVE` | Saisie constantes de tri, administration des soins, cahier de transmission | Prescription autonome d'ordonnance |
| **AIDE-SOIGNANT** | Patients (Accueil), Hospitalisation (Chambres) | `READ_ONLY` / Saisie partielle | Surveillance du confort, saisie de température, hygiène | Administration médicamenteuse, signature |
| **LABORANTIN** | Station Laboratoire (LabStation), GECD | `ACTIVE` | Réception échantillons, saisie valeurs d'analyses, validation technique | Altération de la prescription médicale initiale |
| **PHARMACIEN** | Gestion des Stocks, Lots FEFO, Fournisseurs, Alertes | `ACTIVE` | Réceptions de commandes, gestion du dépôt, inventaires physiques | Vente et encaissement d'espèces (rôle caissier) |
| **CAISSIER** | Facturation Centrale, Vente Pharmacie Guichet, Quittances | `ACTIVE` | Encaissement de tous les actes, édition factures, clôture journalière | Accès aux détails cliniques intimes du DME |
| **COMPTABLE** | Facturation, Rapports de Caisse, Grands Livres, Export | `ACTIVE` | Rapprochement bancaire, audit comptable, déclarations fiscales | Modification des prescriptions médicales |
| **RH** | Pointage Présences, Gestion Paie, Bulletins, Contrats | `ACTIVE` | Gestion des effectifs, pointage horaire, calcul des salaires nets | Consultation des dossiers médicaux du personnel |
| **ARCHIVISTE** | GECD (Gestion Documentaire), Registres Patients | `ACTIVE` | Numérisation, indexation documentaire, recherche d'archives | Modification des montants financiers |

---

## 5. TRAÇABILITÉ MÉDICO-LÉGALE & REGISTRE D'AUDIT COMPLET

Conformément aux normes internationales et aux exigences médico-légales de la République du Mali, toute transaction logicielle est tracée de manière inaltérable :

### 5.1. Spécification du Journal d'Audit (`AuditLog`)
Pour chaque action dans le système, le serveur capture et persiste automatiquement :
1. **Identité de l'auteur :** `userId`, `userName`, `userRole`.
2. **Horodatage à la milliseconde :** `timestamp` (ISO 8601).
3. **Origine réseau & poste physique :** `ipAddress` (IPv4/IPv6), `userAgent` (navigateur et poste de travail).
4. **Nature de l'opération :** `action` (`CREATE`, `UPDATE`, `DELETE`, `LOGIN`, `EXPORT`, `SIGN`, `PAY`).
5. **Différentiel d'intégrité :** `previousContent` vs `newContent` (permettant la reconstitution exacte de l'état antérieur en cas de litige judiciaire).

### 5.2. Verrou de Concurrence de Dossier (`activeDossierLocks`)
Pour éviter l'écrasement simultané d'un dossier patient par deux soignants :
* L'ouverture d'une consultation active pose un verrou temporaire associé au médecin consultant.
* Si un second intervenant tente d'ouvrir le dossier en modification, le système affiche une alerte prévenant que le dossier est en cours d'édition par le Dr. X, tout en autorisant une consultation en lecture seule.

---

## 6. DÉTAIL DES 21 MODULES FONCTIONNELS DE MÉDISAHEL V2

### Module 1 : Dashboard Décisionnel (Praticien & Direction)
* Indicateurs clés en temps réel : Consultations du jour, Taux d'occupation des lits, Recettes globales par mode de paiement, Alertes de stocks critiques.
* Graphiques de fréquentation hebdomadaire et mensuelle.
* Raccourcis d'accès rapide aux actions prioritaires.

### Module 2 : Gestion des Patients & Admissions
* Création et gestion de l'Identifiant Permanent Patient (IPP).
* Formulaire d'admission avec Triage Vital (TA, Pouls, Température, Poids, Glycémie capillaire, SpO2).
* Gestion des couvertures sociales : AMO (CANAM), INPS, Assurances privées (NSIA, Sunu, Allianz, etc.) avec taux de prise en charge et matricule d'assuré.

### Module 3 : Dossier Médical Électronique (DME)
* Vue chronologique 360° du patient.
* Antécédents personnels, familiaux, chirurgicaux, gynéco-obstétricaux.
* Répertoire des allergies avec alertes visuelles clignotantes en cas de contre-indication.
* Historique consolidé des consultations, bilans de laboratoire, ordonnances et séjours hospitaliers.

### Module 4 : Consultation de Médecine Générale (DMG)
* Espace de travail ergonomique pour le médecin.
* Bibliothèque de modèles médicaux et raccourcis textuels pour une saisie rapide des comptes-rendus.
* Diagnostic codifié et module d'aide au diagnostic différentiel.
* Prescription électronique d'analyses biomédicales (avec verrou d'impayé automatique).
* Prescription thérapeutique d'ordonnances avec posologie structurée.

### Module 5 : Station de Laboratoire & Biologie Médicale (LabStation)
* Réception des demandes d'analyses après acquittement à la caisse.
* Gestion des paillasses : Hématologie (NFS), Parasitologie (TDR, Goutte Épaisse), Biochimie (Glycémie, Créatinine, Urée, Transaminases), Sérologie (VIH, Hépatites, Widal).
* Saisie assistée avec bornes de normalité selon l'âge et le sexe du patient.
* Signature électronique certifiée et injection instantanée dans le DME.

### Module 6 : Guichet Unique de Vente Pharmacie
* Encaissement des ordonnances médicales et ventes comptoir sans ordonnance.
* Application automatique de la prise en charge tiers-payant (AMO/Assurance).
* Sortie de stock automatisée selon la règle FEFO (premier périmé, premier sorti).
* Impression de tickets de caisse thermique (format 80mm) et bordereaux A4 avec QR Code.

### Module 7 : Gestion des Stocks Pharmacie & Dépôt Central
* Référentiel complet des médicaments par DCI (Dénomination Commune Internationale) et Nom Commercial.
* Suivi fin par numéro de lot et date d'expiration.
* Alertes automatiques : Rupture imminente, Seuil de sécurité franchi, Périmés à 30/60/90 jours.
* Gestion des transferts Dépôt Central ➔ Pharmacie d'officine avec bons de transfert signés.
* Module d'inventaire physique périodique avec calcul automatique des écarts et justification des pertes.

### Module 8 : Hospitalisation & Gestion des Lits
* Plan interactif de la clinique (Chambres Privées, Salles Communes, Soins Intensifs).
* Suivi des statuts de lits en direct : `Disponible`, `Occupé`, `En Nettoyage`, `En Maintenance`.
* Admission, transfert de lit à lit avec historisation, et formalités de sortie.
* Facturation journalière automatique des frais d'hôtellerie hospitalière.

### Module 9 : Unité de Soins Infirmiers & Soins Délégués
* Plan de soins informatisé prescrit par le corps médical (injections, perfusions, pansements, surveillance).
* Feuille de surveillance et d'administration horodatée des traitements.
* Cahier de transmission inter-équipes (Matin / Après-midi / Nuit) et journal de la main courante.

### Module 10 : Facturation Centrale & Gestion de Caisse
* Émission de factures proforma, factures définitives et quittances de règlement.
* Gestion multidevises et modes de paiement sahéliens (Espèces FCFA, Orange Money, Moov Money, Wave, Chèques).
* Clôture journalière de caisse avec état de caisse physique vs théorique et signature de l'agent.
* Historique inaltérable de tous les flux financiers.

### Module 11 : Gestion des Mutuelles & Assurances (Tiers-Payant)
* Barèmes configurables des organismes payeurs (AMO Malienne, INPS, Assurances d'entreprises).
* Génération des bordereaux de télétransmission et états récapitulatifs mensuels pour remboursement.
* Suivi des créances en attente et lettrage des encaissements d'organismes.

### Module 12 : Téléconsultation Médicale
* Module de consultation à distance sécurisé.
* Prise de notes en direct, partage de documents et délivrance d'ordonnance numérique certifiée.

### Module 13 : Agenda Clinique & Prise de Rendez-Vous
* Planning dynamique partagé par praticien et par spécialité.
* Gestion des statuts de rendez-vous (`Confirmé`, `En attente`, `Effectué`, `Annulé`).
* Module d'envoi automatique de rappels aux patients.

### Module 14 : Gestion Électronique des Courriers & Documents (GECD)
* Numérisation, téléversement et indexation de pièces jointes (comptes-rendus externes, imagerie médicale, pièces d'identité).
* Génération automatique de courriers de liaison, lettres d'orientation vers les spécialistes et certificats médicaux officiels.
* Coffre-fort documentaire sécurisé.

### Module 15 : Ressources Humaines (RH) & Pointage des Présences
* Registre des collaborateurs (médecins vacataires, salariés fixes, infirmiers, administratifs).
* Système de badgeuse virtuelle pour le pointage des arrivées/départs avec calcul automatique des heures ouvrées et des retards.
* Gestion des plannings de garde et des demandes de congés.

### Module 16 : Gestion de la Paie du Personnel
* Fiches de paie mensuelles automatisées.
* Calcul des salaires de base, primes de garde, indemnités et déductions légales (INPS, ITS).
* Génération de bulletins de salaire imprimables et exportables en PDF.

### Module 17 : Modules Médicaux Spécialisés
* **Maternité & Gynéco-Obstétrique :** Suivi de grossesse, consultations prénatales (CPN), partogramme informatisé.
* **Pédiatrie :** Courbes de croissance (Poids/Taille/Âge OMS), calendrier vaccinal PEV du Mali.
* **Ophtalmologie :** Réfraction, acuité visuelle, tonus oculaire.
* **Chirurgie & Bloc Opératoire :** Compte-rendu opératoire, fiche d'anesthésie, check-list de sécurité.

### Module 18 : Administration des Utilisateurs & Habilitations RBAC
* Création, modification et désactivation des comptes d'accès.
* Attribution fine des profils et des modules visibles/actifs par utilisateur.
* Politique de sécurité renforcée (changement obligatoire du mot de passe initial, expiration de session).

### Module 19 : Paramètres & Image de Marque (Branding)
* Personnalisation institutionnelle de la clinique : Dénomination légale, Logo haute définition, Slogan.
* Coordonnées complètes (Adresse, Bamako, Téléphone, WhatsApp officiel, RCCM, NIF/IFU, N° d'Agrément ministériel).
* Configuration du cachet numérique officiel et de la signature institutionnelle imprimés sur les ordonnances et quittances.
* Palette de couleurs de l'établissement (Vert Médical #0f766e, etc.).

### Module 20 : Registre d'Audit & Sécurité Système
* Console de surveillance en temps réel des accès et des actions critiques.
* Liste des sessions actives avec déconnexion forcée possible par l'administrateur.
* Consultation détaillée des journaux d'événements avec filtres multicritères.

### Module 21 : Rapports Sanitaires Officiels (SNIS, INPS, CANAM & MDO)
* Agrégation automatique des données épidémiologiques et statistiques sanitaires.
* Rapport mensuel d'activité conforme au Système National d'Information Sanitaire (**SNIS Mali**).
* Déclaration immédiate des Maladies à Déclaration Obligatoire (**MDO** : Fièvre jaune, Rougeole, Méningite, Choléra, etc.).
* Bordereaux statistiques pour la CANAM et l'INPS.

---

## 7. MODÈLE DE DONNÉES RELATIONNEL (POSTGRESQL / PRISMA)

Le schéma Prisma (`prisma/schema.prisma`) comprend 24 tables hautement normalisées :

1. **`Clinic` :** Données institutionnelles, identifiants fiscaux, logos, cachet, palette graphique, paramètres régionaux.
2. **`User` :** Comptes personnels, hash de mot de passe, rôle RBAC, rattachement clinique, statut.
3. **`Patient` :** Identité complète du patient, IPP, NINA, AMO, INPS, groupe sanguin, allergies, ethnie, contacts.
4. **`MedicalRecord` :** Fiches de consultation médicale, symptômes, examen clinique, diagnostic, prescription.
5. **`Hospitalization` :** Séjours cliniques, motif d'admission, dates d'entrée/sortie, chambre, lit, tarification.
6. **`Room` & `Bed` :** Inventaire physique des chambres et des lits avec capacités, types et statuts d'occupation.
7. **`BedHistory` & `TransferLog` :** Traçabilité historique complète des mouvements de lits des patients.
8. **`Transaction` :** Lignes de facturation et quittances de paiement, montants, modes de règlement, statuts.
9. **`LabTest` :** Demandes et résultats d'analyses de laboratoire, catégories, prescripteur, technicien, statuts.
10. **`PharmacyProduct` :** Référentiel des spécialités pharmaceutiques, DCI, forme, prix d'achat, prix de vente, seuils.
11. **`PharmacyLot` :** Lots de médicaments avec dates de péremption, stocks en dépôt et stocks en officine (FEFO).
12. **`PharmacySale` :** Actes de vente d'officine avec détails des articles déstockés, quittances et identité du caissier.
13. **`PharmacyPrescription` :** Ordonnances d'officine en attente de dispensation.
14. **`PharmacyTransfer` & `PharmacyAdjustment` :** Mouvements de stock internes et procès-verbaux d'ajustements/pertes.
15. **`PharmacySupplier` :** Répertoire des grossistes répartiteurs et fournisseurs pharmaceutiques.
16. **`DmgStaff` & `DmgGuardPlanning` :** Organisation des équipes médicales et plannings de garde.
17. **`DmgDelegatedCare` :** Prescriptions d'actes de soins infirmiers délégués avec suivi de l'exécution.
18. **`DmgShiftHandover` :** Cahier de transmission formel entre les relèves infirmières.
19. **`ClinicalVersion` :** Historisation et versioning légal de toute modification sur un document médical.
20. **`MedicalLibraryItem` :** Raccourcis de texte et protocoles thérapeutiques préconfigurés.
21. **`Document` :** Indexation des fichiers dématérialisés du module GECD.
22. **`AuditLog` :** Registre de sécurité inaltérable de tous les événements système.
23. **`Attendance` :** Enregistrements quotidiens de pointage du personnel soignant et administratif.
24. **`Payroll` :** Bulletins de paie mensuels consolidés avec salaires de base, primes, retenues et net à payer.

---

## 8. RÈGLE ERGONOMIQUE "TOUT EST CLIQUABLE"

L'interface utilisateur de MédiSahel obéit à la règle de **traçabilité visuelle immédiate** :
* Un clic sur un **Nom de Patient** n'importe où dans le logiciel ouvre instantanément son **DME complet**.
* Un clic sur un **Numéro de Consultation** ouvre le compte-rendu médical original.
* Un clic sur une **Ligne d'Analyse** ouvre le bulletin de laboratoire signé avec ses valeurs de référence.
* Un clic sur un **Numéro de Facture** ouvre le bordereau de facturation officiel imprimable.
* Un clic sur un **Numéro de Reçu** affiche la quittance de caisse détaillée avec le cachet numérique.
* Un clic sur un **Numéro de Lit** ouvre la fiche clinique de suivi du séjour hospitalier.

---

## 9. GUIDE DE DÉPLOIEMENT & EXPLOITATION EN PRODUCTION

Le système dispose d'une configuration prête à l'emploi pour les serveurs Linux Ubuntu 22.04 / 24.04 LTS.

### 9.1. Méthode 1 : Déploiement Conteneurisé Docker (Recommandé)
Le fichier `docker-compose.yml` orchestre l'ensemble de la pile :
```bash
# 1. Cloner le projet sur le serveur
cd /opt/medisahel

# 2. Configurer les variables d'environnement
cp .env.example .env

# 3. Lancer l'infrastructure en tâche de fond
sudo docker compose up -d --build
```
* **Conteneurs inclus :**
  - `postgres` (Base de données persistée sur volume Docker sécurisé).
  - `app` (Serveur Node.js Full-Stack avec build Vite de production).
  - `nginx-proxy` (Passerelle Web avec gestion SSL Let's Encrypt).

### 9.2. Méthode 2 : Déploiement Natif avec PM2 & Nginx
```bash
# 1. Installation des dépendances et compilation
npm install
npm run build

# 2. Exécution des migrations Prisma
npx prisma migrate deploy
npx prisma db seed

# 3. Démarrage managé avec PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### 9.3. Sauvegardes Automatisées
Un script de sauvegarde quotidien de la base PostgreSQL est programmé via `cron` vers `/opt/medisahel/backups` avec rotation sur 30 jours et possibilité de réplication distante.

---

## 10. COMPTES D'ACCÈS INITIAUX & ENVIRONNEMENT DE TEST

Lors du premier déploiement, la base de données est initialisée avec les accès suivants :

### 10.1. Compte Administrateur Système (IT & Paramétrage)
* **Identifiant :** `admin` (ou `admin@medisahel.ml`)
* **Mot de passe initial :** `AdminPassword2026!`
* **Habilitation :** Accès intégral à tous les modules techniques, au Registre d'Audit et à la configuration institutionnelle.

### 10.2. Compte Direction Générale / Promoteur
* **Identifiant :** `promoteur_dg` (ou `promoteur_dg@medisahel.ml`)
* **Mot de passe initial :** `DGPassword2026!`
* **Habilitation :** Supervision stratégique, consultation des bilans financiers consolidés et gouvernance clinique.

---

## 11. CONCLUSION & HOMOLOGATION POUR DÉLÉGATION À TOUTE IA

Le présent cahier des charges et descriptif technique synthétise **l'intégralité du travail réalisé sur MédiSahel Clinique Bamako V2**.  
Tout ingénieur logiciel ou tout agent d'intelligence artificielle recevant ce document dispose de **la totalité des spécifications fonctionnelles, de la cartographie des données, des règles de sécurité hermétiques et des protocoles de déploiement** nécessaires pour reproduire, maintenir ou faire évoluer ce Système d'Information Hospitalier de grade production.
