require('dotenv').config();
const nodeFetch = require('node-fetch');
const { createApi } = require('unsplash-js');
const { exec } = require('child_process');
const os = require('os');
const yargs = require('yargs');
const util = require('util');
const download = require('download');
// const { getSunrise, getSunset } = require('sunrise-sunset-js');
// const { Navigator } = require('node-navigator');

// const navigator = new Navigator();

const args = yargs
  .option('theme', {
    alias: 't',
    description: 'Theme of image to get',
    default: 'pink',
    type: 'string',
  })
  .help()
  .alias('help', 'h')
  .argv;

// async function getCoords() {
//   return new Promise((resolve, reject) => {
//     navigator.geolocation.getCurrentPosition((success, error) => {
//       if (error) {
//         reject(error);
//       }
//       resolve(success);
//     });
//   });
// }

const unsplash = createApi({
  accessKey: process.env.UNSPLASH_API_ACCESS_KEY,
  fetch: nodeFetch,
});

async function getNewBackground() {
  let result;
  // const coords = await getCoords();
  // const sunset = getSunset(coords.latitude, coords.longitude);
  // console.log(sunset);
  // return;

  console.log('Querying random image...');
  try {
    result = await unsplash.photos.getRandom(
      {
        query: args.theme,
        orientation: 'landscape',
      },
    );
  } catch (errors) {
    console.error('Error occurred while fetching random image ', errors[0]);
  }

  console.log('Downloading image...');
  const photo = result.response;
  const wallpaperPath = os.tmpdir();
  const wallpaperName = 'wallpaper';

  try {
    await download(photo.urls.regular, wallpaperPath, { filename: wallpaperName });
  } catch (errors) {
    console.error('Error occurred while downloading image ', errors);
  }

  console.log('Tracking download...');
  unsplash.photos.trackDownload({
    downloadLocation: photo.links.download_location,
  });

  console.log('Setting wallpaper...');
  util.promisify(exec)(`feh --bg-scale ${wallpaperPath}/${wallpaperName}`)
    .catch((err) => console.error(`Error setting wallpaper: ${err}`));
}

setInterval(getNewBackground, 1000 * 60 * 10);

getNewBackground();
