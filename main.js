const WEBP = require('webp-converter'); // webp convertor library
const PATH = require('path');
const fs = require('fs');
const EventEmitter = require('events');
const {
    execSync,
    exec
} = require('child_process');
const process = require('process');
const { log, debug } = require('console');
const os = require('os')







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


class TotalSizes {
    sourceDir= 0
    sinkDir= 0

    constructor(){

    }
    /**
     * 
     * @param {BigInt} src - size in BYTES
     * @param {BigInt} sink - size in BYTES
     */
    updateSizes(src, sink) {
        this.sourceDir += src/1000;
        this.sinkDir += sink/1000;
    }

    compressionFactor() {
        return this.sourceDir/this.sinkDir;
    }
};

// PS C:\Users\omers> ffmpeg -i .\C0001.MP4 -c:v libvpx-vp9 -crf 15 -c:a libopus output-auto-br-2pass.webm
/**
 * 
 * @param {Array<PATH.ParsedPath>} videoFiles list of images files 
 * @param {String} sourceRootDir 
 * @param {Stirng} targetFolderRootDir 
 */
async function convertVideos(videoFiles, sourceRootDir, targetFolderRootDir){
    let videoCount = 0
    let totalVideos = videoFiles.length

    let totalSizes = new TotalSizes()

    for (const file of videoFiles) {
        let sourcePath = file
        let targetPath = `${sourcePath.dir}\\${sourcePath.name}.webm`;


        videoCount++
        targetPath = targetPath.replace(`\\${sourceRootDir.substring(sourceRootDir.lastIndexOf('\\') + 1)}\\`, `\\${targetFolderRootDir}\\`);
        
        if (fs.existsSync(targetPath)) {
            console.log(`Skipping file: ${PATH.format(sourcePath)}`);
            console.error('converted file already exists');
            continue;
        }

        let inputFileSize = fs.statSync(PATH.format(sourcePath)).size;


        if (overWriteSource !== undefined) {
            log(PATH.format(sourcePath))
            console.log(`Converting Video ${videoCount} of ${totalVideos}`);
            convertVideoToWebm(PATH.format(sourcePath), targetPath, inputFileSize, totalSizes);
            sourcePath.base = sourcePath.base.split(".")[0] + ".webm"
            fs.copyFile(targetPath,PATH.format(sourcePath),copyFileCallBack)

        }
        else {
            // create the desitination target path in the output folder
            console.log(`Converting Video ${videoCount} of ${totalVideos}`);
            convertVideoToWebm(PATH.format(sourcePath), targetPath, inputFileSize, totalSizes)

        }

    }

        console.debug(`TOTAL COMPRESSION FACTOR: ${totalSizes.compressionFactor()}\n
        SOURCE SIZE: ${totalSizes.sourceDir}\n
        SINK SIZE: ${totalSizes.sinkDir}`);

        function copyFileCallBack(err) {
            if (err) log(`Error Copying File ${PATH.format(sourcePath)}\n${err}`)
            else log(`Copied File ${PATH.format(sourcePath)}`)
        }
}

/**
 * 
 * @param {String} sourcePath 
 * @param {String} targetPath 
 * @param {BigInt} inputFileSize 
 * @param {TotalSizes} totalSizes 
 */
function convertVideoToWebm(sourcePath, targetPath, inputFileSize, totalSizes) {
    execSync(`ffmpeg -i "${sourcePath}" -c:v libvpx-vp9 -crf 25 -c:a libopus -vbr off -b:a 256k -application voip -threads 8 "${targetPath}"`,{stdio: 'inherit'});
    let outputFileSize = fs.statSync(targetPath).size;
    console.info(`Comppression Factor: ${inputFileSize / outputFileSize}`);
    totalSizes.updateSizes(inputFileSize, outputFileSize);
}

/**
 * 
 * @param {Array<PATH.ParsedPath>} imageFiles list of images files 
 * @param {String} sourceRootDir 
 * @param {String} targetFolderRootDir 
 * @param {Number} BATCH_SIZE 
 */
