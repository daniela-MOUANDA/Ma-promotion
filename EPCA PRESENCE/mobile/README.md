# EPCA Enseignants (Flutter)

Application mobile des enseignants : accueil avec logo, connexion, classes par catégorie, appel et consultation de l’emploi du temps.

## Comptes de démonstration

| E-mail | Mot de passe | Classes |
| --- | --- | --- |
| `s.mba@epca.ga` | `epca2026` | B1 Douanes, A2 Impôts |
| `p.ogandaga@epca.ga` | `epca2026` | B1 Douanes, B2 Administration |

## Lancer sur votre téléphone Android

1. Activez **Options pour les développeurs** puis **Débogage USB**.
2. Branchez le téléphone (câble USB) et acceptez l’invite « Autoriser le débogage USB ».
3. Dans PowerShell, depuis ce dossier :

```powershell
.\run-on-phone.ps1
```

Ou manuellement :

```powershell
$env:JAVA_HOME = "C:\Program Files\Microsoft\jdk-17.0.20.101-hotspot"
$env:ANDROID_HOME = "C:\Users\LENOVO\sdk\android"
$env:PATH = "C:\Users\LENOVO\sdk\flutter\bin;$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:PATH"
cd "C:\Users\LENOVO\Downloads\EPCA PRESENCE\mobile"
adb devices
flutter run
```

Hot reload : une fois l’app lancée, appuyez sur `r` dans le terminal. `R` relance complètement.

## Écrans

- **Accueil** : logo EPCA
- **Connexion** : e-mail + mot de passe
- **Classes** : groupées par catégorie (B1, A2, …), avec filière et salle
- **Appel** : Présent / Absent / Retard / Excusé, puis enregistrement
- **Emploi du temps** : vos heures (jour, créneau, salle, module) + grille complète d’une classe
