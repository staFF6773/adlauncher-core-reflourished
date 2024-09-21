const fs = require('fs');
const path = require('path');
let https = require('https');
https.globalAgent.maxSockets = 2;
const Zip = require('adm-zip');
const EventEmitter = require('events');
const shownNumbers = new Set();

class Downloader {
    constructor() {
        this.url = {
            meta: 'https://launchermeta.mojang.com/mc/game/version_manifest.json',
            resource: 'https://resources.download.minecraft.net',
            optifine: 'https://optifine.net/downloads'
        };
        this.cache = 'cache';
        this.versions = 'versions';
        this.assets = 'assets';
        this.libraries = 'libraries';
        this.natives = 'natives';
        this.emisor = new EventEmitter();
    }

    async down(url, dir, name) {
        try {
            const response = new Promise((resolve, reject) => {
                const req = https.get(url, { timeout: 10000 }, (res) => {
                    const filePath = path.join(dir, name);
                    const writeToFile = fs.createWriteStream(filePath);
                    res.pipe(writeToFile);

                    writeToFile.on('finish', () => {
                        resolve();
                    });

                    writeToFile.on('error', reject);
                });

                req.on('error', reject);
            });

            return response;
        } catch (error) {
            console.error('Download error:', error);
            throw error;
        }
    }

    getVersions(type) {
        return new Promise(async (resolve, reject) => {
            https.get(this.url.meta, (res) => {
                let data = '';

                res.on('data', async chunk => {
                    data += chunk;
                });

                res.on('end', () => {
                    data = JSON.parse(data);

                    switch (type) {
                        case "vanilla":
                            resolve(data.versions.filter(x => x.type === "release"));
                            break;

                        case "snapshot":
                            resolve(data.versions.filter(x => x.type === "snapshot"));
                            break;

                        default:
                            reject(new Error("Error obtaining available versions."));
                            break;
                    }
                });
            });
        });
    }

    // New method to fetch OptiFine versions
    getOptiFineVersions() {
        return new Promise((resolve, reject) => {
            https.get(this.url.optifine, (res) => {
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
                res.on('end', () => {
                    // Basic parsing to extract OptiFine version information
                    const matches = data.match(/<td><a href=".*">(.*)<\/a><\/td>/g);
                    if (matches) {
                        const versions = matches.map(match => {
                            const versionMatch = match.match(/<td><a href=".*">(.*)<\/a><\/td>/);
                            return versionMatch ? versionMatch[1] : null;
                        }).filter(version => version !== null);
                        resolve(versions);
                    } else {
                        reject(new Error("Failed to parse OptiFine versions"));
                    }
                });
            }).on('error', reject);
        });
    }

