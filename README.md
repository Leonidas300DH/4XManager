# 🚀 4XManager - Gestionnaire Space Empires 4X

![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7.2-646CFF?logo=vite&logoColor=white)
![Vercel](https://img.shields.io/badge/Deployed-Vercel-000000?logo=vercel&logoColor=white)

**Application web de suivi pour le jeu de plateau [Space Empires 4X](https://www.gmtgames.com/p-512-space-empires-4x-4th-printing.aspx)**

Automatise la gestion économique complexe et le suivi des flottes pour vous permettre de vous concentrer sur la stratégie !

🌐 **[Accéder à l'application](https://manager4x.vercel.app)**

---

## ✨ Fonctionnalités

### 📊 Gestion Économique
- Suivi des ressources : **CP** (Points de Construction), **RP** (Points de Recherche), **LP** (Points Logistiques), **TP** (Points Temporels)
- Phases économiques multi-tours avec propagation réactive
- Calcul automatique de la maintenance et des pénalités

### 🔬 Technologies
- Arbre technologique complet avec héritage dynamique
- Badges de recherche et niveaux par catégorie
- Modernisation automatique des unités de construction

### 🪐 Planètes & Colonies
- Gestion du Homeworld et des colonies
- Croissance de population et niveaux CP
- Construction de facilités (Industrielles, Logistiques, Recherche, Temporelles)

### ⚔️ Gestion de Flotte
- Suivi des groupes de vaisseaux avec illustrations dynamiques
- Système d'upgrade togglable pour les vaisseaux spatiaux
- Calculs de mouvement et bonus de vitesse (Fast Tech)
- Support spécialisé : Fighters (F), Carriers (CV/BV), Battlecruisers (BC)

### 📓 Journal de Bord
- Historique chronologique de toutes les actions
- Commentaires éditables par tour pour le journaling stratégique

### 📈 Tableau de Bord
- Vue d'ensemble tactique de l'empire
- Registre planétaire et aperçu de l'Amirauté
- Briefing technique des recherches acquises

### ⚙️ Paramètres
- Personnalisation des couleurs de ressources (CSS variables)
- Export/Import JSON pour sauvegarde et synchronisation multi-appareils
- Persistance automatique via LocalStorage

---

## 🛠️ Stack Technique

| Technologie | Version | Rôle |
|-------------|---------|------|
| React | 19.2.0 | Framework UI |
| TypeScript | 5.9.3 | Typage statique |
| Vite | 7.2.4 | Build tool & dev server |
| CSS | - | Styling composant par composant |
| Vercel | - | Hébergement & CI/CD |

---

## 📁 Structure du Projet

```
4XManager/
├── public/
│   └── images/
│       ├── planets/     # Illustrations des planètes
│       └── ships/       # Illustrations des vaisseaux
├── src/
│   ├── components/      # Composants React
│   │   ├── Cell.tsx
│   │   ├── ConfirmModal.tsx
│   │   ├── DashboardTab.tsx
│   │   ├── EconomyGrid.tsx
│   │   ├── FleetTab.tsx
│   │   ├── HudOverlay.tsx
│   │   ├── LogTab.tsx
│   │   ├── PlanetsTab.tsx
│   │   ├── ResearchTab.tsx
│   │   └── SettingsModal.tsx
│   ├── data/            # Définitions statiques
│   │   ├── shipDefinitions.ts
│   │   └── technologies.ts
│   ├── types/           # Types TypeScript
│   ├── utils/           # Utilitaires
│   │   └── calculations.ts  # Moteur de calcul réactif
│   ├── App.tsx          # Composant principal
│   └── main.tsx         # Point d'entrée
└── package.json
```

---

## 🚀 Installation & Développement

### Prérequis
- **Node.js** 18+ recommandé
- **npm** ou **yarn**

### Installation

```bash
# Cloner le repository
git clone https://github.com/Leonidas300DH/4XManager.git
cd 4XManager

# Installer les dépendances
npm install
```

### Développement

```bash
# Lancer le serveur de développement
npm run dev
```

L'application sera accessible sur `http://localhost:5173`

### Build Production

```bash
# Compiler pour la production
npm run build

# Prévisualiser le build
npm run preview
```

---

## 📦 Déploiement

L'application est automatiquement déployée sur **Vercel** à chaque push sur la branche principale.

### Déploiement Manuel

```bash
# Installer Vercel CLI (si nécessaire)
npm install -g vercel

# Déployer
vercel --prod
```

---

## 🎮 Philosophie de Design

### Propagation Réactive
Toute modification au Tour N met automatiquement à jour tous les tours suivants (N+1, N+2, etc.)

### Verrouillage Séquentiel
Les tours précédant le dernier sont en lecture seule pour protéger l'intégrité historique

### État Dérivé
Les valeurs UI (stats d'unités upgradées) sont dérivées du pic technologique global, pas stockées en état redondant

### Immutabilité
Le moteur de calcul utilise le clonage profond pour éviter la corruption d'état React

---

## 📄 Licence

Ce projet est développé à des fins personnelles pour accompagner les parties de Space Empires 4X.

---

## 🙏 Crédits

- **GMT Games** pour l'excellent jeu de plateau [Space Empires 4X](https://www.gmtgames.com/)
- Développé avec ❤️ par **Antigravity**

---

*Bon jeu et que votre empire prospère dans les étoiles !* 🌌
