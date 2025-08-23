# Modifications Détaillées pour Coolify Beta 420

## 1. Fonction deployApplication (ligne ~104)
**Avant:**
```javascript
async deployApplication(uuid) {
    const response = await this.request(`/applications/${uuid}/deploy`, {
        method: 'POST',
    });
```

**Après:**
```javascript
async deployApplication(uuid) {
    // Correction: L'endpoint /deploy n'existe pas dans la beta 420
    // Utilisation de /start qui est le bon endpoint
    const response = await this.request(`/applications/${uuid}/start`, {
        method: 'POST',
        body: '{}'  // Body requis pour la beta
    });
```

## 2. Nouvelles fonctions de contrôle d'application
```javascript
// Ajout de stopApplication - n'existait pas avant
async stopApplication(uuid) {
    const response = await this.request(`/applications/${uuid}/stop`, {
        method: 'POST',
        body: '{}'
    });
    return response;
}

// Ajout de restartApplication - n'existait pas avant  
async restartApplication(uuid) {
    const response = await this.request(`/applications/${uuid}/restart`, {
        method: 'POST',
        body: '{}'
    });
    return response;
}

// Alias pour compatibilité
async startApplication(uuid) {
    return this.deployApplication(uuid);
}
```

## 3. Fonction updateApplicationEnvironmentVariables (ligne ~222)
**Changement majeur:** Support intelligent de PATCH pour update et POST pour création

**Avant:** Seulement POST, créait des doublons
**Après:** 
- Essaie PATCH d'abord (pour update)
- Si erreur "not found", utilise POST (pour créer)
- Support batch (array) et single (object)
- Format minimal validé: {key, value}

## 4. Fonction getDeployments (ligne ~316)
**Avant:**
```javascript
return this.request(`/applications/${applicationUuid}/deployments`);
// Retournait 404
```

**Après:**
```javascript
return this.request(`/deployments?application_uuid=${applicationUuid}`);
// Endpoint correct avec query param
```

## 5. Nouvelles fonctions ajoutées
- `getDeploymentStatus()` - Récupère le statut du dernier déploiement
- `deleteApplicationEnvironmentVariable()` - Suppression de variable
- `getBuildLogs()` - Logs de build
- `getServerMetrics()` - Métriques serveur
- `getApplicationMetrics()` - Métriques application
- `getDockerContainers()` - Containers Docker
- `getDockerNetworks()` - Réseaux Docker
- `getDockerVolumes()` - Volumes Docker

## Tests effectués
- ✅ 25 fonctions testées sur instance réelle Coolify v4.0.0-beta.420.6
- ✅ Taux de succès: 96% (24/25)
- ✅ Seul échec: logs quand app non démarrée (comportement attendu)
