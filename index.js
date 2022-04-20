const csv = require('fast-csv');
const fs = require('fs');
const path = require('path');
const pdf_extract = require('pdf-extract');
const xlsx = require('xlsx')
const pg = require('pg');
const {v4} = require('uuid');

const failedToProcess = [];
    // 'C:\\Users\\Logan\\Downloads\\Open Records Reference Docs\\FOIAs reduced\\H  LS  06.01.21\\DocumentsReport-57.pdf'
// ];

const folderMap = {
    A: {
      path: 'C:\\Users\\Logan\\Downloads\\Open Records Reference Docs\\FOIAs reduced\\A  SV 11.30.20',
      date: '11.30.20'
    },
    B: {
      path: 'C:\\Users\\Logan\\Downloads\\Open Records Reference Docs\\FOIAs reduced\\B  SV  11.12.21',
      date: '11.12.21'
    },
    C: {
      path: 'C:\\Users\\Logan\\Downloads\\Open Records Reference Docs\\FOIAs reduced\\C  SV  10.08.21',
      date: '10.08.21'
    },
    D: {
      path: 'C:\\Users\\Logan\\Downloads\\Open Records Reference Docs\\FOIAs reduced\\D-F  WT  03.04.21\\D  Walz Energy',
      date: '03.04.21'
    },
    E: {
      path: 'C:\\Users\\Logan\\Downloads\\Open Records Reference Docs\\FOIAs reduced\\D-F  WT  03.04.21\\E  Walz Energy Emails',
      date: '03.04.21'
    },
    F: {
      path: 'C:\\Users\\Logan\\Downloads\\Open Records Reference Docs\\FOIAs reduced\\D-F  WT  03.04.21\\F  Walz Energy Field Office',
      date: '03.04.21'
    },
    G: {
      path: 'C:\\Users\\Logan\\Downloads\\Open Records Reference Docs\\FOIAs reduced\\G  CS  04.19.21',
      date: '04.19.21'
    },
    H: {
      path: 'C:\\Users\\Logan\\Downloads\\Open Records Reference Docs\\FOIAs reduced\\H  LS  06.01.21',
      date: '06.01.21'
    },
    I: {
      path: 'C:\\Users\\Logan\\Downloads\\Open Records Reference Docs\\FOIAs reduced\\I  LS  08.17.21',
      date: '8.17.21'
    },
    J: {
      path: 'C:\\Users\\Logan\\Downloads\\Open Records Reference Docs\\FOIAs reduced\\J-U  GS  10.01.17\\J  2017 6 14 SWPPP 1stReview',
      date: '10.01.17'
    },
    K: {
      path: 'C:\\Users\\Logan\\Downloads\\Open Records Reference Docs\\FOIAs reduced\\J-U  GS  10.01.17\\K  2017 6 20 SWPPP 2ndSubmittal',
      date: '10.01.17'
    },
    L: {
      path: 'C:\\Users\\Logan\\Downloads\\Open Records Reference Docs\\FOIAs reduced\\J-U  GS  10.01.17\\L  2017 7 5 SWPPP 3rdSubmittal_incomplete',
      date: '10.01.17'
    },
    M: {
      path: 'C:\\Users\\Logan\\Downloads\\Open Records Reference Docs\\FOIAs reduced\\J-U  GS  10.01.17\\M  2017 7 28 Prep for Senator Zumbach',
      date: '10.01.17'
    },
    N: {
      path: 'C:\\Users\\Logan\\Downloads\\Open Records Reference Docs\\FOIAs reduced\\J-U  GS  10.01.17\\N  2017 8 4 SWPPP 4thSubmittal',
      date: '10.01.17'
    },
    O: {
      path: 'C:\\Users\\Logan\\Downloads\\Open Records Reference Docs\\FOIAs reduced\\J-U  GS  10.01.17\\O  2017 8 SWPPP 5th time comments',
      date: '10.01.17'
    },
    P: {
      path: 'C:\\Users\\Logan\\Downloads\\Open Records Reference Docs\\FOIAs reduced\\J-U  GS  10.01.17\\P  2017 11 29 WALZ Energy_Information Requests',
      date: '10.01.17'
    },
    Q: {
      path: 'C:\\Users\\Logan\\Downloads\\Open Records Reference Docs\\FOIAs reduced\\J-U  GS  10.01.17\\Q  2017 12 18 SWPPP 6th submittal',
      date: '10.01.17'
    },
    R: {
      path: 'C:\\Users\\Logan\\Downloads\\Open Records Reference Docs\\FOIAs reduced\\J-U  GS  10.01.17\\R  DRAFT Permit',
      date: '10.01.17'
    },
    S: {
      path: 'C:\\Users\\Logan\\Downloads\\Open Records Reference Docs\\FOIAs reduced\\J-U  GS  10.01.17\\S  FINAL Permit',
      date: '10.01.17'
    },
    T: {
      path: 'C:\\Users\\Logan\\Downloads\\Open Records Reference Docs\\FOIAs reduced\\J-U  GS  10.01.17\\T-U  PUBLIC COMMENTS',
      date: '10.01.17',
      recursive: false
    },
    U: {
      path: 'C:\\Users\\Logan\\Downloads\\Open Records Reference Docs\\FOIAs reduced\\J-U  GS  10.01.17\\T-U  PUBLIC COMMENTS\\U  Public Comments-Website Generated',
      date: '10.01.17'
    },
    V: {
      path: 'C:\\Users\\Logan\\Downloads\\Open Records Reference Docs\\FOIAs reduced\\V  SV  10.27.20',
      date: '10.27.20'
    },
    W: {
      path: 'C:\\Users\\Logan\\Downloads\\Open Records Reference Docs\\FOIAs reduced\\W  SV 11.06.20',
      date: '11.06.20'
    }
};


