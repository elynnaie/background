/*
 * Issues:
 *
 * 1. Everything is in one file. Maybe not a huge issue? Could be better organized.
 * 2. Indentation hell. How do you avoid this in JS?
 * 3. Setting background is not cross-platform / relies on exec'ing feh. wallpaper package did not work.
 */
require('dotenv').config();
const nodeFetch = require('node-fetch');
const { createApi } = require('unsplash-js');
const fs = require('fs');
const https = require('https');
const { exec } = require("child_process");
const schedule = require('node-schedule');
const os = require('os');
const yargs = require('yargs');
const { getSunrise, getSunset } = require('sunrise-sunset-js')
const { Navigator } = require("node-navigator");

const navigator = new Navigator();

const argv = yargs
    .option('theme', {
        alias: 't',
        description: 'Theme of image to get',
        default: 'pink',
        type: 'string',
    })
    .help()
    .alias('help', 'h')
    .argv;

async function getCoords() {
    return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition((success, error) => {
            if (error) {
                reject(error);
            }
            resolve(success);
        });
    });
}

async function loop()
{
    const coords = await getCoords();
    const sunset = getSunset(coords.latitude, coords.longitude);
    console.log(sunset);
    return;

    const unsplash = createApi({
      accessKey: process.env.UNSPLASH_API_ACCESS_KEY,
      fetch: nodeFetch,
    });

    schedule.scheduleJob('*/1 * * * *', function(){
        console.log('Querying random image...');

        unsplash.photos.getRandom(
            {
                query: argv.theme,
                orientation: 'landscape',
            }
        ).then(result => {
            if (result.errors) {
                console.error('Error occurred while fetching random image ', result.errors[0]);
            } else {
                const photo = result.response;

                console.log('Downloading image...');
                https.get(photo.urls.regular, (res) => {
                    const path = `${os.tmpdir()}/wallpaper`;
                    const filePath = fs.createWriteStream(path);
                    res.pipe(filePath);
                    filePath.on('finish',() => {
                        filePath.close();

                        console.log('Tracking download...');
                        unsplash.photos.trackDownload({
                            downloadLocation: photo.links.download_location,
                        });

                        console.log('Setting wallpaper...');
                        exec(`feh --bg-scale ${os.tmpdir()}/wallpaper`, (error, stdout, stderr) => {
                            if (error) {
                                console.error(`Error setting wallpaper: ${error.message}`);
                                return;
                            }
                            if (stderr) {
                                console.error(`Error setting wallpaper: ${stderr}`);
                                return;
                            }
                        });
                    })
                });
            }
        });
    });
}

loop();
