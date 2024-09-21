const fs = require('fs'); // Module for file system operations
const path = require('path'); // Module for file path manipulation
let https = require('https'); // Module for making HTTPS requests
https.globalAgent.maxSockets = 2; // Set the maximum number of simultaneous connections for HTTPS requests
const Zip = require('adm-zip'); // Module for manipulating ZIP files
const EventEmitter = require('events'); // Module for emitting events
const shownNumbers = new Set(); // Object to avoid repeated numbers in the event

// Downloader class for downloading files related to Minecraft
class Downloader {
  constructor() {
    // URL for different resources
    this.url = {
      meta: 'https://launchermeta.mojang.com/mc/game/version_manifest.json', // URL for the version metadata file
      resource: 'https://resources.download.minecraft.net', // Base URL for downloading Minecraft resources
    };
    // Cache storage directory
    this.cache = 'cache';
    // Directory for storing downloaded versions
    this.versions = 'versions';
    // Directory for storing downloaded assets
    this.assets = 'assets';
    // Directory for storing downloaded libraries
    this.libraries = 'libraries';
    // Directory for storing downloaded native files
    this.natives = 'natives';
    // Define the event emitter
    this.emisor = new EventEmitter();
  }
  
  // Method to download a file from a given URL
  async down(url, dir, name) {
    try {
      const response = new Promise((resolve, reject) => {
        // Make an HTTPS request to get the file
        const req = https.get(url, { timeout: 10000 }, (res) => {
          // Destination file path
          const filePath = path.join(dir, name);
          // Create a write stream to write the file
          const writeToFile = fs.createWriteStream(filePath);
          // Pipe the response from the request to a file
          res.pipe(writeToFile);
  
          // Handle the finish event of writing
          writeToFile.on('finish', () => {
            // Resolve the promise
            resolve();
          });
  
          // Handle writing errors
          writeToFile.on('error', reject);
        });
  
        // Handle request errors
        req.on('error', reject);
      });
  
      return response;
    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
  }

  /**
   * 
   * @param {String} type Enter the type of list you need: vanilla - snapshot 
   */
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

  // Method to download the Minecraft version
  #downloadVersion() {
    return new Promise(async (resolve, reject) => {
      // Emit the downloadFiles event
      await this.emisor.emit('downloadFiles', 'Downloading main files.');
      // Create cache directory if it doesn't exist
      if(!fs.existsSync(path.join(this.root, this.cache, 'json'))) fs.mkdirSync(path.join(this.root, this.cache, 'json'), { recursive: true });
      // Download the version metadata file
      await this.down(this.url.meta, path.join(this.root, this.cache, 'json'), 'version_manifest.json');

      // Check if the cache directory exists
      if(fs.existsSync(path.join(this.root, this.cache))) {
        // Read the version metadata file
        let ver = JSON.parse(fs.readFileSync(path.join(this.root, this.cache, 'json', 'version_manifest.json'), { encoding: 'utf-8' }));
        // Find the URL for the specific version
        const verJson = ver.versions.find(x => x.type === 'release' && x.id === this.version).url;
        // Throw an error if the version does not exist
        if (!verJson) throw "The version does not exist.";
        
        // Create the version directory if it doesn't exist
        if(!fs.existsSync(path.join(this.root,this.versions, this.version))) fs.mkdirSync(path.join(this.root, this.versions, this.version), { recursive: true});
        try {
          // Download the JSON file for the specific version
          await this.down(verJson, path.join(this.root, this.versions, this.version), `${this.version}.json`);
        } catch (error) {
          // Handle download errors
          reject(new Error('Error downloading the version metadata file.', error));
        }
      }
      // Resolve the promise
      resolve();
    });
  }