function *walkSync(dir, recursive) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    if (file.isDirectory() && recursive) {
      yield* walkSync(path.join(dir, file.name), recursive);
    } else if (!file.isDirectory()) {
      yield path.join(dir, file.name);
    }
  }
}

function getFiles(dir, recursive = true) {
    const files = [];

    for (const filePath of walkSync(dir, recursive)) {
      files.push(filePath);
    }

    return files;
}

function *walkDirSync(dir, recursive) {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    for (const file of files) {
        if (file.isDirectory() && recursive) {
            yield* walkDirSync(path.join(dir, file.name), true);
            yield path.join(dir, file.name);
        }
    }
}
  
function getFolders(dir, recursive = true) {
    const folders = [];

    for (const filePath of walkDirSync(dir, recursive)) {
        folders.push(filePath);
    }

    return folders;
}

function extractText(filePath) {
    const absolute_path_to_pdf = path.resolve(filePath)
    // if (absolute_path_to_pdf.includes(" ")) throw new Error("will fail for paths w spaces like "+absolute_path_to_pdf)

    const options = {
        type: 'text', // extract searchable text from PDF
        ocr_flags: ['--psm 1'], // automatically detect page orientation
        enc: 'UTF-16',  // optional, encoding to use for the text output
        clean: true,
        mode: 'layout' // optional, mode to use when reading the pdf
    }

    return new Promise((resolve, reject) => {
        const processor = pdf_extract(absolute_path_to_pdf, options, () => {});
        
        processor.on('complete', resolve);
        processor.on('error', (err) => { console.error(err); reject(err) });
    });
}

async function getFriendlyText(filePath) {
    const {text_pages} = await extractText(filePath);
    const cleanup = text_pages.map(str => str.replaceAll('\f', ''));
    
    return cleanup.join('\n');
}

async function getFileText(filePath) {
    const asString = await getFriendlyText(filePath);

    if (asString.trim() === '') {
        console.log('Not searchable');

        const fileDir = 'C:\\Users\\Logan\\Downloads\\Open Records Reference Docs\\FOIAs reduced';
        const searchableDir = 'C:\\Users\\Logan\\Downloads\\Output';
        const filename = filePath.replace(/^.*[\\\/]/, '');
        const replaced = filePath.replace(fileDir, searchableDir);
        const searchableFilepath = replaced.replace(filename, 'SEARCHABLE-' + filename);

        if (fs.existsSync(searchableFilepath)) {
            const searchableText = await getFriendlyText(searchableFilepath);
            
            return {
                fileContent: searchableText,
                fileData: '\\x' + fs.readFileSync(searchableFilepath, 'hex')
            };
        } else {
            throw new Error("A searchable pdf was not found for " + filePath);
        }
    } else {
        console.log('Searchable');

        return {
            fileContent: asString,
            fileData: '\\x' + fs.readFileSync(filePath, 'hex')
        };
    }
}

