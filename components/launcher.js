const fs = require('fs'); // Module for working with the file system
const { spawn } = require('child_process'); // Module for creating child processes
const path = require('path'); // Module for working with file and directory paths
const downloader = require('./downloader'); // Custom download module
const { v4: uuidv4 } = require('uuid'); // Module for generating UUIDs
const EventEmitter = require('events'); // Module for emitting events

/**
 * Launcher class to manage launching Minecraft.
 */
class Launcher {
  constructor() {
    // Imports custom functions
    this.downloader = new downloader(this);
    // Defines the event emitter
    this.emisor = new EventEmitter();
  }

  /**
   * Method to create the launch profile if it doesn't exist.
   * @param {String} root - Path of the game's root directory.
   */
  #createProfile(root) {
    if (!fs.existsSync(path.resolve(root, 'launcher_profiles.json'))) {
      fs.writeFileSync(
        path.resolve(root, 'launcher_profiles.json'),
        JSON.stringify({ profiles: {} })
      );
    }
  }

  /**
   * Method to find JAR files in a directory and its subdirectories.
   * @param {String} directory - Directory to explore.
   * @param {Array} files - List of files to search for.
   * @param {String} ver - Minecraft version.
   * @returns {String} - String of found JAR files.
   */
  #getJarFiles(directory, files, ver) {
    const filesList = fs.readdirSync(directory);
    let jarFilesString = '';

    filesList.forEach((file) => {
      const fullPath = path.resolve(directory, file);
      if (fs.statSync(fullPath).isDirectory()) {
        jarFilesString += this.#getJarFiles(fullPath, files, ver);
      } else {
        if (['1.14', '1.14.1', '1.14.2', '1.14.3'].includes(ver)) {
          if (path.extname(file) === '.jar' && files.includes(file)) {
            jarFilesString += fullPath + ';';
          }
        } else {
          if (
            path.extname(file) === '.jar' &&
            files.includes(file) &&
            !file.includes('3.2.1')
          ) {
            jarFilesString += fullPath + ';';
          }
        }
      }
    });
    return jarFilesString;
  }

  /**
   * Method to authenticate the user and get their UUID.
   * @param {String} root - Path of the game's root directory.
   * @param {String} us - Username.
   * @returns {String} - User's UUID.
   */
  #auth(root, us) {
    try {
      const file = JSON.parse(
        fs.readFileSync(path.resolve(root, 'usercache.json'), { encoding: 'utf-8' })
      );
      return file.find((x) => x.name === us).uuid;
    } catch (error) {
      this.emisor.emit('debug', 'NO USERS FOUND, CREATING ONE');
      return uuidv4();
    }
  }

  /**
   * Emit the event
   * @param {String} event - Name of the event
   * @param {String} args - Arguments to pass to the event
   * @return {String} - Event data
   */
  emisor(event, args) {
    this.emisor.emit(event, ...args);
  }

  /**
   * Listen for the event
   * @param {String} event - Name of the event
   * @param {String} callback - Custom function
   * @return {String} - Event data
   */
  on(event, callback) {
    this.emisor.on(event, callback);
  }

  /**
   * Method to launch the Minecraft game.
   * @param {Object} options - Game launch options.
   */
  async launch(options) {
    const minM = options.memory.min;
    const maxM = options.memory.max;
    const rootPath = options.gameDirectory;
    const version = options.version.match(/\b1\.\d+(\.\d+)?\b/g)[0];
    const custom = options.version !== version ? options.version : null;
    const username = options.username;
    let java = options.java;
    let java8 = options.java8;
    const file = JSON.parse(
      fs.readFileSync(
        path.resolve(rootPath, this.downloader.versions, version, `${version}.json`),
        { encoding: 'utf-8' }
      )
    );

    await this.#createProfile(rootPath);

    const uuid = this.#auth(rootPath, username);
    const reqLibs = file.libraries
      .filter((element) => element.downloads && element.downloads.artifact)
      .map((element) => path.basename(element.downloads.artifact.path));
    let mainClass = file.mainClass;
    let gameArgs = file.minecraftArguments
      ? file.minecraftArguments.split(' ')
      : file.arguments.game;

    let jvm = [
      `-Djava.library.path=${path.resolve(rootPath, this.downloader.natives, version)}`,
      `-Xmx${maxM}`,
      `-Xms${minM}`,
      '-XX:HeapDumpPath=MojangTricksIntelDriversForPerformance_javaw.exe_minecraft.exe.heapdump',
    ];

    // Handle OptiFine launch
    if (optifineVersion) {
      mainClass = 'net.minecraft.launchwrapper.Launch'; // OptiFine uses LaunchWrapper
      const optifineJar = `OptiFine_${version}_HD_U_${optifineVersion}.jar`;
      jvm.push(`-Dfml.ignoreInvalidMinecraftCertificates=true`);
      jvm.push(`-Dfml.ignorePatchDiscrepancies=true`);
      gameArgs.unshift('--tweakClass', 'optifine.OptiFineTweaker');
      libs += path.resolve(rootPath, this.downloader.versions, version, optifineJar) + ';'; // Add OptiFine JAR to classpath
  } else if (custom !== null) { 
    const customFile = JSON.parse(
      fs.readFileSync(
        path.resolve(rootPath, this.downloader.versions, custom, `${custom}.json`),
        { encoding: 'utf-8' }
      )
    );

    customFile.libraries.forEach((element) => {
      reqLibs.push(element.name.split(':').slice(-2).join('-').concat('.jar'));
    });

    mainClass = customFile.mainClass;

    if (!customFile.arguments) {
      gameArgs = customFile.minecraftArguments.split(' ');
    } else {
      if (customFile.arguments.jvm) {
        jvm.push(...customFile.arguments.jvm);
      }
      gameArgs.push(...customFile.arguments.game);
    }

    if (fs.existsSync(path.resolve(rootPath, 'options.txt'))) {
      fs.unlinkSync(path.resolve(rootPath, 'options.txt'));
    }

    if (custom.includes('forge') && version.includes('1.20')) {
      const matches = custom.split('-');
      const forgeVersion = matches[matches.length - 1].replace('forge', '');
      const result = `forge-${version}-${forgeVersion}-universal.jar`;
      const resultClient = `forge-${version}-${forgeVersion}-client.jar`;
      reqLibs.push(result, resultClient);
      if (['1.20', '1.20.1'].includes(version)) {
        reqLibs.push('mergetool-1.1.5-api.jar');
      }
    }
  }

    let libs = this.#getJarFiles(
      path.resolve(rootPath, this.downloader.libraries),
      reqLibs,
      version
    );
    libs += path.resolve(rootPath, this.downloader.versions, version, `${version}.jar`);
    const fields = {
      '${auth_access_token}': uuid,
      '${auth_session}': uuid,
      '${auth_player_name}': username,
      '${auth_uuid}': uuid,
      '${auth_xuid}': uuid,
      '${user_properties}': '{}',
      '${user_type}': 'mojang',
      '${version_name}': version,
      '${assets_index_name}': version,
      '${game_directory}': path.resolve(rootPath),
      '${assets_root}': path.resolve(rootPath, this.downloader.assets),
      '${game_assets}': path.resolve(rootPath, this.downloader.assets),
      '${version_type}': 'release',
      '${clientid}': uuid,
      '${resolution_width}': 856,
      '${resolution_height}': 482,
      library_directory: path
        .resolve(rootPath, this.downloader.libraries)
        .split(path.sep)
        .join('/'),
      version_name: version,
      classpath_separator: ';',
    };

    jvm = jvm.map((str) => str.replace(/\$\{(\w+)\}/g, (match, p1) => fields[p1] || match));

    let args = [...jvm, '-cp', libs, mainClass, ...gameArgs];

    args = args.map((arg) => (fields[arg] ? fields[arg] : arg));

    const parV = parseInt(version.split('.')[1]);

    if (!java) {
      java = 'C:/Program Files/Java/jdk-17/bin/java.exe';
    }
    if (custom && custom.includes('forge') && parV < 16 && !java8) {
      java = java8 || 'C:/Program Files/Java/jre-1.8/bin/java.exe';
      this.emisor.emit('debug', `USING JAVA 8`);
    }

    const spawnRoot = path.resolve(rootPath);
    const minecraft = spawn(java, args, { cwd: spawnRoot });
    this.emisor.emit('debug', `STARTING MINECRAFT VERSION: ${custom || version}`);
    this.emisor.emit('debug', `STARTING WITH THE FOLLOWING ARGUMENTS ${args.toString()}`);
    minecraft.stdout.on('data', (data) => this.emisor.emit('debug', data.toString().trim()));
    minecraft.stderr.on('data', (data) => this.emisor.emit('debug', data.toString().trim()));
  }
}

module.exports = Launcher; // Export the Launcher class for use in other files