  // Method to download the Minecraft client
  #downloadClient() {
    return new Promise(async (resolve, reject) => {
      // Emit the downloadFiles event
      this.emisor.emit('downloadFiles', 'Downloading client.');
      // Get the path of the version JSON file
      this.file = path.join(this.root, this.versions, this.version, `${this.version}.json`);
      // Read the version JSON file
      this.file = JSON.parse(fs.readFileSync(this.file, { encoding: 'utf-8' }));
      
      // Get the client URL
      const client = this.file.downloads.client.url;
      // Create the version directory if it doesn't exist
      if(!fs.existsSync(path.join(this.root, this.versions, this.version))) fs.mkdirSync(path.join(this.root, this.versions, this.version));
      try {
        // Download the client .jar file
        await this.down(client, path.join(this.root, this.versions, this.version), `${this.version}.jar`);
      } catch (error) {
        // Handle download errors
        reject(new Error('Error downloading the version .jar file.', error));
      }
      // Resolve the promise
      resolve();
    });
  }

  // Method to download Minecraft assets
  #downloadAssets() {
    return new Promise(async (resolve, reject) => {
      // Emit the downloadFiles event
      this.emisor.emit('downloadFiles', 'Downloading assets.');
      // Create assets index directory if it doesn't exist
      if(!fs.existsSync(path.join(this.root, this.assets, 'indexes'))) fs.mkdirSync(path.join(this.root, this.assets, 'indexes'), { recursive: true });
      const totalSize = this.file.assetIndex.totalSize;
      // Download the assets index file
      await this.down(this.file.assetIndex.url, path.join(this.root, this.assets, 'indexes'), `${this.version}.json`);
      // Download the cached assets index file
      await this.down(this.file.assetIndex.url, path.join(this.root, this.cache, 'json'), `${this.version}.json`);

      // Read the assets index file
      const assetFile = JSON.parse(fs.readFileSync(path.join(this.root, this.assets, 'indexes', `${this.version}.json`)));
      // Create assets objects directory if it doesn't exist
      if(!fs.existsSync(path.join(this.root, this.assets, 'objects'))) fs.mkdirSync(path.join(this.root, this.assets, 'objects'));

      // Define variables for the percentDownloaded event
      let size = 0, percentage;

      // Iterate over the asset objects
      for (const key in assetFile.objects) {
        if (assetFile.objects.hasOwnProperty.call(assetFile.objects, key)) {
          const fileName = assetFile.objects[key]; // object
          const fileSize = fileName.size; // size of the object
          const fileHash = fileName.hash; // name of the object
          const fileSubHash = fileHash.substring(0, 2); // folder name of the object
          
          // Create subhash directory if it doesn't exist
          if(!fs.existsSync(path.join(this.root, this.assets, 'objects', fileSubHash))) fs.mkdirSync(path.join(this.root, this.assets, 'objects', fileSubHash));
          try {
            // Download asset resources
            this.down(`${this.url.resource}/${fileSubHash}/${fileHash}`, path.join(this.root, this.assets, 'objects', fileSubHash), fileName.hash).then(() => { 
              // Update the percentDownloaded variables
              size += fileSize; 
              percentage = Math.floor(((size / totalSize) * 100)); 
              if (!shownNumbers.has(percentage)) {
                this.emisor.emit('percentDownloaded', `${percentage}% downloaded!`);
                shownNumbers.add(percentage);
                if(percentage === 100) {
                  resolve();
                }
              }
            }).catch(e => reject(new Error('ERROR', e)));
          } catch (error) {
            // Handle download errors
            reject(new Error('Error downloading the version resources.', error));
          }
        }
      }
    });
  }

  // Method to download native files
  #downloadNatives() {
    return new Promise((resolve, reject) => {
      // Emit the downloadFiles event
      this.emisor.emit('downloadFiles', 'Downloading natives.');
      // Create natives directory if it doesn't exist
      if(!fs.existsSync(path.join(this.root, this.natives))) fs.mkdirSync(path.join(this.root, this.natives));

      // Iterate over the libraries and download native files if available
      this.file.libraries.forEach(async element => {
        const el = element.downloads.classifiers;
        const natives = (typeof el === 'object' && (el['natives-windows'] ? el['natives-windows'] : el['natives-windows-64']));
        if(natives) {
          try {
            // Download the native file
            await this.down(natives.url, path.join(this.root, this.natives), path.basename(natives.path));
  
            // Delete the native file if the version is 1.8 and it is a nightly build
            if(this.version === '1.8' && natives.url.includes('nightly')) return fs.unlinkSync(path.join(this.root, this.natives, path.basename(natives.path)));
            // Extract the ZIP file
            new Zip(path.join(path.join(this.root, this.natives), path.basename(natives.path))).extractAllTo(path.join(this.root, this.natives, this.version), true);

            // Delete the ZIP file
            fs.unlinkSync(path.join(this.root, this.natives, path.basename(natives.path)));
          } catch (error) {
            // Handle download errors
            reject(new Error('Error downloading native files for the version.', error));
          }
        }
      });
      // Resolve the promise
      resolve();
    });
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

  /**
   * Emits the event
   * @param {String} event Event name
   * @param {String} args Arguments to be passed to the event
   * @return {String} Event data
   */
  emisor(event, args) {
    this.emisor.emit(event, ...args);
  }

  /**
   * Listens to the event
   * @param {String} event Event name
   * @param {String} callback Custom function 
   * @return {String} Event data
   */
  on(event, callback) {
    this.emisor.on(event, callback);
  }

  /**
   * Main method to download all resources for a Minecraft version
   * @param {String} version Enter the version you want to download
   * @param {String} root Path where the download will take place
   */
  download(version, root) {
    this.version = version;
    this.root = root;
    return new Promise(async (resolve, reject) => {
      // Check if a version was provided
      if (!version) {
        reject(new Error("No version provided."));
      }

      // Start downloading the version
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
      this.emisor.emit('downloadFiles', 'All files are downloaded.');
      // Resolve the promise and clear the event emitters
      this.emisor.removeAllListeners('downloadFiles');
      this.emisor.removeAllListeners('percentDownloaded');
      shownNumbers.clear();
      resolve();
    });
  }
};

module.exports = Downloader; // Exporting the Downloader class for use in other modules