async function convertImages(imageFiles, sourceRootDir, targetFolderRootDir, BATCH_SIZE = os.cpus().length - 2) {

    let imageCount = 0;
    let totalImages = imageFiles.length;


    let totalSizes = new TotalSizes()


    /**
     * 
     * @param {Array<PATH.ParsedPath>} batch 
     */
    async function processBatch(batch) {
        let promises = []
        for (const file of batch) {
            let sourcePath = file
            let targetPath = `${sourcePath.dir}\\${sourcePath.name}.webp`;
            
            targetPath = targetPath.replace(`\\${sourceRootDir.substring(sourceRootDir.lastIndexOf('\\') + 1)}\\`, `\\${targetFolderRootDir}\\`);
            imageCount++;
            if (fs.existsSync(targetPath)) {
                console.log(`Skipping file: ${PATH.format(sourcePath)}`);
                console.error('converted file already exists');
                continue;
            }

            let inputFileSize = fs.statSync(PATH.format(sourcePath)).size;
    
            if (overWriteSource !== undefined) {
                sourcePath.base = sourcePath.base.split(".")[0] + ".webp"
                log(PATH.format(sourcePath))
                fs.renameSync(file,PATH.format(sourcePath));
                promises.push(convertImageToWebp(imageCount, totalImages, PATH.format(sourcePath), PATH.format(sourcePath), inputFileSize, totalSizes));
    
            }
            else {
                promises.push(convertImageToWebp(imageCount, totalImages, file, targetPath, inputFileSize, totalSizes));
    
    
            }
    
    }
        await Promise.all(promises)


    }

    let batchIndex = 0;
    while (batchIndex * BATCH_SIZE < imageFiles.length) {
        const start = batchIndex * BATCH_SIZE;
        const end = start + BATCH_SIZE;
        const batch = imageFiles.slice(start, end);

        console.log(`Processing batch ${batchIndex + 1}/${Math.ceil(imageFiles.length / BATCH_SIZE)}...`);
        await processBatch(batch); // Process the current batch
        batchIndex++;
    }
    '-q 75 -pass 10 -f 100 -sns 100 -mt -m 6 -alpha_q 50'
    "-lossless -z 9 -m 6 -mt"
    '-q 75 -pass 10 -f 100 -sns 100 -resize 600 900 -mt -m 6 -alpha_q 50'

    console.debug(`TOTAL COMPRESSION FACTOR: ${totalSizes.compressionFactor()}\n
                    SOURCE SIZE: ${totalSizes.sourceDir}\n
                    SINK SIZE: ${totalSizes.sinkDir}`);


}

/**
 * 
 * @param {Number} imageCount 
 * @param {Number} totalImages 
 * @param {PATH.ParsedPath} file 
 * @param {String} targetPath 
 * @param {Number} inputFileSize 
 * @param {TotalSizes} totalSizes 
 */
async function convertImageToWebp(imageCount, totalImages, file, targetPath, inputFileSize, totalSizes) {
    console.log(`Converting Image ${imageCount} of ${totalImages}`);
    await WEBP.cwebp(PATH.format(file), targetPath, '-q 75 -pass 10 -f 100 -sns 100 -mt -m 6 -alpha_q 50', '-v')
        .then(response => {
            console.log(response.replace('File:', `Input Size: ${inputFileSize} bytes\n:`));
            let outputFileSize = fs.statSync(targetPath).size;
            console.info(`Comppression Factor: ${inputFileSize / outputFileSize}`);
            totalSizes.updateSizes(inputFileSize, outputFileSize);
        });
}



/**
 * 
 * @param {String} dir full path of the parent direcory whose file contents need to be enumerated
 * @param {Array<PATH.ParsedPath>} files_ __DO NOT PASS ANYTHING FOR THIS PARAM__
 * @returns {Array<PATH.ParsedPath>} an array of parsed paths of every file in the directory
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
            files_.push(PATH.parse(name)); // fairly obvious

    }
    return files_;
}

/**
 * 
 * @param {Array<PATH.ParsedPath>} files absolute file paths
 * @returns 
 */
function seggregateMedia(files) {
    let media = {
        images: [],
        vidoes: [],
        others: []
    }
    for (let file of files) {
        if (isImage(file)) media.images.push(file)
        else if (isVideo(file)) media.vidoes.push(file)
        else media.others.push(file)
    }

    return media
}

/**
 * 
 * @param {PATH.ParsedPath} parsedPath 
 * @returns {Boolean}
 */
function isImage(parsedPath) {
    const ext = parsedPath.ext.toLowerCase()
    return ext === '.jpg' || ext === '.png' || ext === '.tif' || ext === '.jpeg' || ext === '.heic'
}


/**
 * 
 * @param {PATH.ParsedPath} parsedPath 
 * @returns {Boolean}
 */
function isVideo(parsedPath) {
    const ext =  parsedPath.ext.toLowerCase()
    return ext === '.mp4'
}


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


let {images, vidoes, others} =  seggregateMedia(files)

convertImages(images, source, process.argv[3]).then(() => convertVideos(vidoes, source, process.argv[3]).then(() => console.log(others)))
