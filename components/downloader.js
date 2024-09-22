const fs = require('fs');
const path = require('path');
const https = require('https');
const Zip = require('adm-zip');
const EventEmitter = require('events');
const { MultiBar, Presets } = require('cli-progress');

const shownNumbers = new Set();

class Downloader {
  constructor() {
    this.url = {
      meta: 'https://launchermeta.mojang.com/mc/game/version_manifest.json',
      resource: 'https://resources.download.minecraft.net',
    };
    this.cache = 'cache';
    this.versions = 'versions';
    this.assets = 'assets';
    this.libraries = 'libraries';
    this.natives = 'natives';
    this.emisor = new EventEmitter();
    this.progressBar = null;
  }

  async down(url, dir, name) {
    return new Promise((resolve, reject) => {
      const req = https.get(url, { timeout: 10000 }, (res) => {
        const filePath = path.join(dir, name);
        const writeToFile = fs.createWriteStream(filePath);
        res.pipe(writeToFile);
        writeToFile.on('finish', resolve);
        writeToFile.on('error', reject);
      });
      req.on('error', reject);
    });
  }

  async downloadFileWithProgress(url, dir, name) {
    return new Promise((resolve, reject) => {
      const req = https.get(url, { timeout: 10000 }, (res) => {
        const filePath = path.join(dir, name);
        const writeToFile = fs.createWriteStream(filePath);
        const totalSize = parseInt(res.headers['content-length'], 10);
        let downloadedSize = 0;

        if (!this.progressBar) {
          this.progressBar = this.progressBar.create(totalSize, 0);
        }

        res.on('data', (chunk) => {
          downloadedSize += chunk.length;
          this.progressBar.update(downloadedSize);
        });

        res.pipe(writeToFile);

        writeToFile.on('finish', () => {
          this.progressBar.stop();
          resolve();
        });

        writeToFile.on('error', reject);
      });

      req.on('error', reject);
    });
  }