async function readCsv(filePath) {
    const rows = [];

    return new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
            .pipe(csv.parse({ headers: true }))
            .on('error', reject)
            .on('data', row => { rows.push(row) })
            .on('end', () => resolve(rows));
    });
}

async function readXlsx(filePath) {
    const workbook = xlsx.readFile(filePath);
    const sheet_name_list = workbook.SheetNames;
    const xlData = xlsx.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);

    return xlData;
}

async function processFile(filePath) {
    console.log('Processing ' + filePath);

    const content = await getFileText(filePath);

    return content;
}

async function processFiles(client) {
    await client.connect();
    const folderCsv = 'C:/Users/Logan/Downloads/Folder organization.xlsx - OR Identifiers.csv';
    const fileSummaryDir = 'C:/Users/Logan/Downloads/Files Summaries/Files Summaries';

    const folders = await readCsv(folderCsv);
    const fileSummaryXlsx = getFiles(fileSummaryDir);
    
    const folderDict = {};
    for (const filePath of fileSummaryXlsx) {
        const filename = filePath.replace(/^.*[\\\/]/, '');
        const fileNames = await readXlsx(filePath);
        const folderLetter = filename.split(' ')[1];

        folderDict[folderLetter] = {}

        fileNames.forEach((details) => {
            folderDict[folderLetter][details['File name']] = {
                sbrId: details['SBR ID'],
                orRequestor: details['OR Request'],
                fileName: details['File name']
            };
        });
    }

    
    for (const folderLetter of Object.keys(folderMap)) {
        const folderDetails = folderMap[folderLetter];
        const recursive = folderMap[folderLetter].hasOwnProperty('recursive') ? folderMap[folderLetter].recursive : true; 
        const files = getFiles(folderDetails.path, recursive);


        for (const [i, file] of files.entries()) {
            const fileName = path.basename(file);
            // console.log(file);
            
            let fileDetails = {};

            if (folderLetter === 'V') {
                fileDetails = {
                    sbrId: 'V' + String(i + 1).padStart('0', 3),
                    orRequestor: 'SV',
                    fileName
                };
            } else if (folderLetter === 'W') {
                fileDetails = {
                    sbrId: 'W' + String(i + 1).padStart('0', 3),
                    orRequestor: 'SV',
                    fileName
                };
            } else {
                if (!folderDict[folderLetter][fileName]) {
                    throw new Error('File not found: ' + file);
                }
                fileDetails = folderDict[folderLetter][fileName];
            }

            fileDetails.date = folderDetails.date;

            const documentSearch = await client.query({
                text: 'SELECT * FROM public."Document" WHERE "sbrId" = $1',
                values: [fileDetails.sbrId]
            });

            const [existingDocument] = documentSearch.rows;

            if (existingDocument) {
                if (failedToProcess.find(filePath => filePath === file)) {
                    console.log('Skipping: ' + file);
                } else {
                    const documentContentSearch = await client.query({
                        text: 'SELECT * FROM public."DocumentContent" WHERE "documentId" = $1',
                        values: [existingDocument.id]
                    });
    
                    const [existingDocumentContent] = documentContentSearch.rows;
    
                    if (!existingDocumentContent) {
                        console.log('Document Content not found for: ' + file);
                        const {fileContent, fileData} = await processFile(file);
    
                        await client.query({
                            text: 'INSERT INTO public."DocumentContent"("id", "documentId", "textSearch", "text", "file") VALUES($1, $2, to_tsvector($3), $4, $5)',
                            values: [v4(), existingDocument.id, fileContent, fileContent, fileData]
                        });
                    }
                }

            } else {
                await client.query({
                    text: 'INSERT INTO public."Document"("id", "sbrId", "orRequestor", "orRequestDate", "fileName", "pages", "path", "driveId") VALUES($1, $2, $3, $4, $5, $6, $7, $8)',
                    values: [v4(), fileDetails.sbrId, fileDetails.orRequestor, new Date(fileDetails.date), fileDetails.fileName, 0, "", ""]
                });
            }
            // console.log(test);
            // console.log(fileDetails);
        }
    }

    client.end();
    // await processFile(files[2]);
}

const fileDir = 'C:/Users/Logan/Downloads/Open Records Reference Docs/FOIAs reduced';
const files = getFiles(fileDir);

const client = new pg.Client({
  host: 'localhost',
  port: 5432,
  database: 'sbr',
  user: 'postgres',
  password: 'admin',
})

processFiles(client);
