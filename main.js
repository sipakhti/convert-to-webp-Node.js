const WEBP = require('webp-converter'); // webp convertor library
const PATH = require('path');
const fs = require('fs');
const {
    exec
} = require('child_process');
const EventEmitter = require('events');
const {
    execSync
} = require('child_process');
const process = require('process');


WEBP.grant_permission();
console.log(process.argv);
// process.argv[2] is the first argument that is passed in the CLI batch command
let source = process.argv[2];
// source is parsed to extract the full path of the parent directory and appends the process.argv[3] (2nd CLI arg)
let sink = source.substr(0, source.lastIndexOf('\\')) + '\\' + process.argv[3];
let files = getFiles(source);
create_dir(source, sink);
convert(files, source, process.argv[3]);

/**
 * 
 * @param {String} source 
 * @param {Stirng} target 
 * 
 * xcopy /t /e /i source target 
   xcopy (copy only folder structure) (copy empty directories as well) (tells the program that it is a directory)
 */

function create_dir(source, target) {
    try {
        execSync(`xcopy /t /e /i "${source}" "${target}"`);
    } catch (error) {
        console.log("XCOPY FAILED");
    }
}
async function convert(files, sourceRootName, targetFolderRootName) {

    let imageData = {
        source: [],
        target: [],
        purge() {
            this.source = [];
            this.target = [];
        }
    }

    let imageCount = 0;
    let totalImages = files.length;
    let nonImages = []
    for (const file of files) {
        imageCount++;
        let sourcePath = PATH.parse(file);
        let targetPath = sourcePath.dir + '\\' + sourcePath.name + '.webp'


        if (!(sourcePath.ext === '.jpg' || sourcePath.ext === '.png' || sourcePath.ext === '.tif' || sourcePath.ext === '.jpeg')) {
            // console.log("COPYING FILE: " + file);
            // exec(`copy "${file}" "${file.replace('\\' + sourceRootName.substr(sourceRootName.lastIndexOf('\\') + 1) + '\\', '\\' + targetFolderRootName + '\\')}"`,(error, stdout, stderr) => {
            //     // console.log("COPYING COMPLETE: " + file);
            //     if (error) console.error(error);
            //     console.log(stdout);
            //     console.timeStamp("SIPAKHTI");
            //     console.log(stderr);
            // });
            // execSync(`copy ${file} ${file.replace('\\' + sourceRootName.substr(sourceRootName.lastIndexOf('\\') + 1) + '\\', '\\' + targetFolderRootName + '\\')}`)
            continue;
        }
        sourcePath.ext = '.webp';
        targetPath = sourcePath.dir + '\\' + sourcePath.name + '.webp'
        targetPath = targetPath.replace('\\' + sourceRootName.substr(sourceRootName.lastIndexOf('\\') + 1) + '\\', '\\' + targetFolderRootName + '\\');
        if (fs.existsSync(targetPath)) {
            console.log(`Skipping file: ${file}`);
            console.error('file already exists');
            continue;
        }
        // console.log(targetPath.replace(source.substr(source.lastIndexOf('\\') + 1), target));
        // imageData.source.push(PATH.format(sourcePath));
        // imageData.target.push(targetPath);
        let size = fs.statSync(PATH.format(sourcePath)).size;
        // console.log(size);
        // if (imageData.source.length >= 2){
        //     await bulkConvert(imageData)
        //     imageData.purge();
        // }
        // if (size > 30000) continue;
        console.log(`Converting Image ${imageCount} of ${totalImages}`);
        await WEBP.cwebp(file, targetPath, '-q 75 -pass 10 -f 100 -sns 100 -mt -m 6 -alpha_q 50', '-v')
            .then(response => console.log(response.replace('File:', `Input Size: ${size} bytes\nFiles:`)))

    }
    '-q 75 -pass 10 -f 100 -sns 100 -mt -m 6 -alpha_q 50'
    "-lossless -z 9 -m 6 -mt"
    '-q 75 -pass 10 -f 100 -sns 100 -resize 600 900 -mt -m 6 -alpha_q 50'

}

async function bulkConvert(imageData) {
    let iterations = imageData.source.length;

    for (let index = 0; index < iterations; index++) {
        let size = fs.statSync(imageData.source[index]).size;
        WEBP.cwebp(imageData.source[index], imageData.target[index], '-q 75 -pass 6 -sns 100 -mt -m 6', '-v')
            .then(response => console.log(response.replace('File:', `Input Size: ${size} bytes\nFiles:`)))
    }


}
async function convertBulkImage(imageData) {

    let iterations = imageData.source.length;
    let commands = [];

    for (let index = 0; index < iterations; index++)
        commands.push(`F:\\WORK\\WebP\\webp\\bin\\cwebp.exe -q 75 -pass 6 -sns 100 -mt -m 6 -alpha_q 50 "${imageData.source[index]}" -o "${imageData.target[index]}" -v`)
    // WEBP.cwebp()
    console.log(execSync(commands.join('&&')));
    return;
}

/**
 * 
 * @param {String} dir full path of the parent direcory whose file contents need to be enumerated
 * @param {any} files_ 
 * @returns 
 */
function getFiles(dir, files_) {
    // files_ is the array that holds the filepaths
    // this array is passed recursively 
    files_ = files_ || [];
    let files = fs.readdirSync(dir); // returns a list of all subdirectories and files as relative paths
    for (let i in files) {
        let name = dir + '\\' + files[i]; // construct an absolute path
        if (fs.statSync(name).isDirectory()) // filter directory names from the list
            getFiles(name, files_); // calls itself again to restart the sequence until the leaf direcotory is found
        else
            files_.push(name); // fairly obvious

    }
    return files_;
}