  async getVersions(type) {
    return new Promise((resolve, reject) => {
      https.get(this.url.meta, (res) => {
        let data = '';
        res.on('data', (chunk) => {
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
              reject(new Error("Error when obtaining available versions."));
              break;
          }
        });
      });
    });
  }

  async #downloadVersion() {
    await this.emisor.emit('downloadFiles', 'Downloading main files.');
    if (!fs.existsSync(path.join(this.root, this.cache, 'json'))) fs.mkdirSync(path.join(this.root, this.cache, 'json'), { recursive: true });
    await this.downloadFileWithProgress(this.url.meta, path.join(this.root, this.cache, 'json'), 'version_manifest.json');

    if (fs.existsSync(path.join(this.root, this.cache))) {
      let ver = JSON.parse(fs.readFileSync(path.join(this.root, this.cache, 'json', 'version_manifest.json'), { encoding: 'utf-8' }));
      const verJson = ver.versions.find(x => x.type === 'release' && x.id === this.version).url;
      if (!verJson) throw "La version no existe.";

      if (!fs.existsSync(path.join(this.root, this.versions, this.version))) {
        fs.mkdirSync(path.join(this.root, this.versions, this.version), { recursive: true });
      }

      await this.downloadFileWithProgress(verJson, path.join(this.root, this.versions, this.version), `${this.version}.json`);
    }
  }

  async #downloadClient() {
    await this.emisor.emit('downloadFiles', 'Downloading client.');
    this.file = path.join(this.root, this.versions, this.version, `${this.version}.json`);
    this.file = JSON.parse(fs.readFileSync(this.file, { encoding: 'utf-8' }));
    const client = this.file.downloads.client.url;

    if (!fs.existsSync(path.join(this.root, this.versions, this.version))) {
      fs.mkdirSync(path.join(this.root, this.versions, this.version));
    }

    await this.downloadFileWithProgress(client, path.join(this.root, this.versions, this.version), `${this.version}.jar`);
  }

  async #downloadAssets() {
    await this.emisor.emit('downloadFiles', 'Downloading assets.');
    if (!fs.existsSync(path.join(this.root, this.assets, 'indexes'))) {
      fs.mkdirSync(path.join(this.root, this.assets, 'indexes'), { recursive: true });
    }

    await this.downloadFileWithProgress(this.file.assetIndex.url, path.join(this.root, this.assets, 'indexes'), `${this.version}.json`);
    await this.downloadFileWithProgress(this.file.assetIndex.url, path.join(this.root, this.cache, 'json'), `${this.version}.json`);

    const assetFile = JSON.parse(fs.readFileSync(path.join(this.root, this.assets, 'indexes', `${this.version}.json`)));
    if (!fs.existsSync(path.join(this.root, this.assets, 'objects'))) {
      fs.mkdirSync(path.join(this.root, this.assets, 'objects'));
    }

    const totalAssets = Object.keys(assetFile.objects).length;
    let completedAssets = 0;

    for (const key in assetFile.objects) {
      const fileName = assetFile.objects[key];
      const fileHash = fileName.hash;
      const fileSubHash = fileHash.substring(0, 2);

      if (!fs.existsSync(path.join(this.root, this.assets, 'objects', fileSubHash))) {
        fs.mkdirSync(path.join(this.root, this.assets, 'objects', fileSubHash));
      }

      await this.downloadFileWithProgress(`${this.url.resource}/${fileSubHash}/${fileHash}`, path.join(this.root, this.assets, 'objects', fileSubHash), fileHash);
      completedAssets++;
      this.progressBar.update(completedAssets, { total: totalAssets });
    }
  }

  async #downloadNatives() {
    await this.emisor.emit('downloadFiles', 'Downloading natives.');
    if (!fs.existsSync(path.join(this.root, this.natives))) {
      fs.mkdirSync(path.join(this.root, this.natives));
    }
  
    for (const element of this.file.libraries) {
      const el = element.downloads.classifiers;
      if (el) { // Verificar si el existe
        const natives = el['natives-windows'] || el['natives-windows-64'];
        if (natives) {
          await this.downloadFileWithProgress(natives.url, path.join(this.root, this.natives), path.basename(natives.path));
  
          if (this.version === '1.8' && natives.url.includes('nightly')) {
            fs.unlinkSync(path.join(this.root, this.natives, path.basename(natives.path)));
          } else {
            new Zip(path.join(this.root, this.natives, path.basename(natives.path))).extractAllTo(path.join(this.root, this.natives, this.version), true);
            fs.unlinkSync(path.join(this.root, this.natives, path.basename(natives.path)));
          }
        }
      }
    }
  }
  

  async #downloadLibraries() {
    await this.emisor.emit('downloadFiles', 'Downloading libraries.');
    if (!fs.existsSync(path.join(this.root, this.libraries))) {
      fs.mkdirSync(path.join(this.root, this.libraries));
    }

    for (const element of this.file.libraries) {
      if (element.downloads.artifact) {
        const jarFile = element.downloads.artifact.path;
        const parts = jarFile.split('/');
        parts.pop();
        const libRoot = parts.join('/');
        const libName = path.basename(jarFile);

        if (!fs.existsSync(path.join(this.root, this.libraries, libRoot))) {
          fs.mkdirSync(path.join(this.root, this.libraries, libRoot), { recursive: true });
        }

        await this.downloadFileWithProgress(element.downloads.artifact.url, path.join(this.root, this.libraries, libRoot), libName);
      }
    }
  }

  emisor(event, args) {
    this.emisor.emit(event, ...args);
  }

  on(event, callback) {
    this.emisor.on(event, callback);
  }

  async download(version, root) {
    this.version = version;
    this.root = root;
    this.progressBar = new MultiBar({ format: '{bar} | {percentage}% | {value}/{total} Files', clearOnComplete: false, hideCursor: true });

    return new Promise(async (resolve, reject) => {
      if (!version) {
        reject(new Error("No version has been provided"));
      }

      await this.#downloadVersion();
      await this.#downloadClient();
      await this.#downloadAssets();
      await this.#downloadLibraries();
      await this.#downloadNatives();

      this.emisor.emit('downloadFiles', 'All files are downloaded.');
      this.progressBar.stop();
      resolve();
    });
  }
}

module.exports = Downloader;
