import PATH from "path";
import FormData from "form-data"
import fs from "node:fs"
import chalk from "chalk"
import inquirer from "inquirer";

const HOST = "http://localhost:9123"
const FILE_SERVER_PUBLIC_API = `${HOST}/fileserver_public__api`
const FILE_SERVER_PRIVATE_API_UPLOAD = `${HOST}/fileserver_private__api/file/upload`

const PATH_FROM_ARGUMENTS = process.argv[3]
const PRESET = process.argv[2]

const SETTINGS_BY_PRESET = {
  "high-quality-webp": {
    queryString: "quality=90&format=webp",
    filePostfix: "_high.webp"
  },
  "low-quality-jpg": {
    queryString: "quality=20&width=50&height=50&format=jpg",
    filePostfix: "_low.jpg"
  }
}

const HEADERS = {
  "X-Message-Metadata": "eyJzZXJ2aWNlQWNjZXNzVG9rZW4iOiI3MmNlYWU3My0wNmQxLTRhYTEtOWM5Mi0yOWMwMDhmM2ZiYWEifQ==",
  "Content-Type": "application/json"
}

const IMAGE_PROXY_RESTRICTIONS = JSON.stringify({
  "path": "temp",
  "restrictions": [
    {
      "argName": "width",
      "min": 50,
      "max": 3000,
      "step": 10
    },
    {
      "argName": "height",
      "min": 50,
      "max": 2000,
      "step": 10
    },
    {
      "argName": "quality",
      "min": 20,
      "max": 90,
      "step": 10
    }
  ]
})

const EXTENSIONS = [".jpeg", ".jpg", ".png"];

const chooseFiles = async (path) => {
  if (fs.statSync(path).isFile()) {
    const file = PATH.parse(path)
    if (!EXTENSIONS.includes(file.ext)) {
      console.log(chalk.yellow(`File must have one of the following extensions: ${EXTENSIONS.join(", ")}`))
      return []
    }

    return [{
      filename: file.base,
      filepath: path
    }]
  }

  const choices = fs.readdirSync(path)
    .filter((file) => EXTENSIONS.some((ext) => file.endsWith(ext)))
    .map((filepath) => {
      const file = PATH.parse(filepath)
      const value = {
        filename: file.base,
        filepath: PATH.join(path, filepath),
      }
      return ({value, name: file.base})
    });

  if (choices.length === 0) {
    console.log(chalk.yellow(`Folder does not contain files with the following extensions: ${EXTENSIONS.join(", ")}`))
    return []
  }

  const answers = await inquirer.prompt({
    name: "Choose Files",
    type: "checkbox",
    choices: choices
  })

  return answers["Choose Files"]
}

const dropImageProxyRestrictions = async () => {
  const response = await fetch("http://localhost:9161/rpc/sumstats.imageproxy.command.upsert_arg_restrictions", {
    body: IMAGE_PROXY_RESTRICTIONS,
    headers: HEADERS,
    method: "POST"
  }).catch((e) => {
    return {
      ok: false,
      statusText: e.message
    }
  })

  if (!response.ok) {
    console.log(chalk.red(response.statusText))
    return false
  }
  const json = await response.json()
  if (Array.isArray(json) && json[0].message) {

    console.log(chalk.red(json[0].message))
    return false
  }

  return response.ok
}

const uploadFiles = async (filesProps) => {
  const form = new FormData()

  filesProps.forEach(({filepath, filename}) => {
    form.append(filename, fs.createReadStream(filepath))
  })

  return await new Promise((resolve) => {
    let uploadedFiles = []

    form.submit(FILE_SERVER_PRIVATE_API_UPLOAD, async (err, res) => {

      if (res?.statusCode !== 200) {
        console.log(chalk.red(`Status code: ${res.statusCode}`))
        resolve(uploadedFiles)
      }

      if (err) {
        console.log(chalk.red(err))
        resolve(uploadedFiles)
      }

      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          uploadedFiles = JSON.parse(data)
        } catch (e) {
          console.log(chalk.red(e))
        }
        resolve(uploadedFiles)
      });
    })
  })
}

const downloadFilesAndSave = async (uploadedFiles, {queryString, filePostfix}) => {
  for (const file of uploadedFiles) {
    const {pathToFile, originName, originPath} = file

    const urlToFetch = `${FILE_SERVER_PUBLIC_API}/${pathToFile}?${queryString}`

    await fetch(urlToFetch).then(async (res) => {
      if (!res.ok) {
        console.log(urlToFetch + " - " + res.statusText)
        return false
      }

      const buffer = await res.arrayBuffer()

      const name = originName + filePostfix

      fs.writeFileSync(PATH.join(PATH.dirname(originPath), `./${name}`), Buffer.from(buffer))

      console.log(chalk.green(`${name} Saved`))
    })
  }

  return true
}

const run = async () => {
  if (PATH_FROM_ARGUMENTS === undefined) {
    console.log(chalk.yellow("Path is not specified"))
    return
  }

  const settings = SETTINGS_BY_PRESET[PRESET]
  if (settings === undefined) {
    console.log(chalk.yellow(`Invalid settings preset, possible preset: ${Object.keys(SETTINGS_BY_PRESET).join(", ")}`))
    return
  }

  const filesToUpload = await chooseFiles(PATH_FROM_ARGUMENTS)
  if (filesToUpload.length === 0) {
    console.log(chalk.yellow("0 files have been chosen"))
    return
  }
  console.log(chalk.blue(`Ready to upload ${filesToUpload.length} ${filesToUpload.length > 1 ? "files" : "file"}`))

  if (PRESET === "low-quality-jpg") {
    const dropped = await dropImageProxyRestrictions()
    if (dropped === false) {
      console.log(chalk.yellow("Image Proxy restrictions did not dropped"))
    } else {
      console.log(chalk.blue("Image Proxy restrictions dropped"))
    }
  }

  const uploadedFiles = await uploadFiles(filesToUpload)
  if (uploadedFiles.length === 0) {
    console.log(chalk.yellow("0 files have been uploaded"))
    return
  }
  console.log(chalk.blue(`Uploaded ${uploadedFiles.length} ${uploadedFiles.length > 1 ? "files" : "file"}`))

  const files = uploadedFiles.map((file) => {
    const originFile = filesToUpload.find((it) => it.filename === file.originName)
    return {
      ...file,
      originPath: originFile.filepath
    }
  })

  const downloadedOrSaved = await downloadFilesAndSave(files, settings)
  if (downloadedOrSaved === false) {
    console.log(chalk.yellow("files did not downloaded or saved"))
  }
}

run()
