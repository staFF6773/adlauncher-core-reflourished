const Launcher = require('./components/launcher');

const launcher = new Launcher();

// State the options with which you are going to release a version of Minecraft
const launchOptions = {
  username: 'Fae34r', // Enter your username
  version: '1.8', // Enter the version
  gameDirectory: './minecraft', // Enter the directory where you have downloaded Minecraft
  memory: {
    // Define the memory you want to use
    min: '2G', // Minimum memory
    max: '5G', // Maximum memory
  },
  java: 'C:/Program Files/Java/jdk-17/bin/java.exe', // Exact location of java.exe file (OPTIONAL)
  java8: 'C:/Program Files/Java/jre-1.8/bin/java.exe', // Exact location of the java.exe v8 file (OPTIONAL)
};

launcher.launch(launchOptions); // Starts Minecraft with the declared options