    #downloadVersion() {
        return new Promise(async (resolve, reject) => {
            await this.emisor.emit('downloadFiles', 'Downloading main files.');
            if(!fs.existsSync(path.join(this.root, this.cache, 'json'))) fs.mkdirSync(path.join(this.root, this.cache, 'json'), { recursive: true });
            await this.down(this.url.meta, path.join(this.root, this.cache, 'json'), 'version_manifest.json');

            if(fs.existsSync(path.join(this.root, this.cache))) {
                let ver = JSON.parse(fs.readFileSync(path.join(this.root, this.cache, 'json', 'version_manifest.json'), { encoding: 'utf-8' }));
                const verJson = ver.versions.find(x => x.type === 'release' && x.id === this.version).url;
                if (!verJson) throw "The version does not exist.";

                if(!fs.existsSync(path.join(this.root,this.versions, this.version))) fs.mkdirSync(path.join(this.root, this.versions, this.version), { recursive: true});
                try {
                    await this.down(verJson, path.join(this.root, this.versions, this.version), `${this.version}.json`);
                } catch (error) {
                    reject(new Error('Error downloading the version metadata file.', error));
                }
            }
            resolve();
        });
    }

    #downloadClient() {
        return new Promise(async (resolve, reject) => {
            this.emisor.emit('downloadFiles', 'Downloading client.');
            this.file = path.join(this.root, this.versions, this.version, `${this.version}.json`);
            this.file = JSON.parse(fs.readFileSync(this.file, { encoding: 'utf-8' }));

            const client = this.file.downloads.client.url;
            if(!fs.existsSync(path.join(this.root, this.versions, this.version))) fs.mkdirSync(path.join(this.root, this.versions, this.version));
            try {
                await this.down(client, path.join(this.root, this.versions, this.version), `${this.version}.jar`);
            } catch (error) {
                reject(new Error('Error downloading the version .jar file.', error));
            }
            resolve();
        });
    }

    #downloadAssets() {
        return new Promise(async (resolve, reject) => {
            this.emisor.emit('downloadFiles', 'Downloading assets.');
    
            // Verificar y crear directorios si es necesario
            if (!fs.existsSync(path.join(this.root, this.assets))) {
                fs.mkdirSync(path.join(this.root, this.assets), { recursive: true });
            }
            if (!fs.existsSync(path.join(this.root, this.assets, 'indexes'))) {
                fs.mkdirSync(path.join(this.root, this.assets, 'indexes'), { recursive: true });
            }
    
            try {
                const totalSize = this.file.assetIndex.totalSize;
                await this.down(this.file.assetIndex.url, path.join(this.root, this.assets, 'indexes'), `${this.version}.json`);
                await this.down(this.file.assetIndex.url, path.join(this.root, this.cache, 'json'), `${this.version}.json`);
    
                const assetFile = JSON.parse(fs.readFileSync(path.join(this.root, this.assets, 'indexes', `${this.version}.json`)));
    
                if (!fs.existsSync(path.join(this.root, this.assets, 'objects'))) {
                    fs.mkdirSync(path.join(this.root, this.assets, 'objects'));
                }
    
                let size = 0, percentage;
    
                for (const key in assetFile.objects) {
                    if (assetFile.objects.hasOwnProperty.call(assetFile.objects, key)) {
                        const fileName = assetFile.objects[key];
                        const fileSize = fileName.size;
                        const fileHash = fileName.hash;
                        const fileSubHash = fileHash.substring(0, 2);
    
                        if (!fs.existsSync(path.join(this.root, this.assets, 'objects', fileSubHash))) {
                            fs.mkdirSync(path.join(this.root, this.assets, 'objects', fileSubHash));
                        }
    
                        try {
                            await this.down(`${this.url.resource}/${fileSubHash}/${fileHash}`, path.join(this.root, this.assets, 'objects', fileSubHash), fileName.hash);
                            size += fileSize;
                            percentage = Math.floor(((size / totalSize) * 100));
    
                            if (!shownNumbers.has(percentage)) {
                                this.emisor.emit('percentDownloaded', `${percentage}% downloaded!`);
                                shownNumbers.add(percentage);
    
                                if (percentage === 100) {
                                    resolve();
                                }
                            }
                        } catch (error) {
                            console.error('Error downloading asset:', error); // Manejo de errores individual
                            // Puedes optar por continuar o manejar el error de otra manera
                        }
                    }
                }
            } catch (error) {
                reject(new Error('Error downloading or processing assets:', error));
            }
        });
    }

    #downloadNatives() {
      return new Promise((resolve, reject)  => {
        this.emisor.emit('downloadFiles', 'Downloading natives.');
        if(!fs.existsSync(path.join(this.root, this.natives))) fs.mkdirSync(path.join(this.root, this.natives));

        this.file.libraries.forEach(async element => {
          const el = element.downloads.classifiers;
          const natives = (typeof el === 'object' && (el['natives-windows'] ? el['natives-windows'] : el['natives-windows-64']));
          if(natives) {
            try {
              await this.down(natives.url, path.join(this.root, this.natives), path.basename(natives.path));

              if(this.version === '1.8' && natives.url.includes('nightly')) return fs.unlinkSync(path.join(this.root, this.natives, path.basename(natives.path)));
              new Zip(path.join(path.join(this.root, this.natives), path.basename(natives.path))).extractAllTo(path.join(this.root, this.natives, this.version), true);

              fs.unlinkSync(path.join(this.root, this.natives, path.basename(natives.path)));
            } catch (error) {
              reject(new Error('Error downloading native files for the version.', error));
            }
          }
        });
        resolve();
      });
    }

    // New method to download OptiFine
    async #downloadOptiFine() {
      if (!this.optifineVersion) return; // Skip if no OptiFine version specified

      this.emisor.emit('downloadFiles', 'Downloading OptiFine.');

      // Construct the OptiFine download URL based on MC version and OptiFine version
      const optifineUrl = `https://optifine.net/adloadx?f=OptiFine_${this.version}_HD_U_${this.optifineVersion}.jar`; 

      try {
          await this.down(optifineUrl, path.join(this.root, this.versions, this.version), `OptiFine_${this.version}_HD_U_${this.optifineVersion}.jar`);
      } catch (error) {
          throw new Error('Error downloading OptiFine.', error);
      }
    }

    // Method to download libraries
    #downloadLibraries() {
      return new Promise((resolve, reject) => {
        // Emit the downloadFiles event
        this.emisor.emit('downloadFiles', 'Downloading libraries.');
        // Create libraries directory if it doesn't exist
        if(!fs.existsSync(path.join(this.root, this.libraries))) fs.mkdirSync(path.join(this.root, this.libraries));
        // Iterate over the libraries and download them
        this.file.libraries.forEach(async element => {
          if(element.downloads.artifact !== undefined) {
            const jarFile = element.downloads.artifact.path;
            const parts = jarFile.split('/');
            parts.pop();
            const libRoot = parts.join('/');
            const libName = path.basename(jarFile);
            // Create directory for the library if it doesn't exist
            if(!fs.existsSync(path.join(this.root, this.libraries, libRoot))) fs.mkdirSync(path.join(this.root, this.libraries, libRoot), { recursive: true });
            try {
              // Download the library
              await this.down(element.downloads.artifact.url, path.join(this.root, this.libraries, libRoot), libName);
            } catch (error) {
              // Handle download errors
              reject(new Error('Error downloading the libraries for the version.', error));
            }
          }
        });
        // Resolve the promise
        resolve();
      });
    }

    emisor(event, args) {
      this.emisor.emit(event, ...args);
      }
      
      on(event, callback) {
      this.emisor.on(event, callback);
      }
      
      /**
      * Main method to download all resources for a Minecraft version, including OptiFine if specified
      * @param {String} version Enter the version you want to download
      * @param {String} root Path where the download will take place
      * @param {String} optifineVersion (Optional) Specify the OptiFine version to download
      */

      download(version, root, optifineVersion = null) {
        this.version = version;
        this.root = root;
        this.optifineVersion = optifineVersion; // Store the OptiFine version
        
        return new Promise(async (resolve, reject) => {
            if (!version) {
                reject(new Error("No version provided."));
            }
        
            await this.#downloadVersion();
            this.emisor.emit('downloadFiles', `Minecraft ${version} is now downloading.`);
            await this.#downloadClient();
            this.emisor.emit('downloadFiles', 'Client downloaded.');
            await this.#downloadAssets();
            this.emisor.emit('downloadFiles', 'Assets downloaded.');
            await this.#downloadLibraries();
            this.emisor.emit('downloadFiles', 'Libraries downloaded.');
            await this.#downloadNatives();
            this.emisor.emit('downloadFiles', 'Natives downloaded.');
        
            // Download OptiFine if specified
            if (optifineVersion) {
                try {
                    await this.#downloadOptiFine();
                    this.emisor.emit('downloadFiles', 'OptiFine downloaded.');
                } catch (error) {
                    reject(error); // Pass the error up to the caller
                }
            }
        
            this.emisor.emit('downloadFiles', 'All files are downloaded.');
            this.emisor.removeAllListeners('downloadFiles');
            this.emisor.removeAllListeners('percentDownloaded');
            shownNumbers.clear();
            resolve();
        });
        }
        };
        
        module.exports = Downloader;
