# ADLAUNCHER-CORE-reflourished | MINECRAFT LAUNCHER WITH NODE JS

This is a simple minecraft-core for download and play minecraft with node.js. / Simple minecraft-core para descargar y jugar minecraft con node.js.

---

This is a project developed in Node in charge of getting the files to run minecraft Vanilla, OptiFine, Forge and Fabric. The package will be updated taking into account suggestions and bug reports.

The package is in its official version `1.3`, with support for OptiFine, Forge and Fabric.

The `1.3` update contains an event manager with which you can check the data sent by the program and the `getVersions` function to get the minecraft versions.

The project is not enabled for playing on premium servers (piracy is not supported).

## Requirements

- [Java 8](https://www.java.com/en/download/manual.jsp) (Only for forge versions less than 1.16.5)
- [Java 17](https://www.oracle.com/java/technologies/javase/jdk17-archive-downloads.html)
- [Node.js](https://nodejs.org/en)

## Usage

### Install

`npm i adlauncher-core-reflourished`

### Get Versions

```js
const { Downloader } = require('adlauncher-core');

const downloader = new Downloader();

// Get the available versions: vanilla - snapshot
downloader.getVersions('vanilla').then((data) => console.log(data));
```

### Download Version

```js
const { Downloader } = require('adlauncher-core');

const downloader = new Downloader();

// Specify the version you want to download (1.8.9) and the directory
// downloader.download('[version]', '[path]');
downloader.download('1.8.9', './minecraft');
```

### Launch Version

```js
const { Launcher } = require('adlauncher-core');

const launcher = new Launcher();

// State the options with which you are going to release a version of Minecraft
const launchOptions = {
  username: 'Fae34r', // Enter your username
  version: '1.20.1', // Enter the version
  gameDirectory: './minecraft', // Enter the directory where you have downloaded Minecraft
  memory: {
    // Define the memory you want to use
    min: '3G', // Minimum memory
    max: '7G', // Maximum memory
  },
  java: 'C:/Program Files/Java/jdk-17/bin/java.exe', // Exact location of java.exe file (OPTIONAL)
  java8: 'C:/Program Files/Java/jre-1.8/bin/java.exe', // Exact location of the java.exe v8 file (OPTIONAL)
};

launcher.launch(launchOptions); // Starts Minecraft with the declared options
```

### Play with OptiFine

En el caso que quieras jugar con optimización y necesites instalar OptiFine, deberás instalarlo de manera manual y especificar en `version` la carpeta de OptiFine instalada.

Si tienes problemas al instalar `Fabric` de forma manual, puedes ver [Cómo instalar OptiFine en MINECRAFT](https://youtu.be/hPIQIweUXL8?si=ZhKtysEGmv2Ijsn5)

```js
const { Launcher } = require('adlauncher-core');

const launcher = new Launcher();

// Declara las opciones con las que vas a lanzar una versión de Minecraft
const launchOptions = {
  username: 'dani_adbg', // Ingresa tu nombre de usuario
  version: '1.8.9-OptiFine_HD_U_M5', // Ingresa la versión de OptiFine
  gameDirectory: './minecraft', // Ingresa el directorio donde tienes descargado Minecraft
  memory: {
    // Define la memoria que quieras usar
    min: '2G', // Mínimo de memoria
    max: '6G', // Máximo de memoria
  },
  java: 'C:/Program Files/Java/jdk-17/bin/java.exe', // Ubicación exacta del archivo java.exe (OPCIONAL)
  java8: 'C:/Program Files/Java/jre-1.8/bin/java.exe', // Ubicación exacta del archivo java.exe v8 (OPCIONAL)
};

launcher.launch(launchOptions); // Inicia Minecraft con las opciones declaradas
```

### Play with Fabric

En el caso de que quieras jugar con mods, ya está disponible en `adlauncher-core` el soporte de fabric.

Debes instalarlo de forma manual al igual que OptiFine y especificar en `version` la carpeta de fabric instalada.

Si tienes problemas al instalar `Fabric` de forma manual, puedes ver [Cómo INSTALAR FABRIC y MODS en MINECRAFT](https://youtu.be/taUC6R_LiOE?si=Ewz36e0YfV0LOWAp)

```js
const { Launcher } = require('adlauncher-core');

const launcher = new Launcher();

// Declara las opciones con las que vas a lanzar una versión de Minecraft
const launchOptions = {
  username: 'dani_adbg', // Ingresa tu nombre de usuario
  version: 'fabric-loader-0.15.7-1.18', // Ingresa la versión de Fabric
  gameDirectory: './minecraft', // Ingresa el directorio donde tienes descargado Minecraft
  memory: {
    // Define la memoria que quieras usar
    min: '2G', // Mínimo de memoria
    max: '6G', // Máximo de memoria
  },
  java: 'C:/Program Files/Java/jdk-17/bin/java.exe', // Ubicación exacta del archivo java.exe (OPCIONAL)
  java8: 'C:/Program Files/Java/jre-1.8/bin/java.exe', // Ubicación exacta del archivo java.exe v8 (OPCIONAL)
};

launcher.launch(launchOptions); // Inicia Minecraft con las opciones declaradas
```

### Play with Forge

En el caso de que quieras jugar con mods y no te gusta `fabric`, ya está disponible finalmente en `adlauncher-core` el soporte de forge.

Debes instalarlo de forma manual al igual que OptiFine y Fabric, especifica en `version` la carpeta de forge instalada.

Si tienes problemas al instalar `Forge` de forma manual, puedes ver [Cómo INSTALAR FORGE y MODS en MINECRAFT](https://youtu.be/ccecMbYgBKI).

```js
const { Launcher } = require('adlauncher-core');

const launcher = new Launcher();

// Declara las opciones con las que vas a lanzar una versión de Minecraft
const launchOptions = {
  username: 'dani_adbg', // Ingresa tu nombre de usuario
  version: '1.20-forge-46.0.14', // Ingresa la versión de Forge
  gameDirectory: './minecraft', // Ingresa el directorio donde tienes descargado Minecraft
  memory: {
    // Define la memoria que quieras usar
    min: '2G', // Mínimo de memoria
    max: '6G', // Máximo de memoria
  },
  java: 'C:/Program Files/Java/jdk-17/bin/java.exe', // Ubicación exacta del archivo java.exe (OPCIONAL)
  java8: 'C:/Program Files/Java/jre-1.8/bin/java.exe', // Ubicación exacta del archivo java.exe v8 (OPCIONAL)
};

launcher.launch(launchOptions); // Inicia Minecraft con las opciones declaradas
```

#### Importante

Forge solo está disponible desde la versión `1.12` hasta la más reciente.

Para jugar desde la `1.12` hasta la `1.16.5` se necesita `Java 8 x64` [Descarga Java 8](https://www.java.com/en/download/manual.jsp)

Mientras que para jugar desde la versión `1.17` se necesita `Java 17` [Descarga Java 17](https://www.oracle.com/java/technologies/javase/jdk17-archive-downloads.html)

Al momento de instalarlos, asegurate que los directorios sean los que traen por defecto, caso contrario pueden ocurrir errores.

Forge fue un total dolor de cabeza. Si ocurre un error, reportalo de inmediato en nuestro [Server de Discord](https://discord.gg/a93w5NpBR9).

### Debug

Para leer la data que envía el programa, se necesita escribir el manager de eventos.

```js
// MANAGER DE EVENTOS PARA LA DESCARGA
downloader.download('1.8.9', './minecraft');
downloader.on('downloadFiles', (data) => console.log(data)); // Se encarga de mostrar los paquetes de archivos que se están descargando.
downloader.on('percentDownloaded', (data) => console.log(data)); // Se encarga de mostrar el porcentaje de cada paquete que se está descargando.

// MANAGER DE EVENTOS PARA EL LANZAMIENTO
launcher.launch(launchOptions);
launcher.on('debug', (data) => console.log(data));
```

---

## Contributors

<img src="https://contrib.rocks/image?repo=dani-adbg/adlauncher-core" alt="Img">

## Support

[![Discord](https://dcbadge.vercel.app/api/server/a93w5NpBR9)](https://discord.gg/a93w5NpBR9)
[![YouTube](https://img.shields.io/badge/YouTube-%23FF0000.svg?style=for-the-badge&logo=YouTube&logoColor=white)](https://www.youtube.com/@dani_adbg)

---

Project developed by: `dani_adbg`
