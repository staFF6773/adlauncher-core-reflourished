# ADLAUNCHER-CORE-reflourished | MINECRAFT LAUNCHER WITH NODE JS

This is a simple minecraft-core for download and play minecraft with node.js. / Simple minecraft-core para descargar y jugar minecraft con node.js.

---

This is a project developed in Node in charge of getting the files to run minecraft Vanilla, OptiFine, Forge and Fabric. The package will be updated taking into account suggestions and bug reports.

The package is in its official version `1.0.0`, with support for OptiFine, Forge and Fabric.

The `1.0.0` update contains an event manager with which you can check the data sent by the program and the `getVersions` function to get the minecraft versions.

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
const { Downloader } = require('adlauncher-core-reflourished');

const downloader = new Downloader();

// Get the available versions: vanilla - snapshot
downloader.getVersions('vanilla').then((data) => console.log(data));
```

### Download Version

```js
const { Downloader } = require('adlauncher-core-reflourished');

const downloader = new Downloader();

// Specify the version you want to download (1.8.9) and the directory
// downloader.download('[version]', '[path]');
downloader.download('1.8.9', './minecraft');
```

### Launch Version

```js
const { Launcher } = require('adlauncher-core-reflourished');

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

In case you want to play with optimization and need to install OptiFine, you will have to install it manually and specify in `version` the OptiFine folder installed.

If you have problems installing `Fabric` manually, you can see [How to install OptiFine in MINECRAFT](https://youtu.be/hPIQIweUXL8?si=ZhKtysEGmv2Ijsn5)

```js
const { Launcher } = require('adlauncher-core-reflourished');

const launcher = new Launcher();

// State the options with which you are going to release a version of Minecraft
const launchOptions = {
  username: 'Fae34r', // Enter your username
  version: '1.8.9-OptiFine_HD_U_M5', // Enter the OptiFine version
  gameDirectory: './minecraft', // Enter the directory where you have downloaded Minecraft
  memory: {
    // Define the memory you want to use
    min: '2G', // Mínimo de memoria
    max: '6G', // Máximo de memoria
  },
  java: 'C:/Program Files/Java/jdk-17/bin/java.exe', // Exact location of java.exe file (OPTIONAL)
  java8: 'C:/Program Files/Java/jre-1.8/bin/java.exe', // Exact location of java.exe file v8 (OPTIONAL)
};

launcher.launch(launchOptions); // Starts Minecraft with the declared options
```

### Play with Fabric

In case you want to play with mods, support for fabric is already available in `adlauncher-core-reflourished`.

You must install it manually like OptiFine and specify in `version` the installed fabric folder.

If you have problems installing `Fabric` manually, you can see [How to INSTALL FABRIC and MODS in MINECRAFT](https://youtu.be/taUC6R_LiOE?si=Ewz36e0YfV0LOWAp)

```js
const { Launcher } = require('adlauncher-core-reflourished');

const launcher = new Launcher();

// State the options with which you are going to release a version of Minecraft
const launchOptions = {
  username: 'Fae34r', Enter your username
  version: 'fabric-loader-0.15.7-1.18', // Enter the Fabric version
  gameDirectory: './minecraft', // Enter the directory where you have downloaded Minecraft
  memory: {
    // Define the memory you want to use
    min: '2G', // Minimum memory
    max: '6G', // Maximum memory
  },
  java: 'C:/Program Files/Java/jdk-17/bin/java.exe', // Exact location of java.exe file (OPTIONAL)
  java8: 'C:/Program Files/Java/jre-1.8/bin/java.exe', // Exact location of java.exe file v8 (OPTIONAL)
};

launcher.launch(launchOptions); // Inicia Minecraft con las opciones declaradas
```

### Play with Forge

If you want to play with mods and don't like `Fabric`, Forge support is finally available in `adlauncher-core-reflourished`.

You must install it manually, just like OptiFine and Fabric; specify the installed Forge folder in the `version`.

If you have problems installing `Forge` manually, you can check [How to INSTALL FORGE and MODS in MINECRAFT](https://youtu.be/ccecMbYgBKI).

```js
const { Launcher } = require('adlauncher-core-reflourished');

const launcher = new Launcher();

// Declare the options with which you will launch a version of Minecraft
const launchOptions = {
  username: 'dani_adbg', // Enter your username
  version: '1.20-forge-46.0.14', // Enter the Forge version
  gameDirectory: './minecraft', // Enter the directory where you have downloaded Minecraft
  memory: {
    // Define the memory you want to use
    min: '2G', // Minimum memory
    max: '6G', // Maximum memory
  },
  java: 'C:/Program Files/Java/jdk-17/bin/java.exe', // Exact location of the java.exe file (OPTIONAL)
  java8: 'C:/Program Files/Java/jre-1.8/bin/java.exe', // Exact location of the java.exe v8 file (OPTIONAL)
};

launcher.launch(launchOptions); // Starts Minecraft with the declared options
```

**Important Information**

- **Forge Compatibility:** Forge is available from version `1.12` to the latest.

- **Java Requirements:**
  - For playing versions from `1.12` to `1.16.5`, you need **Java 8 x64**. [Download Java 8 here](https://www.java.com/en/download/manual.jsp).
  - For playing versions from `1.17`, you need **Java 17**. [Download Java 17 here](https://www.oracle.com/java/technologies/javase/jdk17-archive-downloads.html).

- **Installation:** Make sure the installation directories are the defaults. If you change the location, errors may occur.


### Debug

To read the data sent by the program, you need to write the event manager.

```js
// EVENT MANAGER FOR DOWNLOADING
downloader.download('1.8.9', './minecraft');
downloader.on('downloadFiles', (data) => console.log(data)); // Handles showing the file packages being downloaded.
downloader.on('percentDownloaded', (data) => console.log(data)); // Handles showing the percentage of each package being downloaded.

// EVENT MANAGER FOR LAUNCHING
launcher.launch(launchOptions);
launcher.on('debug', (data) => console.log(data));
```

---

# adlauncher-core-reflourished

**adlauncher-core-reflourished** is a continuation of **adlauncher-core**, a library designed for developing Minecraft launchers using **Node.js**.

## Project Overview

As the base library is currently abandoned, **adlauncher-core-reflourished** offers essential support by:

- Providing new versions
- Incorporating additional features

## Credits

Special thanks to [dani_adbg](https://github.com/dani-adbg) for the original work and inspiration.

