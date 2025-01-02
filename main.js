const WEBP = require('webp-converter'); // webp convertor library
const PATH = require('path');
const fs = require('fs');
const EventEmitter = require('events');
const {
    execSync
} = require('child_process');
const process = require('process');
const { log, debug } = require('console');
const os = require('os')

WEBP.grant_permission();
console.log(process.argv);
// process.argv[2] is the first argument that is passed in the CLI batch command
let source = process.argv[2];
// source is parsed to extract the full path of the parent directory and appends the process.argv[3] (2nd CLI arg)
let sink = source.substring(0, source.lastIndexOf('\\')) + '\\' + process.argv[3];
let overWriteSource = process.argv[4];
console.log(overWriteSource);

console.info(`SOURCE DIRECTORY: ${source}`);
console.info(`TARGET DIRECTORY: ${sink}`);

let files = getFiles(source);
if (overWriteSource === undefined) create_dir(source, sink);

convert(files, source, process.argv[3]);




/**
 * @param {String} source 
 * @param {Stirng} target 
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

async function convert(files, sourceRootDir, targetFolderRootDir) {

    let imageCount = 0;
    let totalImages = files.length;


    let TotalSizes = {
        sourceDir: 0,
        sinkDir: 0,

        /**
         * 
         * @param {BigInt} src - size in BYTES
         * @param {BigInt} sink - size in BYTES
         */
        updateSizes(src, sink) {
            this.sourceDir += src/1000;
            this.sinkDir += sink/1000;
        },

        compressionFactor() {
            return this.sourceDir/this.sinkDir;
        }
    };

    async function processBatch(batch) {
        let promises = []
        for (const file of batch) {
            let sourcePath = PATH.parse(file);
            let targetPath = `${sourcePath.dir}\\${sourcePath.name}.webp`;
        
            // skip files types other than images
            if (!(sourcePath.ext.toLowerCase() === '.jpg' || sourcePath.ext.toLowerCase() === '.png' || sourcePath.ext.toLowerCase() === '.tif' || sourcePath.ext.toLowerCase() === '.jpeg' || sourcePath.ext.toLowerCase() === '.heic')) {
                continue;
            };
    
            sourcePath.ext = '.webp';
            targetPath = `${sourcePath.dir}\\${sourcePath.name}.webp`;
    
            targetPath = targetPath.replace(`\\${sourceRootDir.substr(sourceRootDir.lastIndexOf('\\') + 1)}\\`, `\\${targetFolderRootDir}\\`);
            if (fs.existsSync(targetPath)) {
                console.log(`Skipping file: ${file}`);
                console.error('file already exists');
                continue;
            }

            imageCount++;
            let inputFileSize = fs.statSync(PATH.format(sourcePath)).size;
    
            if (overWriteSource !== undefined) {
                sourcePath.base = sourcePath.base.split(".")[0] + ".webp"
                log(PATH.format(sourcePath))
                fs.renameSync(file,PATH.format(sourcePath));
                promises.push(convertActualImage(imageCount, totalImages, PATH.format(sourcePath), PATH.format(sourcePath), inputFileSize, TotalSizes));
    
            }
            else {
                promises.push(convertActualImage(imageCount, totalImages, file, targetPath, inputFileSize, TotalSizes));
                log(sourcePath, file)
    
    
            }
    
    }
        await Promise.all(promises)


    }

    
    const BATCH_SIZE = os.cpus().length - 2

    let batchIndex = 0;
    while (batchIndex * BATCH_SIZE < files.length) {
        const start = batchIndex * BATCH_SIZE;
        const end = start + BATCH_SIZE;
        const batch = files.slice(start, end);

        console.log(`Processing batch ${batchIndex + 1}/${Math.ceil(files.length / BATCH_SIZE)}...`);
        await processBatch(batch); // Process the current batch
        batchIndex++;
    }
    '-q 75 -pass 10 -f 100 -sns 100 -mt -m 6 -alpha_q 50'
    "-lossless -z 9 -m 6 -mt"
    '-q 75 -pass 10 -f 100 -sns 100 -resize 600 900 -mt -m 6 -alpha_q 50'

    console.debug(`TOTAL COMPRESSION FACTOR: ${TotalSizes.compressionFactor()}\n
                    SOURCE SIZE: ${TotalSizes.sourceDir}\n
                    SINK SIZE: ${TotalSizes.sinkDir}`);


}

async function convertActualImage(imageCount, totalImages, file, targetPath, inputFileSize, TotalSizes) {
    console.log(`Converting Image ${imageCount} of ${totalImages}`);
    WEBP.cwebp(file, targetPath, '-q 75 -pass 10 -f 100 -sns 100 -mt -m 6 -alpha_q 50', '-v')
        .then(response => {
            console.log(response.replace('File:', `Input Size: ${inputFileSize} bytes\n:`));
            let outputFileSize = fs.statSync(targetPath).size;
            console.info(`Comppression Factor: ${inputFileSize / outputFileSize}`);
            TotalSizes.updateSizes(inputFileSize, outputFileSize);
        });
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